import csv
from io import StringIO, BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, Spacer, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

from chest.models import Chest
from user.models import CustomUser

from datetime import datetime
import pytz


def generate_pdf_blob(csv_string: str, chest: Chest, user: CustomUser) -> bytes:
    # Parse CSV
    buffer = StringIO(csv_string)
    reader = csv.reader(buffer)
    table_data_raw = list(reader)

    # Use Paragraphs in table for wrapping
    styles = getSampleStyleSheet()
    normal_style = styles['Normal']
    bold_style = ParagraphStyle('bold', parent=normal_style, fontName='Helvetica-Bold')

    # Make header bold
    table_data = [
        [Paragraph(cell, bold_style) for cell in table_data_raw[0]]
    ]

    # Wrap text for each data row
    for row in table_data_raw[1:]:
        table_data.append([Paragraph(str(cell), normal_style) for cell in row])

    # PDF to memory
    pdf_buffer = BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=landscape(A4), rightMargin=20, leftMargin=20)
    elements = []

    # Get Central Time
    central_tz = pytz.timezone('America/Chicago')
    now = datetime.now(pytz.utc).astimezone(central_tz)

    # Header section
    header_lines = [
        "Inventory Information:\n",
        f"By: {user.rank} {user.last_name}, {user.first_name}",
        f"Date: {now.strftime('%Y%m%d %H:%M:%S')}\n",
        "Chest Info:\n",
        chest.description,
        f"Serial: {chest.serial}",
        f"Case #: {chest.case_number} of {chest.case_total} cases in set",
        f"NSN: {chest.nsn}"
    ]
    for line in header_lines:
        elements.append(Paragraph(line, normal_style))
    elements.append(Spacer(1, 0.3 * inch))

    # Define column widths (adjust as needed)
    column_widths = [2.5*inch, 2.5*inch, 1.5*inch, 1*inch, 1*inch, 1*inch, 2*inch]

    # Table with style
    table = Table(table_data, colWidths=column_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))

    elements.append(table)
    doc.build(elements)
    pdf_buffer.seek(0)
    return pdf_buffer.read()
