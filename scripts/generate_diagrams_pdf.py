from pathlib import Path


OUT = Path("docs/diagramas-secuencia-robustez-av-publicidad.pdf")


def esc(text):
    return str(text).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


class Pdf:
    def __init__(self):
        self.objects = []
        self.pages = []

    def add_object(self, content):
        self.objects.append(content)
        return len(self.objects)

    def add_page(self, commands):
        stream = "\n".join(commands).encode("latin-1", "replace")
        stream_id = self.add_object(
            f"<< /Length {len(stream)} >>\nstream\n".encode("latin-1") + stream + b"\nendstream"
        )
        page_id = self.add_object(
            f"<< /Type /Page /Parent 0 0 R /MediaBox [0 0 842 595] "
            f"/Resources << /Font << /F1 0 0 R /F2 0 0 R >> >> "
            f"/Contents {stream_id} 0 R >>"
        )
        self.pages.append(page_id)

    def write(self, path):
        font_regular = self.add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
        font_bold = self.add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
        for i, obj in enumerate(self.objects):
            if isinstance(obj, str):
                self.objects[i] = obj.replace("/F1 0 0 R", f"/F1 {font_regular} 0 R").replace(
                    "/F2 0 0 R", f"/F2 {font_bold} 0 R"
                )
        kids = " ".join(f"{p} 0 R" for p in self.pages)
        pages_id = self.add_object(f"<< /Type /Pages /Kids [{kids}] /Count {len(self.pages)} >>")
        for i, obj in enumerate(self.objects):
            if isinstance(obj, str):
                self.objects[i] = obj.replace("/Parent 0 0 R", f"/Parent {pages_id} 0 R")
        catalog_id = self.add_object(f"<< /Type /Catalog /Pages {pages_id} 0 R >>")

        offsets = []
        data = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        for idx, obj in enumerate(self.objects, 1):
            offsets.append(len(data))
            data.extend(f"{idx} 0 obj\n".encode("latin-1"))
            if isinstance(obj, bytes):
                data.extend(obj)
            else:
                data.extend(obj.encode("latin-1", "replace"))
            data.extend(b"\nendobj\n")
        xref = len(data)
        data.extend(f"xref\n0 {len(self.objects) + 1}\n0000000000 65535 f \n".encode("latin-1"))
        for off in offsets:
            data.extend(f"{off:010d} 00000 n \n".encode("latin-1"))
        data.extend(
            f"trailer\n<< /Size {len(self.objects) + 1} /Root {catalog_id} 0 R >>\n"
            f"startxref\n{xref}\n%%EOF\n".encode("latin-1")
        )
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)


def text(cmds, x, y, value, size=12, bold=False):
    font = "F2" if bold else "F1"
    cmds.append("0 0 0 rg")
    cmds.append(f"BT /{font} {size} Tf {x} {y} Td ({esc(value)}) Tj ET")


def line(cmds, x1, y1, x2, y2, width=1):
    cmds.append("0 0 0 RG")
    cmds.append(f"{width} w {x1} {y1} m {x2} {y2} l S")


def box(cmds, x, y, w, h, label, fill=False):
    if fill:
        cmds.append("0.95 0.97 1 rg")
        cmds.append(f"{x} {y} {w} {h} re f")
        cmds.append("0 0 0 RG")
    cmds.append(f"{x} {y} {w} {h} re S")
    text(cmds, x + 8, y + h / 2 - 4, label, 10, True)


def arrow(cmds, x1, y1, x2, y2):
    line(cmds, x1, y1, x2, y2)
    cmds.append("0 0 0 rg")
    if x2 >= x1:
        cmds.append(f"{x2} {y2} m {x2 - 7} {y2 + 4} l {x2 - 7} {y2 - 4} l f")
    else:
        cmds.append(f"{x2} {y2} m {x2 + 7} {y2 + 4} l {x2 + 7} {y2 - 4} l f")


def wrapped_text(cmds, x, y, value, size=10, max_chars=95):
    words = value.split()
    line_value = ""
    for word in words:
        candidate = f"{line_value} {word}".strip()
        if len(candidate) > max_chars:
            text(cmds, x, y, line_value, size)
            y -= size + 4
            line_value = word
        else:
            line_value = candidate
    if line_value:
        text(cmds, x, y, line_value, size)
    return y


def sequence_page(pdf, title, participants, messages, notes=None):
    cmds = []
    text(cmds, 36, 555, title, 18, True)
    text(cmds, 36, 532, "Diagrama de secuencia", 12, True)
    if notes:
        y = wrapped_text(cmds, 36, 512, notes, 9, 120) - 8
    else:
        y = 510
    left = 55
    gap = 720 / max(1, len(participants) - 1) if len(participants) > 1 else 0
    xs = [left + i * gap for i in range(len(participants))]
    for x, name in zip(xs, participants):
        box(cmds, x - 45, y - 25, 90, 26, name, True)
        line(cmds, x, y - 25, x, 80, 0.5)
    msg_y = y - 55
    for frm, to, label in messages:
        x1 = xs[participants.index(frm)]
        x2 = xs[participants.index(to)]
        arrow(cmds, x1, msg_y, x2, msg_y)
        text(cmds, min(x1, x2) + 8, msg_y + 7, label, 8)
        msg_y -= 28
        if msg_y < 95:
            break
    pdf.add_page(cmds)


def robustness_page(pdf, title, boundary, control, entities, rules):
    cmds = []
    text(cmds, 36, 555, title, 18, True)
    text(cmds, 36, 532, "Diagrama de robustez", 12, True)
    box(cmds, 48, 420, 155, 42, f"Boundary: {boundary}", True)
    box(cmds, 315, 420, 175, 42, f"Control: {control}", True)
    arrow(cmds, 203, 441, 315, 441)
    y = 470
    for entity in entities:
        box(cmds, 615, y - 42, 170, 42, f"Entity: {entity}", True)
        arrow(cmds, 490, 441, 615, y - 21)
        y -= 62
    text(cmds, 48, 330, "Reglas / validaciones principales", 11, True)
    bullet_y = 310
    for rule in rules:
        bullet_y = wrapped_text(cmds, 64, bullet_y, f"- {rule}", 9, 115) - 8
    pdf.add_page(cmds)


FLOWS = [
    {
        "name": "Autenticacion",
        "boundary": "LoginPage",
        "control": "AuthController/AuthService",
        "entities": ["Empleado", "Rol", "Sucursal"],
        "participants": ["Usuario", "Frontend", "AuthController", "AuthService", "EmpleadoRepository"],
        "messages": [
            ("Usuario", "Frontend", "correo + contrasena"),
            ("Frontend", "AuthController", "POST /auth/login"),
            ("AuthController", "AuthService", "validar credenciales"),
            ("AuthService", "EmpleadoRepository", "buscar por correo"),
            ("EmpleadoRepository", "AuthService", "empleado + rol + sucursal"),
            ("AuthService", "AuthController", "sesion"),
            ("AuthController", "Frontend", "AuthResponse"),
        ],
        "rules": [
            "El correo debe existir y la contrasena debe coincidir con BCrypt.",
            "La sesion conserva empleado, rol y sucursales asociadas.",
            "Logout elimina la sesion local del navegador.",
        ],
    },
    {
        "name": "Clientes",
        "boundary": "ClientesPage / formulario cliente",
        "control": "ClienteController/ClienteService",
        "entities": ["Cliente", "Empleado auditor"],
        "participants": ["Usuario", "Frontend", "ClienteController", "ClienteService", "ClienteRepository"],
        "messages": [
            ("Usuario", "Frontend", "captura/edita cliente"),
            ("Frontend", "ClienteController", "POST/PUT /clientes"),
            ("ClienteController", "ClienteService", "validar request"),
            ("ClienteService", "ClienteRepository", "validar RFC y guardar"),
            ("ClienteRepository", "ClienteService", "cliente persistido"),
            ("ClienteService", "Frontend", "respuesta"),
        ],
        "rules": [
            "Tipo permitido: Frecuente o No frecuente.",
            "Limite de credito no acepta valores negativos.",
            "Los pedidos a credito consumen creditoActual y no pueden rebasar limiteCredito.",
            "Se guarda auditoria de creacion, edicion y eliminacion.",
        ],
    },
    {
        "name": "Pedidos",
        "boundary": "PuntoVentaPage / PedidosPage",
        "control": "PedidoController/PedidoService",
        "entities": ["Pedido", "Cliente", "Sucursal", "Empleado"],
        "participants": ["Usuario", "Frontend", "PedidoController", "PedidoService", "PedidoRepository"],
        "messages": [
            ("Usuario", "Frontend", "confirma pedido"),
            ("Frontend", "PedidoController", "POST /pedidos"),
            ("PedidoController", "PedidoService", "aplicar reglas"),
            ("PedidoService", "PedidoRepository", "guardar pedido en Pendiente"),
            ("PedidoRepository", "PedidoService", "pedido creado"),
            ("PedidoService", "Frontend", "pedido"),
        ],
        "rules": [
            "Todo pedido nuevo inicia en Pendiente.",
            "Flujo valido: Borrador/Pendiente -> En proceso -> Terminado -> Entregado.",
            "Cancelado solo puede venir de Borrador o Pendiente y requiere motivo.",
            "Contado no puede entregarse sin pago completo; credito/intercambio si pueden entregarse.",
        ],
    },
    {
        "name": "Detalle de pedido",
        "boundary": "Resumen del pedido",
        "control": "DetallePedidoController/DetallePedidoService",
        "entities": ["DetallePedido", "Servicio", "Material", "Inventario"],
        "participants": ["Usuario", "Frontend", "DetallePedidoController", "DetallePedidoService", "InventarioService"],
        "messages": [
            ("Usuario", "Frontend", "agrega servicio/cantidad/precio"),
            ("Frontend", "DetallePedidoController", "POST /detalles-pedido"),
            ("DetallePedidoController", "DetallePedidoService", "calcular subtotal"),
            ("DetallePedidoService", "InventarioService", "validar material y stock"),
            ("InventarioService", "DetallePedidoService", "stock disponible"),
            ("DetallePedidoService", "Frontend", "detalle agregado"),
        ],
        "rules": [
            "Subtotal = cantidad * precio unitario.",
            "El administrador ingresa precio unitario manualmente.",
            "La unidad se deriva del material ligado al servicio.",
            "No se permite usar servicios o materiales inactivos/no disponibles.",
        ],
    },
    {
        "name": "Pagos",
        "boundary": "Modal registrar pago",
        "control": "PagoController/PagoService",
        "entities": ["Pago", "Pedido", "Empleado"],
        "participants": ["Usuario", "Frontend", "PagoController", "PagoService", "PagoRepository"],
        "messages": [
            ("Usuario", "Frontend", "monto, forma, concepto, referencia"),
            ("Frontend", "PagoController", "POST /pagos"),
            ("PagoController", "PagoService", "validar pago"),
            ("PagoService", "PagoRepository", "guardar pago"),
            ("PagoRepository", "PagoService", "pago persistido"),
            ("PagoService", "Frontend", "saldo actualizado"),
        ],
        "rules": [
            "Referencia es obligatoria.",
            "Liquidacion coloca automaticamente el saldo pendiente.",
            "Intercambio bloquea forma/concepto y usa el total del pedido.",
            "Conceptos permitidos: Anticipo, Abono_credito, Liquidacion, Abono.",
        ],
    },
    {
        "name": "Servicios",
        "boundary": "ServiciosPage",
        "control": "ServicioController/ServicioService",
        "entities": ["Servicio", "CategoriaServicio", "ServicioMaterial"],
        "participants": ["Usuario", "Frontend", "ServicioController", "ServicioService", "ServicioRepository"],
        "messages": [
            ("Usuario", "Frontend", "crea/edita servicio"),
            ("Frontend", "ServicioController", "POST/PUT /servicios"),
            ("ServicioController", "ServicioService", "validar categoria"),
            ("ServicioService", "ServicioRepository", "guardar servicio"),
            ("ServicioRepository", "ServicioService", "servicio"),
            ("ServicioService", "Frontend", "respuesta"),
        ],
        "rules": [
            "Un servicio pertenece a una categoria de servicio.",
            "Un servicio puede tener materiales asociados con cantidad usada.",
            "No se puede agregar material no disponible a un servicio.",
            "Servicios inactivos no pueden agregarse a pedidos.",
        ],
    },
    {
        "name": "Inventario y movimientos",
        "boundary": "InventarioPage",
        "control": "InventarioController/MovimientoInventarioService",
        "entities": ["Inventario", "Material", "Sucursal", "MovimientoInventario"],
        "participants": ["Usuario", "Frontend", "MovimientoController", "MovimientoService", "InventarioRepository"],
        "messages": [
            ("Usuario", "Frontend", "entrada/salida"),
            ("Frontend", "MovimientoController", "POST /movimientos-inventario"),
            ("MovimientoController", "MovimientoService", "validar signo y material"),
            ("MovimientoService", "InventarioRepository", "actualizar stock"),
            ("InventarioRepository", "MovimientoService", "stock nuevo"),
            ("MovimientoService", "Frontend", "movimiento registrado"),
        ],
        "rules": [
            "Entradas no aceptan cantidades negativas.",
            "Salidas no aceptan cantidades positivas si se captura con signo inverso.",
            "No se permiten movimientos para material no disponible.",
            "Una salida no puede dejar stock negativo.",
        ],
    },
    {
        "name": "Corte de caja",
        "boundary": "CorteCajaPage",
        "control": "CorteCajaController/CorteCajaService",
        "entities": ["CorteCaja", "Pago", "Empleado"],
        "participants": ["Usuario", "Frontend", "CorteCajaController", "CorteCajaService", "PagoRepository"],
        "messages": [
            ("Usuario", "Frontend", "abre/cierra caja"),
            ("Frontend", "CorteCajaController", "POST /cortes-caja"),
            ("CorteCajaController", "CorteCajaService", "calcular pagos del dia"),
            ("CorteCajaService", "PagoRepository", "sumar pagos"),
            ("PagoRepository", "CorteCajaService", "total pagos"),
            ("CorteCajaService", "Frontend", "corte"),
        ],
        "rules": [
            "Se permiten varios cortes por empleado y fecha.",
            "Saldo esperado = saldo inicial + pagos recibidos.",
            "Diferencia = saldo real - saldo esperado.",
            "El historial muestra fecha, hora, empleado auditado y creador.",
        ],
    },
    {
        "name": "Configuracion",
        "boundary": "ConfiguracionPage",
        "control": "Sucursal/Empleado/Rol controllers",
        "entities": ["Sucursal", "Empleado", "Rol", "GlobalValues"],
        "participants": ["Administrador", "Frontend", "Controller", "Service", "Repository"],
        "messages": [
            ("Administrador", "Frontend", "edita sucursal/empleado/rol"),
            ("Frontend", "Controller", "POST/PUT/DELETE"),
            ("Controller", "Service", "validar permisos y datos"),
            ("Service", "Repository", "persistir cambios"),
            ("Repository", "Service", "entidad actualizada"),
            ("Service", "Frontend", "respuesta"),
        ],
        "rules": [
            "Administrador puede crear/editar empleados, roles y sucursales.",
            "Un empleado puede estar ligado a mas de una sucursal desde la UI.",
            "Se registra quien creo, edito o elimino.",
            "GlobalValues guarda datos de empresa y logo.",
        ],
    },
    {
        "name": "Reportes y panel principal",
        "boundary": "Dashboard/ReportesPage",
        "control": "Servicios de consulta",
        "entities": ["Pedido", "Pago", "Inventario", "Servicio", "Cliente"],
        "participants": ["Usuario", "Frontend", "Controller", "Service", "Repository"],
        "messages": [
            ("Usuario", "Frontend", "abre dashboard/reportes"),
            ("Frontend", "Controller", "GET endpoints"),
            ("Controller", "Service", "consultar metricas por sucursal"),
            ("Service", "Repository", "agregaciones"),
            ("Repository", "Service", "datos"),
            ("Service", "Frontend", "graficas y tablas"),
        ],
        "rules": [
            "La informacion se filtra por sucursal activa.",
            "Muestra ventas del dia, ventas mensuales, servicios mas pedidos.",
            "Incluye estado de inventario y pedidos por estado.",
            "No mezcla datos de otras sucursales.",
        ],
    },
    {
        "name": "Nota PDF de pedido",
        "boundary": "Boton nota PDF",
        "control": "PedidoController/PdfService",
        "entities": ["Pedido", "DetallePedido", "Cliente", "GlobalValues"],
        "participants": ["Usuario", "Frontend", "PedidoController", "PdfService", "PedidoRepository"],
        "messages": [
            ("Usuario", "Frontend", "solicita nota"),
            ("Frontend", "PedidoController", "GET /pedidos/{id}/nota-pdf"),
            ("PedidoController", "PdfService", "generar documento"),
            ("PdfService", "PedidoRepository", "pedido + detalles"),
            ("PedidoRepository", "PdfService", "datos"),
            ("PdfService", "Frontend", "application/pdf"),
        ],
        "rules": [
            "La nota usa datos de empresa desde GlobalValues.",
            "Incluye cliente, servicios, subtotales y total.",
            "Sirve como documento listo para imprimir.",
        ],
    },
]


def cover(pdf):
    cmds = []
    text(cmds, 70, 500, "AV Publicidad", 28, True)
    text(cmds, 70, 465, "Diagramas de secuencia y robustez", 20, True)
    text(cmds, 70, 430, "Documento generado desde los modulos actuales del backend y frontend.", 12)
    text(cmds, 70, 400, "Incluye autenticacion, clientes, pedidos, pagos, inventario, servicios,", 11)
    text(cmds, 70, 382, "corte de caja, configuracion, reportes y nota PDF.", 11)
    text(cmds, 70, 335, "Convencion de robustez:", 12, True)
    text(cmds, 90, 310, "Boundary = pantalla, modal o endpoint visible para el usuario.", 10)
    text(cmds, 90, 292, "Control = controller/service que coordina reglas del flujo.", 10)
    text(cmds, 90, 274, "Entity = modelo o tabla persistente involucrada.", 10)
    pdf.add_page(cmds)


def main():
    pdf = Pdf()
    cover(pdf)
    for flow in FLOWS:
        sequence_page(
            pdf,
            flow["name"],
            flow["participants"],
            flow["messages"],
            notes="Flujo principal representado a nivel aplicacion, desde la UI hasta repositorios y respuesta.",
        )
        robustness_page(pdf, flow["name"], flow["boundary"], flow["control"], flow["entities"], flow["rules"])
    pdf.write(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
