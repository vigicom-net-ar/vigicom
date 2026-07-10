/*
 Navicat Premium Data Transfer

 Source Server         : localhost - vigicom
 Source Server Type    : MySQL
 Source Server Version : 80046
 Source Host           : localhost:3310
 Source Schema         : vigicom_dev

 Target Server Type    : MySQL
 Target Server Version : 80046
 File Encoding         : 65001

 Date: 17/05/2026 12:46:10
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for adjuntos
-- ----------------------------
DROP TABLE IF EXISTS `adjuntos`;
CREATE TABLE `adjuntos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `objeto` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `identidad` int(0) NULL DEFAULT NULL,
  `archivo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2838 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for agentes
-- ----------------------------
DROP TABLE IF EXISTS `agentes`;
CREATE TABLE `agentes`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `razon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `contacto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `web` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correoPublico` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefonoPublico` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `localidad` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `provincia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ciudad` int(0) NULL DEFAULT NULL,
  `logo` smallint(0) NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  `comentarios` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 25 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for alarmas
-- ----------------------------
DROP TABLE IF EXISTS `alarmas`;
CREATE TABLE `alarmas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `equipo` int(0) NULL DEFAULT NULL,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `generacion` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `hardware` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `firmware` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `revision` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `prioridad` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `altura` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunicacion` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `propagacion` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `identidad` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ciudad` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `foto` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `latitud` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `longitud` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `instalacion` datetime(0) NULL DEFAULT NULL,
  `atendida` datetime(0) NULL DEFAULT NULL,
  `garantia` datetime(0) NULL DEFAULT NULL,
  `desinstalacion` datetime(0) NULL DEFAULT NULL,
  `titularidad` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(0) NULL DEFAULT NULL,
  `disuasion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `inicio` datetime(0) NULL DEFAULT NULL,
  `latido` datetime(0) NULL DEFAULT NULL,
  `energia` int(0) NULL DEFAULT NULL,
  `bateria` int(0) NULL DEFAULT NULL,
  `reinicios` int(0) NULL DEFAULT NULL,
  `senal` int(0) NULL DEFAULT NULL,
  `reconexiones` int(0) NULL DEFAULT NULL,
  `salud` int(0) NULL DEFAULT NULL,
  `envio` datetime(0) NULL DEFAULT NULL,
  `parametros` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 685 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for alarmascomposiciones
-- ----------------------------
DROP TABLE IF EXISTS `alarmascomposiciones`;
CREATE TABLE `alarmascomposiciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `caso` int(0) NULL DEFAULT NULL,
  `alarma` int(0) NULL DEFAULT NULL,
  `gabinete` int(0) NULL DEFAULT NULL,
  `placa` int(0) NULL DEFAULT NULL,
  `controlador` int(0) NULL DEFAULT NULL,
  `comunicador` int(0) NULL DEFAULT NULL,
  `cargador` int(0) NULL DEFAULT NULL,
  `bateria` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 50 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for alarmasgraficas
-- ----------------------------
DROP TABLE IF EXISTS `alarmasgraficas`;
CREATE TABLE `alarmasgraficas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `alarma` int(0) NULL DEFAULT NULL,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `fecha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nivel` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `energia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 156178 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'ingresos diarios' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for alarmasinstalaciones
-- ----------------------------
DROP TABLE IF EXISTS `alarmasinstalaciones`;
CREATE TABLE `alarmasinstalaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `tarea` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `alarma` int(0) NULL DEFAULT NULL,
  `tecnico` int(0) NULL DEFAULT NULL,
  `ingresada` datetime(0) NULL DEFAULT NULL,
  `programada` datetime(0) NULL DEFAULT NULL,
  `completada` datetime(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1057 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for alarmasonline
-- ----------------------------
DROP TABLE IF EXISTS `alarmasonline`;
CREATE TABLE `alarmasonline`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `total` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `dia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `noche` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 14548 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for alarmaspropiedades
-- ----------------------------
DROP TABLE IF EXISTS `alarmaspropiedades`;
CREATE TABLE `alarmaspropiedades`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `alarma` int(0) NULL DEFAULT NULL,
  `titulo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `variable` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `valor` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `valor2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `orden` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 27926 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for aplicaciones
-- ----------------------------
DROP TABLE IF EXISTS `aplicaciones`;
CREATE TABLE `aplicaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `apikey` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `apisecret` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `usos` int(0) NULL DEFAULT NULL,
  `habilitada` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 101 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for areas
-- ----------------------------
DROP TABLE IF EXISTS `areas`;
CREATE TABLE `areas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for arqueos
-- ----------------------------
DROP TABLE IF EXISTS `arqueos`;
CREATE TABLE `arqueos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `apertura` datetime(0) NULL DEFAULT NULL,
  `cierre` datetime(0) NULL DEFAULT NULL,
  `empleado` int(0) NULL DEFAULT NULL,
  `efectivoReal` decimal(10, 2) NULL DEFAULT NULL,
  `efectivoSistema` decimal(10, 2) NULL DEFAULT NULL,
  `efectivoResultado` decimal(10, 2) NULL DEFAULT NULL,
  `mercadopagoReal` decimal(10, 2) NULL DEFAULT NULL,
  `mercadopagoSistema` decimal(10, 2) NULL DEFAULT NULL,
  `mercadopagoResultado` decimal(10, 2) NULL DEFAULT NULL,
  `posnetReal` decimal(10, 2) NULL DEFAULT NULL,
  `posnetSistema` decimal(10, 2) NULL DEFAULT NULL,
  `posnetResultado` decimal(10, 2) NULL DEFAULT NULL,
  `caja1` decimal(10, 2) NULL DEFAULT NULL,
  `caja2` decimal(10, 2) NULL DEFAULT NULL,
  `caja3` decimal(10, 2) NULL DEFAULT NULL,
  `caja4` decimal(10, 2) NULL DEFAULT NULL,
  `banco1` decimal(10, 2) NULL DEFAULT NULL,
  `banco2` decimal(10, 2) NULL DEFAULT NULL,
  `comentarios` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1400 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for articulos
-- ----------------------------
DROP TABLE IF EXISTS `articulos`;
CREATE TABLE `articulos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `subtipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `componente` smallint(0) NULL DEFAULT NULL,
  `categoria` int(0) NULL DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `descripcion` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `comentarios` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `barras` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `actual` int(0) NULL DEFAULT NULL,
  `minimo` int(0) NULL DEFAULT NULL,
  `recomendado` int(0) NULL DEFAULT NULL,
  `iva` decimal(10, 2) NULL DEFAULT NULL,
  `moneda` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `importacion` decimal(10, 2) NULL DEFAULT NULL,
  `compra` decimal(10, 2) NULL DEFAULT NULL,
  `margen` decimal(10, 2) NULL DEFAULT NULL,
  `venta` decimal(10, 2) NULL DEFAULT NULL,
  `margen2` decimal(10, 2) NULL DEFAULT NULL,
  `venta2` decimal(10, 2) NULL DEFAULT NULL,
  `margen3` decimal(10, 2) NULL DEFAULT NULL,
  `venta3` decimal(10, 2) NULL DEFAULT NULL,
  `ciclo` tinyint(0) NULL DEFAULT NULL,
  `web` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `visibilidad` int(0) NULL DEFAULT NULL,
  `actualizado` datetime(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `proveedor` int(0) NULL DEFAULT NULL,
  `proveedor2` int(0) NULL DEFAULT NULL,
  `proveedor3` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 300 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for articuloscategorias
-- ----------------------------
DROP TABLE IF EXISTS `articuloscategorias`;
CREATE TABLE `articuloscategorias`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for articuloscompuestos
-- ----------------------------
DROP TABLE IF EXISTS `articuloscompuestos`;
CREATE TABLE `articuloscompuestos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `producto` int(0) NULL DEFAULT NULL,
  `componente` int(0) NULL DEFAULT NULL,
  `requiere` int(0) NULL DEFAULT NULL,
  `disponible` int(0) NULL DEFAULT NULL,
  `capacidad` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 404 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for asientos
-- ----------------------------
DROP TABLE IF EXISTS `asientos`;
CREATE TABLE `asientos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `tipo` int(0) NULL DEFAULT NULL,
  `cuenta1` int(0) NULL DEFAULT NULL,
  `cuenta2` int(0) NULL DEFAULT NULL,
  `monto` decimal(10, 2) NULL DEFAULT NULL,
  `detalle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `automatico` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 172803 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for asientostipos
-- ----------------------------
DROP TABLE IF EXISTS `asientostipos`;
CREATE TABLE `asientostipos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `tipo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `titulo1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuentas1` int(0) NULL DEFAULT NULL,
  `titulo2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuentas2` int(0) NULL DEFAULT NULL,
  `orden` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 38 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for atajos
-- ----------------------------
DROP TABLE IF EXISTS `atajos`;
CREATE TABLE `atajos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `destino` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for avisos
-- ----------------------------
DROP TABLE IF EXISTS `avisos`;
CREATE TABLE `avisos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `medio` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `casa` int(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `destinatario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `destino` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `prioridad` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `asunto` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuerpo` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `formato` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `media` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `direccion` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 103662 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for avisosplantillas
-- ----------------------------
DROP TABLE IF EXISTS `avisosplantillas`;
CREATE TABLE `avisosplantillas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medio` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `asunto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuerpo` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 103 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for avisospredefinidos
-- ----------------------------
DROP TABLE IF EXISTS `avisospredefinidos`;
CREATE TABLE `avisospredefinidos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `grupo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `orden` smallint(0) NULL DEFAULT NULL,
  `texto` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `parametros` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for avisostipos
-- ----------------------------
DROP TABLE IF EXISTS `avisostipos`;
CREATE TABLE `avisostipos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `texto` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for bancoexternocupones
-- ----------------------------
DROP TABLE IF EXISTS `bancoexternocupones`;
CREATE TABLE `bancoexternocupones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comprobante` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `clienteCuenta` int(0) NULL DEFAULT NULL,
  `presentacion` int(0) NULL DEFAULT NULL,
  `emision` date NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `cbu` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medio` tinyint(0) NULL DEFAULT NULL,
  `observaciones` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `importe` decimal(9, 2) NULL DEFAULT NULL,
  `periodo` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `auxiliares` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(0) NULL DEFAULT NULL,
  `imputado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `recibo` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 78615 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for bancoexternopresentaciones
-- ----------------------------
DROP TABLE IF EXISTS `bancoexternopresentaciones`;
CREATE TABLE `bancoexternopresentaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `generada` datetime(0) NULL DEFAULT NULL,
  `presentada` datetime(0) NULL DEFAULT NULL,
  `imputada` datetime(0) NULL DEFAULT NULL,
  `presentadasCantidad` int(0) NULL DEFAULT NULL,
  `presentadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `presentadasTexto` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `procesadasCantidad` int(0) NULL DEFAULT NULL,
  `procesadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `procesadasTexto` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `aprobadasCantidad` int(0) NULL DEFAULT NULL,
  `aprobadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `aprobadasTexto` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `rechazadasCantidad` int(0) NULL DEFAULT NULL,
  `rechazadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `rechazadasTexto` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 261 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for bancos
-- ----------------------------
DROP TABLE IF EXISTS `bancos`;
CREATE TABLE `bancos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 44 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for bancosanjuancupones
-- ----------------------------
DROP TABLE IF EXISTS `bancosanjuancupones`;
CREATE TABLE `bancosanjuancupones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comprobante` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `clienteCuenta` int(0) NULL DEFAULT NULL,
  `presentacion` int(0) NULL DEFAULT NULL,
  `emision` date NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `cbu` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medio` tinyint(0) NULL DEFAULT NULL,
  `observaciones` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `importe` decimal(9, 2) NULL DEFAULT NULL,
  `periodo` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `auxiliares` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(0) NULL DEFAULT NULL,
  `imputado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `recibo` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 59164 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for bancosanjuanpresentaciones
-- ----------------------------
DROP TABLE IF EXISTS `bancosanjuanpresentaciones`;
CREATE TABLE `bancosanjuanpresentaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `generada` datetime(0) NULL DEFAULT NULL,
  `presentada` datetime(0) NULL DEFAULT NULL,
  `imputada` datetime(0) NULL DEFAULT NULL,
  `presentadasCantidad` int(0) NULL DEFAULT NULL,
  `presentadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `presentadasTexto` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `preprocesadasCantidad` int(0) NULL DEFAULT NULL,
  `preprocesadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `preprocesadasTexto` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `procesadasCantidad` int(0) NULL DEFAULT NULL,
  `procesadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `procesadasTexto` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `aprobadasCantidad` int(0) NULL DEFAULT NULL,
  `aprobadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `aprobadasTexto` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `rechazadasCantidad` int(0) NULL DEFAULT NULL,
  `rechazadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `rechazadasTexto` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 335 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for cargos___
-- ----------------------------
DROP TABLE IF EXISTS `cargos___`;
CREATE TABLE `cargos___`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `funcion` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `permisos` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `menus` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `widgets` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for carteles
-- ----------------------------
DROP TABLE IF EXISTS `carteles`;
CREATE TABLE `carteles`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comunidad` int(0) NULL DEFAULT NULL,
  `casa` int(0) NULL DEFAULT NULL,
  `tecnico` int(0) NULL DEFAULT NULL,
  `instalado` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for casas
-- ----------------------------
DROP TABLE IF EXISTS `casas`;
CREATE TABLE `casas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comunidad` int(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ciudad` int(0) NULL DEFAULT NULL,
  `latitud` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `longitud` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `grupos` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `contrato` int(0) NULL DEFAULT NULL,
  `alta` datetime(0) NULL DEFAULT NULL,
  `monitoreo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 11289 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for casos
-- ----------------------------
DROP TABLE IF EXISTS `casos`;
CREATE TABLE `casos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `apertura` datetime(0) NULL DEFAULT NULL,
  `autor` int(0) NULL DEFAULT NULL,
  `area` int(0) NULL DEFAULT NULL,
  `objeto` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `identidad` int(0) NULL DEFAULT NULL,
  `asunto` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `asignado` int(0) NULL DEFAULT NULL,
  `prioridad` tinyint(1) NULL DEFAULT NULL,
  `evolucion` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `vencimiento` datetime(0) NULL DEFAULT NULL,
  `cierre` datetime(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `cobrable` tinyint(1) NULL DEFAULT NULL,
  `facturado` tinyint(1) NULL DEFAULT NULL,
  `factura` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 12939 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for causamdeudas
-- ----------------------------
DROP TABLE IF EXISTS `causamdeudas`;
CREATE TABLE `causamdeudas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `cliente` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular1` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular3` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono3` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo1` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo3` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `localidad` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `provincia` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `pais` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `localidad___` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `provincia___` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `capital` decimal(11, 2) NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `detalle` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `generada` datetime(0) NULL DEFAULT NULL,
  `actualizada` datetime(0) NULL DEFAULT NULL,
  `sincronizada` datetime(0) NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10687 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for causamdeudas_copy1
-- ----------------------------
DROP TABLE IF EXISTS `causamdeudas_copy1`;
CREATE TABLE `causamdeudas_copy1`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `cliente` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular1` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular3` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono3` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo1` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo3` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `localidad` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `provincia` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `pais` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `localidad___` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `provincia___` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `capital` decimal(11, 2) NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `detalle` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `generada` datetime(0) NULL DEFAULT NULL,
  `actualizada` datetime(0) NULL DEFAULT NULL,
  `sincronizada` datetime(0) NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9470 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for causameventos
-- ----------------------------
DROP TABLE IF EXISTS `causameventos`;
CREATE TABLE `causameventos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `deuda` int(0) NULL DEFAULT NULL,
  `detalle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 738225 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for chats
-- ----------------------------
DROP TABLE IF EXISTS `chats`;
CREATE TABLE `chats`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `origen` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `destino` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ultimo` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10565 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for chatsmensajes
-- ----------------------------
DROP TABLE IF EXISTS `chatsmensajes`;
CREATE TABLE `chatsmensajes`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `chat` int(0) NULL DEFAULT NULL,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `sentido` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `mensaje` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 172670 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for chatsrespuestas
-- ----------------------------
DROP TABLE IF EXISTS `chatsrespuestas`;
CREATE TABLE `chatsrespuestas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comando` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `respuesta` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for cheques
-- ----------------------------
DROP TABLE IF EXISTS `cheques`;
CREATE TABLE `cheques`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `cuenta` int(0) NULL DEFAULT NULL,
  `tipo` int(0) NULL DEFAULT NULL,
  `numero` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `emision` datetime(0) NULL DEFAULT NULL,
  `vencimiento` datetime(0) NULL DEFAULT NULL,
  `pago` datetime(0) NULL DEFAULT NULL,
  `beneficiario` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `importe` decimal(19, 2) NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `observaciones` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  INDEX `_WA_Sys_Estado_79A81403`(`estado`) USING BTREE,
  INDEX `_WA_Sys_Vencimiento_79A81403`(`vencimiento`) USING BTREE,
  INDEX `_WA_Sys_Emision_79A81403`(`emision`) USING BTREE,
  INDEX `_WA_Sys_Importe_79A81403`(`importe`) USING BTREE,
  INDEX `_WA_Sys_Id_79A81403`(`id`) USING BTREE,
  INDEX `_WA_Sys_Numero_79A81403`(`numero`) USING BTREE,
  INDEX `_WA_Sys_Beneficiario_79A81403`(`beneficiario`) USING BTREE,
  INDEX `_WA_Sys_Cuenta_79A81403`(`cuenta`) USING BTREE,
  INDEX `_WA_Sys_Tipo_79A81403`(`tipo`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 16085 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for chips
-- ----------------------------
DROP TABLE IF EXISTS `chips`;
CREATE TABLE `chips`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `serie` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuenta` int(0) NULL DEFAULT NULL,
  `plan` int(0) NULL DEFAULT NULL,
  `titular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `destino` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `detectado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `registrado` date NULL DEFAULT NULL,
  `registrante` int(0) NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 861 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for chipscuentas
-- ----------------------------
DROP TABLE IF EXISTS `chipscuentas`;
CREATE TABLE `chipscuentas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `compania` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `titular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `numero` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `habilitada` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 26 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for chipsplanes
-- ----------------------------
DROP TABLE IF EXISTS `chipsplanes`;
CREATE TABLE `chipsplanes`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `compania` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `codigo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `sms` int(0) NULL DEFAULT NULL,
  `mb` int(0) NULL DEFAULT NULL,
  `costo` decimal(10, 2) NULL DEFAULT NULL,
  `habilitado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for ciudades
-- ----------------------------
DROP TABLE IF EXISTS `ciudades`;
CREATE TABLE `ciudades`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `pais` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `provincia` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `localidad` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `latitud` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `longitud` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `_WA_Sys_Provincia_5CA1C101`(`provincia`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 2182 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for clientes
-- ----------------------------
DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `usuario` int(0) NULL DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `ciudad` int(0) NULL DEFAULT NULL,
  `telefono` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `dni` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nacimiento` date NULL DEFAULT NULL,
  `alta` date NULL DEFAULT NULL,
  `comentarios` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `talonario` int(0) NULL DEFAULT NULL,
  `razon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `condicion` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuit` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medio` int(0) NULL DEFAULT NULL,
  `medio___` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `situacion` tinyint(1) NULL DEFAULT NULL,
  `canceladas` smallint(0) NULL DEFAULT NULL,
  `pendientes` smallint(0) NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `total` decimal(10, 2) NULL DEFAULT NULL,
  `score` decimal(10, 2) NULL DEFAULT NULL,
  `recalculado` datetime(0) NULL DEFAULT NULL,
  `intimado` datetime(0) NULL DEFAULT NULL,
  `cobranza` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 12288 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for clientes___
-- ----------------------------
DROP TABLE IF EXISTS `clientes___`;
CREATE TABLE `clientes___`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `usuario` int(0) NULL DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `ciudad` int(0) NULL DEFAULT NULL,
  `telefono` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `dni` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nacimiento` date NULL DEFAULT NULL,
  `alta` date NULL DEFAULT NULL,
  `comentarios` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `talonario` int(0) NULL DEFAULT NULL,
  `razon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `condicion` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuit` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medio_mp` int(0) NULL DEFAULT NULL,
  `medio` int(0) NULL DEFAULT NULL,
  `situacion` tinyint(1) NULL DEFAULT NULL,
  `canceladas` smallint(0) NULL DEFAULT NULL,
  `pendientes` smallint(0) NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `total` decimal(10, 2) NULL DEFAULT NULL,
  `score` decimal(10, 2) NULL DEFAULT NULL,
  `recalculado` datetime(0) NULL DEFAULT NULL,
  `intimado` datetime(0) NULL DEFAULT NULL,
  `cobranza` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 12121 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for clientes___2
-- ----------------------------
DROP TABLE IF EXISTS `clientes___2`;
CREATE TABLE `clientes___2`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `usuario` int(0) NULL DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `ciudad` int(0) NULL DEFAULT NULL,
  `telefono` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `dni` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nacimiento` date NULL DEFAULT NULL,
  `alta` date NULL DEFAULT NULL,
  `comentarios` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `talonario` int(0) NULL DEFAULT NULL,
  `razon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `condicion` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuit` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medio` int(0) NULL DEFAULT NULL,
  `medio___` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `situacion` tinyint(1) NULL DEFAULT NULL,
  `canceladas` smallint(0) NULL DEFAULT NULL,
  `pendientes` smallint(0) NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `total` decimal(10, 2) NULL DEFAULT NULL,
  `score` decimal(10, 2) NULL DEFAULT NULL,
  `recalculado` datetime(0) NULL DEFAULT NULL,
  `intimado` datetime(0) NULL DEFAULT NULL,
  `cobranza` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 12121 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for clientescuentas
-- ----------------------------
DROP TABLE IF EXISTS `clientescuentas`;
CREATE TABLE `clientescuentas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `cliente` int(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `medio` int(0) NULL DEFAULT NULL,
  `titular` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `documento` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `banco` int(0) NULL DEFAULT NULL,
  `cbu` varchar(23) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `validacion` tinyint(1) NULL DEFAULT NULL,
  `firma` tinyint(1) NULL DEFAULT NULL,
  `registrada` datetime(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `observaciones` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1470 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for clientestarjetas
-- ----------------------------
DROP TABLE IF EXISTS `clientestarjetas`;
CREATE TABLE `clientestarjetas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `cliente` int(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `medio` int(0) NULL DEFAULT NULL,
  `titular` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tipo` smallint(0) NULL DEFAULT NULL,
  `numero` varchar(19) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `expira` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `codigo` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `documento` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `customer_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `card_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `validacion` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `firma` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `registrada` datetime(0) NULL DEFAULT NULL,
  `aprobada` datetime(0) NULL DEFAULT NULL,
  `rechazada` datetime(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `observaciones` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1408 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for clientestarjetas___
-- ----------------------------
DROP TABLE IF EXISTS `clientestarjetas___`;
CREATE TABLE `clientestarjetas___`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `cliente` int(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `medio` int(0) NULL DEFAULT NULL,
  `titular` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tipo` smallint(0) NULL DEFAULT NULL,
  `numero` varchar(19) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `expira` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `codigo` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `documento` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `customer_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `card_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `validacion` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `firma` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `registrada` datetime(0) NULL DEFAULT NULL,
  `aprobada` datetime(0) NULL DEFAULT NULL,
  `rechazada` datetime(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `observaciones` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1408 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for cobros___
-- ----------------------------
DROP TABLE IF EXISTS `cobros___`;
CREATE TABLE `cobros___`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` date NULL DEFAULT NULL,
  `concepto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `monto` decimal(10, 0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1401 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for comandos
-- ----------------------------
DROP TABLE IF EXISTS `comandos`;
CREATE TABLE `comandos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `alarma` int(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `propagacion` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `texto` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `prioridad` tinyint(0) NULL DEFAULT NULL,
  `procesado` datetime(0) NULL DEFAULT NULL,
  `estado` tinyint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1904598 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for combos
-- ----------------------------
DROP TABLE IF EXISTS `combos`;
CREATE TABLE `combos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `combo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `orden` int(0) NULL DEFAULT NULL,
  `texto` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `valor` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 11090 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for comisiones
-- ----------------------------
DROP TABLE IF EXISTS `comisiones`;
CREATE TABLE `comisiones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `generada` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cancelada` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vendedor` int(0) NULL DEFAULT NULL,
  `contratos` int(0) NULL DEFAULT NULL,
  `primas` decimal(10, 2) NULL DEFAULT NULL,
  `premio` decimal(10, 2) NULL DEFAULT NULL,
  `total` decimal(10, 2) NULL DEFAULT NULL,
  `estado` tinyint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 355 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for comisionesdetalles
-- ----------------------------
DROP TABLE IF EXISTS `comisionesdetalles`;
CREATE TABLE `comisionesdetalles`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comision` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `contrato` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuota` decimal(10, 2) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 18137 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for comprobantes
-- ----------------------------
DROP TABLE IF EXISTS `comprobantes`;
CREATE TABLE `comprobantes`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `talonario` int(0) NULL DEFAULT NULL,
  `empresa` int(0) NULL DEFAULT NULL,
  `tipo` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `punto` int(0) NULL DEFAULT NULL,
  `serie` int(0) NULL DEFAULT NULL,
  `fiscal` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `caenro` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `caevto` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `caeres` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `emision` date NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `contraparte` int(0) NULL DEFAULT NULL,
  `razon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ciudad` int(0) NULL DEFAULT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `condicion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `subtotal` decimal(10, 2) NULL DEFAULT NULL,
  `iva1050` decimal(10, 2) NULL DEFAULT NULL,
  `iva2100` decimal(10, 2) NULL DEFAULT NULL,
  `total` decimal(10, 2) NULL DEFAULT NULL,
  `observaciones` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentarios` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medio` int(0) NULL DEFAULT NULL,
  `tags` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `contrato` int(0) NULL DEFAULT NULL,
  `originado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `origen` int(0) NULL DEFAULT NULL,
  `advertencia` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 533580 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for comprobantes___
-- ----------------------------
DROP TABLE IF EXISTS `comprobantes___`;
CREATE TABLE `comprobantes___`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `talonario` int(0) NULL DEFAULT NULL,
  `empresa` int(0) NULL DEFAULT NULL,
  `tipo` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `punto` int(0) NULL DEFAULT NULL,
  `serie` int(0) NULL DEFAULT NULL,
  `fiscal` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `caenro` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `caevto` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `caeres` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `emision` date NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `contraparte` int(0) NULL DEFAULT NULL,
  `razon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ciudad` int(0) NULL DEFAULT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `condicion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `subtotal` decimal(10, 2) NULL DEFAULT NULL,
  `iva1050` decimal(10, 2) NULL DEFAULT NULL,
  `iva2100` decimal(10, 2) NULL DEFAULT NULL,
  `total` decimal(10, 2) NULL DEFAULT NULL,
  `observaciones` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentarios` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medio` int(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `contrato` int(0) NULL DEFAULT NULL,
  `originado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `origen` int(0) NULL DEFAULT NULL,
  `advertencia` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 519083 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for comprobantes___2
-- ----------------------------
DROP TABLE IF EXISTS `comprobantes___2`;
CREATE TABLE `comprobantes___2`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `talonario` int(0) NULL DEFAULT NULL,
  `empresa` int(0) NULL DEFAULT NULL,
  `tipo` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `punto` int(0) NULL DEFAULT NULL,
  `serie` int(0) NULL DEFAULT NULL,
  `fiscal` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `caenro` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `caevto` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `caeres` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `emision` date NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `contraparte` int(0) NULL DEFAULT NULL,
  `razon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ciudad` int(0) NULL DEFAULT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `condicion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `subtotal` decimal(10, 2) NULL DEFAULT NULL,
  `iva1050` decimal(10, 2) NULL DEFAULT NULL,
  `iva2100` decimal(10, 2) NULL DEFAULT NULL,
  `total` decimal(10, 2) NULL DEFAULT NULL,
  `observaciones` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentarios` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medio` int(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `contrato` int(0) NULL DEFAULT NULL,
  `originado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `origen` int(0) NULL DEFAULT NULL,
  `advertencia` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 520741 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for comprobantes_copy1
-- ----------------------------
DROP TABLE IF EXISTS `comprobantes_copy1`;
CREATE TABLE `comprobantes_copy1`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `talonario` int(0) NULL DEFAULT NULL,
  `empresa` int(0) NULL DEFAULT NULL,
  `tipo` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `punto` int(0) NULL DEFAULT NULL,
  `serie` int(0) NULL DEFAULT NULL,
  `fiscal` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `caenro` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `caevto` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `caeres` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `emision` date NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `contraparte` int(0) NULL DEFAULT NULL,
  `razon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ciudad` int(0) NULL DEFAULT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `condicion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `subtotal` decimal(10, 2) NULL DEFAULT NULL,
  `iva1050` decimal(10, 2) NULL DEFAULT NULL,
  `iva2100` decimal(10, 2) NULL DEFAULT NULL,
  `total` decimal(10, 2) NULL DEFAULT NULL,
  `observaciones` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentarios` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medio` int(0) NULL DEFAULT NULL,
  `tags` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `contrato` int(0) NULL DEFAULT NULL,
  `originado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `origen` int(0) NULL DEFAULT NULL,
  `advertencia` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 523481 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for comprobantesrenglones
-- ----------------------------
DROP TABLE IF EXISTS `comprobantesrenglones`;
CREATE TABLE `comprobantesrenglones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comprobante` int(0) NULL DEFAULT NULL,
  `orden` int(0) NULL DEFAULT NULL,
  `cantidad` decimal(10, 2) NULL DEFAULT NULL,
  `articulo` int(0) NULL DEFAULT NULL,
  `detalle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `iva` decimal(10, 2) NULL DEFAULT NULL,
  `unitario` decimal(10, 2) NULL DEFAULT NULL,
  `monto` decimal(10, 2) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 2509202 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for compuestos
-- ----------------------------
DROP TABLE IF EXISTS `compuestos`;
CREATE TABLE `compuestos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `producto` int(0) NULL DEFAULT NULL,
  `componente` int(0) NULL DEFAULT NULL,
  `requiere` int(0) NULL DEFAULT NULL,
  `disponible` int(0) NULL DEFAULT NULL,
  `capacidad` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 247 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for comunidades
-- ----------------------------
DROP TABLE IF EXISTS `comunidades`;
CREATE TABLE `comunidades`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ciudad` int(0) NULL DEFAULT NULL,
  `latitud` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `longitud` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `indicaciones` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `policia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ambulancia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `bomberos` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `solvencia` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `inscripcion` int(0) NULL DEFAULT NULL,
  `plan` int(0) NULL DEFAULT NULL,
  `promo` int(0) NULL DEFAULT NULL,
  `promoInicio` date NULL DEFAULT NULL,
  `promoFin` date NULL DEFAULT NULL,
  `mantenimiento` tinyint(1) NULL DEFAULT NULL,
  `convenio` int(0) NULL DEFAULT NULL,
  `contratos` int(0) NULL DEFAULT NULL,
  `contratosVigentes` int(0) NULL DEFAULT NULL,
  `contratosMorosos` int(0) NULL DEFAULT NULL,
  `contratosSuspendidos` int(0) NULL DEFAULT NULL,
  `contratosRescindidos` int(0) NULL DEFAULT NULL,
  `contratosPermanencia` decimal(11, 2) NULL DEFAULT NULL,
  `alarmas` int(0) NULL DEFAULT NULL,
  `alarmasOnline` int(0) NULL DEFAULT NULL,
  `alarmasOffline` int(0) NULL DEFAULT NULL,
  `alarmasFuncionamiento` decimal(11, 2) NULL DEFAULT NULL,
  `casas` int(0) NULL DEFAULT NULL,
  `usuarios` int(0) NULL DEFAULT NULL,
  `disparos` int(0) NULL DEFAULT NULL,
  `registro` date NULL DEFAULT NULL,
  `alta` date NULL DEFAULT NULL,
  `modo` tinyint(0) NULL DEFAULT NULL,
  `vendedor` int(0) NULL DEFAULT NULL,
  `estado` tinyint(0) NULL DEFAULT NULL,
  `wspHabilitado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `wspNombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `wspDescripcion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `wspGrupo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `wspInvitacion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `wspIcono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `wspMiembros` int(0) NULL DEFAULT NULL,
  `wspActualizado` datetime(0) NULL DEFAULT NULL,
  `wspRenovado` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 377 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for comunidadesprestaciones
-- ----------------------------
DROP TABLE IF EXISTS `comunidadesprestaciones`;
CREATE TABLE `comunidadesprestaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comunidad` int(0) NULL DEFAULT NULL,
  `contratos` int(0) NULL DEFAULT NULL,
  `periodo` date NULL DEFAULT NULL,
  `caso` int(0) NULL DEFAULT NULL,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `cantidad` decimal(10, 2) NULL DEFAULT NULL,
  `articulo` int(0) NULL DEFAULT NULL,
  `detalle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `iva` decimal(10, 2) NULL DEFAULT NULL,
  `unitario` decimal(10, 2) NULL DEFAULT NULL,
  `monto` decimal(10, 2) NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 588 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for concursos
-- ----------------------------
DROP TABLE IF EXISTS `concursos`;
CREATE TABLE `concursos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `asunto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `apertura` datetime(0) NULL DEFAULT NULL,
  `cierre` datetime(0) NULL DEFAULT NULL,
  `ganadora` int(0) NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 35 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for concursosinvitaciones
-- ----------------------------
DROP TABLE IF EXISTS `concursosinvitaciones`;
CREATE TABLE `concursosinvitaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `concurso` int(0) NULL DEFAULT NULL,
  `oferente` int(0) NULL DEFAULT NULL,
  `enviada` datetime(0) NULL DEFAULT NULL,
  `leida` datetime(0) NULL DEFAULT NULL,
  `recibida` datetime(0) NULL DEFAULT NULL,
  `oferta` decimal(10, 2) NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 99 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for conserjes
-- ----------------------------
DROP TABLE IF EXISTS `conserjes`;
CREATE TABLE `conserjes`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `numero` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `iniciado` datetime(0) NULL DEFAULT NULL,
  `latido` datetime(0) NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 103 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for conserjesregistros
-- ----------------------------
DROP TABLE IF EXISTS `conserjesregistros`;
CREATE TABLE `conserjesregistros`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `medio` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `conserje` int(0) NULL DEFAULT NULL,
  `numero` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `mensaje` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1162 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for consultas
-- ----------------------------
DROP TABLE IF EXISTS `consultas`;
CREATE TABLE `consultas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `medio` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `preguntaFecha` datetime(0) NULL DEFAULT NULL,
  `preguntaUsuario` int(0) NULL DEFAULT NULL,
  `pregunta` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `respuestaFecha` datetime(0) NULL DEFAULT NULL,
  `respuestaUsuario` int(0) NULL DEFAULT NULL,
  `respuesta` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 5672 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for contactos
-- ----------------------------
DROP TABLE IF EXISTS `contactos`;
CREATE TABLE `contactos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `listas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for contratos
-- ----------------------------
DROP TABLE IF EXISTS `contratos`;
CREATE TABLE `contratos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `inscripcion` int(0) NULL DEFAULT NULL,
  `numero` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `vendedor` int(0) NULL DEFAULT NULL,
  `convenio` int(0) NULL DEFAULT NULL,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `modo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cantidad` int(0) NULL DEFAULT NULL,
  `registro` datetime(0) NULL DEFAULT NULL,
  `firma` datetime(0) NULL DEFAULT NULL,
  `alta` datetime(0) NULL DEFAULT NULL COMMENT 'fecha de alta contrato',
  `baja` datetime(0) NULL DEFAULT NULL COMMENT 'fecha de baja de contrato',
  `bajaHabilitada` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'boton de baja habilitado',
  `bajaDeshabilitar` datetime(0) NULL DEFAULT NULL COMMENT 'boton de baja ocultar',
  `permanencia` int(0) NULL DEFAULT NULL,
  `plan` int(0) NULL DEFAULT NULL,
  `promo` int(0) NULL DEFAULT NULL,
  `promoInicio` date NULL DEFAULT NULL,
  `promoFinal` date NULL DEFAULT NULL,
  `ciclo` tinyint(0) NULL DEFAULT NULL,
  `cuota` decimal(10, 2) NULL DEFAULT NULL,
  `periodo` decimal(10, 2) NULL DEFAULT NULL,
  `facturado` date NULL DEFAULT NULL,
  `facturar` date NULL DEFAULT NULL,
  `comision` int(0) NULL DEFAULT NULL,
  `tags` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `estadoDetectado` datetime(0) NULL DEFAULT NULL,
  `canalNotificacion` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `canalCorreo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `canalWhatsapp` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `canalSms` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `resumenNotificacion` datetime(0) NULL DEFAULT NULL,
  `resumenCorreo` datetime(0) NULL DEFAULT NULL,
  `resumenWhatsapp` datetime(0) NULL DEFAULT NULL,
  `resumenSms` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 11649 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for contratos___
-- ----------------------------
DROP TABLE IF EXISTS `contratos___`;
CREATE TABLE `contratos___`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `inscripcion` int(0) NULL DEFAULT NULL,
  `numero` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `vendedor` int(0) NULL DEFAULT NULL,
  `convenio` int(0) NULL DEFAULT NULL,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `modo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cantidad` int(0) NULL DEFAULT NULL,
  `registro` datetime(0) NULL DEFAULT NULL,
  `firma` datetime(0) NULL DEFAULT NULL,
  `alta` datetime(0) NULL DEFAULT NULL COMMENT 'fecha de alta contrato',
  `baja` datetime(0) NULL DEFAULT NULL COMMENT 'fecha de baja de contrato',
  `bajaHabilitada` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'boton de baja habilitado',
  `bajaDeshabilitar` datetime(0) NULL DEFAULT NULL COMMENT 'boton de baja ocultar',
  `permanencia` int(0) NULL DEFAULT NULL,
  `plan` int(0) NULL DEFAULT NULL,
  `promo` int(0) NULL DEFAULT NULL,
  `promoInicio` date NULL DEFAULT NULL,
  `promoFinal` date NULL DEFAULT NULL,
  `ciclo` tinyint(0) NULL DEFAULT NULL,
  `cuota` decimal(10, 2) NULL DEFAULT NULL,
  `periodo` decimal(10, 2) NULL DEFAULT NULL,
  `facturado` date NULL DEFAULT NULL,
  `facturar` date NULL DEFAULT NULL,
  `comision` int(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `estadoDetectado` datetime(0) NULL DEFAULT NULL,
  `resumenMedio` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `resumenEnviado` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 11432 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for contratos_copy1
-- ----------------------------
DROP TABLE IF EXISTS `contratos_copy1`;
CREATE TABLE `contratos_copy1`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `inscripcion` int(0) NULL DEFAULT NULL,
  `numero` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `vendedor` int(0) NULL DEFAULT NULL,
  `convenio` int(0) NULL DEFAULT NULL,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `modo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cantidad` int(0) NULL DEFAULT NULL,
  `registro` datetime(0) NULL DEFAULT NULL,
  `firma` datetime(0) NULL DEFAULT NULL,
  `alta` datetime(0) NULL DEFAULT NULL COMMENT 'fecha de alta contrato',
  `baja` datetime(0) NULL DEFAULT NULL COMMENT 'fecha de baja de contrato',
  `bajaHabilitada` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'boton de baja habilitado',
  `bajaDeshabilitar` datetime(0) NULL DEFAULT NULL COMMENT 'boton de baja ocultar',
  `permanencia` int(0) NULL DEFAULT NULL,
  `plan` int(0) NULL DEFAULT NULL,
  `promo` int(0) NULL DEFAULT NULL,
  `promoInicio` date NULL DEFAULT NULL,
  `promoFinal` date NULL DEFAULT NULL,
  `ciclo` tinyint(0) NULL DEFAULT NULL,
  `cuota` decimal(10, 2) NULL DEFAULT NULL,
  `periodo` decimal(10, 2) NULL DEFAULT NULL,
  `facturado` date NULL DEFAULT NULL,
  `facturar` date NULL DEFAULT NULL,
  `comision` int(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `estadoDetectado` datetime(0) NULL DEFAULT NULL,
  `resumenMedio` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `resumenEnviado` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 11432 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for contratos_copy2
-- ----------------------------
DROP TABLE IF EXISTS `contratos_copy2`;
CREATE TABLE `contratos_copy2`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `inscripcion` int(0) NULL DEFAULT NULL,
  `numero` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `vendedor` int(0) NULL DEFAULT NULL,
  `convenio` int(0) NULL DEFAULT NULL,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `modo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cantidad` int(0) NULL DEFAULT NULL,
  `registro` datetime(0) NULL DEFAULT NULL,
  `firma` datetime(0) NULL DEFAULT NULL,
  `alta` datetime(0) NULL DEFAULT NULL COMMENT 'fecha de alta contrato',
  `baja` datetime(0) NULL DEFAULT NULL COMMENT 'fecha de baja de contrato',
  `bajaHabilitada` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'boton de baja habilitado',
  `bajaDeshabilitar` datetime(0) NULL DEFAULT NULL COMMENT 'boton de baja ocultar',
  `permanencia` int(0) NULL DEFAULT NULL,
  `plan` int(0) NULL DEFAULT NULL,
  `promo` int(0) NULL DEFAULT NULL,
  `promoInicio` date NULL DEFAULT NULL,
  `promoFinal` date NULL DEFAULT NULL,
  `ciclo` tinyint(0) NULL DEFAULT NULL,
  `cuota` decimal(10, 2) NULL DEFAULT NULL,
  `periodo` decimal(10, 2) NULL DEFAULT NULL,
  `facturado` date NULL DEFAULT NULL,
  `facturar` date NULL DEFAULT NULL,
  `comision` int(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `estadoDetectado` datetime(0) NULL DEFAULT NULL,
  `resumenMedio` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `resumenEnviado` datetime(0) NULL DEFAULT NULL,
  `meta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `medioNotificacion` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medioCorreo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medioWhatsapp` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medioSms` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `resumenNotificacion` datetime(0) NULL DEFAULT NULL,
  `resumenCorreo` datetime(0) NULL DEFAULT NULL,
  `resumenWhatsapp` datetime(0) NULL DEFAULT NULL,
  `resumenSms` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 11528 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for contratos_copy3
-- ----------------------------
DROP TABLE IF EXISTS `contratos_copy3`;
CREATE TABLE `contratos_copy3`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `inscripcion` int(0) NULL DEFAULT NULL,
  `numero` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `vendedor` int(0) NULL DEFAULT NULL,
  `convenio` int(0) NULL DEFAULT NULL,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `modo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cantidad` int(0) NULL DEFAULT NULL,
  `registro` datetime(0) NULL DEFAULT NULL,
  `firma` datetime(0) NULL DEFAULT NULL,
  `alta` datetime(0) NULL DEFAULT NULL COMMENT 'fecha de alta contrato',
  `baja` datetime(0) NULL DEFAULT NULL COMMENT 'fecha de baja de contrato',
  `bajaHabilitada` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'boton de baja habilitado',
  `bajaDeshabilitar` datetime(0) NULL DEFAULT NULL COMMENT 'boton de baja ocultar',
  `permanencia` int(0) NULL DEFAULT NULL,
  `plan` int(0) NULL DEFAULT NULL,
  `promo` int(0) NULL DEFAULT NULL,
  `promoInicio` date NULL DEFAULT NULL,
  `promoFinal` date NULL DEFAULT NULL,
  `ciclo` tinyint(0) NULL DEFAULT NULL,
  `cuota` decimal(10, 2) NULL DEFAULT NULL,
  `periodo` decimal(10, 2) NULL DEFAULT NULL,
  `facturado` date NULL DEFAULT NULL,
  `facturar` date NULL DEFAULT NULL,
  `comision` int(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `estadoDetectado` datetime(0) NULL DEFAULT NULL,
  `canalNotificacion` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `canalCorreo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `canalWhatsapp` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `canalSms` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `resumenNotificacion` datetime(0) NULL DEFAULT NULL,
  `resumenCorreo` datetime(0) NULL DEFAULT NULL,
  `resumenWhatsapp` datetime(0) NULL DEFAULT NULL,
  `resumenSms` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 11539 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for contratos_copy4
-- ----------------------------
DROP TABLE IF EXISTS `contratos_copy4`;
CREATE TABLE `contratos_copy4`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `inscripcion` int(0) NULL DEFAULT NULL,
  `numero` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `vendedor` int(0) NULL DEFAULT NULL,
  `convenio` int(0) NULL DEFAULT NULL,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `modo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cantidad` int(0) NULL DEFAULT NULL,
  `registro` datetime(0) NULL DEFAULT NULL,
  `firma` datetime(0) NULL DEFAULT NULL,
  `alta` datetime(0) NULL DEFAULT NULL COMMENT 'fecha de alta contrato',
  `baja` datetime(0) NULL DEFAULT NULL COMMENT 'fecha de baja de contrato',
  `bajaHabilitada` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'boton de baja habilitado',
  `bajaDeshabilitar` datetime(0) NULL DEFAULT NULL COMMENT 'boton de baja ocultar',
  `permanencia` int(0) NULL DEFAULT NULL,
  `plan` int(0) NULL DEFAULT NULL,
  `promo` int(0) NULL DEFAULT NULL,
  `promoInicio` date NULL DEFAULT NULL,
  `promoFinal` date NULL DEFAULT NULL,
  `ciclo` tinyint(0) NULL DEFAULT NULL,
  `cuota` decimal(10, 2) NULL DEFAULT NULL,
  `periodo` decimal(10, 2) NULL DEFAULT NULL,
  `facturado` date NULL DEFAULT NULL,
  `facturar` date NULL DEFAULT NULL,
  `comision` int(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `estadoDetectado` datetime(0) NULL DEFAULT NULL,
  `canalNotificacion` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `canalCorreo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `canalWhatsapp` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `canalSms` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `resumenNotificacion` datetime(0) NULL DEFAULT NULL,
  `resumenCorreo` datetime(0) NULL DEFAULT NULL,
  `resumenWhatsapp` datetime(0) NULL DEFAULT NULL,
  `resumenSms` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 11539 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for contratoscasas
-- ----------------------------
DROP TABLE IF EXISTS `contratoscasas`;
CREATE TABLE `contratoscasas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `contrato` int(0) NULL DEFAULT NULL,
  `casa` int(0) NULL DEFAULT NULL,
  `alta` date NULL DEFAULT NULL,
  `baja` date NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for contratosfacturables
-- ----------------------------
DROP TABLE IF EXISTS `contratosfacturables`;
CREATE TABLE `contratosfacturables`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `total` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vigentes` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `morosos` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `suspendidos` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `altas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `bajas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 14566 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for contratosvigentes
-- ----------------------------
DROP TABLE IF EXISTS `contratosvigentes`;
CREATE TABLE `contratosvigentes`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `total` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vigentes` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `morosos` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `suspendidos` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `altas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `bajas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 14566 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for convenios
-- ----------------------------
DROP TABLE IF EXISTS `convenios`;
CREATE TABLE `convenios`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `modo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuerpo` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 35 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for cuentas
-- ----------------------------
DROP TABLE IF EXISTS `cuentas`;
CREATE TABLE `cuentas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `padre` int(0) NULL DEFAULT NULL,
  `orden` int(0) NULL DEFAULT NULL,
  `categoria` smallint(0) NULL DEFAULT NULL,
  `tipo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `observaciones` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `saldo` decimal(20, 2) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 297 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for cuentasmovimientos
-- ----------------------------
DROP TABLE IF EXISTS `cuentasmovimientos`;
CREATE TABLE `cuentasmovimientos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `cuenta` int(0) NULL DEFAULT NULL,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `monto` decimal(20, 2) NULL DEFAULT NULL,
  `saldo` decimal(20, 2) NULL DEFAULT NULL,
  `asiento` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 340876 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for cuentasregistros
-- ----------------------------
DROP TABLE IF EXISTS `cuentasregistros`;
CREATE TABLE `cuentasregistros`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `cuenta` int(0) NULL DEFAULT NULL,
  `importacion` datetime(0) NULL DEFAULT NULL,
  `movimiento` date NULL DEFAULT NULL,
  `valor` date NULL DEFAULT NULL,
  `monto` decimal(10, 2) NULL DEFAULT NULL,
  `referencia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `concepto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `saldo` decimal(10, 2) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 52468 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for cursos
-- ----------------------------
DROP TABLE IF EXISTS `cursos`;
CREATE TABLE `cursos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `area` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `orden` smallint(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `dificultad` smallint(0) NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 28 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for cursosasistencias
-- ----------------------------
DROP TABLE IF EXISTS `cursosasistencias`;
CREATE TABLE `cursosasistencias`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `clase` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 99 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for cursosclases
-- ----------------------------
DROP TABLE IF EXISTS `cursosclases`;
CREATE TABLE `cursosclases`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `curso` int(0) NULL DEFAULT NULL,
  `orden` smallint(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `youtube` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `creada` datetime(0) NULL DEFAULT NULL,
  `publicada` datetime(0) NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 32 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for dashboards
-- ----------------------------
DROP TABLE IF EXISTS `dashboards`;
CREATE TABLE `dashboards`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `modulos` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for dashboardsmodulos
-- ----------------------------
DROP TABLE IF EXISTS `dashboardsmodulos`;
CREATE TABLE `dashboardsmodulos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for descargas
-- ----------------------------
DROP TABLE IF EXISTS `descargas`;
CREATE TABLE `descargas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `categoria` int(0) NULL DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `archivo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `creacion` datetime(0) NULL DEFAULT NULL,
  `descarga` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 110 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for descargascategorias
-- ----------------------------
DROP TABLE IF EXISTS `descargascategorias`;
CREATE TABLE `descargascategorias`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `padre` int(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for descuentos
-- ----------------------------
DROP TABLE IF EXISTS `descuentos`;
CREATE TABLE `descuentos`  (
  `id` int(0) NOT NULL,
  `codigo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `promocion` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `operador` int(0) NULL DEFAULT NULL,
  `observaciones` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for dialogos
-- ----------------------------
DROP TABLE IF EXISTS `dialogos`;
CREATE TABLE `dialogos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `pregunta` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `respuesta` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `instruccion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for difusiones
-- ----------------------------
DROP TABLE IF EXISTS `difusiones`;
CREATE TABLE `difusiones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `mensaje` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `formato` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `media` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `registrada` datetime(0) NULL DEFAULT NULL,
  `programada` datetime(0) NULL DEFAULT NULL,
  `enviada` datetime(0) NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 122 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for disparos
-- ----------------------------
DROP TABLE IF EXISTS `disparos`;
CREATE TABLE `disparos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `casa` int(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `ubicacion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `modo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `procesado` datetime(0) NULL DEFAULT NULL,
  `tomado` datetime(0) NULL DEFAULT NULL,
  `guardia` int(0) NULL DEFAULT NULL,
  `patrulla` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `resultado` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `detalle` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cerrado` datetime(0) NULL DEFAULT NULL,
  `espera` int(0) NULL DEFAULT NULL,
  `reportado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 17709 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for disparos_copy1
-- ----------------------------
DROP TABLE IF EXISTS `disparos_copy1`;
CREATE TABLE `disparos_copy1`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `casa` int(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `ubicacion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `modo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `procesado` datetime(0) NULL DEFAULT NULL,
  `tomado` datetime(0) NULL DEFAULT NULL,
  `guardia` int(0) NULL DEFAULT NULL,
  `patrulla` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `resultado` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `detalle` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cerrado` datetime(0) NULL DEFAULT NULL,
  `reportado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 17681 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for disparosacciones
-- ----------------------------
DROP TABLE IF EXISTS `disparosacciones`;
CREATE TABLE `disparosacciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `disparo` int(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `detalle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 70298 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for disparosacciones_copy1
-- ----------------------------
DROP TABLE IF EXISTS `disparosacciones_copy1`;
CREATE TABLE `disparosacciones_copy1`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `disparo` int(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `detalle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 70119 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for disparosrespuestas
-- ----------------------------
DROP TABLE IF EXISTS `disparosrespuestas`;
CREATE TABLE `disparosrespuestas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `grupo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `texto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `icono` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `color` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `orden` smallint(0) NULL DEFAULT NULL,
  `submenu` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for ejecuciones
-- ----------------------------
DROP TABLE IF EXISTS `ejecuciones`;
CREATE TABLE `ejecuciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `aplicacion` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ubicacion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `precicion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 114818 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for empleados
-- ----------------------------
DROP TABLE IF EXISTS `empleados`;
CREATE TABLE `empleados`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `documento` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nacimiento` date NULL DEFAULT NULL,
  `domicilio` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ciudad` int(0) NULL DEFAULT NULL,
  `telefono` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `cuenta` int(0) NULL DEFAULT NULL,
  `sueldo` decimal(10, 2) NULL DEFAULT NULL,
  `funcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `areas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `funciones` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `observaciones` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 173 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for empleadosautorizados
-- ----------------------------
DROP TABLE IF EXISTS `empleadosautorizados`;
CREATE TABLE `empleadosautorizados`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `documento` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `funcion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for empleadosfunciones
-- ----------------------------
DROP TABLE IF EXISTS `empleadosfunciones`;
CREATE TABLE `empleadosfunciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for empleadosmarcadas
-- ----------------------------
DROP TABLE IF EXISTS `empleadosmarcadas`;
CREATE TABLE `empleadosmarcadas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `empleado` int(0) NULL DEFAULT NULL,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `sentido` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 4343 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for empleadosnovedades
-- ----------------------------
DROP TABLE IF EXISTS `empleadosnovedades`;
CREATE TABLE `empleadosnovedades`  (
  `id` int(0) NOT NULL,
  `fecha` date NULL DEFAULT NULL,
  `empleado` int(0) NULL DEFAULT NULL,
  `tipo` smallint(0) NULL DEFAULT NULL,
  `periodo` date NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for empresas
-- ----------------------------
DROP TABLE IF EXISTS `empresas`;
CREATE TABLE `empresas`  (
  `id` int(0) NOT NULL,
  `razon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `condicion` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuit` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for entradas
-- ----------------------------
DROP TABLE IF EXISTS `entradas`;
CREATE TABLE `entradas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `fecha` date NULL DEFAULT NULL,
  `categoria` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `orden` int(0) NULL DEFAULT NULL,
  `autor` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `volanta` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `titulo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `bajada` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuerpo` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `etiquetas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `miniatura` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `imagen` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `visibilidad` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `metadatos` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 121 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for entradascategorias
-- ----------------------------
DROP TABLE IF EXISTS `entradascategorias`;
CREATE TABLE `entradascategorias`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `padre` int(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 124 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for equipos
-- ----------------------------
DROP TABLE IF EXISTS `equipos`;
CREATE TABLE `equipos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `agente` int(0) NULL DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `serial` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `hardware` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `firmware` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `chip` int(0) NULL DEFAULT NULL,
  `registrado` datetime(0) NULL DEFAULT NULL,
  `control` int(0) NULL DEFAULT NULL,
  `asignado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `habilitado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `parametros` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5403 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for equipos___
-- ----------------------------
DROP TABLE IF EXISTS `equipos___`;
CREATE TABLE `equipos___`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `serie` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `modelo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentarios` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `uso` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `fabricado` datetime(0) NULL DEFAULT NULL,
  `instalado` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 215 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for estadisticas
-- ----------------------------
DROP TABLE IF EXISTS `estadisticas`;
CREATE TABLE `estadisticas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `orden` tinyint(0) NULL DEFAULT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cantidad` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `destino` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for estados
-- ----------------------------
DROP TABLE IF EXISTS `estados`;
CREATE TABLE `estados`  (
  `campo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `valor` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `texto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `orden` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`campo`, `valor`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'Catálogo de valores posibles de campos tipo enum por objeto.campo (ej. disparos.estado)' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for eventos
-- ----------------------------
DROP TABLE IF EXISTS `eventos`;
CREATE TABLE `eventos`  (
  `id` int(0) NOT NULL,
  `cuenta` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `calificador` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `codigo` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `particion` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `zona` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `usuario` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for financiaciones
-- ----------------------------
DROP TABLE IF EXISTS `financiaciones`;
CREATE TABLE `financiaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `emision` date NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `concepto` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `total` decimal(10, 2) NULL DEFAULT NULL,
  `cuota` decimal(10, 2) NULL DEFAULT NULL,
  `cuotas` smallint(0) NULL DEFAULT NULL,
  `facturadas` smallint(0) NULL DEFAULT NULL,
  `facturar` date NULL DEFAULT NULL,
  `facturada` date NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1167 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for grafico_cobros
-- ----------------------------
DROP TABLE IF EXISTS `grafico_cobros`;
CREATE TABLE `grafico_cobros`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `mes` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `monto` decimal(14, 2) NOT NULL DEFAULT 0.00,
  `cantidad` int(0) NOT NULL DEFAULT 0,
  `actualizado` datetime(0) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_mes`(`mes`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'Cache mensual de cobros (recibos RX) para el Analizador' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for grupos
-- ----------------------------
DROP TABLE IF EXISTS `grupos`;
CREATE TABLE `grupos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comunidad` int(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 55 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for guardias
-- ----------------------------
DROP TABLE IF EXISTS `guardias`;
CREATE TABLE `guardias`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `empleado` int(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ingreso` datetime(0) NULL DEFAULT NULL,
  `egreso` datetime(0) NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 107 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for incidentes
-- ----------------------------
DROP TABLE IF EXISTS `incidentes`;
CREATE TABLE `incidentes`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `apertura` datetime(0) NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `disparo` int(0) NULL DEFAULT NULL,
  `disparos` int(0) NULL DEFAULT NULL,
  `cierre` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4431 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for informes
-- ----------------------------
DROP TABLE IF EXISTS `informes`;
CREATE TABLE `informes`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `iniciado` datetime(0) NULL DEFAULT NULL,
  `finalizado` datetime(0) NULL DEFAULT NULL,
  `texto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for informesusuarios
-- ----------------------------
DROP TABLE IF EXISTS `informesusuarios`;
CREATE TABLE `informesusuarios`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `historial` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 16313 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for ingresos
-- ----------------------------
DROP TABLE IF EXISTS `ingresos`;
CREATE TABLE `ingresos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `cargo` int(0) NULL DEFAULT NULL,
  `geolocalizacion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 103195 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for inscripciones
-- ----------------------------
DROP TABLE IF EXISTS `inscripciones`;
CREATE TABLE `inscripciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `navegador` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `genero` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nacimiento` date NULL DEFAULT NULL,
  `dni` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ciudad` int(0) NULL DEFAULT NULL,
  `celular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `convenio` int(0) NULL DEFAULT NULL,
  `medio` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  `banco` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tarjeta` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6528 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for instrucciones
-- ----------------------------
DROP TABLE IF EXISTS `instrucciones`;
CREATE TABLE `instrucciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `alarma` int(0) NULL DEFAULT NULL,
  `texto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `prioridad` tinyint(0) NULL DEFAULT NULL,
  `intentos` int(0) NULL DEFAULT NULL,
  `confirmar` tinyint(0) NULL DEFAULT NULL,
  `procesada` datetime(0) NULL DEFAULT NULL,
  `estado` tinyint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 2766 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for invitaciones
-- ----------------------------
DROP TABLE IF EXISTS `invitaciones`;
CREATE TABLE `invitaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `emision` datetime(0) NULL DEFAULT NULL,
  `usuario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `destino` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `destinatario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `mensaje` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `apertura` datetime(0) NULL DEFAULT NULL,
  `estado` tinyint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1030 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for listas
-- ----------------------------
DROP TABLE IF EXISTS `listas`;
CREATE TABLE `listas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `malijet` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for localidades
-- ----------------------------
DROP TABLE IF EXISTS `localidades`;
CREATE TABLE `localidades`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `pais` int(0) NULL DEFAULT NULL,
  `provincia` int(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `categoria` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ubicacion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `propagacion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 94077 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for marketplaceanunciantes
-- ----------------------------
DROP TABLE IF EXISTS `marketplaceanunciantes`;
CREATE TABLE `marketplaceanunciantes`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `contacto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `localidad` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `provincia` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `pais` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `registrado` datetime(0) NULL DEFAULT NULL,
  `publicaciones` int(0) NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 110 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for marketplacecategorias
-- ----------------------------
DROP TABLE IF EXISTS `marketplacecategorias`;
CREATE TABLE `marketplacecategorias`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `padre` int(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `foto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `orden` int(0) NULL DEFAULT NULL,
  `publicaciones` int(0) NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 130 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for marketplacemensajes
-- ----------------------------
DROP TABLE IF EXISTS `marketplacemensajes`;
CREATE TABLE `marketplacemensajes`  (
  `id` int(0) NOT NULL,
  `anunciante` int(0) NULL DEFAULT NULL,
  `anuncio` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for marketplacepublicaciones
-- ----------------------------
DROP TABLE IF EXISTS `marketplacepublicaciones`;
CREATE TABLE `marketplacepublicaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `categoria` int(0) NULL DEFAULT NULL,
  `anunciante` int(0) NULL DEFAULT NULL,
  `titulo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `registrado` datetime(0) NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 114 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mastercardcupones
-- ----------------------------
DROP TABLE IF EXISTS `mastercardcupones`;
CREATE TABLE `mastercardcupones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comprobante` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `clienteTarjeta` int(0) NULL DEFAULT NULL,
  `presentacion` int(0) NULL DEFAULT NULL,
  `emision` date NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `tarjeta` varchar(19) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medio` tinyint(0) NULL DEFAULT NULL,
  `observaciones` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `importe` decimal(9, 2) NULL DEFAULT NULL,
  `periodo` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `auxiliares` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(0) NULL DEFAULT NULL,
  `imputado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `recibo` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 28286 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mastercardpresentaciones
-- ----------------------------
DROP TABLE IF EXISTS `mastercardpresentaciones`;
CREATE TABLE `mastercardpresentaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `generada` datetime(0) NULL DEFAULT NULL,
  `presentada` datetime(0) NULL DEFAULT NULL,
  `imputada` datetime(0) NULL DEFAULT NULL,
  `presentadasCantidad` int(0) NULL DEFAULT NULL,
  `presentadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `presentadasTexto` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `procesadasCantidad` int(0) NULL DEFAULT NULL,
  `procesadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `procesadasTexto` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `aprobadasCantidad` int(0) NULL DEFAULT NULL,
  `aprobadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `aprobadasTexto` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `rechazadasCantidad` int(0) NULL DEFAULT NULL,
  `rechazadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `rechazadasTexto` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `observadasCantidad` int(0) NULL DEFAULT NULL,
  `observadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `observadasTexto` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 161 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for medios
-- ----------------------------
DROP TABLE IF EXISTS `medios`;
CREATE TABLE `medios`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `grupo` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tipo` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ciclico` tinyint(1) NULL DEFAULT NULL,
  `cuenta` int(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `comentarios` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 26 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for migraciones
-- ----------------------------
DROP TABLE IF EXISTS `migraciones`;
CREATE TABLE `migraciones`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `hash` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `aplicada` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for memos
-- ----------------------------
DROP TABLE IF EXISTS `memos`;
CREATE TABLE `memos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `objeto` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `identidad` int(0) NULL DEFAULT NULL,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `mensaje` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 365 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for menus
-- ----------------------------
DROP TABLE IF EXISTS `menus`;
CREATE TABLE `menus`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `padre` int(0) NULL DEFAULT NULL,
  `orden` tinyint(0) NULL DEFAULT NULL,
  `icono` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `destino` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ventana` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `inicio` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 283 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mercadopago
-- ----------------------------
DROP TABLE IF EXISTS `mercadopago`;
CREATE TABLE `mercadopago`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `articulo` int(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vinculo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mercadopagocupones___
-- ----------------------------
DROP TABLE IF EXISTS `mercadopagocupones___`;
CREATE TABLE `mercadopagocupones___`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comprobante` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `emision` date NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `vencimiento2` date NULL DEFAULT NULL,
  `observaciones` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `importe` decimal(10, 2) NULL DEFAULT NULL,
  `importe2` decimal(10, 2) NULL DEFAULT NULL,
  `enviado` date NULL DEFAULT NULL,
  `visto` tinyint(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 16757 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mercadopagodebitos
-- ----------------------------
DROP TABLE IF EXISTS `mercadopagodebitos`;
CREATE TABLE `mercadopagodebitos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `suscripcion` int(0) NULL DEFAULT NULL,
  `monto` decimal(11, 2) NULL DEFAULT NULL,
  `estado` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 105 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mercadopagoplanes___
-- ----------------------------
DROP TABLE IF EXISTS `mercadopagoplanes___`;
CREATE TABLE `mercadopagoplanes___`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `monto` decimal(11, 2) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 105 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mercadopagosuscripciones
-- ----------------------------
DROP TABLE IF EXISTS `mercadopagosuscripciones`;
CREATE TABLE `mercadopagosuscripciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `usuario` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `comprobante` int(0) NULL DEFAULT NULL,
  `uuid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `referencia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `concepto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `monto` decimal(11, 2) NULL DEFAULT NULL,
  `periodo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `frecuencia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `pruebaPeriodo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `pruebaFrecuencia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `destino` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `registrada` datetime(0) NULL DEFAULT NULL,
  `actualizada` datetime(0) NULL DEFAULT NULL,
  `iniciada` datetime(0) NULL DEFAULT NULL,
  `pausada` datetime(0) NULL DEFAULT NULL,
  `reactivada` datetime(0) NULL DEFAULT NULL,
  `finalizada` datetime(0) NULL DEFAULT NULL,
  `estado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1513 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mercadopagosuscripciones___
-- ----------------------------
DROP TABLE IF EXISTS `mercadopagosuscripciones___`;
CREATE TABLE `mercadopagosuscripciones___`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `monto` decimal(11, 2) NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 105 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for monitoreos
-- ----------------------------
DROP TABLE IF EXISTS `monitoreos`;
CREATE TABLE `monitoreos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `cliente` int(0) NULL DEFAULT NULL,
  `casa` int(0) NULL DEFAULT NULL,
  `plan` int(0) NULL DEFAULT NULL,
  `importe` decimal(10, 0) NULL DEFAULT NULL,
  `desde` date NULL DEFAULT NULL,
  `hasta` date NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for morosos
-- ----------------------------
DROP TABLE IF EXISTS `morosos`;
CREATE TABLE `morosos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `ingreso` date NULL DEFAULT NULL,
  `egreso` date NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `medio` int(0) NULL DEFAULT NULL,
  `capital` decimal(10, 2) NULL DEFAULT NULL,
  `facturas` int(0) NULL DEFAULT NULL,
  `deuda` decimal(10, 2) NULL DEFAULT NULL,
  `antigua` date NULL DEFAULT NULL,
  `operador` int(0) NULL DEFAULT NULL,
  `llamados` int(0) NULL DEFAULT NULL,
  `ultimo` datetime(0) NULL DEFAULT NULL,
  `siguiente` datetime(0) NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  `estadoDetectado` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 49099 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for morososacciones
-- ----------------------------
DROP TABLE IF EXISTS `morososacciones`;
CREATE TABLE `morososacciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `moroso` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `operador` int(0) NULL DEFAULT NULL,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `detalle` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 106464 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for motores
-- ----------------------------
DROP TABLE IF EXISTS `motores`;
CREATE TABLE `motores`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `intervalo` int(0) NULL DEFAULT NULL,
  `tolerancia` int(0) NULL DEFAULT NULL,
  `latido` datetime(0) NULL DEFAULT NULL,
  `orden` smallint(0) NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for negocios
-- ----------------------------
DROP TABLE IF EXISTS `negocios`;
CREATE TABLE `negocios`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `categoria` int(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `responsable` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `web` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ciudad` int(0) NULL DEFAULT NULL,
  `visible` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `calificacion` decimal(3, 1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`, `uuid`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 106 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for negocioscategorias
-- ----------------------------
DROP TABLE IF EXISTS `negocioscategorias`;
CREATE TABLE `negocioscategorias`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 109 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for negociosresenas
-- ----------------------------
DROP TABLE IF EXISTS `negociosresenas`;
CREATE TABLE `negociosresenas`  (
  `id` int(0) NOT NULL,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `negocio` int(0) NULL DEFAULT NULL,
  `comentario` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `calificacion` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for noticias
-- ----------------------------
DROP TABLE IF EXISTS `noticias`;
CREATE TABLE `noticias`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `copete` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `titulo` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `bajada` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `cuerpo` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `visible` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for notificaciones
-- ----------------------------
DROP TABLE IF EXISTS `notificaciones`;
CREATE TABLE `notificaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `icono` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `asunto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuerpo` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `direccion` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `leida` datetime(0) NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1095 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for obras
-- ----------------------------
DROP TABLE IF EXISTS `obras`;
CREATE TABLE `obras`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `tipo` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for pagas
-- ----------------------------
DROP TABLE IF EXISTS `pagas`;
CREATE TABLE `pagas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT 'pagos informados por usuarios',
  `informada` datetime(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `comprobante` int(0) NULL DEFAULT NULL,
  `pagada` datetime(0) NULL DEFAULT NULL,
  `medio` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `monto` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `numero` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `resolucion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 6464 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for pagospymecorreos
-- ----------------------------
DROP TABLE IF EXISTS `pagospymecorreos`;
CREATE TABLE `pagospymecorreos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `creado` datetime(0) NULL DEFAULT NULL,
  `enviado` datetime(0) NULL DEFAULT NULL,
  `sentido` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `asunto` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `adjunto` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `texto` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 5078 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for pagospymecupones
-- ----------------------------
DROP TABLE IF EXISTS `pagospymecupones`;
CREATE TABLE `pagospymecupones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comprobante` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `emision` date NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `vencimiento2` date NULL DEFAULT NULL,
  `observaciones` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `importe` decimal(10, 2) NULL DEFAULT NULL,
  `importe2` decimal(10, 2) NULL DEFAULT NULL,
  `enviado` date NULL DEFAULT NULL,
  `visto` tinyint(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 121253 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for pagospymerecibos
-- ----------------------------
DROP TABLE IF EXISTS `pagospymerecibos`;
CREATE TABLE `pagospymerecibos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `cupon` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `pago` date NULL DEFAULT NULL,
  `importe` decimal(10, 2) NULL DEFAULT NULL,
  `recepcion` datetime(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 20873 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for paises
-- ----------------------------
DROP TABLE IF EXISTS `paises`;
CREATE TABLE `paises`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ubicacion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `propagacion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for parametros
-- ----------------------------
DROP TABLE IF EXISTS `parametros`;
CREATE TABLE `parametros`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `variable` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `valor` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentario` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 147 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for periodicos
-- ----------------------------
DROP TABLE IF EXISTS `periodicos`;
CREATE TABLE `periodicos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `concepto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vencimiento` smallint(0) NULL DEFAULT NULL,
  `debe` decimal(10, 2) NULL DEFAULT NULL,
  `haber` decimal(10, 2) NULL DEFAULT NULL,
  `empresa` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `actualizado` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 119 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for permisos
-- ----------------------------
DROP TABLE IF EXISTS `permisos`;
CREATE TABLE `permisos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `sistema` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 229 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for piezas
-- ----------------------------
DROP TABLE IF EXISTS `piezas`;
CREATE TABLE `piezas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `etiqueta` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tipo` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `registrada` datetime(0) NULL DEFAULT NULL,
  `actualizada` datetime(0) NULL DEFAULT NULL,
  `imprimir` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `impresa` datetime(0) NULL DEFAULT NULL,
  `comentarios` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `responsable` int(0) NULL DEFAULT NULL,
  `ubicacion` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `alarma` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1903 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for piezassucesos
-- ----------------------------
DROP TABLE IF EXISTS `piezassucesos`;
CREATE TABLE `piezassucesos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `pieza` int(0) NULL DEFAULT NULL,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `comentarios` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `alarma` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 360 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for posnetcupones
-- ----------------------------
DROP TABLE IF EXISTS `posnetcupones`;
CREATE TABLE `posnetcupones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `cliente` int(0) NULL DEFAULT NULL,
  `casa` int(0) NULL DEFAULT NULL,
  `emision` date NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `vencimiento2` date NULL DEFAULT NULL,
  `observaciones` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `importe` decimal(10, 2) NULL DEFAULT NULL,
  `importe2` decimal(10, 2) NULL DEFAULT NULL,
  `enviado` datetime(0) NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 91 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for prensas
-- ----------------------------
DROP TABLE IF EXISTS `prensas`;
CREATE TABLE `prensas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` date NULL DEFAULT NULL,
  `titulo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `fuente` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 29 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for promociones
-- ----------------------------
DROP TABLE IF EXISTS `promociones`;
CREATE TABLE `promociones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `desde` datetime(0) NULL DEFAULT NULL,
  `hasta` datetime(0) NULL DEFAULT NULL,
  `condiciones` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `parametros` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for promocionescupones
-- ----------------------------
DROP TABLE IF EXISTS `promocionescupones`;
CREATE TABLE `promocionescupones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `emision` datetime(0) NULL DEFAULT NULL,
  `vencimiento` datetime(0) NULL DEFAULT NULL,
  `promocion` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `deuda` decimal(10, 2) NULL DEFAULT NULL,
  `gestion` decimal(10, 2) NULL DEFAULT NULL,
  `total` decimal(10, 2) NULL DEFAULT NULL,
  `detalle` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `script` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `operador` int(0) NULL DEFAULT NULL,
  `prima` decimal(10, 2) NULL DEFAULT NULL,
  `comision` int(0) NULL DEFAULT NULL,
  `comprobante` int(0) NULL DEFAULT NULL,
  `domicilio` smallint(0) NULL DEFAULT NULL,
  `aplicado` datetime(0) NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12279 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for promocionesinvitaciones
-- ----------------------------
DROP TABLE IF EXISTS `promocionesinvitaciones`;
CREATE TABLE `promocionesinvitaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `promocion` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `enviada` datetime(0) NULL DEFAULT NULL,
  `aceptada` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for prospectos
-- ----------------------------
DROP TABLE IF EXISTS `prospectos`;
CREATE TABLE `prospectos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `alta` datetime(0) NULL DEFAULT NULL,
  `origen` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `producto` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cartera` int(0) NULL DEFAULT NULL,
  `organizacion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `contacto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `localidad` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `provincia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `pais` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ubicacion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `referente` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(0) NULL DEFAULT NULL,
  `actualizado` datetime(0) NULL DEFAULT NULL,
  `comentarios` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `acciones` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 4502 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for prospectosacciones
-- ----------------------------
DROP TABLE IF EXISTS `prospectosacciones`;
CREATE TABLE `prospectosacciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `prospecto` int(0) NULL DEFAULT NULL,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `empleado` int(0) NULL DEFAULT NULL,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentarios` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 881 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for prospectoscorreos
-- ----------------------------
DROP TABLE IF EXISTS `prospectoscorreos`;
CREATE TABLE `prospectoscorreos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `remitente` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `remite` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `asunto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuerpo` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for protectores
-- ----------------------------
DROP TABLE IF EXISTS `protectores`;
CREATE TABLE `protectores`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `zonas` int(0) NULL DEFAULT NULL,
  `habilitado` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for protectoreszonas
-- ----------------------------
DROP TABLE IF EXISTS `protectoreszonas`;
CREATE TABLE `protectoreszonas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `protector` int(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `sensor` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `habilitado` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for protocolos
-- ----------------------------
DROP TABLE IF EXISTS `protocolos`;
CREATE TABLE `protocolos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `tipo` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `titulo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuerpo` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 73 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for proveedores
-- ----------------------------
DROP TABLE IF EXISTS `proveedores`;
CREATE TABLE `proveedores`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ciudad` int(0) NULL DEFAULT NULL,
  `telefono` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `web` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `talonario` int(0) NULL DEFAULT NULL,
  `condicion` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuit` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vendedorNombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vendedorTelefono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vendedorCorreo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vendedorNombre2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vendedorTelefono2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vendedorCorreo2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vendedorNombre3` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vendedorTelefono3` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vendedorCorreo3` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentarios` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 2039 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for provincias
-- ----------------------------
DROP TABLE IF EXISTS `provincias`;
CREATE TABLE `provincias`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `pais` int(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `categoria` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ubicacion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `propagacion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 101 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for pruebas
-- ----------------------------
DROP TABLE IF EXISTS `pruebas`;
CREATE TABLE `pruebas`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `alarma` int(0) NULL DEFAULT NULL,
  `iniciada` datetime(0) NULL DEFAULT NULL,
  `finalizada` datetime(0) NULL DEFAULT NULL,
  `fallas` smallint(0) NULL DEFAULT NULL,
  `resultado` smallint(0) NULL DEFAULT NULL,
  `mensaje` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for rapicobrocupones
-- ----------------------------
DROP TABLE IF EXISTS `rapicobrocupones`;
CREATE TABLE `rapicobrocupones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comprobante` int(0) NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `emision` date NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `observaciones` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `importe` decimal(9, 2) NULL DEFAULT NULL,
  `estado` tinyint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1887 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for rastreados
-- ----------------------------
DROP TABLE IF EXISTS `rastreados`;
CREATE TABLE `rastreados`  (
  `id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL,
  `telefono` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL,
  `reportado` datetime(0) NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for rastreadosubicaciones
-- ----------------------------
DROP TABLE IF EXISTS `rastreadosubicaciones`;
CREATE TABLE `rastreadosubicaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `rastreado` int(0) NULL DEFAULT NULL,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `latitud` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `longitud` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `velocidad` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 109 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for referidos
-- ----------------------------
DROP TABLE IF EXISTS `referidos`;
CREATE TABLE `referidos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `ingreso` datetime(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 107 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for reportes
-- ----------------------------
DROP TABLE IF EXISTS `reportes`;
CREATE TABLE `reportes`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `alarma` int(0) NULL DEFAULT NULL,
  `texto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 991331 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for representantesempleados
-- ----------------------------
DROP TABLE IF EXISTS `representantesempleados`;
CREATE TABLE `representantesempleados`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `representante` int(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for rescisiones
-- ----------------------------
DROP TABLE IF EXISTS `rescisiones`;
CREATE TABLE `rescisiones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `contrato` int(0) NULL DEFAULT NULL,
  `ingresada` datetime(0) NULL DEFAULT NULL,
  `finalizada` datetime(0) NULL DEFAULT NULL,
  `medio` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `motivo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentarios` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `receptor` int(0) NULL DEFAULT NULL,
  `responsable` int(0) NULL DEFAULT NULL,
  `promo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `aplicada` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2141 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for rescisionespromos
-- ----------------------------
DROP TABLE IF EXISTS `rescisionespromos`;
CREATE TABLE `rescisionespromos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `valor` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `articulo` int(0) NULL DEFAULT NULL,
  `orden` smallint(0) NULL DEFAULT NULL,
  `visible` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for retornos
-- ----------------------------
DROP TABLE IF EXISTS `retornos`;
CREATE TABLE `retornos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `telefono` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `texto` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 15652 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for reuniones
-- ----------------------------
DROP TABLE IF EXISTS `reuniones`;
CREATE TABLE `reuniones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `registrada` datetime(0) NULL DEFAULT NULL,
  `programada` datetime(0) NULL DEFAULT NULL,
  `vendedor` int(0) NULL DEFAULT NULL,
  `objeto` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `identidad` int(0) NULL DEFAULT NULL,
  `contacto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentarios` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 406 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for roles
-- ----------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `sistema` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `permisos` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `menus` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `widgets` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 122 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for satelites
-- ----------------------------
DROP TABLE IF EXISTS `satelites`;
CREATE TABLE `satelites`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `casa` int(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `equipo` int(0) NULL DEFAULT NULL,
  `dispositivo` int(0) NULL DEFAULT NULL,
  `tipo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  `habilitado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for senales
-- ----------------------------
DROP TABLE IF EXISTS `senales`;
CREATE TABLE `senales`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `sentido` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `propagacion` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `texto` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `prioridad` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `intentos` smallint(0) NULL DEFAULT NULL,
  `procesada` datetime(0) NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx`(`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 32891108 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sismos
-- ----------------------------
DROP TABLE IF EXISTS `sismos`;
CREATE TABLE `sismos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `magnitud` decimal(11, 2) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 48 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for solicitudes
-- ----------------------------
DROP TABLE IF EXISTS `solicitudes`;
CREATE TABLE `solicitudes`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `comunidad` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `domicilio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sorteos
-- ----------------------------
DROP TABLE IF EXISTS `sorteos`;
CREATE TABLE `sorteos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `fecha` date NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 103 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sorteosganadores
-- ----------------------------
DROP TABLE IF EXISTS `sorteosganadores`;
CREATE TABLE `sorteosganadores`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `sorteo` int(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `celular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `facebook` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `instagram` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tiktok` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 503 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sucesos
-- ----------------------------
DROP TABLE IF EXISTS `sucesos`;
CREATE TABLE `sucesos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `iniciado` datetime(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `objeto` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `identidad` int(0) NULL DEFAULT NULL,
  `detalle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `prioridad` tinyint(0) NULL DEFAULT NULL,
  `estado` tinyint(0) NULL DEFAULT NULL,
  `finalizado` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1041477 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sucesos_log
-- ----------------------------
DROP TABLE IF EXISTS `sucesos_log`;
CREATE TABLE `sucesos_log`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `origen` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tipo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'info',
  `detalle` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for talonarios
-- ----------------------------
DROP TABLE IF EXISTS `talonarios`;
CREATE TABLE `talonarios`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `empresa` int(0) NULL DEFAULT NULL,
  `tipo` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `punto` int(0) NULL DEFAULT NULL,
  `serie` int(0) NULL DEFAULT NULL,
  `fiscal` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 42 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for teclados
-- ----------------------------
DROP TABLE IF EXISTS `teclados`;
CREATE TABLE `teclados`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `contenido` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `visible` smallint(0) NULL DEFAULT NULL,
  `habilitado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 614 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for terminales
-- ----------------------------
DROP TABLE IF EXISTS `terminales`;
CREATE TABLE `terminales`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tipo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `sistema` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `registrada` datetime(0) NULL DEFAULT NULL,
  `ingresada` datetime(0) NULL DEFAULT NULL,
  `firma` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `token` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `marca` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `modelo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16751 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for terminos___
-- ----------------------------
DROP TABLE IF EXISTS `terminos___`;
CREATE TABLE `terminos___`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `modo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cuerpo` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 22 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tiendacargados
-- ----------------------------
DROP TABLE IF EXISTS `tiendacargados`;
CREATE TABLE `tiendacargados`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `usuario` int(0) NULL DEFAULT NULL,
  `articulo` int(0) NULL DEFAULT NULL,
  `cantidad` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for tiendapedidos
-- ----------------------------
DROP TABLE IF EXISTS `tiendapedidos`;
CREATE TABLE `tiendapedidos`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `usuario` int(0) NULL DEFAULT NULL,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `total` decimal(10, 0) NULL DEFAULT NULL,
  `estado` smallint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 263 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for tiendapedidosrenglones
-- ----------------------------
DROP TABLE IF EXISTS `tiendapedidosrenglones`;
CREATE TABLE `tiendapedidosrenglones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `pedido` int(0) NULL DEFAULT NULL,
  `cantidad` int(0) NULL DEFAULT NULL,
  `articulo` int(0) NULL DEFAULT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `unitario` decimal(10, 2) NULL DEFAULT NULL,
  `subtotal` decimal(10, 2) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 45 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for usuarios
-- ----------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `casa` int(0) NULL DEFAULT NULL,
  `comunidad` int(0) NULL DEFAULT NULL,
  `token` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `genero` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nacimiento` date NULL DEFAULT NULL,
  `dni` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `aplicacion` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ubicacionCoordenadas` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ubicacionExactitud` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ubicacionActualizada` datetime(0) NULL DEFAULT NULL,
  `sistema` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `instalada` datetime(0) NULL DEFAULT NULL,
  `ejecutada` datetime(0) NULL DEFAULT NULL,
  `avisos` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `notificaciones` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `whatsapps` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `mensajes` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `correos` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `contrasena` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `clave` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `terminal` int(0) NULL DEFAULT NULL,
  `registrado` datetime(0) NULL DEFAULT NULL,
  `registrante` int(0) NULL DEFAULT NULL,
  `roles` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  `propiedades` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 22117 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for validaciones
-- ----------------------------
DROP TABLE IF EXISTS `validaciones`;
CREATE TABLE `validaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` datetime(0) NULL DEFAULT NULL,
  `telefono` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `codigo` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 26690 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for verazintimaciones
-- ----------------------------
DROP TABLE IF EXISTS `verazintimaciones`;
CREATE TABLE `verazintimaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `contrato` int(0) NULL DEFAULT NULL,
  `emision` date NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `facturas` int(0) NULL DEFAULT NULL,
  `recibos` int(0) NULL DEFAULT NULL,
  `deuda` decimal(10, 2) NULL DEFAULT NULL,
  `presentacion` int(0) NULL DEFAULT NULL,
  `estado` tinyint(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 695 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for verificaciones
-- ----------------------------
DROP TABLE IF EXISTS `verificaciones`;
CREATE TABLE `verificaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comunidad` int(0) NULL DEFAULT NULL,
  `alarma` int(0) NULL DEFAULT NULL,
  `casa` int(0) NULL DEFAULT NULL,
  `usuario` int(0) NULL DEFAULT NULL,
  `telefono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `resultado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for visacupones
-- ----------------------------
DROP TABLE IF EXISTS `visacupones`;
CREATE TABLE `visacupones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `comprobante` int(0) NULL DEFAULT NULL,
  `cliente` int(0) NULL DEFAULT NULL,
  `clienteTarjeta` int(0) NULL DEFAULT NULL,
  `presentacion` int(0) NULL DEFAULT NULL,
  `emision` date NULL DEFAULT NULL,
  `vencimiento` date NULL DEFAULT NULL,
  `tarjeta` varchar(19) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `medio` tinyint(0) NULL DEFAULT NULL,
  `observaciones` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `importe` decimal(9, 2) NULL DEFAULT NULL,
  `periodo` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `auxiliares` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `estado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `imputado` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `recibo` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 52064 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for visapresentaciones
-- ----------------------------
DROP TABLE IF EXISTS `visapresentaciones`;
CREATE TABLE `visapresentaciones`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `generada` datetime(0) NULL DEFAULT NULL,
  `presentada` datetime(0) NULL DEFAULT NULL,
  `imputada` datetime(0) NULL DEFAULT NULL,
  `presentadasCantidad` int(0) NULL DEFAULT NULL,
  `presentadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `presentadasTexto` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `procesadasCantidad` int(0) NULL DEFAULT NULL,
  `procesadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `procesadasTexto` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `aprobadasCantidad` int(0) NULL DEFAULT NULL,
  `aprobadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `aprobadasTexto` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `rechazadasCantidad` int(0) NULL DEFAULT NULL,
  `rechazadasMonto` decimal(10, 2) NULL DEFAULT NULL,
  `rechazadasTexto` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `estado` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 132 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget005
-- ----------------------------
DROP TABLE IF EXISTS `widget005`;
CREATE TABLE `widget005`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `periodo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `altas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `bajas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `resultado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 15948 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget007
-- ----------------------------
DROP TABLE IF EXISTS `widget007`;
CREATE TABLE `widget007`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ingresado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `acumulado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 25608 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'ingresos diarios' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget013
-- ----------------------------
DROP TABLE IF EXISTS `widget013`;
CREATE TABLE `widget013`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `periodo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `instalaciones` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `desinstalaciones` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `resultado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 7503 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget014
-- ----------------------------
DROP TABLE IF EXISTS `widget014`;
CREATE TABLE `widget014`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `periodo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `altas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `bajas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 11697 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget015
-- ----------------------------
DROP TABLE IF EXISTS `widget015`;
CREATE TABLE `widget015`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `facturado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cobrado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `pendiente` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 13545 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'ingresos diarios' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget016
-- ----------------------------
DROP TABLE IF EXISTS `widget016`;
CREATE TABLE `widget016`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `facturable` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `cobrable` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `incobrable` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 13476 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'ingresos diarios' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget020
-- ----------------------------
DROP TABLE IF EXISTS `widget020`;
CREATE TABLE `widget020`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `seguridad` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tecnica` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 6607 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'ingresos diarios' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget022
-- ----------------------------
DROP TABLE IF EXISTS `widget022`;
CREATE TABLE `widget022`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `periodo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `usuarios` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget023
-- ----------------------------
DROP TABLE IF EXISTS `widget023`;
CREATE TABLE `widget023`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `empleado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `empleadoNombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `entrada` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 6462 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget024
-- ----------------------------
DROP TABLE IF EXISTS `widget024`;
CREATE TABLE `widget024`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `llamador1` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `llamador2` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `llamador3` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `llamador4` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `llamador5` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `operador1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `operador2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `operador3` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `operador4` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `operador5` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `operador6` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 45883 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'ingresos diarios' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget026
-- ----------------------------
DROP TABLE IF EXISTS `widget026`;
CREATE TABLE `widget026`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `grafico` smallint(0) NULL DEFAULT NULL,
  `fecha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cajas` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `bancos` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `total` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cheques1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cheques2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 29876 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'ingresos diarios' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget028
-- ----------------------------
DROP TABLE IF EXISTS `widget028`;
CREATE TABLE `widget028`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `facturadoMonitoreo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cobradoMonitoreo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `facturadoTotal` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cobradoTotal` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `pendienteTotal` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 21329 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'ingresos diarios' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget029
-- ----------------------------
DROP TABLE IF EXISTS `widget029`;
CREATE TABLE `widget029`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `facturado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cobrado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `pendiente` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 15183 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'ingresos diarios' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget030
-- ----------------------------
DROP TABLE IF EXISTS `widget030`;
CREATE TABLE `widget030`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `periodo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `caducadas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `anuladas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 8629 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget031
-- ----------------------------
DROP TABLE IF EXISTS `widget031`;
CREATE TABLE `widget031`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `video` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 18 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget032
-- ----------------------------
DROP TABLE IF EXISTS `widget032`;
CREATE TABLE `widget032`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `registrados` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `instaladas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ejecutadas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 21361 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'ingresos diarios' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget033
-- ----------------------------
DROP TABLE IF EXISTS `widget033`;
CREATE TABLE `widget033`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `periodo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `facturado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `acreditado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `iva` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `iibb` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 7867 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget034
-- ----------------------------
DROP TABLE IF EXISTS `widget034`;
CREATE TABLE `widget034`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `periodo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `facturado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `acreditado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `iva` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `iibb` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 7204 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget035
-- ----------------------------
DROP TABLE IF EXISTS `widget035`;
CREATE TABLE `widget035`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `periodo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `recibido` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `facturado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 15294 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget036
-- ----------------------------
DROP TABLE IF EXISTS `widget036`;
CREATE TABLE `widget036`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `estado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `cantidad` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 12749 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget037
-- ----------------------------
DROP TABLE IF EXISTS `widget037`;
CREATE TABLE `widget037`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `total` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `dia` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `noche` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 14310 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget038
-- ----------------------------
DROP TABLE IF EXISTS `widget038`;
CREATE TABLE `widget038`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `total` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `vigentes` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `morosos` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `suspendidos` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `temporalidad` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 323795 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget039
-- ----------------------------
DROP TABLE IF EXISTS `widget039`;
CREATE TABLE `widget039`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `total` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `vigentes` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `morosos` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `suspendidos` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `temporalidad` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 270995 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget040
-- ----------------------------
DROP TABLE IF EXISTS `widget040`;
CREATE TABLE `widget040`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `total` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `javier` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `leonardo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `lucas` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `marcelo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `temporalidad` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 17847 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widget041
-- ----------------------------
DROP TABLE IF EXISTS `widget041`;
CREATE TABLE `widget041`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `fecha` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `total` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `fp` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'falta de pago',
  `cd` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'cambio de domicilio',
  `cs` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'costo servicio',
  `fs` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'falla servicio',
  `fr` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'fallecimiento',
  `ar` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'alarmas retiradas',
  `ot` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'otro',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 17451 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for widgets
-- ----------------------------
DROP TABLE IF EXISTS `widgets`;
CREATE TABLE `widgets`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `modo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `archivo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `alto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ancho` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 131 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- View structure for alarmasinstalacionesvista
-- ----------------------------
DROP VIEW IF EXISTS `alarmasinstalacionesvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `alarmasinstalacionesvista` AS select `alarmasinstalaciones`.`id` AS `id`,`alarmasinstalaciones`.`tarea` AS `tarea`,`alarmasinstalaciones`.`alarma` AS `alarma`,`alarmasinstalaciones`.`tecnico` AS `tecnico`,`alarmasinstalaciones`.`ingresada` AS `ingresada`,`alarmasinstalaciones`.`programada` AS `programada`,`alarmasinstalaciones`.`completada` AS `completada`,`alarmasinstalaciones`.`estado` AS `estado`,`alarmas`.`hardware` AS `alarmaHardware`,`alarmas`.`firmware` AS `alarmaFirmware` from (`alarmasinstalaciones` join `alarmas` on((`alarmas`.`id` = `alarmasinstalaciones`.`alarma`)));

-- ----------------------------
-- View structure for alarmasvista
-- ----------------------------
DROP VIEW IF EXISTS `alarmasvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `alarmasvista` AS select `ciudades`.`localidad` AS `ciudadLocalidad`,`ciudades`.`provincia` AS `ciudadProvincia`,`ciudades`.`pais` AS `ciudadPais`,`comunidades`.`nombre` AS `comunidadNombre`,`comunidades`.`contratos` AS `comunidadContratos`,`comunidades`.`contratosVigentes` AS `comunidadContratosVigentes`,`comunidades`.`contratosMorosos` AS `comunidadContratosMorosos`,`comunidades`.`contratosSuspendidos` AS `comunidadContratosSuspendidos`,`comunidades`.`contratosRescindidos` AS `comunidadContratosRescindidos`,`comunidades`.`contratosPermanencia` AS `comunidadContratosPermanencia`,`alarmas`.`id` AS `id`,`alarmas`.`nombre` AS `nombre`,`alarmas`.`equipo` AS `equipo`,`alarmas`.`tipo` AS `tipo`,`alarmas`.`generacion` AS `generacion`,`alarmas`.`hardware` AS `hardware`,`alarmas`.`firmware` AS `firmware`,`alarmas`.`revision` AS `revision`,`alarmas`.`prioridad` AS `prioridad`,`alarmas`.`altura` AS `altura`,`alarmas`.`comunicacion` AS `comunicacion`,`alarmas`.`propagacion` AS `propagacion`,`alarmas`.`identidad` AS `identidad`,`alarmas`.`comunidad` AS `comunidad`,`alarmas`.`domicilio` AS `domicilio`,`alarmas`.`ciudad` AS `ciudad`,`alarmas`.`foto` AS `foto`,`alarmas`.`latitud` AS `latitud`,`alarmas`.`longitud` AS `longitud`,`alarmas`.`instalacion` AS `instalacion`,`alarmas`.`atendida` AS `atendida`,`alarmas`.`garantia` AS `garantia`,`alarmas`.`desinstalacion` AS `desinstalacion`,`alarmas`.`titularidad` AS `titularidad`,`alarmas`.`estado` AS `estado`,`alarmas`.`disuasion` AS `disuasion`,`alarmas`.`inicio` AS `inicio`,`alarmas`.`latido` AS `latido`,`alarmas`.`energia` AS `energia`,`alarmas`.`bateria` AS `bateria`,`alarmas`.`reinicios` AS `reinicios`,`alarmas`.`senal` AS `senal`,`alarmas`.`reconexiones` AS `reconexiones`,`alarmas`.`salud` AS `salud`,`alarmas`.`envio` AS `envio`,`alarmas`.`parametros` AS `parametros` from ((`alarmas` join `ciudades` on((`alarmas`.`ciudad` = `ciudades`.`id`))) join `comunidades` on((`alarmas`.`comunidad` = `comunidades`.`id`)));

-- ----------------------------
-- View structure for casasvista
-- ----------------------------
DROP VIEW IF EXISTS `casasvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `casasvista` AS select `comunidades`.`nombre` AS `comunidadNombre`,`casas`.`id` AS `id`,`casas`.`comunidad` AS `comunidad`,`casas`.`nombre` AS `nombre`,`casas`.`domicilio` AS `domicilio`,`casas`.`ciudad` AS `ciudad`,`casas`.`latitud` AS `latitud`,`casas`.`longitud` AS `longitud`,`casas`.`grupos` AS `grupos`,`casas`.`usuario` AS `usuario`,`casas`.`cliente` AS `cliente`,`casas`.`contrato` AS `contrato`,`casas`.`alta` AS `alta`,`casas`.`monitoreo` AS `monitoreo`,`casas`.`estado` AS `estado` from (`casas` join `comunidades` on((`comunidades`.`id` = `casas`.`comunidad`)));

-- ----------------------------
-- View structure for chatsmensajesvista
-- ----------------------------
DROP VIEW IF EXISTS `chatsmensajesvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `chatsmensajesvista` AS select `chats`.`origen` AS `chatOrigen`,`chats`.`destino` AS `chatDestino`,`chatsmensajes`.`id` AS `id`,`chatsmensajes`.`chat` AS `chat`,`chatsmensajes`.`fecha` AS `fecha`,`chatsmensajes`.`sentido` AS `sentido`,`chatsmensajes`.`mensaje` AS `mensaje` from (`chatsmensajes` join `chats` on((`chatsmensajes`.`chat` = `chats`.`id`)));

-- ----------------------------
-- View structure for clientescuentasvista
-- ----------------------------
DROP VIEW IF EXISTS `clientescuentasvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `clientescuentasvista` AS select `clientes`.`nombre` AS `nombre`,`clientescuentas`.`id` AS `id`,`clientescuentas`.`cliente` AS `cliente`,`clientescuentas`.`usuario` AS `usuario`,`clientescuentas`.`medio` AS `medio`,`clientescuentas`.`titular` AS `titular`,`clientescuentas`.`documento` AS `documento`,`clientescuentas`.`banco` AS `banco`,`clientescuentas`.`cbu` AS `cbu`,`clientescuentas`.`validacion` AS `validacion`,`clientescuentas`.`firma` AS `firma`,`clientescuentas`.`estado` AS `estado`,`clientescuentas`.`observaciones` AS `observaciones` from (`clientes` join `clientescuentas` on((`clientes`.`id` = `clientescuentas`.`cliente`)));

-- ----------------------------
-- View structure for comprobantesrenglonesvista
-- ----------------------------
DROP VIEW IF EXISTS `comprobantesrenglonesvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `comprobantesrenglonesvista` AS select `comprobantes`.`contrato` AS `comprobantecontrato`,`comprobantes`.`razon` AS `comprobanterazon`,`comprobantes`.`contraparte` AS `comprobantecontraparte`,`comprobantes`.`emision` AS `comprobanteemision`,`comprobantes`.`talonario` AS `comprobantetalonario`,`comprobantes`.`fiscal` AS `comprobantefiscal`,`comprobantesrenglones`.`id` AS `id`,`comprobantesrenglones`.`comprobante` AS `comprobante`,`comprobantesrenglones`.`orden` AS `orden`,`comprobantesrenglones`.`cantidad` AS `cantidad`,`comprobantesrenglones`.`articulo` AS `articulo`,`comprobantesrenglones`.`detalle` AS `detalle`,`comprobantesrenglones`.`iva` AS `iva`,`comprobantesrenglones`.`unitario` AS `unitario`,`comprobantesrenglones`.`monto` AS `monto`,`comprobantesrenglones`.`estado` AS `estado` from (`comprobantes` join `comprobantesrenglones` on((`comprobantesrenglones`.`comprobante` = `comprobantes`.`id`)));

-- ----------------------------
-- View structure for compuestosvista
-- ----------------------------
DROP VIEW IF EXISTS `compuestosvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `compuestosvista` AS select `articulos`.`nombre` AS `nombre`,`articulos`.`compra` AS `compra`,`compuestos`.`requiere` AS `requiere` from (`articulos` join `compuestos` on((`compuestos`.`componente` = `articulos`.`id`)));

-- ----------------------------
-- View structure for comunidadesvista
-- ----------------------------
DROP VIEW IF EXISTS `comunidadesvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `comunidadesvista` AS select `ciudades`.`localidad` AS `ciudadLocalidad`,`ciudades`.`provincia` AS `ciudadProvincia`,`ciudades`.`pais` AS `ciudadPais`,`convenios`.`modo` AS `convenioModo`,`comunidades`.`id` AS `id`,`comunidades`.`uuid` AS `uuid`,`comunidades`.`nombre` AS `nombre`,`comunidades`.`domicilio` AS `domicilio`,`comunidades`.`ciudad` AS `ciudad`,`comunidades`.`latitud` AS `latitud`,`comunidades`.`longitud` AS `longitud`,`comunidades`.`indicaciones` AS `indicaciones`,`comunidades`.`policia` AS `policia`,`comunidades`.`ambulancia` AS `ambulancia`,`comunidades`.`bomberos` AS `bomberos`,`comunidades`.`solvencia` AS `solvencia`,`comunidades`.`inscripcion` AS `inscripcion`,`comunidades`.`plan` AS `plan`,`comunidades`.`promo` AS `promo`,`comunidades`.`promoInicio` AS `promoInicio`,`comunidades`.`promoFin` AS `promoFin`,`comunidades`.`mantenimiento` AS `mantenimiento`,`comunidades`.`convenio` AS `convenio`,`comunidades`.`contratos` AS `contratos`,`comunidades`.`contratosVigentes` AS `contratosVigentes`,`comunidades`.`contratosMorosos` AS `contratosMorosos`,`comunidades`.`contratosSuspendidos` AS `contratosSuspendidos`,`comunidades`.`contratosRescindidos` AS `contratosRescindidos`,`comunidades`.`contratosPermanencia` AS `contratosPermanencia`,`comunidades`.`alarmas` AS `alarmas`,`comunidades`.`alarmasOnline` AS `alarmasOnline`,`comunidades`.`alarmasOffline` AS `alarmasOffline`,`comunidades`.`alarmasFuncionamiento` AS `alarmasFuncionamiento`,`comunidades`.`casas` AS `casas`,`comunidades`.`usuarios` AS `usuarios`,`comunidades`.`disparos` AS `disparos`,`comunidades`.`registro` AS `registro`,`comunidades`.`alta` AS `alta`,`comunidades`.`modo` AS `modo`,`comunidades`.`vendedor` AS `vendedor`,`comunidades`.`estado` AS `estado`,`comunidades`.`wspHabilitado` AS `wspHabilitado`,`comunidades`.`wspNombre` AS `wspNombre`,`comunidades`.`wspDescripcion` AS `wspDescripcion`,`comunidades`.`wspGrupo` AS `wspGrupo`,`comunidades`.`wspInvitacion` AS `wspInvitacion`,`comunidades`.`wspIcono` AS `wspIcono`,`comunidades`.`wspMiembros` AS `wspMiembros`,`comunidades`.`wspActualizado` AS `wspActualizado`,`comunidades`.`wspRenovado` AS `wspRenovado` from ((`comunidades` join `ciudades` on((`ciudades`.`id` = `comunidades`.`ciudad`))) join `convenios` on((`comunidades`.`convenio` = `convenios`.`id`)));

-- ----------------------------
-- View structure for contratosvista
-- ----------------------------
DROP VIEW IF EXISTS `contratosvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `contratosvista` AS select `clientes`.`nombre` AS `clienteNombre`,`clientes`.`medio` AS `clienteMedio`,`comunidades`.`nombre` AS `comunidadNombre`,`clientes`.`situacion` AS `clienteSituacion`,`clientes`.`canceladas` AS `clienteCanceladas`,`clientes`.`pendientes` AS `clientePendientes`,`clientes`.`telefono` AS `clienteTelefono`,`clientes`.`correo` AS `clienteCorreo`,`contratos`.`id` AS `id`,`contratos`.`inscripcion` AS `inscripcion`,`contratos`.`numero` AS `numero`,`contratos`.`comunidad` AS `comunidad`,`contratos`.`cliente` AS `cliente`,`contratos`.`vendedor` AS `vendedor`,`contratos`.`convenio` AS `convenio`,`contratos`.`tipo` AS `tipo`,`contratos`.`modo` AS `modo`,`contratos`.`cantidad` AS `cantidad`,`contratos`.`registro` AS `registro`,`contratos`.`firma` AS `firma`,`contratos`.`alta` AS `alta`,`contratos`.`baja` AS `baja`,`contratos`.`bajaHabilitada` AS `bajaHabilitada`,`contratos`.`bajaDeshabilitar` AS `bajaDeshabilitar`,`contratos`.`permanencia` AS `permanencia`,`contratos`.`plan` AS `plan`,`contratos`.`promo` AS `promo`,`contratos`.`promoInicio` AS `promoInicio`,`contratos`.`promoFinal` AS `promoFinal`,`contratos`.`ciclo` AS `ciclo`,`contratos`.`cuota` AS `cuota`,`contratos`.`periodo` AS `periodo`,`contratos`.`facturado` AS `facturado`,`contratos`.`facturar` AS `facturar`,`contratos`.`comision` AS `comision`,`contratos`.`estado` AS `estado`,`contratos`.`estadoDetectado` AS `estadoDetectado`,`contratos`.`canalNotificacion` AS `canalNotificacion`,`contratos`.`canalCorreo` AS `canalCorreo`,`contratos`.`canalWhatsapp` AS `canalWhatsapp`,`contratos`.`canalSms` AS `canalSms`,`contratos`.`resumenNotificacion` AS `resumenNotificacion`,`contratos`.`resumenCorreo` AS `resumenCorreo`,`contratos`.`resumenWhatsapp` AS `resumenWhatsapp`,`contratos`.`resumenSms` AS `resumenSms` from ((`contratos` join `clientes` on((`contratos`.`cliente` = `clientes`.`id`))) join `comunidades` on((`comunidades`.`id` = `contratos`.`comunidad`)));

-- ----------------------------
-- View structure for cuentasmovimientosvista
-- ----------------------------
DROP VIEW IF EXISTS `cuentasmovimientosvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `cuentasmovimientosvista` AS select `cuentas`.`nombre` AS `cuentaNombre`,`cuentasmovimientos`.`id` AS `id`,`cuentasmovimientos`.`cuenta` AS `cuenta`,`cuentasmovimientos`.`fecha` AS `fecha`,`cuentasmovimientos`.`monto` AS `monto`,`cuentasmovimientos`.`saldo` AS `saldo` from (`cuentas` join `cuentasmovimientos` on((`cuentas`.`id` = `cuentasmovimientos`.`cuenta`)));

-- ----------------------------
-- View structure for cuentasvista
-- ----------------------------
DROP VIEW IF EXISTS `cuentasvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `cuentasvista` AS select `cuentas2`.`nombre` AS `padreNombre`,`cuentas`.`id` AS `id`,`cuentas`.`padre` AS `padre`,`cuentas`.`orden` AS `orden`,`cuentas`.`categoria` AS `categoria`,`cuentas`.`tipo` AS `tipo`,`cuentas`.`nombre` AS `nombre`,`cuentas`.`observaciones` AS `observaciones`,`cuentas`.`saldo` AS `saldo` from (`cuentas` join `cuentas` `cuentas2` on((`cuentas`.`padre` = `cuentas2`.`id`)));

-- ----------------------------
-- View structure for disparosaccionesvista
-- ----------------------------
DROP VIEW IF EXISTS `disparosaccionesvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `disparosaccionesvista` AS select `disparosacciones`.`id` AS `id`,`disparosacciones`.`fecha` AS `fecha`,`disparosacciones`.`disparo` AS `disparo`,`disparosacciones`.`usuario` AS `usuario`,`disparosacciones`.`detalle` AS `detalle`,`usuarios`.`nombre` AS `usuarioNombre` from (`usuarios` join `disparosacciones` on((`disparosacciones`.`usuario` = `usuarios`.`id`)));

-- ----------------------------
-- View structure for disparosvista
-- ----------------------------
DROP VIEW IF EXISTS `disparosvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `disparosvista` AS select `comunidades`.`nombre` AS `comunidadNombre`,`usuarios`.`nombre` AS `usuarioNombre`,`disparos`.`id` AS `id`,`disparos`.`fecha` AS `fecha`,`disparos`.`comunidad` AS `comunidad`,`disparos`.`casa` AS `casa`,`disparos`.`usuario` AS `usuario`,`disparos`.`modo` AS `modo`,`disparos`.`procesado` AS `procesado`,`disparos`.`guardia` AS `guardia`,`disparos`.`resultado` AS `resultado`,`disparos`.`comentario` AS `comentario`,`disparos`.`estado` AS `estado` from ((`disparos` join `comunidades` on((`comunidades`.`id` = `disparos`.`comunidad`))) join `usuarios` on((`usuarios`.`id` = `disparos`.`usuario`)));

-- ----------------------------
-- View structure for empleadosmarcadasvista
-- ----------------------------
DROP VIEW IF EXISTS `empleadosmarcadasvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `empleadosmarcadasvista` AS select `empleados`.`nombre` AS `nombre`,`empleadosmarcadas`.`id` AS `id`,`empleadosmarcadas`.`empleado` AS `empleado`,`empleadosmarcadas`.`fecha` AS `fecha`,`empleadosmarcadas`.`sentido` AS `sentido` from (`empleados` join `empleadosmarcadas` on((`empleadosmarcadas`.`empleado` = `empleados`.`id`)));

-- ----------------------------
-- View structure for ingresosvista
-- ----------------------------
DROP VIEW IF EXISTS `ingresosvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `ingresosvista` AS select `usuarios`.`nombre` AS `usuarioNombre`,`comunidades`.`nombre` AS `comunidadNombre`,`ingresos`.`id` AS `id`,`ingresos`.`fecha` AS `fecha`,`ingresos`.`usuario` AS `usuario`,`ingresos`.`comunidad` AS `comunidad`,`ingresos`.`cargo` AS `cargo`,`ingresos`.`geolocalizacion` AS `geolocalizacion`,`ingresos`.`ip` AS `ip` from ((`ingresos` join `usuarios` on((`usuarios`.`id` = `ingresos`.`usuario`))) join `comunidades` on((`comunidades`.`id` = `ingresos`.`comunidad`)));

-- ----------------------------
-- View structure for instruccionesvista
-- ----------------------------
DROP VIEW IF EXISTS `instruccionesvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `instruccionesvista` AS select `alarmas`.`nombre` AS `alarmaNombre`,`instrucciones`.`id` AS `id`,`instrucciones`.`fecha` AS `fecha`,`instrucciones`.`alarma` AS `alarma`,`instrucciones`.`texto` AS `texto`,`instrucciones`.`prioridad` AS `prioridad`,`instrucciones`.`intentos` AS `intentos`,`instrucciones`.`confirmar` AS `confirmar`,`instrucciones`.`procesada` AS `procesada`,`instrucciones`.`estado` AS `estado` from (`instrucciones` join `alarmas` on((`instrucciones`.`alarma` = `alarmas`.`id`)));

-- ----------------------------
-- View structure for memosvista
-- ----------------------------
DROP VIEW IF EXISTS `memosvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `memosvista` AS select `memos`.`id` AS `id`,`memos`.`objeto` AS `objeto`,`memos`.`identidad` AS `identidad`,`memos`.`fecha` AS `fecha`,`memos`.`usuario` AS `usuario`,`memos`.`mensaje` AS `mensaje`,`usuarios`.`nombre` AS `usuarioNombre` from (`memos` join `usuarios` on((`memos`.`usuario` = `usuarios`.`id`)));

-- ----------------------------
-- View structure for menusvista
-- ----------------------------
DROP VIEW IF EXISTS `menusvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `menusvista` AS select `menus2`.`nombre` AS `padreNombre`,`menus`.`id` AS `id`,`menus`.`padre` AS `padre`,`menus`.`orden` AS `orden`,`menus`.`icono` AS `icono`,`menus`.`nombre` AS `nombre`,`menus`.`destino` AS `destino`,`menus`.`ventana` AS `ventana`,`menus`.`inicio` AS `inicio`,`menus`.`estado` AS `estado` from (`menus` join `menus` `menus2` on((`menus`.`padre` = `menus2`.`id`)));

-- ----------------------------
-- View structure for morososaccionesvista
-- ----------------------------
DROP VIEW IF EXISTS `morososaccionesvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `morososaccionesvista` AS select `empleados`.`nombre` AS `operadorNombre`,`clientes`.`nombre` AS `clienteNombre`,`morososacciones`.`id` AS `id`,`morososacciones`.`moroso` AS `moroso`,`morososacciones`.`cliente` AS `cliente`,`morososacciones`.`operador` AS `operador`,`morososacciones`.`fecha` AS `fecha`,`morososacciones`.`detalle` AS `detalle` from ((`morososacciones` join `clientes` on((`clientes`.`id` = `morososacciones`.`cliente`))) join `empleados` on((`morososacciones`.`operador` = `empleados`.`id`)));

-- ----------------------------
-- View structure for morosospromocionesvista
-- ----------------------------
DROP VIEW IF EXISTS `morosospromocionesvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `morosospromocionesvista` AS select `clientes`.`nombre` AS `clienteNombre`,`clientes`.`situacion` AS `clienteSituacion`,`clientes`.`canceladas` AS `clienteCanceladas`,`clientes`.`pendientes` AS `clientePendientes`,`clientes`.`total` AS `clienteTotal`,`promocionescupones`.`id` AS `promocionCuponId`,`promocionescupones`.`emision` AS `promocionCuponEmision`,`promocionescupones`.`vencimiento` AS `promocionCuponVencimiento`,`morosos`.`id` AS `id`,`morosos`.`ingreso` AS `ingreso`,`morosos`.`egreso` AS `egreso`,`morosos`.`comunidad` AS `comunidad`,`morosos`.`cliente` AS `cliente`,`morosos`.`medio` AS `medio`,`morosos`.`capital` AS `capital`,`morosos`.`facturas` AS `facturas`,`morosos`.`deuda` AS `deuda`,`morosos`.`operador` AS `operador`,`morosos`.`antigua` AS `antigua`,`morosos`.`llamados` AS `llamados`,`morosos`.`ultimo` AS `ultimo`,`morosos`.`siguiente` AS `siguiente`,`morosos`.`estado` AS `estado` from ((`clientes` join `morosos` on((`morosos`.`cliente` = `clientes`.`id`))) join `promocionescupones` on((`promocionescupones`.`cliente` = `morosos`.`cliente`)));

-- ----------------------------
-- View structure for morososvista
-- ----------------------------
DROP VIEW IF EXISTS `morososvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `morososvista` AS select `clientes`.`nombre` AS `clienteNombre`,`clientes`.`situacion` AS `clienteSituacion`,`clientes`.`canceladas` AS `clienteCanceladas`,`clientes`.`pendientes` AS `clientePendientes`,`clientes`.`total` AS `clienteTotal`,`morosos`.`id` AS `id`,`morosos`.`ingreso` AS `ingreso`,`morosos`.`egreso` AS `egreso`,`morosos`.`comunidad` AS `comunidad`,`morosos`.`cliente` AS `cliente`,`morosos`.`medio` AS `medio`,`morosos`.`capital` AS `capital`,`morosos`.`facturas` AS `facturas`,`morosos`.`deuda` AS `deuda`,`morosos`.`operador` AS `operador`,`morosos`.`antigua` AS `antigua`,`morosos`.`llamados` AS `llamados`,`morosos`.`ultimo` AS `ultimo`,`morosos`.`siguiente` AS `siguiente`,`morosos`.`estado` AS `estado` from (`clientes` join `morosos` on((`morosos`.`cliente` = `clientes`.`id`)));

-- ----------------------------
-- View structure for rapicobrocuponesvista
-- ----------------------------
DROP VIEW IF EXISTS `rapicobrocuponesvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `rapicobrocuponesvista` AS select `clientes`.`nombre` AS `clienteNombre`,`comunidades`.`nombre` AS `comunidadNombre`,`rapicobrocupones`.`id` AS `id`,`rapicobrocupones`.`comprobante` AS `comprobante`,`rapicobrocupones`.`comunidad` AS `comunidad`,`rapicobrocupones`.`cliente` AS `cliente`,`rapicobrocupones`.`emision` AS `emision`,`rapicobrocupones`.`vencimiento` AS `vencimiento`,`rapicobrocupones`.`observaciones` AS `observaciones`,`rapicobrocupones`.`importe` AS `importe`,`rapicobrocupones`.`estado` AS `estado` from ((`rapicobrocupones` join `clientes` on((`clientes`.`id` = `rapicobrocupones`.`cliente`))) join `comunidades` on((`comunidades`.`id` = `rapicobrocupones`.`comunidad`)));

-- ----------------------------
-- View structure for reportesvista
-- ----------------------------
DROP VIEW IF EXISTS `reportesvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `reportesvista` AS select `alarmas`.`nombre` AS `alarmaNombre`,`comunidades`.`nombre` AS `comunidadNombre`,`reportes`.`id` AS `id`,`reportes`.`fecha` AS `fecha`,`reportes`.`comunidad` AS `comunidad`,`reportes`.`alarma` AS `alarma`,`reportes`.`texto` AS `texto` from ((`reportes` join `alarmas` on((`reportes`.`alarma` = `alarmas`.`id`))) join `comunidades` on((`comunidades`.`id` = `reportes`.`comunidad`)));

-- ----------------------------
-- View structure for rescisionesvista
-- ----------------------------
DROP VIEW IF EXISTS `rescisionesvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `rescisionesvista` AS select `contratos`.`comunidad` AS `contratoComunidad`,`rescisiones`.`id` AS `id`,`rescisiones`.`contrato` AS `contrato`,`rescisiones`.`ingresada` AS `ingresada`,`rescisiones`.`finalizada` AS `finalizada`,`rescisiones`.`medio` AS `medio`,`rescisiones`.`motivo` AS `motivo`,`rescisiones`.`comentarios` AS `comentarios`,`rescisiones`.`receptor` AS `receptor`,`rescisiones`.`responsable` AS `responsable`,`rescisiones`.`promo` AS `promo`,`rescisiones`.`estado` AS `estado`,`rescisiones`.`aplicada` AS `aplicada` from (`rescisiones` join `contratos` on((`rescisiones`.`contrato` = `contratos`.`id`)));

-- ----------------------------
-- View structure for usuariosvista
-- ----------------------------
DROP VIEW IF EXISTS `usuariosvista`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `usuariosvista` AS select `casas`.`nombre` AS `casaNombre`,`casas`.`monitoreo` AS `casaMonitoreo`,`comunidades`.`nombre` AS `comunidadNombre`,`usuarios`.`id` AS `id`,`usuarios`.`nombre` AS `nombre`,`usuarios`.`casa` AS `casa`,`usuarios`.`comunidad` AS `comunidad`,`usuarios`.`correo` AS `correo`,`usuarios`.`telefono` AS `telefono`,`usuarios`.`aplicacion` AS `aplicacion`,`usuarios`.`sistema` AS `sistema`,`usuarios`.`instalada` AS `instalada`,`usuarios`.`ejecutada` AS `ejecutada`,`usuarios`.`token` AS `token`,`usuarios`.`avisos` AS `avisos`,`usuarios`.`notificaciones` AS `notificaciones`,`usuarios`.`whatsapps` AS `whatsapps`,`usuarios`.`mensajes` AS `mensajes`,`usuarios`.`correos` AS `correos`,`usuarios`.`contrasena` AS `contrasena`,`usuarios`.`clave` AS `clave`,`usuarios`.`terminal` AS `terminal`,`usuarios`.`registrado` AS `registrado`,`usuarios`.`registrante` AS `registrante`,`usuarios`.`roles` AS `roles`,`usuarios`.`estado` AS `estado`,`usuarios`.`propiedades` AS `propiedades` from ((`usuarios` join `comunidades` on((`comunidades`.`id` = `usuarios`.`comunidad`))) join `casas` on((`casas`.`id` = `usuarios`.`casa`)));

SET FOREIGN_KEY_CHECKS = 1;
