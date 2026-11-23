"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ClipboardCheck, CalendarClock, Video, ChevronLeft, ChevronRight } from "lucide-react";

interface UjianRow {
    _id: string;
    namaUjian: string;
    tipe: "EXAM" | "QUIZ";
    mapel: string;
    kelas: string;
    status: "LIVE" | "SCHEDULED" | "ARCHIVED";
    tenggat: string | null;
    namaGuru: string;
    totalPeserta: number;
    jumlahMengerjakan: number;
    rataRata: number | null;
}

interface ZoomRow {
    _id: string;
    namaGuru: string;
    namaMapel: string;
    kelas: string;
    zoomLink: string | null;
}

interface Stats {
    live: number;
    terjadwal: number;
    diarsipkan: number;
    zoomTerkirim: number;
    zoomTotal: number;
}

type Tab = "ujian" | "zoom";
type StatusFilter = "ALL" | "LIVE" | "SCHEDULED" | "ARCHIVED";
type TipeFilter = "ALL" | "EXAM" | "QUIZ";
type ZoomFilter = "ALL" | "SUDAH" | "BELUM";

const PAGE_SIZE = 8;

const statusBadge: Record<string, string> = {
    LIVE: "bg-emerald-100 text-emerald-700",
    SCHEDULED: "bg-amber-100 text-amber-700",
    ARCHIVED: "bg-slate-100 text-slate-500",
};
const statusLabel: Record<string, string> = {
    LIVE: "Berlangsung",
    SCHEDULED: "Terjadwal",
    ARCHIVED: "Diarsipkan",
};

// hanya izinkan link http(s)
function linkAman(link?: string | null) {
    return !!link && /^https?:\/\//i.test(link);
}

function formatTenggat(iso: string | null) {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function PetugasAcademicPage() {
    const [stats, setStats] = useState<Stats>({
        live: 0,
        terjadwal: 0,
        diarsipkan: 0,
        zoomTerkirim: 0,
        zoomTotal: 0,
    });
    const [ujian, setUjian] = useState<UjianRow[]>([]);
    const [zoom, setZoom] = useState<ZoomRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>("ujian");

    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [tipeFilter, setTipeFilter] = useState<TipeFilter>("ALL");
    const [zoomFilter, setZoomFilter] = useState<ZoomFilter>("ALL");
    const [page, setPage] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/petugas/academic");
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setUjian(data.ujian);
                setZoom(data.zoom);
            }
        } catch (err) {
            console.error("Fetch academic error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setPage(0);
    }, [statusFilter, tipeFilter, zoomFilter, tab]);

    const ujianTerfilter = useMemo(
        () =>
            ujian.filter(
                (u) =>
                    (statusFilter === "ALL" || u.status === statusFilter) &&
                    (tipeFilter === "ALL" || u.tipe === tipeFilter)
            ),
        [ujian, statusFilter, tipeFilter]
    );

    const zoomTerfilter = useMemo(
        () =>
            zoom.filter(
                (z) =>
                    zoomFilter === "ALL" || (zoomFilter === "SUDAH" ? !!z.zoomLink : !z.zoomLink)
            ),
        [zoom, zoomFilter]
    );

    const daftar = tab === "ujian" ? ujianTerfilter : zoomTerfilter;
    const totalHalaman = Math.max(1, Math.ceil(daftar.length / PAGE_SIZE));
    const dariIdx = page * PAGE_SIZE;
    const ujianTampil = ujianTerfilter.slice(dariIdx, dariIdx + PAGE_SIZE);
    const zoomTampil = zoomTerfilter.slice(dariIdx, dariIdx + PAGE_SIZE);

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold text-slate-900">Pemantauan Akademik</h1>
            <p className="mt-1 text-sm text-slate-400">
                Pantau ujian, tugas, dan kelas virtual. Halaman ini hanya untuk melihat.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <ClipboardCheck size={18} />
                    </span>
                    <p className="mt-3 text-sm text-slate-400">Ujian Berlangsung</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.live}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <CalendarClock size={18} />
                    </span>
                    <p className="mt-3 text-sm text-slate-400">Ujian Terjadwal</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.terjadwal}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2F5FEA]">
                        <Video size={18} />
                    </span>
                    <p className="mt-3 text-sm text-slate-400">Link Zoom Terkirim</p>
                    <p className="text-3xl font-bold text-slate-900">
                        {stats.zoomTerkirim}
                        <span className="text-lg font-semibold text-slate-400"> / {stats.zoomTotal}</span>
                    </p>
                </div>
            </div>

            {/* tab */}
            <div className="mt-8 flex gap-6 border-b border-slate-200 text-sm">
                {(
                    [
                        { key: "ujian", label: "Ujian & Tugas" },
                        { key: "zoom", label: "Kelas Virtual (Zoom)" },
                    ] as { key: Tab; label: string }[]
                ).map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`relative pb-3 font-medium transition-colors ${tab === t.key ? "text-[#2F5FEA]" : "text-slate-400 hover:text-slate-600"
                            }`}
                    >
                        {t.label}
                        {tab === t.key && <span className="absolute -bottom-px left-0 h-0.5 w-full bg-[#2F5FEA]" />}
                    </button>
                ))}
            </div>

            {/* filter */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {tab === "ujian" ? (
                    <>
                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    ["ALL", "Semua"],
                                    ["LIVE", "Berlangsung"],
                                    ["SCHEDULED", "Terjadwal"],
                                    ["ARCHIVED", "Diarsipkan"],
                                ] as [StatusFilter, string][]
                            ).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => setStatusFilter(key)}
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusFilter === key
                                            ? "bg-[#2F5FEA] text-white"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500">Tipe:</label>
                            <select
                                value={tipeFilter}
                                onChange={(e) => setTipeFilter(e.target.value as TipeFilter)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none"
                            >
                                <option value="ALL">Semua</option>
                                <option value="EXAM">Ujian</option>
                                <option value="QUIZ">Kuis</option>
                            </select>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {(
                            [
                                ["ALL", "Semua"],
                                ["SUDAH", "Sudah Dikirim"],
                                ["BELUM", "Belum Dikirim"],
                            ] as [ZoomFilter, string][]
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setZoomFilter(key)}
                                className={`rounded-full px-3 py-1 text-xs font-medium ${zoomFilter === key
                                        ? "bg-[#2F5FEA] text-white"
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* tabel */}
            <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="overflow-x-auto">
                    {tab === "ujian" ? (
                        <table className="w-full min-w-[860px] text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-xs text-slate-400">
                                    <th className="px-5 py-3 font-medium">Ujian</th>
                                    <th className="px-5 py-3 font-medium">Kelas</th>
                                    <th className="px-5 py-3 font-medium">Guru</th>
                                    <th className="px-5 py-3 font-medium">Tenggat</th>
                                    <th className="px-5 py-3 font-medium">Pengerjaan</th>
                                    <th className="px-5 py-3 font-medium">Rata-rata Nilai</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                                            Memuat data...
                                        </td>
                                    </tr>
                                )}
                                {!loading && ujianTampil.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                                            Tidak ada ujian yang cocok.
                                        </td>
                                    </tr>
                                )}
                                {ujianTampil.map((u) => {
                                    const persen = u.totalPeserta
                                        ? Math.min(100, Math.round((u.jumlahMengerjakan / u.totalPeserta) * 100))
                                        : 0;
                                    return (
                                        <tr key={u._id} className="border-t border-slate-50">
                                            <td className="px-5 py-3">
                                                <p className="font-semibold text-slate-800">{u.namaUjian}</p>
                                                <p className="text-xs text-slate-400">
                                                    {u.mapel} • {u.tipe === "QUIZ" ? "Kuis" : "Ujian"}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600">{u.kelas}</td>
                                            <td className="px-5 py-3 text-slate-600">{u.namaGuru}</td>
                                            <td className="px-5 py-3 text-slate-600">{formatTenggat(u.tenggat)}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-24 rounded-full bg-slate-100">
                                                        <div
                                                            className="h-1.5 rounded-full bg-[#2F5FEA]"
                                                            style={{ width: `${persen}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-700">
                                                        {u.jumlahMengerjakan} / {u.totalPeserta}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                {u.rataRata !== null ? (
                                                    <span className="font-semibold text-slate-800">{u.rataRata}</span>
                                                ) : (
                                                    <span className="text-xs text-slate-300">Belum ada nilai</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[u.status]}`}
                                                >
                                                    {statusLabel[u.status]}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-xs text-slate-400">
                                    <th className="px-5 py-3 font-medium">Guru</th>
                                    <th className="px-5 py-3 font-medium">Mata Pelajaran</th>
                                    <th className="px-5 py-3 font-medium">Kelas</th>
                                    <th className="px-5 py-3 font-medium">Link Zoom</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                                            Memuat data...
                                        </td>
                                    </tr>
                                )}
                                {!loading && zoomTampil.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                                            Tidak ada data yang cocok.
                                        </td>
                                    </tr>
                                )}
                                {zoomTampil.map((z) => (
                                    <tr key={z._id} className="border-t border-slate-50">
                                        <td className="px-5 py-3 font-medium text-slate-800">{z.namaGuru}</td>
                                        <td className="px-5 py-3 text-slate-600">{z.namaMapel}</td>
                                        <td className="px-5 py-3 text-slate-600">{z.kelas}</td>
                                        <td className="px-5 py-3">
                                            {z.zoomLink ? (
                                                <div className="flex items-center gap-3">
                                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                        Sudah dikirim
                                                    </span>
                                                    {linkAman(z.zoomLink) && (
                                                        <a
                                                            href={z.zoomLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs font-medium text-[#2F5FEA] hover:underline"
                                                        >
                                                            Buka link
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                                    Belum dikirim
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-50 px-5 py-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        {daftar.length === 0
                            ? "Tidak ada data"
                            : `Menampilkan ${dariIdx + 1} - ${Math.min(dariIdx + PAGE_SIZE, daftar.length)} dari ${daftar.length
                            } ${tab === "ujian" ? "ujian" : "kelas-mapel"}`}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 disabled:opacity-30"
                            aria-label="Halaman sebelumnya"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span>
                            Halaman {page + 1} dari {totalHalaman}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalHalaman - 1, p + 1))}
                            disabled={page >= totalHalaman - 1}
                            className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 disabled:opacity-30"
                            aria-label="Halaman berikutnya"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}