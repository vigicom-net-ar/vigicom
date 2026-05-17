<?php
/**
 * Cifrado custom heredado del sistema legacy de Vigicom.
 *
 * No es bcrypt ni nada estándar — es un XOR + base64 con una clave fija.
 * Vive acá porque la tabla `usuarios` ya tiene contraseñas guardadas con
 * este esquema y migrarlas requiere re-correr setup en cada entorno.
 *
 * Si en algún momento se migra a password_hash() bcrypt, el cambio se
 * hace en setup.php (al guardar) y en api/login.php (al verificar).
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
