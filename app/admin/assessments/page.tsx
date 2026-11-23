"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ClipboardList,
    CheckCircle2,
    AlertTriangle,
    SlidersHorizontal,
    ListFilter,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface AssessmentRow {
    _id: string;
    namaUjian: string;
    tipe: "EXAM" | "QUIZ";
    kelas: string;
    mapel?: string;
    status: "LIVE" | "SCHEDULED" | "ARCHIVED";
    totalPeserta: number;
}

interface Counts {
    totalAktif: number;
    totalScheduled: number;
    totalArchived: number;
    total: number;
}

const statusDot: Record<string, string> = {
    LIVE: "bg-emerald-500",
    SCHEDULED: "bg-amber-500",
    ARCHIVED: "bg-slate-400",
};

const statusText: Record<string, string> = {
    LIVE: "text-emerald-600",
    SCHEDULED: "text-amber-600",
    ARCHIVED: "text-slate-500",
};

const statusLabel: Record<string, string> = {
    LIVE: "Live",
    SCHEDULED: "Scheduled",
    ARCHIVED: "Archived",
};

const PAGE_SIZE = 4;

export default function AssessmentsPage() {
    const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
    const [counts, setCounts] = useState<Counts>({
        totalAktif: 0,
        totalScheduled: 0,
        totalArchived: 0,
        total: 0,
    });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);

    const fetchAssessments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/assessments");
            const data = await res.json();
            if (data.success) {
                setAssessments(data.assessments);
                setCounts(data.counts);
            }
        } catch (err) {
            console.error("Fetch assessments error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAssessments();
    }, [fetchAssessments]);

    async function handleToggleLive(a: AssessmentRow) {
        const nextStatus = a.status === "LIVE" ? "ARCHIVED" : "LIVE";
        try {
            const res = await fetch(`/api/admin/assessments/${a._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = await res.json();
            if (data.success) fetchAssessments();
        } catch {
            alert("Tidak dapat terhubung ke server");
        }
    }

    const totalPages = Math.max(1, Math.ceil(assessments.length / PAGE_SIZE));
    const pageItems = assessments.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    return (
        <div className="p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Assessments Management</h1>
                <p className="text-xs text-slate-400">
                    Ujian dibuat oleh guru. Admin hanya memantau, mengaktifkan/menonaktifkan, dan mengarsipkan.
                </p>
            </div>

            {/* stat cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border-l-4 border-[#2F5FEA] bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <p className="text-sm text-slate-400">Total Aktif</p>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#2F5FEA]">
                            <ClipboardList size={15} />
                        </span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{counts.totalAktif}</p>
                    <p className="mt-1 text-xs text-slate-400">dari {counts.total} total ujian</p>
                </div>

                <div className="rounded-2xl border-l-4 border-[#2F5FEA] bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <p className="text-sm text-slate-400">Terjadwal</p>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#2F5FEA]">
                            <CheckCircle2 size={15} />
                        </span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{counts.totalScheduled}</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                        <div
                            className="h-1.5 rounded-full bg-[#2F5FEA]"
                            style={{
                                width: `${counts.total ? (counts.totalScheduled / counts.total) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </div>

                <div className="rounded-2xl border-l-4 border-red-400 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <p className="text-sm text-slate-400">Diarsipkan</p>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500">
                            <AlertTriangle size={15} />
                        </span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-red-500">{counts.totalArchived}</p>
                    <p className="mt-1 text-xs text-red-400">Tidak lagi menerima peserta</p>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
                <p className="text-sm font-bold tracking-wide text-slate-500">UJIAN BERLANGSUNG</p>
                <div className="flex gap-2">
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50">
                        <SlidersHorizontal size={14} />
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50">
                        <ListFilter size={14} />
                    </button>
                </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-xs text-slate-400">
                            <th className="px-5 py-3 font-medium">Assessment Name</th>
                            <th className="px-5 py-3 font-medium">Type</th>
                            <th className="px-5 py-3 font-medium">Participants</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                                    Memuat data...
                                </td>
                            </tr>
                        )}
                        {!loading && pageItems.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                                    Belum ada ujian. Klik &quot;Create New&quot; untuk menambahkan.
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            pageItems.map((a) => (
                                <tr key={a._id} className="border-t border-slate-50">
                                    <td className="px-5 py-3.5">
                                        <p className="font-semibold text-slate-800">{a.namaUjian}</p>
                                        <p className="text-xs text-slate-400">
                                            {a.kelas}
                                            {a.mapel ? ` • ${a.mapel}` : ""}
                                        </p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                            {a.tipe}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="font-semibold text-slate-700">{a.totalPeserta}</span>
                                        <span className="ml-1 text-xs text-slate-400">siswa terdaftar</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${statusText[a.status]}`}>
                                            <span className={`h-2 w-2 rounded-full ${statusDot[a.status]}`} />
                                            {statusLabel[a.status]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleToggleLive(a)}
                                                className={`relative h-6 w-11 rounded-full transition-colors ${a.status === "LIVE" ? "bg-[#2F5FEA]" : "bg-slate-200"
                                                    }`}
                                                aria-label="Toggle live"
                                            >
                                                <span
                                                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${a.status === "LIVE" ? "translate-x-5" : "translate-x-0.5"
                                                        }`}
                                                />
                                            </button>
                                            <span className="text-xs text-slate-400">
                                                {a.status === "LIVE" ? "Nonaktifkan" : "Aktifkan"}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>

                <div className="flex items-center justify-between border-t border-slate-50 px-5 py-3 text-xs text-slate-400">
                    <span>
                        Showing {pageItems.length} of {assessments.length} active assessments
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 disabled:opacity-30"
                        >
                            <ChevronLeft size={12} />
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 disabled:opacity-30"
                        >
                            <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}