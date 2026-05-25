package avpublicidad.proyecto.service;

import avpublicidad.proyecto.model.Cliente;
import avpublicidad.proyecto.model.DetallePedido;
import avpublicidad.proyecto.model.Empleado;
import avpublicidad.proyecto.model.Pago;
import avpublicidad.proyecto.model.Pedido;
import avpublicidad.proyecto.model.Servicio;
import avpublicidad.proyecto.model.Sucursal;
import avpublicidad.proyecto.repository.ClienteRepository;
import avpublicidad.proyecto.repository.DetallePedidoRepository;
import avpublicidad.proyecto.repository.EmpleadoRepository;
import avpublicidad.proyecto.repository.PagoRepository;
import avpublicidad.proyecto.repository.PedidoRepository;
import avpublicidad.proyecto.repository.ServicioRepository;
import avpublicidad.proyecto.repository.SucursalRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
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
import java.util.List;
import java.util.Locale;

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

            agregarEncabezado(document, pedido);
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

    private void agregarEncabezado(Document document, Pedido pedido) {
        Paragraph titulo = new Paragraph("AV Publicidad", fuenteTitulo());
        titulo.setAlignment(Element.ALIGN_CENTER);
        document.add(titulo);

        Paragraph subtitulo = new Paragraph("Nota de pedido #" + pedido.getIdPedido(), fuenteSubtitulo());
        subtitulo.setAlignment(Element.ALIGN_CENTER);
        subtitulo.setSpacingAfter(16);
        document.add(subtitulo);
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
}
