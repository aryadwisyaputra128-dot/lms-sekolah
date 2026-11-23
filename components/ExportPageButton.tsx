"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface Props {
    title?: string; // default: isi <h1> di halaman
    filename?: string; // default: dari judul
    targetSelector?: string; // area yang dibaca, default <main>
    floating?: boolean; // true = tombol melayang di pojok kanan bawah
    label?: string;
    className?: string;
}

const KOLOM_DILEWATI = ["actions", "aksi", "tindakan"];

export default function ExportPageButton({
    title,
    filename,
    targetSelector = "main",
    floating = false,
    label = "Export PDF",
    className,
}: Props) {
    const [busy, setBusy] = useState(false);

    async function handleClick() {
        setBusy(true);
        try {
            const root = (document.querySelector(targetSelector) as HTMLElement | null) ?? document.body;
            const pageTitle = title || root.querySelector("h1")?.textContent?.trim() || "Laporan";

            const { jsPDF } = await import("jspdf");
            const autoTable = (await import("jspdf-autotable")).default;

            const doc = new jsPDF({ unit: "pt", format: "a4" });
            const finalY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
            const tanggal = new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });

            doc.setFontSize(16);
            doc.text(pageTitle, 40, 48);
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text(`Dibuat: ${tanggal}`, 40, 64);
            doc.setTextColor(0);

            let y = 84;
            const tables = Array.from(root.querySelectorAll("table"));

            function findHeading(table: HTMLElement): string {
                let el: HTMLElement | null = table.parentElement;
                for (let i = 0; i < 4 && el && el !== root; i++, el = el.parentElement) {
                    const h = el.querySelector("h2, h3");
                    if (h?.textContent) return h.textContent.trim();
                }
                return "";
            }

            if (tables.length === 0) {
                // Halaman tanpa tabel (misalnya kartu ringkasan): cetak teks yang tampil
                const lines = root.innerText
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean);
                doc.setFontSize(10);
                const wrapped = doc.splitTextToSize(lines.join("\n"), 510) as string[];
                for (const line of wrapped) {
                    if (y > 790) {
                        doc.addPage();
                        y = 48;
                    }
                    doc.text(line, 40, y);
                    y += 14;
                }
            } else {
                for (const table of tables) {
                    const clone = table.cloneNode(true) as HTMLTableElement;

                    // buang kolom Actions/Aksi dan elemen bertanda data-pdf-ignore
                    const headRow = clone.querySelector("thead tr");
                    if (headRow) {
                        const skip: number[] = [];
                        Array.from(headRow.children).forEach((th, i) => {
                            if (KOLOM_DILEWATI.includes((th.textContent || "").trim().toLowerCase())) skip.push(i);
                        });
                        if (skip.length) {
                            clone.querySelectorAll("tr").forEach((tr) => {
                                const cells = Array.from(tr.children);
                                if (cells.length < skip.length + 1 && cells.length === 1) return; // baris "kosong/memuat"
                                skip.sort((a, b) => b - a).forEach((i) => cells[i]?.remove());
                            });
                        }
                    }
                    clone.querySelectorAll("[data-pdf-ignore]").forEach((el) => el.remove());

                    const heading = findHeading(table);
                    if (heading) {
                        doc.setFontSize(11);
                        doc.text(heading, 40, y + 4);
                        y += 12;
                    }

                    autoTable(doc, {
                        startY: y,
                        html: clone,
                        headStyles: { fillColor: [47, 95, 234] },
                        styles: { fontSize: 8, cellPadding: 4 },
                    });
                    y = finalY() + 24;
                }
            }

            const pages = doc.getNumberOfPages();
            for (let i = 1; i <= pages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Halaman ${i} dari ${pages}`, 40, doc.internal.pageSize.getHeight() - 24);
            }

            const slug = (filename || pageTitle).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            doc.save(`${slug}-${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error("Export PDF error:", err);
            alert("Gagal membuat PDF. Pastikan jspdf dan jspdf-autotable sudah terpasang.");
        } finally {
            setBusy(false);
        }
    }

    const style =
        className ??
        (floating
            ? "fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#2F5FEA] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90 disabled:opacity-60"
            : "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60");

    return (
        <button type="button" onClick={handleClick} disabled={busy} className={style}>
            <Download size={16} /> {busy ? "Membuat PDF..." : label}
        </button>
    );
}