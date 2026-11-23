"use client";

import { useEffect, useState, useCallback } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { Download, TrendingUp, TrendingDown } from "lucide-react";

type RangeType = "daily" | "weekly" | "termly";

interface AnalyticsData {
    chart: { labels: string[]; values: number[] };
    avgAktifPercent: number;
    trend: number;
    roleDistribution: { guru: number; siswa: number; petugas: number };
    systemSummary: { totalKelas: number; totalMapel: number; totalUjian: number };
}

export default function AnalyticsPage() {
    const [range, setRange] = useState<RangeType>("daily");
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const fetchAnalytics = useCallback(async (r: RangeType) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/analytics?range=${r}`);
            const json = await res.json();
            if (json.success) setData(json);
        } catch (err) {
            console.error("Fetch analytics error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics(range);
    }, [range, fetchAnalytics]);

    async function handleExportCsv() {
        if (!data) return;
        setExporting(true);
        try {
            const rows: string[] = [];

            rows.push("Laporan System Analytics - LMS Sekolah");
            rows.push(`Dicetak,${new Date().toLocaleString("id-ID")}`);
            rows.push("");

            rows.push("Ringkasan");
            rows.push(`Average Aktif (%),${data.avgAktifPercent}`);
            rows.push(`Trend vs periode lalu (%),${data.trend}`);
            rows.push("");

            rows.push("Distribusi Role");
            rows.push("Role,Jumlah");
            rows.push(`Guru,${data.roleDistribution.guru}`);
            rows.push(`Siswa,${data.roleDistribution.siswa}`);
            rows.push(`Petugas,${data.roleDistribution.petugas}`);
            rows.push("");

            rows.push("Ringkasan Sistem");
            rows.push(`Total Kelas,${data.systemSummary.totalKelas}`);
            rows.push(`Total Mata Pelajaran,${data.systemSummary.totalMapel}`);
            rows.push(`Total Ujian,${data.systemSummary.totalUjian}`);
            rows.push("");

            rows.push("Data User Aktif");
            rows.push("Periode,Jumlah Login");
            data.chart.labels.forEach((label, i) => {
                rows.push(`${label},${data.chart.values[i]}`);
            });

            const csvContent = rows.join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `laporan-lms-${Date.now()}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export CSV error:", err);
            alert("Gagal membuat CSV.");
        } finally {
            setExporting(false);
        }
    }

    const chartData =
        data?.chart.labels.map((label, i) => ({
            name: label,
            value: data.chart.values[i],
        })) || [];

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900">System Reporting</h1>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* chart card */}
                <div className="lg:col-span-2 rounded-2xl border-l-4 border-[#2F5FEA] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">User Aktif</p>
                        <div className="flex gap-1 rounded-full bg-slate-100 p-1">
                            {(["daily", "weekly", "termly"] as RangeType[]).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${range === r
                                            ? "bg-[#2F5FEA] text-white"
                                            : "text-slate-500 hover:bg-slate-200"
                                        }`}
                                >
                                    {r === "daily" ? "Daily" : r === "weekly" ? "Weekly" : "Termly"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 h-64">
                        {loading ? (
                            <div className="flex h-full items-center justify-center text-sm text-slate-400">
                                Memuat grafik...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        formatter={(value) => [`${value} user login`, "Aktif"]}
                                        cursor={{ fill: "#EEF2FF" }}
                                    />
                                    <Bar dataKey="value" fill="#2F5FEA" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="mt-4 flex items-center gap-8 border-t border-slate-100 pt-4">
                        <div>
                            <p className="text-xs text-slate-400">Average Aktif</p>
                            <p className="text-lg font-bold text-slate-900">
                                {data ? `${data.avgAktifPercent}%` : "-"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Trend vs periode lalu</p>
                            <p
                                className={`flex items-center gap-1 text-lg font-bold ${(data?.trend || 0) >= 0 ? "text-emerald-600" : "text-red-500"
                                    }`}
                            >
                                {(data?.trend || 0) >= 0 ? (
                                    <TrendingUp size={16} />
                                ) : (
                                    <TrendingDown size={16} />
                                )}
                                {data ? `${data.trend >= 0 ? "+" : ""}${data.trend}%` : "-"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* cetak laporan */}
                <div className="flex flex-col justify-between rounded-2xl bg-[#0B1440] p-6 text-white shadow-sm">
                    <div>
                        <p className="text-sm font-semibold">Cetak Laporan</p>
                        <p className="mt-2 text-xs text-blue-100/80">
                            Unduh ringkasan analytics sistem dalam bentuk PDF, lengkap dengan
                            distribusi role dan data user aktif.
                        </p>
                    </div>
                    <button
                        onClick={handleExportCsv}
                        disabled={exporting || !data}
                        className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-semibold hover:bg-white/20 disabled:opacity-50"
                    >
                        <Download size={16} />
                        {exporting ? "Membuat CSV..." : "Export CSV"}
                    </button>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* distribusi role */}
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="mb-4 text-sm font-semibold text-slate-700">DISTRIBUSI ROLE</p>
                    {data &&
                        [
                            { label: "Guru", value: data.roleDistribution.guru, color: "bg-indigo-500" },
                            { label: "Siswa", value: data.roleDistribution.siswa, color: "bg-[#2F5FEA]" },
                            { label: "Petugas", value: data.roleDistribution.petugas, color: "bg-amber-500" },
                        ].map((r) => {
                            const total =
                                data.roleDistribution.guru +
                                data.roleDistribution.siswa +
                                data.roleDistribution.petugas;
                            const pct = total ? Math.round((r.value / total) * 100) : 0;
                            return (
                                <div key={r.label} className="mb-3">
                                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                                        <span>{r.label}</span>
                                        <span>
                                            {r.value} ({pct}%)
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-slate-100">
                                        <div
                                            className={`h-2 rounded-full ${r.color}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {/* ringkasan sistem */}
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="mb-4 text-sm font-semibold text-slate-700">RINGKASAN SISTEM</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-2xl font-bold text-slate-900">
                                {data?.systemSummary.totalKelas ?? "-"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">Total Kelas</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-2xl font-bold text-slate-900">
                                {data?.systemSummary.totalMapel ?? "-"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">Mata Pelajaran</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-2xl font-bold text-slate-900">
                                {data?.systemSummary.totalUjian ?? "-"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">Total Ujian</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}