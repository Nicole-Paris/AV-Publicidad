-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema AV
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema AV
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `AV` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `AV` ;

-- -----------------------------------------------------
-- Table `AV`.`categoria_material`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`categoria_material` (
  `id_categoria_material` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `estado` ENUM("Activo", "Inactivo") NOT NULL,
  `descripcion` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_categoria_material`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `AV`.`categoria_servicio`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`categoria_servicio` (
  `id_categoria_servicio` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(50) NOT NULL,
  `estado` ENUM("Activo", "Inactivo") NOT NULL,
  PRIMARY KEY (`id_categoria_servicio`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `AV`.`cliente`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`cliente` (
  `id_cliente` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `apellido_paterno` VARCHAR(45) NOT NULL,
  `apellido_materno` VARCHAR(45) NOT NULL,
  `tipo` ENUM("Frecuente", "No frecuente") NOT NULL,
  `telefono` VARCHAR(15) NOT NULL,
  `created_at` DATETIME NULL DEFAULT  CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT  CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id_cliente`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `AV`.`rol`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`rol` (
  `id_rol` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id_rol`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `AV`.`empleado`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`empleado` (
  `id_empleado` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `apellido_paterno` VARCHAR(45) NOT NULL,
  `apellido_materno` VARCHAR(45) NOT NULL,
  `telefono` VARCHAR(15) NOT NULL,
  `hora_entrada` TIME NOT NULL,
  `hora_salida` TIME NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT  CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `rol_id` INT NOT NULL,
  PRIMARY KEY (`id_empleado`, `rol_id`),
  INDEX `fk_empleado_rol1_idx` (`rol_id` ASC) VISIBLE,
  CONSTRAINT `fk_empleado_rol1`
    FOREIGN KEY (`rol_id`)
    REFERENCES `AV`.`rol` (`id_rol`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `AV`.`material`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`material` (
  `id_material` INT NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  `unidad` ENUM("Piezas", "Metros", "Litros") NOT NULL,
  `estado` ENUM("Disponible", "No disponible") NOT NULL,
  `costo_unitario` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deteled_at` VARCHAR(45) NULL DEFAULT NULL,
  `categoria_material_id` INT NOT NULL,
  PRIMARY KEY (`id_material`, `categoria_material_id`),
  INDEX `fk_material_categoria_material1_idx` (`categoria_material_id` ASC) VISIBLE,
  CONSTRAINT `fk_material_categoria_material1`
    FOREIGN KEY (`categoria_material_id`)
    REFERENCES `AV`.`categoria_material` (`id_categoria_material`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `AV`.`inventario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`inventario` (
  `id_inventario` INT NOT NULL AUTO_INCREMENT,
  `stock_actual` DECIMAL(10,2) NOT NULL,
  `stock_minimo` DECIMAL(10,2) NOT NULL,
  `creatde_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `material_id` INT NOT NULL,
  PRIMARY KEY (`id_inventario`, `material_id`),
  INDEX `fk_inventario_material1_idx` (`material_id` ASC) VISIBLE,
  CONSTRAINT `fk_inventario_material1`
    FOREIGN KEY (`material_id`)
    REFERENCES `AV`.`material` (`id_material`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `AV`.`sucursal`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`sucursal` (
  `id_sucursal` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `direccion` VARCHAR(100) NOT NULL,
  `telefono` VARCHAR(15) NOT NULL,
  `horario` VARCHAR(100) NOT NULL,
  `inventario_id_inventario` INT NOT NULL,
  `inventario_material_id` INT NOT NULL,
  PRIMARY KEY (`id_sucursal`, `inventario_id_inventario`, `inventario_material_id`),
  INDEX `fk_sucursal_inventario1_idx` (`inventario_id_inventario` ASC, `inventario_material_id` ASC) VISIBLE,
  CONSTRAINT `fk_sucursal_inventario1`
    FOREIGN KEY (`inventario_id_inventario` , `inventario_material_id`)
    REFERENCES `AV`.`inventario` (`id_inventario` , `material_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `AV`.`corte_caja`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`corte_caja` (
  `id_corte_caja` INT NOT NULL AUTO_INCREMENT,
  `fecha` DATE NOT NULL,
  `hora_inicio` TIME NOT NULL,
  `hora_fin` TIME NOT NULL,
  `saldo_inicial` DECIMAL(10,2) NOT NULL,
  `diferencia_saldo` DECIMAL(10,2) NOT NULL,
  `descripcion` VARCHAR(60) NULL,
  `created_at` DATETIME NULL DEFAULT  CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT  CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `empleado_id` INT NOT NULL,
  `sucursal_id_sucursal` INT NOT NULL,
  `sucursal_inventario_id_inventario` INT NOT NULL,
  `sucursal_inventario_material_id` INT NOT NULL,
  PRIMARY KEY (`id_corte_caja`, `empleado_id`, `sucursal_id_sucursal`, `sucursal_inventario_id_inventario`, `sucursal_inventario_material_id`),
  INDEX `fk_corte_caja_empleado1_idx` (`empleado_id` ASC) VISIBLE,
  INDEX `fk_corte_caja_sucursal1_idx` (`sucursal_id_sucursal` ASC, `sucursal_inventario_id_inventario` ASC, `sucursal_inventario_material_id` ASC) VISIBLE,
  CONSTRAINT `fk_corte_caja_empleado1`
    FOREIGN KEY (`empleado_id`)
    REFERENCES `AV`.`empleado` (`id_empleado`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_corte_caja_sucursal1`
    FOREIGN KEY (`sucursal_id_sucursal` , `sucursal_inventario_id_inventario` , `sucursal_inventario_material_id`)
    REFERENCES `AV`.`sucursal` (`id_sucursal` , `inventario_id_inventario` , `inventario_material_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `AV`.`pedido`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`pedido` (
  `id_pedido` INT NOT NULL AUTO_INCREMENT,
  `fecha_pedido` DATETIME NOT NULL,
  `fecha_entrega` DATETIME NOT NULL,
  `estado` ENUM("En proceso", "Terminado", "Entregado") NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `descripcion` VARCHAR(60) NULL,
  `forma_pago` ENUM("Contado", "Credito") NOT NULL,
  `created_at` DATETIME NULL DEFAULT  CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT  CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `cliente_id` INT NOT NULL,
  `empleado_id` INT NOT NULL,
  PRIMARY KEY (`id_pedido`, `cliente_id`, `empleado_id`),
  INDEX `fk_pedido_cliente1_idx` (`cliente_id` ASC) VISIBLE,
  INDEX `fk_pedido_empleado1_idx` (`empleado_id` ASC) VISIBLE,
  CONSTRAINT `fk_pedido_cliente1`
    FOREIGN KEY (`cliente_id`)
    REFERENCES `AV`.`cliente` (`id_cliente`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_pedido_empleado1`
    FOREIGN KEY (`empleado_id`)
    REFERENCES `AV`.`empleado` (`id_empleado`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `AV`.`servicio`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`servicio` (
  `id_servicio` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(60) NOT NULL,
  `descripcion` VARCHAR(50) NULL,
  `estado` ENUM("Activo", "Inactivo") NOT NULL,
  `categoria_servicio_id` INT NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT  CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id_servicio`, `categoria_servicio_id`),
  INDEX `fk_servicio_categoria_servicio1_idx` (`categoria_servicio_id` ASC) VISIBLE,
  CONSTRAINT `fk_servicio_categoria_servicio1`
    FOREIGN KEY (`categoria_servicio_id`)
    REFERENCES `AV`.`categoria_servicio` (`id_categoria_servicio`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `AV`.`detalle_pedido`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`detalle_pedido` (
  `id_detalle_pedido` INT NOT NULL AUTO_INCREMENT,
  `cantidad` DECIMAL(10,2) NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `unidad_detalle` ENUM("Piezas", "Metros", "Litros") NOT NULL,
  `pedido_id` INT NOT NULL,
  `servicio_id` INT NOT NULL,
  PRIMARY KEY (`id_detalle_pedido`, `pedido_id`, `servicio_id`),
  INDEX `fk_detalle_pedido_pedido1_idx` (`pedido_id` ASC) VISIBLE,
  INDEX `fk_detalle_pedido_servicio1_idx` (`servicio_id` ASC) VISIBLE,
  CONSTRAINT `fk_detalle_pedido_pedido1`
    FOREIGN KEY (`pedido_id`)
    REFERENCES `AV`.`pedido` (`id_pedido`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_detalle_pedido_servicio1`
    FOREIGN KEY (`servicio_id`)
    REFERENCES `AV`.`servicio` (`id_servicio`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `AV`.`movimiento_inventario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`movimiento_inventario` (
  `id_movimiento_inventario` INT NOT NULL AUTO_INCREMENT,
  `cantidad` DECIMAL(10,2) NOT NULL,
  `fecha` DATETIME NOT NULL DEFAULT  CURRENT_TIMESTAMP,
  `tipo` ENUM("Entreda", "Salida") NOT NULL,
  `motivo` VARCHAR(50) NOT NULL,
  `inventario_id` INT NOT NULL,
  PRIMARY KEY (`id_movimiento_inventario`, `inventario_id`),
  INDEX `fk_movimiento_inventario_inventario1_idx` (`inventario_id` ASC) VISIBLE,
  CONSTRAINT `fk_movimiento_inventario_inventario1`
    FOREIGN KEY (`inventario_id`)
    REFERENCES `AV`.`inventario` (`id_inventario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `AV`.`pago`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`pago` (
  `id_pago` INT NOT NULL AUTO_INCREMENT,
  `monto` DECIMAL(10,2) NOT NULL,
  `fecha` DATE NOT NULL,
  `hora_pago` TIME NOT NULL,
  `referencia` VARCHAR(50) NULL,
  `forma_pago` ENUM("Efectivo", "Transferencia") NOT NULL,
  `concepto_pago` VARCHAR(60) NULL,
  `created_at` DATETIME NULL DEFAULT  CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT  CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `pedido_id` INT NOT NULL,
  PRIMARY KEY (`id_pago`, `pedido_id`),
  INDEX `fk_pago_pedido1_idx` (`pedido_id` ASC) VISIBLE,
  CONSTRAINT `fk_pago_pedido1`
    FOREIGN KEY (`pedido_id`)
    REFERENCES `AV`.`pedido` (`id_pedido`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `AV`.`servicio_material`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AV`.`servicio_material` (
  `id_servicio_material` INT NOT NULL AUTO_INCREMENT,
  `cantidad_usada` DECIMAL(10,2) NOT NULL,
  `servicio_id` INT NOT NULL,
  `material_id` INT NOT NULL,
  PRIMARY KEY (`id_servicio_material`, `servicio_id`, `material_id`),
  INDEX `fk_servicio_material_servicio1_idx` (`servicio_id` ASC) VISIBLE,
  INDEX `fk_servicio_material_material1_idx` (`material_id` ASC) VISIBLE,
  CONSTRAINT `fk_servicio_material_servicio1`
    FOREIGN KEY (`servicio_id`)
    REFERENCES `AV`.`servicio` (`id_servicio`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_servicio_material_material1`
    FOREIGN KEY (`material_id`)
    REFERENCES `AV`.`material` (`id_material`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;