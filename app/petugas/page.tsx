"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { BookOpen, Users, GraduationCap, ClipboardCheck, Video, TrendingUp } from "lucide-react";

type Periode = "today" | "week" | "month";

interface OverviewData {
    stats: { kelasAktif: number; totalSiswa: number; totalGuru: number };
    ujian: { live: number; terjadwal: number; diarsipkan: number };
    pengerjaanLive: { peserta: number; sudah: number; persen: number };
    zoom: { terkirim: number; total: number };
    periode: { jawabanMasuk: number; rataRataNilai: number | null };
}

const PERIODE_LABEL: { key: Periode; label: string }[] = [
    { key: "today", label: "Hari Ini" },
    { key: "week", label: "Minggu Ini" },
    { key: "month", label: "Bulan Ini" },
];

function Ring({ persen }: { persen: number }) {
    const r = 28;
    const c = 2 * Math.PI * r;
    return (
        <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
            <circle cx="36" cy="36" r={r} fill="none" stroke="#E2E8F0" strokeWidth="8" />
            <circle
                cx="36"
                cy="36"
                r={r}
                fill="none"
                stroke="#2F5FEA"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(persen / 100) * c} ${c}`}
                transform="rotate(-90 36 36)"
            />
            <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="600" fill="#0f172a">
                {persen}%
            </text>
        </svg>
    );
}

export default function PetugasOverviewPage() {
    const [periode, setPeriode] = useState<Periode>("today");
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (p: Periode) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/petugas/overview?range=${p}`);
            const json = await res.json();
            if (json.success) setData(json);
        } catch (err) {
            console.error("Fetch overview error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(periode);
    }, [periode, fetchData]);

    const zoomPersen =
        data && data.zoom.total ? Math.round((data.zoom.terkirim / data.zoom.total) * 100) : 0;

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold text-slate-900">Portal Pemantauan Sekolah</h1>
            <p className="mt-1 text-sm text-slate-400">
                Pantau aktivitas guru, siswa, dan ujian secara langsung. Halaman ini hanya untuk melihat.
            </p>

            {/* statistik utama */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border-l-4 border-[#0B1440] bg-white p-5 shadow-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <BookOpen size={18} />
                    </span>
                    <p className="mt-3 text-sm text-slate-400">Kelas Aktif</p>
                    <p className="text-3xl font-bold text-slate-900">
                        {loading && !data ? "…" : data?.stats.kelasAktif ?? 0}
                    </p>
                </div>
                <div className="rounded-2xl border-l-4 border-[#2F5FEA] bg-white p-5 shadow-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2F5FEA]">
                        <Users size={18} />
                    </span>
                    <p className="mt-3 text-sm text-slate-400">Total Siswa</p>
                    <p className="text-3xl font-bold text-slate-900">
                        {loading && !data ? "…" : (data?.stats.totalSiswa ?? 0).toLocaleString("id-ID")}
                    </p>
                </div>
                <div className="rounded-2xl border-l-4 border-[#2F5FEA] bg-white p-5 shadow-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <GraduationCap size={18} />
                    </span>
                    <p className="mt-3 text-sm text-slate-400">Total Guru</p>
                    <p className="text-3xl font-bold text-slate-900">
                        {loading && !data ? "…" : (data?.stats.totalGuru ?? 0).toLocaleString("id-ID")}
                    </p>
                </div>
            </div>

            {/* ringkasan pemantauan */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Ringkasan Pemantauan</h2>
                    <p className="text-sm text-slate-400">
                        Pemantauan ujian, jawaban siswa, dan kelas virtual.
                    </p>
                </div>
                <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                    {PERIODE_LABEL.map((p) => (
                        <button
                            key={p.key}
                            onClick={() => setPeriode(p.key)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${periode === p.key ? "bg-white text-[#2F5FEA] shadow-sm" : "text-slate-500"
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
                Hari Ini = sejak pukul 00.00, Minggu Ini = 7 hari terakhir, Bulan Ini = 30 hari terakhir.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* jawaban masuk */}
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2F5FEA]">
                        <TrendingUp size={18} />
                    </span>
                    <p className="mt-3 text-sm text-slate-400">Jawaban Masuk</p>
                    <p className="text-3xl font-bold text-slate-900">{data?.periode.jawabanMasuk ?? 0}</p>
                    <p className="mt-1 text-xs text-slate-400">
                        {data?.periode.rataRataNilai !== null && data?.periode.rataRataNilai !== undefined
                            ? `Rata-rata nilai: ${data.periode.rataRataNilai}`
                            : "Belum ada nilai pada periode ini"}
                    </p>
                </div>

                {/* tingkat pengerjaan */}
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Ring persen={data?.pengerjaanLive.persen ?? 0} />
                        <div>
                            <p className="text-sm text-slate-400">Pengerjaan Ujian Live</p>
                            <p className="text-sm font-semibold text-slate-800">
                                {data && data.pengerjaanLive.peserta > 0
                                    ? `${data.pengerjaanLive.sudah} dari ${data.pengerjaanLive.peserta} siswa`
                                    : "Tidak ada ujian live"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ujian berlangsung */}
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <ClipboardCheck size={18} />
                    </span>
                    <p className="mt-3 text-sm text-slate-400">Ujian Berlangsung</p>
                    <p className="text-3xl font-bold text-slate-900">{data?.ujian.live ?? 0}</p>
                    <p className="mt-1 text-xs text-slate-400">
                        Terjadwal: {data?.ujian.terjadwal ?? 0} • Diarsipkan: {data?.ujian.diarsipkan ?? 0}
                    </p>
                    <Link
                        href="/petugas/academic"
                        className="mt-2 inline-block text-xs font-medium text-[#2F5FEA] hover:underline"
                    >
                        Lihat detail →
                    </Link>
                </div>

                {/* link zoom */}
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Video size={18} />
                    </span>
                    <p className="mt-3 text-sm text-slate-400">Link Zoom Terkirim</p>
                    <p className="text-3xl font-bold text-slate-900">
                        {data?.zoom.terkirim ?? 0}
                        <span className="text-lg font-semibold text-slate-400"> / {data?.zoom.total ?? 0}</span>
                    </p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${zoomPersen}%` }} />
                    </div>
                    <Link
                        href="/petugas/academic"
                        className="mt-2 inline-block text-xs font-medium text-[#2F5FEA] hover:underline"
                    >
                        Lihat detail →
                    </Link>
                </div>
            </div>
        </div>
    );
}