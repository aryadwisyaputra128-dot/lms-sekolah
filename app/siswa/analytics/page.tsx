"use client";

import { useEffect, useState, useCallback } from "react";
import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { Download, TrendingUp, CheckCircle2, Target } from "lucide-react";

interface PerMapel {
    mapel: string;
    rataRata: number;
    jumlah: number;
}

interface PerBulan {
    label: string;
    rataRata: number | null;
}

interface Riwayat {
    _id: string;
    judulTugas: string;
    mapel: string;
    tipe: "EXAM" | "QUIZ";
    nilai: number;
    submittedAt: string;
}

interface AnalyticsData {
    rataRata: number | null;
    totalDinilai: number;
    menunggu: number;
    perMapel: PerMapel[];
    perBulan: PerBulan[];
    riwayat: Riwayat[];
}

// warna batang: makin baru makin gelap
const WARNA_BATANG = ["#DCE5FF", "#C3D3FF", "#A3BAFA", "#7C9AF0", "#4F78E6", "#2F5FEA"];

function csvAman(v: string | number) {
    return `"${String(v).replace(/"/g, '""')}"`;
}

export default function SiswaAnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/siswa/analytics");
            const json = await res.json();
            if (json.success) setData(json);
        } catch (err) {
            console.error("Fetch analytics error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    function handleExportCsv() {
        if (!data) return;
        const rows = [
            "Judul,Mata Pelajaran,Tipe,Tanggal,Nilai",
            ...data.riwayat.map((r) =>
                [
                    csvAman(r.judulTugas),
                    csvAman(r.mapel),
                    csvAman(r.tipe === "QUIZ" ? "Kuis" : "Ujian"),
                    csvAman(new Date(r.submittedAt).toLocaleDateString("id-ID")),
                    r.nilai,
                ].join(",")
            ),
        ];
        const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `nilai-saya-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    const terkuat = data?.perMapel[0];
    const terlemah =
        data && data.perMapel.length >= 2 ? data.perMapel[data.perMapel.length - 1] : null;

    const chartData =
        data?.perBulan.map((b) => ({ name: b.label, value: b.rataRata })) || [];

    const adaNilai = !!data && data.totalDinilai > 0;

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Nilai Saya</h1>
                    <p className="mt-1 text-sm text-slate-400">Pantau nilai dan pencapaianmu.</p>
                </div>
                <button
                    onClick={handleExportCsv}
                    disabled={!adaNilai}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                    <Download size={15} /> Unduh Nilai (CSV)
                </button>
            </div>

            {loading && <p className="mt-6 text-sm text-slate-400">Memuat...</p>}

            {!loading && data && !adaNilai && (
                <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
                    <p className="text-sm text-slate-500">
                        Belum ada nilai. Nilai akan muncul setelah ujianmu selesai dinilai.
                    </p>
                    {data.menunggu > 0 && (
                        <p className="mt-2 text-xs text-amber-600">
                            {data.menunggu} tugas sedang menunggu dinilai guru.
                        </p>
                    )}
                </div>
            )}

            {adaNilai && data && (
                <>
                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* grafik rata-rata per bulan */}
                        <div className="rounded-2xl border-l-4 border-[#2F5FEA] bg-white p-5 shadow-sm lg:col-span-2">
                            <div className="flex items-center justify-between">
                                <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <TrendingUp size={16} className="text-[#2F5FEA]" /> Rata-rata Nilai
                                </p>
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2F5FEA]">
                                    Saat ini: {data.rataRata}
                                </span>
                            </div>

                            <div className="mt-4 h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: "#94a3b8" }}
                                        />
                                        <YAxis hide domain={[0, 100]} />
                                        <Tooltip
                                            formatter={(value) => [`${value}`, "Rata-rata"]}
                                            cursor={{ fill: "#EEF2FF" }}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {chartData.map((_, i) => (
                                                <Cell key={i} fill={WARNA_BATANG[i] || WARNA_BATANG[5]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="mt-2 text-[11px] text-slate-400">
                                Rata-rata nilai per bulan, berdasarkan tanggal pengumpulan. Bulan tanpa nilai
                                dikosongkan.
                            </p>
                        </div>

                        {/* ringkasan performa */}
                        <div className="rounded-2xl bg-[#0B1440] p-5 text-white shadow-sm">
                            <p className="text-sm font-semibold">Ringkasan Performa</p>

                            <div className="mt-4 space-y-3">
                                {terkuat && (
                                    <div className="rounded-xl bg-white/10 p-3">
                                        <p className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                                            <CheckCircle2 size={14} /> Terkuat
                                        </p>
                                        <p className="mt-1 text-sm font-medium">{terkuat.mapel}</p>
                                        <p className="text-xs text-blue-100/70">
                                            Rata-rata {terkuat.rataRata} dari {terkuat.jumlah} nilai
                                        </p>
                                    </div>
                                )}

                                {terlemah && terlemah.rataRata < (terkuat?.rataRata ?? 0) && (
                                    <div className="rounded-xl bg-white/10 p-3">
                                        <p className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                                            <Target size={14} /> Perlu Ditingkatkan
                                        </p>
                                        <p className="mt-1 text-sm font-medium">{terlemah.mapel}</p>
                                        <p className="text-xs text-blue-100/70">
                                            Rata-rata {terlemah.rataRata} dari {terlemah.jumlah} nilai
                                        </p>
                                    </div>
                                )}

                                <div className="rounded-xl bg-white/10 p-3 text-xs text-blue-100/80">
                                    <b className="text-white">{data.totalDinilai}</b> tugas sudah dinilai
                                    {data.menunggu > 0 && (
                                        <>
                                            {" • "}
                                            <b className="text-white">{data.menunggu}</b> menunggu dinilai
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* rata-rata per mapel */}
                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <p className="text-sm font-semibold text-slate-700">
                                Rata-rata Nilai per Mata Pelajaran
                            </p>
                            <div className="mt-4 space-y-4">
                                {data.perMapel.map((m) => (
                                    <div key={m.mapel}>
                                        <div className="mb-1 flex justify-between text-xs">
                                            <span className="font-medium text-slate-600">{m.mapel}</span>
                                            <span className="font-semibold text-slate-800">{m.rataRata}</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-100">
                                            <div
                                                className="h-2 rounded-full bg-[#2F5FEA]"
                                                style={{ width: `${Math.min(100, m.rataRata)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* riwayat nilai */}
                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <p className="text-sm font-semibold text-slate-700">Riwayat Nilai</p>
                            <div className="mt-3 divide-y divide-slate-50">
                                {data.riwayat.slice(0, 6).map((r) => (
                                    <div key={r._id} className="flex items-center justify-between gap-3 py-2.5">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-slate-800">
                                                {r.judulTugas}
                                            </p>
                                            <p className="truncate text-xs text-slate-400">
                                                {r.mapel} • {r.tipe === "QUIZ" ? "Kuis" : "Ujian"} •{" "}
                                                {new Date(r.submittedAt).toLocaleDateString("id-ID")}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-sm font-semibold text-emerald-600">
                                            {r.nilai}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {data.riwayat.length > 6 && (
                                <p className="mt-2 text-[11px] text-slate-400">
                                    Menampilkan 6 nilai terbaru. Unduh CSV untuk semua nilai.
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}