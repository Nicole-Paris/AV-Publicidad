from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "diagrama-secuencia-cu02-recuperar-contrasena.pdf"
W, H = 792, 612


def esc(text):
    return (
        text.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
        .replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
        .replace("ñ", "n")
        .replace("Á", "A")
        .replace("É", "E")
        .replace("Í", "I")
        .replace("Ó", "O")
        .replace("Ú", "U")
        .replace("Ñ", "N")
    )


def text(cmds, x, y, value, size=8, font="/F1", color="0 0 0"):
    cmds.append(f"{color} rg BT {font} {size} Tf {x:.1f} {y:.1f} Td ({esc(value)}) Tj ET")


def centered_text(cmds, x, y, value, size=8, font="/F2"):
    approx_width = len(value) * size * 0.27
    text(cmds, x - approx_width, y, value, size=size, font=font)


def line(cmds, x1, y1, x2, y2, color="0.12 0.16 0.22", width=0.8):
    cmds.append(f"{color} RG {width:.1f} w {x1:.1f} {y1:.1f} m {x2:.1f} {y2:.1f} l S")


def rect(cmds, x, y, w, h, fill="0.95 0.97 0.99", stroke="0.55 0.62 0.70"):
    cmds.append(f"{fill} rg {stroke} RG 0.8 w {x:.1f} {y:.1f} {w:.1f} {h:.1f} re B")


def arrow(cmds, x1, y, x2, label):
    line(cmds, x1, y, x2, y)
    direction = 1 if x2 > x1 else -1
    line(cmds, x2, y, x2 - direction * 7, y + 4)
    line(cmds, x2, y, x2 - direction * 7, y - 4)
    tx = min(x1, x2) + 5
    text(cmds, tx, y + 7, label, size=7)


def build_pdf(content):
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    ]
    stream = content.encode("latin-1", errors="replace")
    objects.append(b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream")

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{i} 0 obj\n".encode())
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")
    xref_pos = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    pdf.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        pdf.extend(f"{off:010d} 00000 n \n".encode())
    pdf.extend(
        f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode()
    )
    return pdf


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    cmds = []
    text(cmds, 42, 575, "CU02 - Diagrama de secuencia: Recuperar contrasena", size=16, font="/F2")

    actors = [
        ("Usuario", 55),
        ("LoginPage", 165),
        ("Auth API", 275),
        ("AuthController", 390),
        ("RecuperacionService", 525),
        ("EmpleadoRepository", 650),
        ("JavaMailSender", 745),
    ]
    top = 540
    bottom = 42
    for name, x in actors:
        rect(cmds, x - 42, top, 84, 22)
        centered_text(cmds, x, top + 7, name, size=7)
        cmds.append("0.60 0.65 0.70 RG 0.5 w [3 3] 0 d")
        cmds.append(f"{x:.1f} {top:.1f} m {x:.1f} {bottom:.1f} l S [] 0 d")

    steps = [
        (0, 1, "1. Selecciona Olvidaste tu contrasena"),
        (1, 0, "2. Muestra modal para ingresar correo"),
        (0, 1, "3. Ingresa correo electronico"),
        (1, 2, "4. POST /recuperacion/codigo"),
        (2, 3, "5. Solicita codigo de recuperacion"),
        (3, 4, "6. enviarCodigo(correo)"),
        (4, 5, "7. Valida correo en empleados"),
        (5, 4, "8. Empleado encontrado"),
        (4, 6, "9. Envia codigo de 6 digitos"),
        (6, 4, "10. Correo enviado"),
        (4, 3, "11. Guarda codigo con vigencia 10 min"),
        (3, 2, "12. Codigo enviado"),
        (2, 1, "13. Muestra modal de codigo"),
        (0, 1, "14. Ingresa codigo y valida"),
        (1, 2, "15. POST /validar-codigo"),
        (2, 3, "16. Validar codigo"),
        (3, 4, "17. Verifica que sea correcto y vigente"),
        (4, 3, "18. Codigo valido"),
        (3, 2, "19. Codigo verificado"),
        (2, 1, "20. Muestra modal Nueva contrasena"),
        (0, 1, "21. Ingresa nueva contrasena"),
        (1, 2, "22. POST /restablecer"),
        (2, 3, "23. Restablecer contrasena"),
        (3, 4, "24. Valida codigo y codifica contrasena"),
        (4, 5, "25. Actualiza campo contrasena"),
        (5, 4, "26. Empleado actualizado"),
        (4, 3, "27. Elimina codigo usado"),
        (3, 2, "28. Contrasena restablecida"),
        (2, 1, "29. Muestra mensaje de exito"),
    ]

    y = 515
    for source, target, label in steps:
        arrow(cmds, actors[source][1], y, actors[target][1], label)
        y -= 15

    rect(cmds, 42, 38, 350, 72, fill="0.98 0.99 1.00", stroke="0.55 0.62 0.70")
    text(cmds, 52, 96, "Flujo alterno 2.1 - Administrador restablece contrasena", size=8, font="/F2")
    text(cmds, 52, 80, "Admin entra a Configuracion / Empleados, selecciona empleado,", size=7)
    text(cmds, 52, 66, "ingresa una nueva contrasena y guarda los cambios.", size=7)
    text(cmds, 52, 52, "El sistema actualiza la contrasena del empleado.", size=7)

    rect(cmds, 420, 38, 330, 72, fill="1.00 0.98 0.98", stroke="0.90 0.45 0.45")
    text(cmds, 430, 96, "Excepciones consideradas", size=8, font="/F2")
    text(cmds, 430, 80, "Correo vacio / correo no registrado.", size=7)
    text(cmds, 430, 66, "Codigo invalido o expirado.", size=7)
    text(cmds, 430, 52, "Nueva contrasena no cumple la politica configurada.", size=7)

    text(cmds, 42, 20, "Nota: El sistema usa codigo de recuperacion de 6 digitos; no usa enlace de recuperacion.", size=8, color="0.30 0.35 0.42")
    OUT.write_bytes(build_pdf("\n".join(cmds)))
    print(OUT)


if __name__ == "__main__":
    main()
