SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE SCHEMA IF NOT EXISTS `AV` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `AV`;

DROP TABLE IF EXISTS `servicio_material`;
DROP TABLE IF EXISTS `pago`;
DROP TABLE IF EXISTS `movimiento_inventario`;
DROP TABLE IF EXISTS `detalle_pedido`;
DROP TABLE IF EXISTS `servicio`;
DROP TABLE IF EXISTS `pedido`;
DROP TABLE IF EXISTS `corte_caja`;
DROP TABLE IF EXISTS `inventario`;
DROP TABLE IF EXISTS `sucursal`;
DROP TABLE IF EXISTS `material`;
DROP TABLE IF EXISTS `empleado`;
DROP TABLE IF EXISTS `rol`;
DROP TABLE IF EXISTS `cliente`;
DROP TABLE IF EXISTS `categoria_servicio`;
DROP TABLE IF EXISTS `categoria_material`;

CREATE TABLE `categoria_material` (
  `id_categoria_material` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `estado` ENUM('Activo', 'Inactivo') NOT NULL,
  `descripcion` VARCHAR(100) NULL,
  PRIMARY KEY (`id_categoria_material`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `categoria_servicio` (
  `id_categoria_servicio` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(100) NULL,
  `estado` ENUM('Activo', 'Inactivo') NOT NULL,
  PRIMARY KEY (`id_categoria_servicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cliente` (
  `id_cliente` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `apellido_paterno` VARCHAR(45) NOT NULL,
  `apellido_materno` VARCHAR(45) NULL,
  `tipo` ENUM('Frecuente', 'No frecuente') NOT NULL,
  `telefono` VARCHAR(15) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `rol` (
  `id_rol` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(100) NULL,
  PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `empleado` (
  `id_empleado` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `apellido_paterno` VARCHAR(45) NOT NULL,
  `apellido_materno` VARCHAR(45) NULL,
  `telefono` VARCHAR(15) NOT NULL,
  `correo` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `hora_entrada` TIME NOT NULL,
  `hora_salida` TIME NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  `rol_id` INT NOT NULL,
  PRIMARY KEY (`id_empleado`),
  UNIQUE KEY `uk_empleado_correo` (`correo`),
  INDEX `idx_empleado_rol` (`rol_id`),
  CONSTRAINT `fk_empleado_rol`
    FOREIGN KEY (`rol_id`) REFERENCES `rol` (`id_rol`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sucursal` (
  `id_sucursal` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `direccion` VARCHAR(100) NOT NULL,
  `telefono` VARCHAR(15) NOT NULL,
  `horario` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id_sucursal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `material` (
  `id_material` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `unidad` ENUM('Piezas', 'Metros', 'Litros') NOT NULL,
  `estado` ENUM('Disponible', 'No disponible') NOT NULL,
  `costo_unitario` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  `categoria_material_id` INT NOT NULL,
  PRIMARY KEY (`id_material`),
  INDEX `idx_material_categoria` (`categoria_material_id`),
  CONSTRAINT `fk_material_categoria_material`
    FOREIGN KEY (`categoria_material_id`) REFERENCES `categoria_material` (`id_categoria_material`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `inventario` (
  `id_inventario` INT NOT NULL AUTO_INCREMENT,
  `stock_actual` DECIMAL(10,2) NOT NULL,
  `stock_minimo` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  `material_id` INT NOT NULL,
  `sucursal_id` INT NOT NULL,
  PRIMARY KEY (`id_inventario`),
  INDEX `idx_inventario_material` (`material_id`),
  INDEX `idx_inventario_sucursal` (`sucursal_id`),
  UNIQUE KEY `uk_inventario_material_sucursal` (`material_id`, `sucursal_id`),
  CONSTRAINT `fk_inventario_material`
    FOREIGN KEY (`material_id`) REFERENCES `material` (`id_material`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_inventario_sucursal`
    FOREIGN KEY (`sucursal_id`) REFERENCES `sucursal` (`id_sucursal`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `corte_caja` (
  `id_corte_caja` INT NOT NULL AUTO_INCREMENT,
  `fecha` DATE NOT NULL,
  `hora_inicio` TIME NOT NULL,
  `hora_fin` TIME NULL,
  `saldo_inicial` DECIMAL(10,2) NOT NULL,
  `diferencia_saldo` DECIMAL(10,2) NULL,
  `descripcion` VARCHAR(100) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  `empleado_id` INT NOT NULL,
  `sucursal_id` INT NOT NULL,
  PRIMARY KEY (`id_corte_caja`),
  INDEX `idx_corte_caja_empleado` (`empleado_id`),
  INDEX `idx_corte_caja_sucursal` (`sucursal_id`),
  CONSTRAINT `fk_corte_caja_empleado`
    FOREIGN KEY (`empleado_id`) REFERENCES `empleado` (`id_empleado`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_corte_caja_sucursal`
    FOREIGN KEY (`sucursal_id`) REFERENCES `sucursal` (`id_sucursal`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `pedido` (
  `id_pedido` INT NOT NULL AUTO_INCREMENT,
  `fecha_pedido` DATETIME NOT NULL,
  `fecha_entrega` DATETIME NOT NULL,
  `estado` ENUM('En proceso', 'Terminado', 'Entregado') NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `descripcion` VARCHAR(100) NULL,
  `forma_pago` ENUM('Contado', 'Credito') NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  `cliente_id` INT NOT NULL,
  `empleado_id` INT NOT NULL,
  PRIMARY KEY (`id_pedido`),
  INDEX `idx_pedido_cliente` (`cliente_id`),
  INDEX `idx_pedido_empleado` (`empleado_id`),
  CONSTRAINT `fk_pedido_cliente`
    FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id_cliente`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pedido_empleado`
    FOREIGN KEY (`empleado_id`) REFERENCES `empleado` (`id_empleado`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `servicio` (
  `id_servicio` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(60) NOT NULL,
  `descripcion` VARCHAR(100) NULL,
  `estado` ENUM('Activo', 'Inactivo') NOT NULL,
  `categoria_servicio_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id_servicio`),
  INDEX `idx_servicio_categoria` (`categoria_servicio_id`),
  CONSTRAINT `fk_servicio_categoria_servicio`
    FOREIGN KEY (`categoria_servicio_id`) REFERENCES `categoria_servicio` (`id_categoria_servicio`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `detalle_pedido` (
  `id_detalle_pedido` INT NOT NULL AUTO_INCREMENT,
  `cantidad` DECIMAL(10,2) NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `unidad_detalle` ENUM('Piezas', 'Metros', 'Litros') NULL,
  `pedido_id` INT NOT NULL,
  `servicio_id` INT NOT NULL,
  PRIMARY KEY (`id_detalle_pedido`),
  INDEX `idx_detalle_pedido_pedido` (`pedido_id`),
  INDEX `idx_detalle_pedido_servicio` (`servicio_id`),
  CONSTRAINT `fk_detalle_pedido_pedido`
    FOREIGN KEY (`pedido_id`) REFERENCES `pedido` (`id_pedido`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_pedido_servicio`
    FOREIGN KEY (`servicio_id`) REFERENCES `servicio` (`id_servicio`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `movimiento_inventario` (
  `id_movimiento_inventario` INT NOT NULL AUTO_INCREMENT,
  `cantidad` DECIMAL(10,2) NOT NULL,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo` ENUM('Entrada', 'Salida') NOT NULL,
  `motivo` VARCHAR(50) NOT NULL,
  `inventario_id` INT NOT NULL,
  PRIMARY KEY (`id_movimiento_inventario`),
  INDEX `idx_movimiento_inventario` (`inventario_id`),
  CONSTRAINT `fk_movimiento_inventario_inventario`
    FOREIGN KEY (`inventario_id`) REFERENCES `inventario` (`id_inventario`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `pago` (
  `id_pago` INT NOT NULL AUTO_INCREMENT,
  `monto` DECIMAL(10,2) NOT NULL,
  `fecha` DATE NOT NULL,
  `hora_pago` TIME NOT NULL,
  `referencia` VARCHAR(50) NULL,
  `forma_pago` ENUM('Efectivo', 'Transferencia') NOT NULL,
  `concepto_pago` VARCHAR(60) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  `pedido_id` INT NOT NULL,
  PRIMARY KEY (`id_pago`),
  INDEX `idx_pago_pedido` (`pedido_id`),
  CONSTRAINT `fk_pago_pedido`
    FOREIGN KEY (`pedido_id`) REFERENCES `pedido` (`id_pedido`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `servicio_material` (
  `id_servicio_material` INT NOT NULL AUTO_INCREMENT,
  `cantidad_usada` DECIMAL(10,2) NOT NULL,
  `servicio_id` INT NOT NULL,
  `material_id` INT NOT NULL,
  PRIMARY KEY (`id_servicio_material`),
  INDEX `idx_servicio_material_servicio` (`servicio_id`),
  INDEX `idx_servicio_material_material` (`material_id`),
  UNIQUE KEY `uk_servicio_material` (`servicio_id`, `material_id`),
  CONSTRAINT `fk_servicio_material_servicio`
    FOREIGN KEY (`servicio_id`) REFERENCES `servicio` (`id_servicio`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_servicio_material_material`
    FOREIGN KEY (`material_id`) REFERENCES `material` (`id_material`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
