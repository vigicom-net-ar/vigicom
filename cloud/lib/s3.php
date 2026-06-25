<?php
/**
 * Cliente mínimo de AWS S3 con firma SigV4 (sin SDK).
 *
 * Cubre lo que necesita el "Explorador S3" del módulo Herramientas:
 *   - s3_list_objects   (delimitada por "/", paginada con continuation token)
 *   - s3_put_object     (subir contenido binario con Content-Type)
 *   - s3_delete_object  (borrar un objeto individual)
 *   - s3_list_all       (listar paginado recursivamente bajo un prefijo, para borrar carpetas)
 *   - s3_public_url     (URL pública del objeto, asumiendo bucket público)
 *
 * Lee credenciales y bucket desde las constantes que define env.php:
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET.
 */

function s3_config(): array
{
    foreach (['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'] as $k) {
        if (!defined($k) || (string) constant($k) === '') {
            throw new RuntimeException('Falta configurar la constante ' . $k . ' en el .env.');
        }
    }
    $bucket = AWS_S3_BUCKET;
    $region = AWS_REGION;
    // Buckets cuyo nombre contiene "." rompen el cert wildcard del endpoint
    // virtual-hosted (*.s3.<region>.amazonaws.com solo cubre un nivel). Para
    // esos buckets usamos path-style: https://s3.<region>.amazonaws.com/<bucket>/...
    $pathStyle = (strpos($bucket, '.') !== false);
    $host      = $pathStyle
        ? ('s3.' . $region . '.amazonaws.com')
        : ($bucket . '.s3.' . $region . '.amazonaws.com');
    return [
        'bucket'      => $bucket,
        'region'      => $region,
        'host'        => $host,
        'endpoint'    => 'https://' . $host,
        'path_style'  => $pathStyle,
        'key'         => AWS_ACCESS_KEY_ID,
        'secret'      => AWS_SECRET_ACCESS_KEY,
    ];
}

function s3_public_url(string $key): string
{
    $c = s3_config();
    $segments = array_map('rawurlencode', explode('/', $key));
    $path     = implode('/', $segments);
    // Buckets con nombre tipo dominio (con "." o "-") suelen montarse con un
    // CNAME al endpoint S3 static-website, así que la URL pública canónica es
    // https://<bucket>/<key>. Para buckets "simples", virtual-hosted estándar.
    if ($c['path_style']) {
        return 'https://' . $c['bucket'] . '/' . $path;
    }
    return $c['endpoint'] . '/' . $path;
}

/**
 * Firma una request SigV4 y la ejecuta vía cURL.
 *
 * @param string $method  GET / PUT / DELETE
 * @param string $uri     path comenzando con "/" (sin host); las /-separated segments
 *                        ya deben estar URL-encoded por el llamador
 * @param array  $query   ['k' => 'v'] (se ordenan alfabeticamente y se firman)
 * @param array  $headers headers extra (Content-Type, x-amz-*, etc.)
 * @param string $body    cuerpo crudo (vacío para GET/DELETE)
 *
 * @return array{status:int, headers:array<string,string>, body:string}
 */
function s3_request(string $method, string $uri, array $query = [], array $headers = [], string $body = ''): array
{
    $c       = s3_config();
    $service = 's3';
    $region  = $c['region'];
    $host    = $c['host'];

    $now       = gmdate('Ymd\THis\Z');
    $datestamp = gmdate('Ymd');

    $payloadHash = hash('sha256', $body);

    // Headers canónicos (todos en minúsculas, ordenados alfabéticamente)
    $headers = array_change_key_case($headers, CASE_LOWER);
    $headers['host']                 = $host;
    $headers['x-amz-content-sha256'] = $payloadHash;
    $headers['x-amz-date']           = $now;
    ksort($headers);

    $canonicalHeaders = '';
    $signedHeaders    = [];
    foreach ($headers as $k => $v) {
        $canonicalHeaders .= $k . ':' . trim($v) . "\n";
        $signedHeaders[]   = $k;
    }
    $signedHeadersStr = implode(';', $signedHeaders);

    // Query canónico
    ksort($query);
    $canonicalQueryParts = [];
    foreach ($query as $k => $v) {
        $canonicalQueryParts[] = rawurlencode((string) $k) . '=' . rawurlencode((string) $v);
    }
    $canonicalQuery = implode('&', $canonicalQueryParts);

    $canonicalRequest =
        $method . "\n" .
        $uri . "\n" .
        $canonicalQuery . "\n" .
        $canonicalHeaders . "\n" .
        $signedHeadersStr . "\n" .
        $payloadHash;

    $credentialScope = $datestamp . '/' . $region . '/' . $service . '/aws4_request';
    $stringToSign =
        'AWS4-HMAC-SHA256' . "\n" .
        $now . "\n" .
        $credentialScope . "\n" .
        hash('sha256', $canonicalRequest);

    $kDate    = hash_hmac('sha256', $datestamp, 'AWS4' . $c['secret'], true);
    $kRegion  = hash_hmac('sha256', $region,    $kDate,                true);
    $kService = hash_hmac('sha256', $service,   $kRegion,              true);
    $kSigning = hash_hmac('sha256', 'aws4_request', $kService,         true);
    $signature = hash_hmac('sha256', $stringToSign, $kSigning);

    $authHeader = 'AWS4-HMAC-SHA256 ' .
        'Credential=' . $c['key'] . '/' . $credentialScope . ', ' .
        'SignedHeaders=' . $signedHeadersStr . ', ' .
        'Signature=' . $signature;

    $url = $c['endpoint'] . $uri . ($canonicalQuery !== '' ? ('?' . $canonicalQuery) : '');

    $curlHeaders = ['Authorization: ' . $authHeader];
    foreach ($headers as $k => $v) {
        if ($k === 'host') continue;
        $curlHeaders[] = $k . ': ' . $v;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => $curlHeaders,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER         => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT        => 60,
    ]);
    $raw   = curl_exec($ch);
    $errno = curl_errno($ch);
    if ($errno !== 0) {
        $err = curl_error($ch);
        curl_close($ch);
        throw new RuntimeException('Error de red contra S3: ' . $err);
    }
    $status     = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    $rawHeaders = substr((string) $raw, 0, $headerSize);
    $respBody   = (string) substr((string) $raw, $headerSize);

    $respHeaders = [];
    foreach (preg_split("/\r\n|\n|\r/", $rawHeaders) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || stripos($line, 'HTTP/') === 0) continue;
        $pos = strpos($line, ':');
        if ($pos === false) continue;
        $hk = strtolower(trim(substr($line, 0, $pos)));
        $hv = trim(substr($line, $pos + 1));
        $respHeaders[$hk] = $hv;
    }

    return ['status' => $status, 'headers' => $respHeaders, 'body' => $respBody];
}

function s3_throw_on_error(array $resp, string $action): void
{
    if ($resp['status'] >= 200 && $resp['status'] < 300) return;
    $msg = 'S3 ' . $action . ' falló (HTTP ' . $resp['status'] . ')';
    if ($resp['body'] !== '') {
        $xml = @simplexml_load_string($resp['body']);
        if ($xml !== false) {
            $code    = (string) ($xml->Code    ?? '');
            $message = (string) ($xml->Message ?? '');
            if ($code !== '' || $message !== '') {
                $msg .= ': ' . trim($code . ' ' . $message);
            }
        }
    }
    throw new RuntimeException($msg);
}

/**
 * Listado delimitado por "/" — devuelve "carpetas" y "objetos" del prefijo dado.
 *
 * @return array{
 *   folders:array<int,array{key:string}>,
 *   objects:array<int,array{key:string,size:int,last_modified:string,url:string}>,
 *   truncated:bool,
 *   next_token:?string
 * }
 */
function s3_list_objects(string $prefix = '', ?string $continuationToken = null, int $maxKeys = 200): array
{
    $c      = s3_config();
    $prefix = ltrim($prefix, '/');
    $query  = [
        'list-type'  => '2',
        'delimiter'  => '/',
        'max-keys'   => (string) max(1, min(1000, $maxKeys)),
    ];
    if ($prefix !== '') {
        $query['prefix'] = $prefix;
    }
    if ($continuationToken !== null && $continuationToken !== '') {
        $query['continuation-token'] = $continuationToken;
    }

    $uri  = $c['path_style'] ? ('/' . $c['bucket']) : '/';
    $resp = s3_request('GET', $uri, $query);
    s3_throw_on_error($resp, 'list');

    $xml = simplexml_load_string($resp['body']);
    if ($xml === false) {
        throw new RuntimeException('Respuesta XML inválida de S3.');
    }

    $folders = [];
    foreach ($xml->CommonPrefixes ?? [] as $cp) {
        $folders[] = ['key' => (string) $cp->Prefix];
    }

    $objects = [];
    foreach ($xml->Contents ?? [] as $obj) {
        $key = (string) $obj->Key;
        // Filtrar el marker de carpeta (objeto cuya key === prefix actual)
        if ($key === $prefix) continue;
        $objects[] = [
            'key'           => $key,
            'size'          => (int) $obj->Size,
            'last_modified' => (string) $obj->LastModified,
            'url'           => s3_public_url($key),
        ];
    }

    $truncated = (string) ($xml->IsTruncated ?? 'false') === 'true';
    $nextToken = $truncated ? ((string) ($xml->NextContinuationToken ?? '')) : null;
    if ($nextToken === '') $nextToken = null;

    return [
        'folders'    => $folders,
        'objects'    => $objects,
        'truncated'  => $truncated,
        'next_token' => $nextToken,
    ];
}

/**
 * Lista TODOS los keys bajo un prefijo (sin delimiter), paginando internamente.
 * Pensado para borrado recursivo de carpetas.
 *
 * @return array<int,string> lista de keys
 */
function s3_list_all(string $prefix): array
{
    $c      = s3_config();
    $prefix = ltrim($prefix, '/');
    $token  = null;
    $keys   = [];
    $uri    = $c['path_style'] ? ('/' . $c['bucket']) : '/';
    do {
        $query = [
            'list-type' => '2',
            'prefix'    => $prefix,
            'max-keys'  => '1000',
        ];
        if ($token !== null) {
            $query['continuation-token'] = $token;
        }
        $resp = s3_request('GET', $uri, $query);
        s3_throw_on_error($resp, 'list-all');

        $xml = simplexml_load_string($resp['body']);
        if ($xml === false) {
            throw new RuntimeException('Respuesta XML inválida de S3.');
        }
        foreach ($xml->Contents ?? [] as $obj) {
            $keys[] = (string) $obj->Key;
        }
        $truncated = (string) ($xml->IsTruncated ?? 'false') === 'true';
        $token     = $truncated ? ((string) ($xml->NextContinuationToken ?? '')) : null;
        if ($token === '') $token = null;
    } while ($token !== null);
    return $keys;
}

function s3_put_object(string $key, string $body, string $contentType = 'application/octet-stream'): void
{
    $c        = s3_config();
    $key      = ltrim($key, '/');
    $segments = array_map('rawurlencode', explode('/', $key));
    $keyPath  = implode('/', $segments);
    $uri      = $c['path_style'] ? ('/' . $c['bucket'] . '/' . $keyPath) : ('/' . $keyPath);

    $resp = s3_request('PUT', $uri, [], [
        'content-type' => $contentType,
    ], $body);
    s3_throw_on_error($resp, 'put');
}

function s3_delete_object(string $key): void
{
    $c        = s3_config();
    $key      = ltrim($key, '/');
    $segments = array_map('rawurlencode', explode('/', $key));
    $keyPath  = implode('/', $segments);
    $uri      = $c['path_style'] ? ('/' . $c['bucket'] . '/' . $keyPath) : ('/' . $keyPath);

    $resp = s3_request('DELETE', $uri);
    // S3 devuelve 204 para delete exitoso; 404 lo tratamos como éxito (ya no estaba)
    if ($resp['status'] === 404) return;
    s3_throw_on_error($resp, 'delete');
}
