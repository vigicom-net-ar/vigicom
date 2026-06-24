<?php
/**
 * JWT HS256 para panel.
 *
 * Firma con APP_KEY_PANEL — clave propia de esta app para aislar sesiones
 * de cloud/app/firmware. Mismo formato HS256 que cloud/lib/jwt.php.
 */

function _jwt_b64url_encode(string $bin): string
{
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}

function _jwt_b64url_decode(string $s): string
{
    $pad = strlen($s) % 4;
    if ($pad) {
        $s .= str_repeat('=', 4 - $pad);
    }
    return base64_decode(strtr($s, '-_', '+/'), true) ?: '';
}

function jwt_sign(array $payload, ?int $ttlSeconds = 60 * 60 * 12): string
{
    $now = time();
    $payload = array_merge([
        'iat' => $now,
        'exp' => $ttlSeconds === null ? null : $now + $ttlSeconds,
    ], $payload);
    if ($payload['exp'] === null) {
        unset($payload['exp']);
    }

    $header  = ['alg' => 'HS256', 'typ' => 'JWT'];
    $segHead = _jwt_b64url_encode(json_encode($header,  JSON_UNESCAPED_SLASHES));
    $segLoad = _jwt_b64url_encode(json_encode($payload, JSON_UNESCAPED_SLASHES));
    $signing = $segHead . '.' . $segLoad;
    $sig     = hash_hmac('sha256', $signing, APP_KEY_PANEL, true);

    return $signing . '.' . _jwt_b64url_encode($sig);
}

function jwt_verify(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    [$segHead, $segLoad, $segSig] = $parts;

    $expected = hash_hmac('sha256', $segHead . '.' . $segLoad, APP_KEY_PANEL, true);
    $sig      = _jwt_b64url_decode($segSig);
    if (!hash_equals($expected, $sig)) {
        return null;
    }

    $payload = json_decode(_jwt_b64url_decode($segLoad), true);
    if (!is_array($payload)) {
        return null;
    }
    if (isset($payload['exp']) && time() >= (int) $payload['exp']) {
        return null;
    }
    return $payload;
}
