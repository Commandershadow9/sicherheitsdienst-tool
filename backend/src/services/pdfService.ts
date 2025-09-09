import PDFDocument from 'pdfkit';

export async function generateEventPdf(e: any): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (c: any) => chunks.push(c as Buffer));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text(`Einsatzbericht: ${e.title}`, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Zeitraum: ${new Date(e.startTime).toISOString()} → ${new Date(e.endTime).toISOString()}`);
    if (e.site) {
      const siteLine = [e.site.name, e.site.address, e.site.city, e.site.postalCode].filter(Boolean).join(', ');
      doc.text(`Site: ${siteLine}`);
    } else if (e.siteId) {
      doc.text(`Site: ${e.siteId}`);
    }
    doc.text(`Status: ${e.status || '—'}`);
    doc.moveDown();
    doc.fontSize(14).text('Dienstanweisungen');
    doc.fontSize(12).text(e.serviceInstructions || '—', { align: 'left' });

    if (Array.isArray(e.assignedEmployees) && e.assignedEmployees.length) {
      doc.moveDown();
      doc.fontSize(14).text('Eingesetzte Mitarbeiter');
      doc.fontSize(12);
      e.assignedEmployees.forEach((u: any, idx: number) => {
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
        const line = `${idx + 1}. ${name}${u.employeeId ? ` (${u.employeeId})` : ''}${u.role ? ` – ${u.role}` : ''}`;
        doc.text(line);
      });
    }
    doc.end();
  });
}
