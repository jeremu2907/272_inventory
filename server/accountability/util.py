import csv
from io import StringIO, BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.pagesizes import landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch

from chest.models import Chest
from user.models import CustomUser

from datetime import datetime
import pytz


def generate_pdf_blob(csv_string: str, chest: Chest, user: CustomUser) -> bytes:
    # Parse CSV
    buffer = StringIO(csv_string)
    reader = csv.reader(buffer)
    table_data = list(reader)

    # PDF to memory (not file)
    pdf_buffer = BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=landscape(A4))
    styles = getSampleStyleSheet()
    elements = []
    
    # Define the Central Time Zone (Texas is in Central Time)
    central_tz = pytz.timezone('America/Chicago')

    # Get the current time in UTC and convert it to Central Time
    now = datetime.now(pytz.utc).astimezone(central_tz)

    # Header section
    header_lines = [
        "Inventory Information:\n",
        f"By: {user.rank} {user.last_name}, {user.first_name}",
        f"Date: {now.strftime("%Y-%m-%d %H:%M:%S")}\n",
        "Chest Info:\n",
        chest.description,
        f"Serial: {chest.serial}",
        f"Case #: {chest.case_number} of {chest.case_total} cases in set",
        f"NSN: {chest.nsn}"
    ]
    for line in header_lines:
        elements.append(Paragraph(line, styles['Normal']))
    elements.append(Spacer(1, 0.3 * inch))

    # Table from CSV
    table = Table(table_data)
    elements.append(table)

    # Build the PDF
    doc.build(elements)

    # Return PDF bytes
    pdf_buffer.seek(0)
    return pdf_buffer.read()
