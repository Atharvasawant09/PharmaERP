import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  constructor() {}

  generateSaleInvoice(saleData: any): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Company Header
    doc.setFillColor(102, 126, 234); // Primary blue color
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PharmaERP', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sales Invoice', pageWidth / 2, 30, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Invoice Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, 55);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Invoice No: ${saleData.header.SalesId.substring(0, 8).toUpperCase()}`, 20, 62);
    doc.text(`Date: ${this.formatDate(saleData.header.SalesDate)}`, 20, 68);
    doc.text(`Payment: ${saleData.header.PaymentType}`, 20, 74);

    // Customer Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('BILL TO:', 130, 55);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(saleData.header.CustomerName, 130, 62);
    doc.text(`Mobile: ${saleData.header.Mobile || 'N/A'}`, 130, 68);
    doc.text(`Email: ${saleData.header.Email || 'N/A'}`, 130, 74);

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 82, pageWidth - 20, 82);

    // Items Table
    const tableData = saleData.lines.map((line: any, index: number) => [
      index + 1,
      line.ProductName,
      line.BatchNo,
      line.Quantity,
      `₹${this.toNumber(line.Rate).toFixed(2)}`,
      `₹${this.toNumber(line.LineTotal).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 88,
      head: [['#', 'Product', 'Batch No', 'Qty', 'Rate', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 60 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });

    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY || 88;

    // Totals Section
    const totalsY = finalY + 15;
    const totalsX = pageWidth - 80;

    doc.setDrawColor(200, 200, 200);
    doc.line(totalsX - 10, totalsY - 5, pageWidth - 20, totalsY - 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Grand Total:', totalsX, totalsY);
    doc.setFontSize(14);
    doc.setTextColor(76, 175, 80); // Green color
    doc.text(`₹${this.toNumber(saleData.header.TotalAmount).toFixed(2)}`, pageWidth - 20, totalsY, { align: 'right' });

    // Footer
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
    doc.text('Powered by PharmaERP', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    // Save PDF
    const fileName = `Invoice_${saleData.header.SalesId.substring(0, 8)}_${Date.now()}.pdf`;
    doc.save(fileName);
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private toNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  }
}
