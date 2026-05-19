SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE SCHEMA IF NOT EXISTS `AV` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `AV`;

CREATE TABLE IF NOT EXISTS `rol` (
  `id_rol` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL DEFAULT NULL,
  `deleted_by` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `sucursal` (
  `id_sucursal` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `direccion` VARCHAR(100) NOT NULL,
  `codigo_postal` VARCHAR(10) NOT NULL,
  `telefono` VARCHAR(15) NOT NULL,
  `horario` VARCHAR(100) NOT NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL DEFAULT NULL,
  `deleted_by` INT NULL DEFAULT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id_sucursal`)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `empleado` (
  `id_empleado` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `apellido_paterno` VARCHAR(45) NOT NULL,
  `apellido_materno` VARCHAR(45) NULL,
  `telefono` VARCHAR(15) NOT NULL,
  `correo` VARCHAR(100) NOT NULL,
  `contrasena` VARCHAR(255) NOT NULL,
  `hora_entrada` TIME NOT NULL,
  `hora_salida` TIME NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `rol_id` INT NOT NULL,
  `sucursal_id_sucursal` INT NOT NULL,
  PRIMARY KEY (`id_empleado`),
  UNIQUE INDEX `uk_empleado_correo` (`correo` ASC),
  INDEX `idx_empleado_rol` (`rol_id` ASC),
  INDEX `fk_empleado_sucursal1_idx` (`sucursal_id_sucursal` ASC),
  CONSTRAINT `fk_empleado_rol`
    FOREIGN KEY (`rol_id`)
    REFERENCES `rol` (`id_rol`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_empleado_sucursal1`
    FOREIGN KEY (`sucursal_id_sucursal`)
    REFERENCES `sucursal` (`id_sucursal`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `categoria_material` (
  `id_categoria_material` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `estado` ENUM('Activo', 'Inactivo') NOT NULL,
  `descripcion` VARCHAR(100) NULL DEFAULT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL DEFAULT NULL,
  `deleted_by` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_categoria_material`)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `categoria_servicio` (
  `id_categoria_servicio` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(100) NULL DEFAULT NULL,
  `estado` ENUM('Activo', 'Inactivo') NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL DEFAULT NULL,
  `deleted_by` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_categoria_servicio`)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `cliente` (
  `id_cliente` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `apellido_paterno` VARCHAR(45) NOT NULL,
  `apellido_materno` VARCHAR(45) NOT NULL,
  `tipo` ENUM('Frecuente', 'No frecuente') NOT NULL,
  `telefono` VARCHAR(15) NOT NULL,
  `tiene_credito` TINYINT NULL DEFAULT 0,
  `credito_actual` DECIMAL(10,2) NULL DEFAULT 0.00,
  `limite_credito` DECIMAL(10,2) NULL DEFAULT NULL,
  `direccion` VARCHAR(60) NULL DEFAULT NULL,
  `rfc` VARCHAR(15) NULL DEFAULT NULL,
  `codigo_postal` VARCHAR(10) NULL DEFAULT NULL,
  `razon_social` VARCHAR(30) NULL DEFAULT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL DEFAULT NULL,
  `deleted_by` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_cliente`),
  UNIQUE INDEX `id_cliente_UNIQUE` (`id_cliente` ASC),
  UNIQUE INDEX `rfc_UNIQUE` (`rfc` ASC)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `corte_caja` (
  `id_corte_caja` INT NOT NULL AUTO_INCREMENT,
  `fecha` DATE NOT NULL,
  `hora_inicio` TIME NOT NULL,
  `hora_fin` TIME NULL DEFAULT NULL,
  `saldo_inicial` DECIMAL(10,2) NOT NULL,
  `diferencia_saldo` DECIMAL(10,2) NULL DEFAULT NULL,
  `descripcion` VARCHAR(100) NULL DEFAULT NULL,
  `saldo_esperado` DECIMAL(10,2) NULL,
  `saldo_real` DECIMAL(10,2) NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL DEFAULT NULL,
  `deleted_by` INT NULL DEFAULT NULL,
  `empleado_id` INT NOT NULL,
  PRIMARY KEY (`id_corte_caja`),
  INDEX `idx_corte_caja_empleado` (`empleado_id` ASC),
  CONSTRAINT `fk_corte_caja_empleado`
    FOREIGN KEY (`empleado_id`)
    REFERENCES `empleado` (`id_empleado`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `pedido` (
  `id_pedido` INT NOT NULL AUTO_INCREMENT,
  `fecha_pedido` DATETIME NOT NULL,
  `fecha_entrega` DATETIME NOT NULL,
  `estado` ENUM('Borrador', 'Pendiente', 'En proceso', 'Terminado', 'Entregado', 'Cancelado') NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `descripcion` VARCHAR(100) NULL DEFAULT NULL,
  `tipo_pedido` ENUM('Cotizacion', 'Pedido') NULL,
  `forma_pago` ENUM('Contado', 'Credito') NOT NULL,
  `motivo_cancelacion` VARCHAR(255) NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `cliente_id` INT NOT NULL,
  `empleado_id` INT NOT NULL,
  `sucursal_id` INT NOT NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL DEFAULT NULL,
  `deleted_by` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_pedido`),
  INDEX `idx_pedido_cliente` (`cliente_id` ASC),
  INDEX `idx_pedido_empleado` (`empleado_id` ASC),
  INDEX `fk_pedido_sucursal1_idx` (`sucursal_id` ASC),
  CONSTRAINT `fk_pedido_cliente`
    FOREIGN KEY (`cliente_id`)
    REFERENCES `cliente` (`id_cliente`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pedido_empleado`
    FOREIGN KEY (`empleado_id`)
    REFERENCES `empleado` (`id_empleado`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pedido_sucursal`
    FOREIGN KEY (`sucursal_id`)
    REFERENCES `sucursal` (`id_sucursal`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `servicio` (
  `id_servicio` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(60) NOT NULL,
  `descripcion` VARCHAR(100) NULL DEFAULT NULL,
  `estado` ENUM('Activo', 'Inactivo') NOT NULL,
  `categoria_servicio_id` INT NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL DEFAULT NULL,
  `deleted_by` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_servicio`),
  INDEX `idx_servicio_categoria` (`categoria_servicio_id` ASC),
  CONSTRAINT `fk_servicio_categoria_servicio`
    FOREIGN KEY (`categoria_servicio_id`)
    REFERENCES `categoria_servicio` (`id_categoria_servicio`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `detalle_pedido` (
  `id_detalle_pedido` INT NOT NULL AUTO_INCREMENT,
  `cantidad` DECIMAL(10,2) NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `unidad_detalle` ENUM('Piezas', 'Metros', 'Litros') NOT NULL,
  `pedido_id` INT NOT NULL,
  `servicio_id` INT NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL DEFAULT NULL,
  `deleted_by` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_detalle_pedido`),
  INDEX `idx_detalle_pedido_pedido` (`pedido_id` ASC),
  INDEX `idx_detalle_pedido_servicio` (`servicio_id` ASC),
  CONSTRAINT `fk_detalle_pedido_pedido`
    FOREIGN KEY (`pedido_id`)
    REFERENCES `pedido` (`id_pedido`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_pedido_servicio`
    FOREIGN KEY (`servicio_id`)
    REFERENCES `servicio` (`id_servicio`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `material` (
  `id_material` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `unidad` ENUM('Piezas', 'Metros', 'Litros') NOT NULL,
  `estado` ENUM('Disponible', 'No disponible') NOT NULL,
  `costo_unitario` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `categoria_material_id` INT NOT NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL DEFAULT NULL,
  `deleted_by` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_material`),
  INDEX `idx_material_categoria` (`categoria_material_id` ASC),
  CONSTRAINT `fk_material_categoria_material`
    FOREIGN KEY (`categoria_material_id`)
    REFERENCES `categoria_material` (`id_categoria_material`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `inventario` (
  `id_inventario` INT NOT NULL AUTO_INCREMENT,
  `stock_actual` DECIMAL(10,2) NOT NULL,
  `stock_minimo` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `material_id` INT NOT NULL,
  `sucursal_id` INT NOT NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL DEFAULT NULL,
  `deleted_by` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_inventario`),
  UNIQUE INDEX `uk_inventario_material_sucursal` (`material_id` ASC, `sucursal_id` ASC),
  INDEX `idx_inventario_material` (`material_id` ASC),
  INDEX `idx_inventario_sucursal` (`sucursal_id` ASC),
  CONSTRAINT `fk_inventario_material`
    FOREIGN KEY (`material_id`)
    REFERENCES `material` (`id_material`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_inventario_sucursal`
    FOREIGN KEY (`sucursal_id`)
    REFERENCES `sucursal` (`id_sucursal`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `movimiento_inventario` (
  `id_movimiento_inventario` INT NOT NULL AUTO_INCREMENT,
  `cantidad` DECIMAL(10,2) NOT NULL,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo` ENUM('Entrada', 'Salida') NOT NULL,
  `motivo` VARCHAR(50) NOT NULL,
  `inventario_id` INT NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT NOT NULL,
  PRIMARY KEY (`id_movimiento_inventario`),
  INDEX `idx_movimiento_inventario` (`inventario_id` ASC),
  CONSTRAINT `fk_movimiento_inventario_inventario`
    FOREIGN KEY (`inventario_id`)
    REFERENCES `inventario` (`id_inventario`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `pago` (
  `id_pago` INT NOT NULL AUTO_INCREMENT,
  `monto` DECIMAL(10,2) NOT NULL,
  `fecha` DATE NOT NULL,
  `hora_pago` TIME NOT NULL,
  `referencia` VARCHAR(50) NOT NULL,
  `forma_pago` ENUM('Efectivo', 'Transferencia') NOT NULL,
  `concepto_pago` ENUM('Anticipo', 'Abono_credito', 'Liquidacion', 'Pago_total') NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `pedido_id` INT NOT NULL,
  `empleado_id_empleado` INT NOT NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL DEFAULT NULL,
  `deleted_by` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_pago`),
  INDEX `idx_pago_pedido` (`pedido_id` ASC),
  INDEX `fk_pago_empleado1_idx` (`empleado_id_empleado` ASC),
  CONSTRAINT `fk_pago_pedido`
    FOREIGN KEY (`pedido_id`)
    REFERENCES `pedido` (`id_pedido`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pago_empleado`
    FOREIGN KEY (`empleado_id_empleado`)
    REFERENCES `empleado` (`id_empleado`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `servicio_material` (
  `id_servicio_material` INT NOT NULL AUTO_INCREMENT,
  `cantidad_usada` DECIMAL(10,2) NOT NULL,
  `servicio_id` INT NOT NULL,
  `material_id` INT NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL DEFAULT NULL,
  `deleted_by` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_servicio_material`),
  UNIQUE INDEX `uk_servicio_material` (`servicio_id` ASC, `material_id` ASC),
  INDEX `idx_servicio_material_servicio` (`servicio_id` ASC),
  INDEX `idx_servicio_material_material` (`material_id` ASC),
  CONSTRAINT `fk_servicio_material_material`
    FOREIGN KEY (`material_id`)
    REFERENCES `material` (`id_material`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_servicio_material_servicio`
    FOREIGN KEY (`servicio_id`)
    REFERENCES `servicio` (`id_servicio`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `configuracion_empresa` (
  `id_configuracion` INT NOT NULL AUTO_INCREMENT,
  `nombre_empresa` VARCHAR(90) NOT NULL,
  `razon_social` VARCHAR(100) NULL,
  `rfc` VARCHAR(15) NULL,
  `regimen_fiscal` VARCHAR(100) NULL,
  `direccion_fiscal` VARCHAR(200) NULL,
  `telefono` VARCHAR(45) NULL,
  `correo` VARCHAR(90) NULL,
  `logo_url` VARCHAR(255) NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL DEFAULT NULL,
  `deleted_by` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_configuracion`)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
