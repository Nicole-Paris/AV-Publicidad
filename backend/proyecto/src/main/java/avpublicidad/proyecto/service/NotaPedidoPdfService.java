package avpublicidad.proyecto.service;

import avpublicidad.proyecto.model.Cliente;
import avpublicidad.proyecto.model.DetallePedido;
import avpublicidad.proyecto.model.Empleado;
import avpublicidad.proyecto.model.GlobalValue;
import avpublicidad.proyecto.model.Pago;
import avpublicidad.proyecto.model.Pedido;
import avpublicidad.proyecto.model.Servicio;
import avpublicidad.proyecto.model.Sucursal;
import avpublicidad.proyecto.repository.ClienteRepository;
import avpublicidad.proyecto.repository.DetallePedidoRepository;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.GlobalValueRepository;
import avpublicidad.proyecto.repository.PagoRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
import avpublicidad.proyecto.repository.ServicioRepository;
import avpublicidad.proyecto.repository.SucursalRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotaPedidoPdfService {

    private static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final NumberFormat MONEDA = NumberFormat.getCurrencyInstance(new Locale("es", "MX"));

    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final EmpleadoRepository empleadoRepository;
    private final SucursalRepository sucursalRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final ServicioRepository servicioRepository;
    private final PagoRepository pagoRepository;
    private final GlobalValueRepository globalValueRepository;

    public byte[] generarNotaPedido(Integer pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .filter(valor -> valor.getDeletedAt() == null)
                .orElseThrow(() -> new avpublicidad.proyecto.exception.ResourceNotFoundException("Pedido no encontrado"));

        Cliente cliente = clienteRepository.findById(pedido.getClienteId()).orElse(null);
        Empleado empleado = empleadoRepository.findById(pedido.getEmpleadoId()).orElse(null);
        Sucursal sucursal = sucursalRepository.findById(pedido.getSucursalId()).orElse(null);
        List<DetallePedido> detalles = detallePedidoRepository.findByPedidoIdAndDeletedAtIsNull(pedidoId);
        List<Pago> pagos = pagoRepository.findByPedidoIdAndDeletedAtIsNull(pedidoId);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.LETTER, 36, 36, 36, 36);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            DatosFiscales datosFiscales = obtenerDatosFiscales();

            agregarEncabezado(document, pedido, datosFiscales);
            agregarDatosGenerales(document, pedido, cliente, empleado, sucursal);
            agregarDetalles(document, detalles);
            agregarPagosYTotales(document, pedido, pagos);
            agregarPie(document);

            document.close();
            return outputStream.toByteArray();
        } catch (DocumentException | java.io.IOException e) {
            throw new IllegalStateException("No se pudo generar la nota de pedido", e);
        }
    }

    private void agregarEncabezado(Document document, Pedido pedido, DatosFiscales datosFiscales) throws java.io.IOException {
        PdfPTable encabezado = new PdfPTable(new float[]{1.2f, 4f});
        encabezado.setWidthPercentage(100);
        encabezado.setSpacingAfter(12);

        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(PdfPCell.NO_BORDER);
        logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        logoCell.setPadding(4);

        Image logo = cargarLogo(datosFiscales.logoUrl);
        if (logo != null) {
            logo.scaleToFit(78, 78);
            logoCell.addElement(logo);
        } else {
            Paragraph marca = new Paragraph("av", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, Color.WHITE));
            marca.setAlignment(Element.ALIGN_CENTER);
            logoCell.setBackgroundColor(new Color(251, 90, 53));
            logoCell.addElement(marca);
        }
        encabezado.addCell(logoCell);

        PdfPCell datosCell = new PdfPCell();
        datosCell.setBorder(PdfPCell.NO_BORDER);
        datosCell.setPadding(4);

        Paragraph titulo = new Paragraph(valor(datosFiscales.nombreEmpresa, "AV Publicidad"), fuenteTitulo());
        titulo.setAlignment(Element.ALIGN_LEFT);
        datosCell.addElement(titulo);

        agregarLineaEmpresa(datosCell, "Razon social", datosFiscales.razonSocial);
        agregarLineaEmpresa(datosCell, "RFC", datosFiscales.rfc);
        agregarLineaEmpresa(datosCell, "Regimen fiscal", datosFiscales.regimenFiscal);
        agregarLineaEmpresa(datosCell, "Direccion fiscal", datosFiscales.direccionFiscal);
        agregarLineaEmpresa(datosCell, "Telefono", datosFiscales.telefono);
        agregarLineaEmpresa(datosCell, "Correo", datosFiscales.correo);

        encabezado.addCell(datosCell);
        document.add(encabezado);

        Paragraph subtitulo = new Paragraph("Nota de pedido #" + pedido.getIdPedido(), fuenteSubtitulo());
        subtitulo.setAlignment(Element.ALIGN_CENTER);
        subtitulo.setSpacingAfter(16);
        document.add(subtitulo);
    }

    private void agregarLineaEmpresa(PdfPCell cell, String etiqueta, String valor) {
        if (valor == null || valor.isBlank()) {
            return;
        }
        Paragraph linea = new Paragraph(etiqueta + ": " + valor, fuenteNormal());
        linea.setSpacingBefore(1);
        cell.addElement(linea);
    }

    private DatosFiscales obtenerDatosFiscales() {
        Map<String, String> valores = globalValueRepository.findByDeletedAtIsNull().stream()
                .collect(Collectors.toMap(
                        globalValue -> llave(globalValue.getTipo(), globalValue.getNombre()),
                        GlobalValue::getValor,
                        (actual, repetido) -> repetido
                ));

        return new DatosFiscales(
                valorGlobal(valores, "empresa", "nombreEmpresa", "nombre_empresa"),
                valorGlobal(valores, "empresa", "razonSocial", "razon_social"),
                valorGlobal(valores, "empresa", "rfc"),
                valorGlobal(valores, "empresa", "regimenFiscal", "regimen_fiscal"),
                valorGlobal(valores, "empresa", "direccionFiscal", "direccion_fiscal"),
                valorGlobal(valores, "empresa", "telefono"),
                valorGlobal(valores, "empresa", "correo"),
                primerValor(
                        valorGlobal(valores, "empresa", "logoUrl", "logo_url", "valor_url"),
                        valorGlobal(valores, "logo", "logoUrl", "logo_url", "valor_url")
                )
        );
    }

    private String primerValor(String... valores) {
        for (String valor : valores) {
            if (valor != null && !valor.isBlank()) {
                return valor;
            }
        }
        return null;
    }

    private String valorGlobal(Map<String, String> valores, String tipo, String... nombres) {
        for (String nombre : nombres) {
            String valor = valores.get(llave(tipo, nombre));
            if (valor != null && !valor.isBlank()) {
                return valor;
            }
        }
        return null;
    }

    private String llave(String tipo, String nombre) {
        return (tipo == null ? "" : tipo.trim().toLowerCase(Locale.ROOT))
                + ":"
                + (nombre == null ? "" : nombre.trim());
    }

    private Image cargarLogo(String logoUrl) {
        if (logoUrl == null || logoUrl.isBlank()) {
            return null;
        }

        try {
            String valor = logoUrl.trim();
            if (valor.startsWith("data:image")) {
                int commaIndex = valor.indexOf(',');
                if (commaIndex > 0) {
                    byte[] bytes = Base64.getDecoder().decode(valor.substring(commaIndex + 1));
                    return Image.getInstance(bytes);
                }
            }
            if (valor.startsWith("http://") || valor.startsWith("https://")) {
                return Image.getInstance(valor);
            }
        } catch (Exception ignored) {
            return null;
        }

        return null;
    }

    private void agregarDatosGenerales(Document document, Pedido pedido, Cliente cliente, Empleado empleado, Sucursal sucursal) {
        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(100);
        tabla.setSpacingAfter(14);

        agregarDato(tabla, "Fecha pedido", pedido.getFechaPedido().format(FECHA_HORA));
        agregarDato(tabla, "Fecha entrega", pedido.getFechaEntrega().format(FECHA_HORA));
        agregarDato(tabla, "Cliente", nombreCliente(cliente));
        agregarDato(tabla, "Telefono", valor(cliente == null ? null : cliente.getTelefono()));
        agregarDato(tabla, "Empleado", nombreEmpleado(empleado));
        agregarDato(tabla, "Sucursal", valor(sucursal == null ? null : sucursal.getNombre()));
        agregarDato(tabla, "Estado", valor(pedido.getEstado()));
        agregarDato(tabla, "Forma de pago", valor(pedido.getFormaPago()));
        agregarDato(tabla, "Descripcion", valor(pedido.getDescripcion()));

        document.add(tabla);
    }

    private void agregarDetalles(Document document, List<DetallePedido> detalles) {
        Paragraph titulo = new Paragraph("Detalle del pedido", fuenteSeccion());
        titulo.setSpacingAfter(8);
        document.add(titulo);

        PdfPTable tabla = new PdfPTable(new float[]{3, 1, 1, 1, 1});
        tabla.setWidthPercentage(100);
        tabla.setSpacingAfter(14);

        agregarEncabezadoTabla(tabla, "Servicio");
        agregarEncabezadoTabla(tabla, "Cantidad");
        agregarEncabezadoTabla(tabla, "Unidad");
        agregarEncabezadoTabla(tabla, "P. unitario");
        agregarEncabezadoTabla(tabla, "Subtotal");

        for (DetallePedido detalle : detalles) {
            Servicio servicio = servicioRepository.findById(detalle.getServicioId()).orElse(null);
            agregarCelda(tabla, valor(servicio == null ? "Servicio " + detalle.getServicioId() : servicio.getNombre()));
            agregarCelda(tabla, numero(detalle.getCantidad()));
            agregarCelda(tabla, valor(detalle.getUnidadDetalle()));
            agregarCelda(tabla, moneda(detalle.getPrecioUnitario()));
            agregarCelda(tabla, moneda(detalle.getSubtotal()));
        }

        if (detalles.isEmpty()) {
            PdfPCell celda = new PdfPCell(new Phrase("Sin detalles registrados", fuenteNormal()));
            celda.setColspan(5);
            celda.setPadding(6);
            tabla.addCell(celda);
        }

        document.add(tabla);
    }

    private void agregarPagosYTotales(Document document, Pedido pedido, List<Pago> pagos) {
        BigDecimal totalPagado = pagos.stream()
                .map(Pago::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal saldoPendiente = pedido.getTotal().subtract(totalPagado);

        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(55);
        tabla.setHorizontalAlignment(Element.ALIGN_RIGHT);
        tabla.setSpacingAfter(14);

        agregarDato(tabla, "Total pedido", moneda(pedido.getTotal()));
        agregarDato(tabla, "Pagado", moneda(totalPagado));
        agregarDato(tabla, "Saldo pendiente", moneda(saldoPendiente));

        document.add(tabla);

        if (!pagos.isEmpty()) {
            Paragraph titulo = new Paragraph("Pagos registrados", fuenteSeccion());
            titulo.setSpacingAfter(8);
            document.add(titulo);

            PdfPTable pagosTabla = new PdfPTable(new float[]{1, 1, 1, 1});
            pagosTabla.setWidthPercentage(100);
            agregarEncabezadoTabla(pagosTabla, "Fecha");
            agregarEncabezadoTabla(pagosTabla, "Concepto");
            agregarEncabezadoTabla(pagosTabla, "Forma");
            agregarEncabezadoTabla(pagosTabla, "Monto");

            for (Pago pago : pagos) {
                agregarCelda(pagosTabla, pago.getFecha().format(FECHA));
                agregarCelda(pagosTabla, valor(pago.getConceptoPago()));
                agregarCelda(pagosTabla, valor(pago.getFormaPago()));
                agregarCelda(pagosTabla, moneda(pago.getMonto()));
            }

            document.add(pagosTabla);
        }
    }

    private void agregarPie(Document document) {
        Paragraph pie = new Paragraph("Gracias por su preferencia.", fuenteNormal());
        pie.setAlignment(Element.ALIGN_CENTER);
        pie.setSpacingBefore(18);
        document.add(pie);
    }

    private void agregarDato(PdfPTable tabla, String etiqueta, String valor) {
        PdfPCell etiquetaCell = new PdfPCell(new Phrase(etiqueta, fuenteNegrita()));
        etiquetaCell.setPadding(6);
        tabla.addCell(etiquetaCell);

        PdfPCell valorCell = new PdfPCell(new Phrase(valor, fuenteNormal()));
        valorCell.setPadding(6);
        tabla.addCell(valorCell);
    }

    private void agregarEncabezadoTabla(PdfPTable tabla, String texto) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, fuenteNegrita()));
        celda.setBackgroundColor(new Color(230, 230, 230));
        celda.setPadding(6);
        tabla.addCell(celda);
    }

    private void agregarCelda(PdfPTable tabla, String texto) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, fuenteNormal()));
        celda.setPadding(6);
        tabla.addCell(celda);
    }

    private String nombreCliente(Cliente cliente) {
        if (cliente == null) {
            return "Cliente no disponible";
        }
        return (cliente.getNombre() + " " + cliente.getApellidoPaterno() + " " + valor(cliente.getApellidoMaterno())).trim();
    }

    private String nombreEmpleado(Empleado empleado) {
        if (empleado == null) {
            return "Empleado no disponible";
        }
        return (empleado.getNombre() + " " + empleado.getApellidoPaterno() + " " + valor(empleado.getApellidoMaterno())).trim();
    }

    private String valor(String valor) {
        return valor == null || valor.isBlank() ? "-" : valor;
    }

    private String valor(String valor, String defecto) {
        return valor == null || valor.isBlank() ? defecto : valor;
    }

    private String numero(BigDecimal valor) {
        return valor == null ? "-" : valor.stripTrailingZeros().toPlainString();
    }

    private String moneda(BigDecimal valor) {
        return valor == null ? "-" : MONEDA.format(valor);
    }

    private Font fuenteTitulo() {
        return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
    }

    private Font fuenteSubtitulo() {
        return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
    }

    private Font fuenteSeccion() {
        return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
    }

    private Font fuenteNegrita() {
        return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
    }

    private Font fuenteNormal() {
        return FontFactory.getFont(FontFactory.HELVETICA, 9);
    }

    private static class DatosFiscales {
        private final String nombreEmpresa;
        private final String razonSocial;
        private final String rfc;
        private final String regimenFiscal;
        private final String direccionFiscal;
        private final String telefono;
        private final String correo;
        private final String logoUrl;

        private DatosFiscales(
                String nombreEmpresa,
                String razonSocial,
                String rfc,
                String regimenFiscal,
                String direccionFiscal,
                String telefono,
                String correo,
                String logoUrl
        ) {
            this.nombreEmpresa = nombreEmpresa;
            this.razonSocial = razonSocial;
            this.rfc = rfc;
            this.regimenFiscal = regimenFiscal;
            this.direccionFiscal = direccionFiscal;
            this.telefono = telefono;
            this.correo = correo;
            this.logoUrl = logoUrl;
        }
    }
}
