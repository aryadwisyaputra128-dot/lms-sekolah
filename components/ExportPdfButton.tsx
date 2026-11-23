"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { exportPdf, type PdfReport } from "@/lib/exportPdf";

export default function ExportPdfButton({
    getReport,
    label = "Export PDF",
    disabled = false,
    className = "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60",
}: {
    getReport: () => PdfReport;
    label?: string;
    disabled?: boolean;
    className?: string;
}) {
    const [busy, setBusy] = useState(false);

    async function handleClick() {
        setBusy(true);
        try {
            await exportPdf(getReport());
        } catch (err) {
            console.error("Export PDF error:", err);
            alert("Gagal membuat PDF. Pastikan jspdf dan jspdf-autotable sudah terpasang.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <button type="button" onClick={handleClick} disabled={disabled || busy} className={className}>
            <Download size={16} /> {busy ? "Membuat PDF..." : label}
        </button>
    );
}