<?php
/**
 * Cifrado custom heredado del sistema legacy de Vigicom.
 *
 * XOR + base64 con clave fija. Se mantiene porque la tabla `usuarios` ya
 * guarda las contraseñas con este esquema y se comparte entre todas las
 * apps del repo (cloud, panel, app).
 */

const CRIPTO_CLAVE_DEFECTO = '0123456789';

function cripto_encriptar(string $cadena, string $clave = ''): string
{
    if ($clave === '') {
        $clave = CRIPTO_CLAVE_DEFECTO;
    }
    $resultado = '';
    $len_clave = strlen($clave);
    for ($i = 0, $n = strlen($cadena); $i < $n; $i++) {
        $char    = $cadena[$i];
        $keychar = substr($clave, ($i % $len_clave) - 1, 1);
        $resultado .= chr(ord($char) + ord($keychar));
    }
    return base64_encode($resultado);
}

function cripto_desencriptar(string $cadena, string $clave = ''): string
{
    if ($clave === '') {
        $clave = CRIPTO_CLAVE_DEFECTO;
    }
    $cadena = base64_decode($cadena, true);
    if ($cadena === false) {
        return '';
    }
    $resultado = '';
    $len_clave = strlen($clave);
    for ($i = 0, $n = strlen($cadena); $i < $n; $i++) {
        $char    = $cadena[$i];
        $keychar = substr($clave, ($i % $len_clave) - 1, 1);
        $resultado .= chr(ord($char) - ord($keychar));
    }
    return $resultado;
}
