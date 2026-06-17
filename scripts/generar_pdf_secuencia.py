from __future__ import annotations

import re
import textwrap
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "docs" / "diagramas-secuencia.md"
OUTPUT = ROOT / "docs" / "diagramas-secuencia.pdf"

PAGE_W = 842
PAGE_H = 595
MARGIN_X = 34
TOP = 552
BOTTOM = 42


def clean(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return text.replace("ñ", "n").replace("Ñ", "N")


def pdf_escape(text: str) -> str:
    text = clean(text)
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def wrap(text: str, width: int) -> list[str]:
    return textwrap.wrap(clean(text), width=width, break_long_words=False) or [""]


class Page:
    def __init__(self):
        self.ops: list[str] = []

    def line(self, x1, y1, x2, y2, width=1, color=(0.12, 0.16, 0.22)):
        r, g, b = color
        self.ops.append(f"{r:.3f} {g:.3f} {b:.3f} RG {width:.2f} w {x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S")

    def rect(self, x, y, w, h, stroke=(0.32, 0.36, 0.42), fill=(0.95, 0.97, 1.0), width=1):
        sr, sg, sb = stroke
        fr, fg, fb = fill
        self.ops.append(f"{fr:.3f} {fg:.3f} {fb:.3f} rg {sr:.3f} {sg:.3f} {sb:.3f} RG {width:.2f} w {x:.2f} {y:.2f} {w:.2f} {h:.2f} re B")

    def text(self, x, y, text, size=10, bold=False, color=(0.04, 0.06, 0.12)):
        r, g, b = color
        font = "F2" if bold else "F1"
        self.ops.append(f"BT {r:.3f} {g:.3f} {b:.3f} rg /{font} {size:.2f} Tf {x:.2f} {y:.2f} Td ({pdf_escape(text)}) Tj ET")

    def centered(self, x, y, text, size=9, bold=False, color=(0.04, 0.06, 0.12)):
        approx = len(clean(text)) * size * 0.27
        self.text(x - approx, y, text, size=size, bold=bold, color=color)

    def arrow(self, x1, y, x2, label, dashed=False, color=(0.13, 0.17, 0.23)):
        if dashed:
            self.ops.append("[4 3] 0 d")
        self.line(x1, y, x2, y, width=1.1, color=color)
        if dashed:
            self.ops.append("[] 0 d")
        direction = 1 if x2 >= x1 else -1
        hx = x2
        self.line(hx, y, hx - direction * 7, y + 4, width=1.1, color=color)
        self.line(hx, y, hx - direction * 7, y - 4, width=1.1, color=color)
        tx = min(x1, x2) + 8
        max_width = max(24, int(abs(x2 - x1) / 5))
        lines = wrap(label, min(65, max_width))
        for i, part in enumerate(lines[:2]):
            self.text(tx, y + 7 - i * 10, part, size=7.2, color=(0.22, 0.28, 0.38))

    def note(self, x, y, text):
        lines = wrap(text, 78)
        h = 15 + 10 * len(lines)
        self.rect(x, y - h + 4, PAGE_W - 2 * x, h, stroke=(0.86, 0.55, 0.45), fill=(1.0, 0.95, 0.92), width=0.8)
        for i, line in enumerate(lines):
            self.text(x + 8, y - 10 - i * 10, line, size=8.5, bold=i == 0, color=(0.48, 0.14, 0.08))
        return h

    def content(self) -> bytes:
        return "\n".join(self.ops).encode("latin-1", errors="replace")


def parse_markdown() -> list[dict]:
    text = INPUT.read_text(encoding="utf-8")
    chunks = re.split(r"^## ", text, flags=re.M)
    diagrams = []
    for chunk in chunks[1:]:
        title = chunk.splitlines()[0].strip()
        block_match = re.search(r"```mermaid\n(.*?)```", chunk, flags=re.S)
        if not block_match:
            continue
        block = block_match.group(1)
        participants: list[tuple[str, str]] = []
        messages: list[dict] = []
        for raw in block.splitlines():
            line = raw.strip()
            if not line or line == "sequenceDiagram":
                continue
            part = re.match(r"(actor|participant)\s+(\w+)\s+as\s+(.+)", line)
            if part:
                participants.append((part.group(2), clean(part.group(3))))
                continue
            msg = re.match(r"(\w+)\s*(-{1,2}>>)\s*(\w+):\s*(.+)", line)
            if msg:
                messages.append({
                    "type": "message",
                    "src": msg.group(1),
                    "dst": msg.group(3),
                    "label": clean(msg.group(4)),
                    "dashed": msg.group(2).startswith("--"),
                })
                continue
            group = re.match(r"(alt|else|loop|opt)\s*(.*)", line)
            if group:
                messages.append({"type": "note", "label": f"{group.group(1).upper()} {clean(group.group(2))}".strip()})
                continue
            if line == "end":
                messages.append({"type": "note", "label": "FIN"})
        diagrams.append({"title": clean(title), "participants": participants, "messages": messages})
    return diagrams


def draw_diagram(diagram: dict) -> list[Page]:
    participants = diagram["participants"]
    messages = diagram["messages"]
    pages: list[Page] = []
    page = Page()
    pages.append(page)

    def header(p: Page):
        p.text(MARGIN_X, TOP + 12, diagram["title"], size=18, bold=True)
        p.text(MARGIN_X, TOP - 7, "Diagrama de secuencia", size=10, bold=True, color=(0.32, 0.38, 0.48))

    def participant_positions() -> dict[str, float]:
        usable = PAGE_W - 2 * MARGIN_X
        count = max(1, len(participants))
        return {
            alias: MARGIN_X + (i + 0.5) * usable / count
            for i, (alias, _name) in enumerate(participants)
        }

    pos = participant_positions()

    def draw_participants(p: Page):
        box_w = min(118, max(76, (PAGE_W - 2 * MARGIN_X) / max(1, len(participants)) - 12))
        for alias, name in participants:
            x = pos[alias]
            p.rect(x - box_w / 2, TOP - 46, box_w, 24, fill=(0.94, 0.97, 1.0))
            short = name if len(name) <= 20 else name[:19] + "."
            p.centered(x, TOP - 38, short, size=8.3, bold=True)
            p.line(x, TOP - 46, x, BOTTOM, width=0.7, color=(0.62, 0.66, 0.72))

    header(page)
    draw_participants(page)
    y = TOP - 78
    row_h = 30

    for item in messages:
        if y < BOTTOM + 28:
            page = Page()
            pages.append(page)
            header(page)
            draw_participants(page)
            y = TOP - 78
        if item["type"] == "note":
            consumed = page.note(MARGIN_X, y + 10, item["label"])
            y -= max(24, consumed + 2)
            continue
        src = item["src"]
        dst = item["dst"]
        if src not in pos or dst not in pos:
            page.note(MARGIN_X, y + 10, item["label"])
            y -= row_h
            continue
        page.arrow(pos[src], y, pos[dst], item["label"], dashed=item.get("dashed", False))
        y -= row_h
    return pages


def write_pdf(pages: list[Page]):
    objects: list[bytes] = []

    def add(obj: bytes) -> int:
        objects.append(obj)
        return len(objects)

    catalog_id = add(b"")
    pages_id = add(b"")
    font1_id = add(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    font2_id = add(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

    page_ids = []
    for p in pages:
        content = p.content()
        content_id = add(b"<< /Length " + str(len(content)).encode() + b" >>\nstream\n" + content + b"\nendstream")
        page_id = add(
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {PAGE_W} {PAGE_H}] "
            f"/Resources << /Font << /F1 {font1_id} 0 R /F2 {font2_id} 0 R >> >> "
            f"/Contents {content_id} 0 R >>"
            .encode("ascii")
        )
        page_ids.append(page_id)

    objects[catalog_id - 1] = f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode("ascii")
    kids = " ".join(f"{pid} 0 R" for pid in page_ids)
    objects[pages_id - 1] = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>".encode("ascii")

    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out.extend(f"{i} 0 obj\n".encode("ascii"))
        out.extend(obj)
        out.extend(b"\nendobj\n")
    xref = len(out)
    out.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    out.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        out.extend(f"{off:010d} 00000 n \n".encode("ascii"))
    out.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
        f"startxref\n{xref}\n%%EOF\n".encode("ascii")
    )
    OUTPUT.write_bytes(out)


def main():
    diagrams = parse_markdown()
    pages: list[Page] = []
    for diagram in diagrams:
        pages.extend(draw_diagram(diagram))
    write_pdf(pages)
    print(f"PDF generado: {OUTPUT}")
    print(f"Diagramas: {len(diagrams)} | Paginas: {len(pages)}")


if __name__ == "__main__":
    main()
