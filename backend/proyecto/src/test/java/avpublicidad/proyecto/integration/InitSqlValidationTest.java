package avpublicidad.proyecto.integration;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class InitSqlValidationTest {

    @Test
    void initSql_debeContenerTablasEnumsYDatosInicialesParaFrontend() throws Exception {
        String sql = Files.readString(Path.of("..", "..", "database", "init.sql"));

        assertThat(sql).contains(
                "CREATE TABLE IF NOT EXISTS `AV`.`rol`",
                "CREATE TABLE IF NOT EXISTS `AV`.`sucursal`",
                "CREATE TABLE IF NOT EXISTS `AV`.`empleado`",
                "CREATE TABLE IF NOT EXISTS `AV`.`cliente`",
                "CREATE TABLE IF NOT EXISTS `AV`.`pedido`",
                "CREATE TABLE IF NOT EXISTS `AV`.`detalle_pedido`",
                "CREATE TABLE IF NOT EXISTS `AV`.`pago`",
                "CREATE TABLE IF NOT EXISTS `AV`.`global_values`"
        );

        assertThat(sql).contains(
                "ENUM('Contado', 'Credito', 'Intercambio')",
                "ENUM('Efectivo', 'Transferencia', 'Intercambio')",
                "ENUM('Borrador', 'Pendiente', 'En proceso', 'Terminado', 'Entregado', 'Cancelado')",
                "ENUM('Frecuente', 'No frecuente')"
        );

        assertThat(sql).contains(
                "'Administrador'",
                "'Empleado'",
                "'Sucursal Centro'",
                "'admin@av.com'",
                "'empleado@av.com'",
                "'Lona impresa'",
                "'Lona front 13oz'",
                "'AV Publicidad'",
                "'valor_url'"
        );

        assertThat(sql).contains("$2a$10$");
        assertThat(sql).doesNotContain("'Admin123'", "'Empleado123'");
    }
}
