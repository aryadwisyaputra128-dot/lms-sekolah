"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Download,
    Users,
    GraduationCap,
    Video,
    ClipboardCheck,
    CalendarClock,
    Archive,
    AlertTriangle,
    CheckCircle2,
    LogIn,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Tipe data (sesuai response API admin yang sudah ada)                */
/* ------------------------------------------------------------------ */

interface UserRow {
    _id: string;
    name: string;
    email: string;
    role: "GURU" | "MURID" | "WAKAKURI" | "KEPSEK";
    status: "ACTIVE" | "OFFLINE" | "SUSPENDED";
    kelas?: string;
    mapel?: string;
    jabatan?: string;
    zoomLink?: string; // ASUMSI: nama field link Zoom di model user guru
}

interface AssessmentRow {
    _id: string;
    namaUjian: string;
    tipe: "EXAM" | "QUIZ";
    kelas: string;
    mapel?: string;
    status: "LIVE" | "SCHEDULED" | "ARCHIVED";
    totalPeserta: number;
    totalSelesai?: number; // ASUMSI: jumlah siswa yang sudah mengerjakan
}

interface AssessmentCounts {
    totalAktif: number;
    totalScheduled: number;
    totalArchived: number;
    total: number;
}

interface UserCounts {
    guru: number;
    siswa: number;
    petugas: number;
    total: number;
}

interface LogItem {
    id: string;
    teks: string;
    waktu: string;
}

type Level = "tinggi" | "sedang" | "info";

interface Perhatian {
    judul: string;
    detail: string;
    level: Level;
}

const levelStyle: Record<Level, string> = {
    tinggi: "border-red-200 bg-red-50 text-red-700",
    sedang: "border-amber-200 bg-amber-50 text-amber-700",
    info: "border-slate-200 bg-slate-50 text-slate-600",
};

const statusBadge: Record<AssessmentRow["status"], string> = {
    LIVE: "bg-emerald-100 text-emerald-700",
    SCHEDULED: "bg-amber-100 text-amber-700",
    ARCHIVED: "bg-slate-100 text-slate-500",
};

const statusLabel: Record<AssessmentRow["status"], string> = {
    LIVE: "Berlangsung",
    SCHEDULED: "Terjadwal",
    ARCHIVED: "Diarsipkan",
};

function progres(a: AssessmentRow): number | null {
    if (a.totalSelesai === undefined || !a.totalPeserta) return null;
    return Math.min(100, Math.round((a.totalSelesai / a.totalPeserta) * 100));
}

function formatWaktu(value: unknown): string {
    if (!value) return "";
    const d = new Date(String(value));
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

/* Response /api/admin/activity belum saya lihat, jadi dibaca longgar. */
function normalizeLogs(raw: unknown): LogItem[] {
    const obj = raw as Record<string, unknown>;
    const list = (obj?.activities ?? obj?.logs ?? obj?.activity ?? obj?.data ?? []) as Record<string, unknown>[];
    if (!Array.isArray(list)) return [];
    return list.slice(0, 6).map((l, i) => ({
        id: String(l._id ?? i),
        teks: String(l.message ?? l.description ?? l.text ?? l.title ?? l.action ?? "Aktivitas"),
        waktu: formatWaktu(l.createdAt ?? l.timestamp ?? l.time),
    }));
}

export default function KepsekDashboardPage() {
    const [guru, setGuru] = useState<UserRow[]>([]);
    const [siswa, setSiswa] = useState<UserRow[]>([]);
    const [userCounts, setUserCounts] = useState<UserCounts>({ guru: 0, siswa: 0, petugas: 0, total: 0 });
    const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
    const [aCounts, setACounts] = useState<AssessmentCounts>({ totalAktif: 0, totalScheduled: 0, totalArchived: 0, total: 0 });
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<string[]>([]);
    const [exporting, setExporting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/kepsek/overview");
            if (!res.ok) throw new Error(String(res.status));
            const d = await res.json();
            if (!d.success) throw new Error(d.message || "Gagal memuat");
            setGuru(d.guru);
            setSiswa(d.siswa);
            setUserCounts(d.userCounts);
            setAssessments(d.assessments);
            setACounts(d.aCounts);
            setLogs(normalizeLogs(d.logs));
            setErrors([]);
        } catch (err) {
            setErrors([err instanceof Error ? err.message : "Tidak dapat terhubung ke server"]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    /* ---------------- angka turunan dari data asli ---------------- */

    const guruZoomLengkap = guru.filter((g) => g.zoomLink && g.zoomLink.trim() !== "").length;
    const persenZoom = guru.length ? Math.round((guruZoomLengkap / guru.length) * 1000) / 10 : 0;

    const ujianDenganProgres = assessments.filter((a) => a.status !== "SCHEDULED" && progres(a) !== null);
    const persenPengerjaan = ujianDenganProgres.length
        ? Math.round(ujianDenganProgres.reduce((sum, a) => sum + (progres(a) ?? 0), 0) / ujianDenganProgres.length)
        : null;

    const guruAktif = guru.filter((g) => g.status === "ACTIVE").length;
    const akunSuspended = [...guru, ...siswa].filter((u) => u.status === "SUSPENDED").length;

    const siswaPerKelas = useMemo(() => {
        const map = new Map<string, number>();
        siswa.forEach((s) => {
            const k = s.kelas?.trim() || "Belum ada kelas";
            map.set(k, (map.get(k) ?? 0) + 1);
        });
        return Array.from(map.entries())
            .map(([kelas, jumlah]) => ({ kelas, jumlah }))
            .sort((x, y) => y.jumlah - x.jumlah);
    }, [siswa]);

    const ujianTerkini = useMemo(
        () => [...assessments].filter((a) => a.status !== "ARCHIVED").slice(0, 6),
        [assessments]
    );

    const perhatian = useMemo<Perhatian[]>(() => {
        const list: Perhatian[] = [];
        const tanpaZoom = guru.length - guruZoomLengkap;
        if (guru.length && tanpaZoom > 0) {
            list.push({ judul: `${tanpaZoom} guru belum mengisi link Zoom`, detail: "Kelas online mereka belum bisa diakses siswa.", level: "tinggi" });
        }
        assessments
            .filter((a) => a.status === "LIVE" && (progres(a) ?? 100) < 50)
            .forEach((a) =>
                list.push({ judul: `Ujian ${a.namaUjian} (${a.kelas}) baru ${progres(a)}% dikerjakan`, detail: "Ujian sedang berlangsung.", level: "sedang" })
            );
        if (akunSuspended > 0) {
            list.push({ judul: `${akunSuspended} akun guru/siswa disuspend`, detail: "Periksa apakah penangguhan masih diperlukan.", level: "sedang" });
        }
        if (aCounts.totalScheduled > 0) {
            list.push({ judul: `${aCounts.totalScheduled} ujian terjadwal`, detail: "Pastikan soal dan kelas sudah sesuai.", level: "info" });
        }
        return list;
    }, [guru, guruZoomLengkap, assessments, akunSuspended, aCounts.totalScheduled]);

    /* ---------------- ekspor PDF ---------------- */

    async function handleExportPdf() {
        setExporting(true);
        try {
            const { jsPDF } = await import("jspdf");
            const autoTable = (await import("jspdf-autotable")).default;

            const doc = new jsPDF({ unit: "pt", format: "a4" });
            const finalY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
            const tanggal = new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });

            doc.setFontSize(16);
            doc.text("Laporan Monitoring Sekolah", 40, 48);
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text(`Dibuat: ${tanggal}`, 40, 64);
            doc.setTextColor(0);

            autoTable(doc, {
                startY: 80,
                head: [["Ringkasan", "Nilai"]],
                body: [
                    ["Total siswa", String(userCounts.siswa)],
                    ["Total guru", String(userCounts.guru)],
                    ["Guru aktif", String(guruAktif)],
                    ["Kelengkapan link Zoom guru", `${persenZoom}% (${guruZoomLengkap}/${guru.length})`],
                    ["Rata-rata pengerjaan ujian", persenPengerjaan === null ? "-" : `${persenPengerjaan}%`],
                    ["Ujian berlangsung / terjadwal / diarsipkan", `${aCounts.totalAktif} / ${aCounts.totalScheduled} / ${aCounts.totalArchived}`],
                ],
                headStyles: { fillColor: [11, 20, 64] },
                styles: { fontSize: 9 },
            });

            autoTable(doc, {
                startY: finalY() + 20,
                head: [["Ujian", "Kelas", "Mapel", "Peserta", "Progres", "Status"]],
                body: assessments.map((a) => [
                    a.namaUjian,
                    a.kelas,
                    a.mapel || "-",
                    String(a.totalPeserta),
                    progres(a) === null ? "-" : `${progres(a)}%`,
                    statusLabel[a.status],
                ]),
                headStyles: { fillColor: [47, 95, 234] },
                styles: { fontSize: 9 },
            });

            autoTable(doc, {
                startY: finalY() + 20,
                head: [["Guru", "Mapel", "Link Zoom"]],
                body: guru.map((g) => [g.name, g.mapel || "-", g.zoomLink ? "Lengkap" : "Belum diisi"]),
                headStyles: { fillColor: [47, 95, 234] },
                styles: { fontSize: 9 },
            });

            autoTable(doc, {
                startY: finalY() + 20,
                head: [["Kelas", "Jumlah siswa"]],
                body: siswaPerKelas.map((k) => [k.kelas, String(k.jumlah)]),
                headStyles: { fillColor: [47, 95, 234] },
                styles: { fontSize: 9 },
            });

            if (perhatian.length) {
                autoTable(doc, {
                    startY: finalY() + 20,
                    head: [["Perlu perhatian", "Keterangan"]],
                    body: perhatian.map((p) => [p.judul, p.detail]),
                    headStyles: { fillColor: [180, 60, 60] },
                    styles: { fontSize: 9 },
                });
            }

            doc.save(`laporan-monitoring-${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error("Export PDF error:", err);
            alert("Gagal membuat PDF. Pastikan jspdf dan jspdf-autotable sudah terpasang.");
        } finally {
            setExporting(false);
        }
    }

    /* ---------------- tampilan ---------------- */

    return (
        <div className="p-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-medium text-[#2F5FEA]">Akses hanya-baca</p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900">Monitoring Sekolah</h1>
                    <p className="mt-1 max-w-xl text-sm text-slate-500">
                        Ringkasan kelengkapan guru, ujian, dan siswa dari data yang sudah diinput.
                    </p>
                </div>
                <button
                    onClick={handleExportPdf}
                    disabled={loading || exporting}
                    className="flex items-center gap-2 rounded-lg bg-[#2F5FEA] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                    <Download size={16} /> {exporting ? "Membuat PDF..." : "Unduh laporan PDF"}
                </button>
            </div>

            {errors.length > 0 && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    Gagal memuat data dashboard ({errors.join(", ")}). Pastikan kamu login sebagai Kepala Sekolah.
                </p>
            )}

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <MetricCard icon={<Video size={16} />} label="Kelengkapan link Zoom guru" value={`${persenZoom}%`} progress={persenZoom} color="bg-[#2F5FEA]" />
                <MetricCard
                    icon={<ClipboardCheck size={16} />}
                    label="Tingkat pengerjaan ujian"
                    value={persenPengerjaan === null ? "-" : `${persenPengerjaan}%`}
                    progress={persenPengerjaan ?? 0}
                    color="bg-emerald-500"
                />
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Status ujian</p>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                        <StatusCount icon={<ClipboardCheck size={16} />} value={aCounts.totalAktif} label="Berlangsung" tone="text-emerald-600" />
                        <StatusCount icon={<CalendarClock size={16} />} value={aCounts.totalScheduled} label="Terjadwal" tone="text-amber-600" />
                        <StatusCount icon={<Archive size={16} />} value={aCounts.totalArchived} label="Diarsipkan" tone="text-slate-500" />
                    </div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <SmallStat icon={<Users size={16} />} label="Total siswa" value={userCounts.siswa.toLocaleString("id-ID")} />
                <SmallStat icon={<GraduationCap size={16} />} label="Total guru" value={String(userCounts.guru)} />
                <SmallStat icon={<GraduationCap size={16} />} label="Guru aktif" value={String(guruAktif)} />
                <SmallStat icon={<Users size={16} />} label="Total user" value={userCounts.total.toLocaleString("id-ID")} />
            </div>

            <section className="mt-6 rounded-2xl bg-white shadow-sm">
                <h2 className="px-5 pt-4 text-sm font-semibold text-slate-700">Ujian terkini</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-xs text-slate-400">
                                <th className="px-5 py-3 font-medium">Ujian</th>
                                <th className="px-5 py-3 font-medium">Kelas</th>
                                <th className="px-5 py-3 font-medium">Peserta</th>
                                <th className="px-5 py-3 font-medium">Progres pengerjaan</th>
                                <th className="px-5 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Memuat data...</td></tr>
                            )}
                            {!loading && ujianTerkini.length === 0 && (
                                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Belum ada ujian aktif atau terjadwal.</td></tr>
                            )}
                            {!loading &&
                                ujianTerkini.map((a) => {
                                    const p = progres(a);
                                    return (
                                        <tr key={a._id} className="border-t border-slate-50">
                                            <td className="px-5 py-3">
                                                <p className="font-medium text-slate-800">{a.namaUjian}</p>
                                                <p className="text-xs text-slate-400">{a.mapel || a.tipe}</p>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600">{a.kelas}</td>
                                            <td className="px-5 py-3 text-slate-600">{a.totalPeserta} siswa</td>
                                            <td className="px-5 py-3">
                                                {p === null ? (
                                                    <span className="text-slate-300">-</span>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-1.5 w-32 rounded-full bg-slate-100">
                                                            <div className="h-1.5 rounded-full bg-[#2F5FEA]" style={{ width: `${p}%` }} />
                                                        </div>
                                                        <span className="text-xs text-slate-500">{p}%</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[a.status]}`}>
                                                    {statusLabel[a.status]}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
                    <h2 className="text-sm font-semibold text-slate-700">Jumlah siswa per kelas</h2>
                    <ul className="mt-4 space-y-3">
                        {siswaPerKelas.length === 0 && <li className="text-sm text-slate-400">Belum ada data siswa.</li>}
                        {siswaPerKelas.map((k) => (
                            <li key={k.kelas}>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-700">{k.kelas}</span>
                                    <span className="font-semibold text-slate-900">{k.jumlah}</span>
                                </div>
                                <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                                    <div
                                        className="h-1.5 rounded-full bg-[#2F5FEA]"
                                        style={{ width: `${(k.jumlah / (siswaPerKelas[0]?.jumlah || 1)) * 100}%` }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-700">Log login terakhir</h2>
                    <ul className="mt-4 space-y-3">
                        {logs.length === 0 && <li className="text-sm text-slate-400">Belum ada aktivitas.</li>}
                        {logs.map((l) => (
                            <li key={l.id} className="flex items-start gap-3">
                                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2F5FEA]">
                                    <LogIn size={14} />
                                </span>
                                <div>
                                    <p className="text-sm text-slate-700">{l.teks}</p>
                                    <p className="text-xs text-slate-400">{l.waktu}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-700">Perlu perhatian</h2>
                    <ul className="mt-4 space-y-3">
                        {perhatian.length === 0 && <li className="text-sm text-slate-400">Tidak ada hal yang perlu ditindaklanjuti.</li>}
                        {perhatian.map((p, i) => (
                            <li key={i} className={`flex gap-3 rounded-xl border p-3 ${levelStyle[p.level]}`}>
                                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold">{p.judul}</p>
                                    <p className="text-xs opacity-80">{p.detail}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-700">Status link Zoom per guru</h2>
                    <ul className="mt-4 divide-y divide-slate-50">
                        {guru.length === 0 && <li className="py-2 text-sm text-slate-400">Belum ada guru.</li>}
                        {guru.map((g) => (
                            <li key={g._id} className="flex items-center justify-between py-2.5">
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{g.name}</p>
                                    <p className="text-xs text-slate-400">{g.mapel || "-"}</p>
                                </div>
                                {g.zoomLink ? (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                        <CheckCircle2 size={12} /> Lengkap
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600">Belum diisi</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}

function MetricCard({ icon, label, value, progress, color }: { icon: React.ReactNode; label: string; value: string; progress: number; color: string }) {
    return (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <span className="text-[#2F5FEA]">{icon}</span>
                {label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}

function StatusCount({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: string }) {
    return (
        <div>
            <span className={`mx-auto flex w-fit ${tone}`}>{icon}</span>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
        </div>
    );
}

function SmallStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <span className="text-[#2F5FEA]">{icon}</span>
                {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
    );
}