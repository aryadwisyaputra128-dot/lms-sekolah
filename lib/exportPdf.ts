export interface PdfSection {
    heading: string;
    head: string[];
    body: (string | number)[][];
}

export interface PdfReport {
    title: string;
    subtitle?: string;
    summary?: [string, string | number][]; // pasangan label dan nilai ringkasan
    sections: PdfSection[];
    filename: string; // tanpa ekstensi
}

/** Membuat dan mengunduh PDF dari data laporan. Hanya jalan di browser. */
export async function exportPdf(report: PdfReport) {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const finalY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    const tanggal = new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });

    doc.setFontSize(16);
    doc.text(report.title, 40, 48);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(report.subtitle ? `${report.subtitle}  |  Dibuat: ${tanggal}` : `Dibuat: ${tanggal}`, 40, 64);
    doc.setTextColor(0);

    let y = 80;

    if (report.summary && report.summary.length) {
        autoTable(doc, {
            startY: y,
            head: [["Ringkasan", "Nilai"]],
            body: report.summary.map(([k, v]) => [k, String(v)]),
            headStyles: { fillColor: [11, 20, 64] },
            styles: { fontSize: 9 },
        });
        y = finalY() + 20;
    }

    for (const section of report.sections) {
        doc.setFontSize(11);
        doc.text(section.heading, 40, y + 4);
        autoTable(doc, {
            startY: y + 12,
            head: [section.head],
            body: section.body.length ? section.body.map((r) => r.map(String)) : [["Belum ada data", ...section.head.slice(1).map(() => "")]],
            headStyles: { fillColor: [47, 95, 234] },
            styles: { fontSize: 9 },
        });
        y = finalY() + 24;
    }

    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Halaman ${i} dari ${pages}`, 40, doc.internal.pageSize.getHeight() - 24);
    }

    doc.save(`${report.filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
}