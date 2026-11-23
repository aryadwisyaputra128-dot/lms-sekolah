"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Calendar,
    FileDown,
    ClipboardPlus,
    Video,
    MessageCircle,
    X,
} from "lucide-react";

interface Assignment {
    _id: string;
    namaMapel: string;
    kelas: string;
    zoomLink?: string;
}

interface ScheduleItem {
    _id: string;
    judul: string;
    kelas?: string;
    jamMulai: string;
    jamSelesai: string;
}

interface AssessmentItem {
    _id: string;
    namaUjian: string;
    tipe: string;
    kelas: string;
    status: string;
    createdAt: string;
}

function timeAgo(dateStr: string) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
}

export default function GuruOverviewPage() {
    const router = useRouter();
    const [stats, setStats] = useState({ totalSiswa: 0, kelasAktif: 0 });
    const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
    const [recentAssessments, setRecentAssessments] = useState<AssessmentItem[]>([]);
    const [statusSummary, setStatusSummary] = useState({ live: 0, scheduled: 0, archived: 0 });
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTugasModal, setShowTugasModal] = useState(false);
    const [showVirtualModal, setShowVirtualModal] = useState(false);

    const fetchOverview = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/guru/overview");
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setTodaySchedule(data.todaySchedule);
                setRecentAssessments(data.recentAssessments);
                setStatusSummary(data.statusSummary);
                setAssignments(data.assignments);
            }
        } catch (err) {
            console.error("Fetch overview error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    function handleGenerateLaporan() {
        const rows: string[] = [];
        rows.push("Laporan Kelas Saya");
        rows.push(`Dicetak,${new Date().toLocaleString("id-ID")}`);
        rows.push("");
        rows.push(`Total Siswa,${stats.totalSiswa}`);
        rows.push(`Kelas Aktif,${stats.kelasAktif}`);
        rows.push("");
        rows.push("Mapel,Kelas");
        assignments.forEach((a) => rows.push(`${a.namaMapel},${a.kelas}`));

        const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `laporan-kelas-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    const today = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    return (
        <div className="p-4 md:p-8">
            {/* welcome banner */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0B1440] p-6 text-white md:p-8">
                <p className="text-xs text-blue-200">{today}</p>
                <h1 className="mt-1 text-2xl font-bold">Selamat Datang{loading ? "" : ", Guru"}</h1>
                <p className="mt-1 text-sm text-blue-100/80">Semangat guru adalah inspirasi siswa</p>
                <div className="mt-5 flex flex-wrap gap-3">
                    <button
                        onClick={() => router.push("/guru/academic")}
                        className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
                    >
                        <Calendar size={16} /> Lihat Jadwal
                    </button>
                    <button
                        onClick={handleGenerateLaporan}
                        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0B1440] hover:opacity-90"
                    >
                        <FileDown size={16} /> Generate Laporan
                    </button>
                </div>
            </div>

            {/* quick actions */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button
                    onClick={() => setShowTugasModal(true)}
                    className="rounded-2xl bg-white p-5 text-left shadow-sm hover:shadow-md transition-shadow"
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2F5FEA]">
                        <ClipboardPlus size={18} />
                    </span>
                    <p className="mt-3 font-semibold text-slate-800">Tugas Baru</p>
                    <p className="text-xs text-slate-400">Buat ujian harian interaktif untuk siswa</p>
                    <p className="mt-2 text-xs font-medium text-[#2F5FEA]">Create Now →</p>
                </button>

                <button
                    onClick={() => setShowVirtualModal(true)}
                    className="rounded-2xl bg-white p-5 text-left shadow-sm hover:shadow-md transition-shadow"
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Video size={18} />
                    </span>
                    <p className="mt-3 font-semibold text-slate-800">Kelas Virtual</p>
                    <p className="text-xs text-slate-400">Atur link Zoom kelas virtual</p>
                    <p className="mt-2 text-xs font-medium text-indigo-600">Start Stream →</p>
                </button>

                <div className="rounded-2xl bg-white p-5 opacity-60 shadow-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <MessageCircle size={18} />
                    </span>
                    <p className="mt-3 font-semibold text-slate-800">Informasi</p>
                    <p className="text-xs text-slate-400">Sampaikan informasi kepada siswa</p>
                    <p className="mt-2 text-xs font-medium text-amber-600">Segera hadir</p>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* jadwal hari ini */}
                <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-700">Jadwal Hari Ini</p>
                    <p className="text-xs text-slate-400">{today}</p>
                    <div className="mt-4 space-y-3">
                        {!loading && todaySchedule.length === 0 && (
                            <p className="py-6 text-center text-sm text-slate-400">
                                Tidak ada jadwal hari ini.
                            </p>
                        )}
                        {todaySchedule.map((s) => (
                            <div key={s._id} className="flex items-center gap-3 border-l-4 border-[#2F5FEA] bg-blue-50/50 px-3 py-2">
                                <div className="text-xs font-semibold text-slate-600">{s.jamMulai}</div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{s.judul}</p>
                                    {s.kelas && <p className="text-xs text-slate-400">{s.kelas}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ringkasan ujian */}
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-700">Ringkasan Ujian</p>
                    <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-slate-600">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live
                            </span>
                            <span className="font-semibold text-slate-800">{statusSummary.live}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-slate-600">
                                <span className="h-2 w-2 rounded-full bg-amber-500" /> Scheduled
                            </span>
                            <span className="font-semibold text-slate-800">{statusSummary.scheduled}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-slate-600">
                                <span className="h-2 w-2 rounded-full bg-slate-400" /> Archived
                            </span>
                            <span className="font-semibold text-slate-800">{statusSummary.archived}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* recent activity */}
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-700">Recent Activity</p>
                <div className="mt-4 space-y-3">
                    {!loading && recentAssessments.length === 0 && (
                        <p className="py-4 text-center text-sm text-slate-400">Belum ada aktivitas.</p>
                    )}
                    {recentAssessments.map((a) => (
                        <div key={a._id} className="flex items-center justify-between text-sm">
                            <div>
                                <p className="font-medium text-slate-800">
                                    Ujian &quot;{a.namaUjian}&quot; dibuat
                                </p>
                                <p className="text-xs text-slate-400">
                                    {a.tipe} • {a.kelas}
                                </p>
                            </div>
                            <span className="text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {showTugasModal && (
                <TugasModal
                    assignments={assignments}
                    onClose={() => setShowTugasModal(false)}
                    onSaved={() => {
                        setShowTugasModal(false);
                        fetchOverview();
                    }}
                />
            )}

            {showVirtualModal && (
                <VirtualModal
                    assignments={assignments}
                    onClose={() => setShowVirtualModal(false)}
                    onSaved={() => {
                        setShowVirtualModal(false);
                        fetchOverview();
                    }}
                />
            )}
        </div>
    );
}

function TugasModal({
    assignments,
    onClose,
    onSaved,
}: {
    assignments: Assignment[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [namaUjian, setNamaUjian] = useState("");
    const [tipe, setTipe] = useState("QUIZ");
    const [assignmentId, setAssignmentId] = useState(assignments[0]?._id || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const selected = assignments.find((a) => a._id === assignmentId);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selected) {
            setError("Pilih kelas terlebih dahulu");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/guru/assessments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    namaUjian,
                    tipe,
                    kelas: selected.kelas,
                    mapel: selected.namaMapel,
                    status: "SCHEDULED",
                }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || "Gagal menyimpan");
                return;
            }
            onSaved();
        } catch {
            setError("Tidak dapat terhubung ke server");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Tugas Baru</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                {assignments.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        Kamu belum punya kelas/mapel. Tambahkan dulu di halaman Academic.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Nama Ujian</label>
                            <input
                                value={namaUjian}
                                onChange={(e) => setNamaUjian(e.target.value)}
                                required
                                placeholder="cth: Kuis Harian Basis Data"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Tipe</label>
                            <select
                                value={tipe}
                                onChange={(e) => setTipe(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                            >
                                <option value="QUIZ">Quiz</option>
                                <option value="EXAM">Exam</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Kelas &amp; Mapel
                            </label>
                            <select
                                value={assignmentId}
                                onChange={(e) => setAssignmentId(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                            >
                                {assignments.map((a) => (
                                    <option key={a._id} value={a._id}>
                                        {a.namaMapel} • {a.kelas}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {error && (
                            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full rounded-lg bg-[#0B1440] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                        >
                            {loading ? "Menyimpan..." : "Buat Ujian"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

function VirtualModal({
    assignments,
    onClose,
    onSaved,
}: {
    assignments: Assignment[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [links, setLinks] = useState<Record<string, string>>(
        Object.fromEntries(assignments.map((a) => [a._id, a.zoomLink || ""]))
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSaveAll() {
        setLoading(true);
        setError("");
        try {
            const results = await Promise.all(
                assignments.map(async (a) => {
                    let link = (links[a._id] || "").trim();
                    // kalau lupa tulis https://, tambahkan otomatis
                    if (link && !/^https?:\/\//i.test(link)) link = "https://" + link;
                    if (link) {
                        try {
                            const u = new URL(link);
                            if (!u.hostname.includes(".")) throw new Error("bukan domain");
                        } catch {
                            return {
                                ok: false,
                                message: "Link tidak valid. Contoh: https://zoom.us/j/1234567890",
                                nama: a.namaMapel,
                            };
                        }
                    }

                    const res = await fetch(`/api/guru/academic/${a._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ zoomLink: link }),
                    });
                    const data = await res.json().catch(() => null);
                    return { ok: res.ok && data?.success, message: data?.message, nama: a.namaMapel };
                })
            );

            const gagal = results.find((r) => !r.ok);
            if (gagal) {
                setError(
                    `Gagal menyimpan link ${gagal.nama}` +
                    (gagal.message ? `: ${gagal.message}` : " (periksa file API academic/[id] sudah terpasang)")
                );
                return;
            }
            onSaved();
        } catch {
            setError("Tidak dapat terhubung ke server");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Kelas Virtual</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>
                <p className="mb-3 text-xs text-slate-400">
                    Tempel link Zoom/Meet untuk tiap kelas. Link ini akan tampil ke siswa di kelas terkait.
                </p>

                {assignments.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        Kamu belum punya kelas/mapel. Tambahkan dulu di halaman Academic.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {assignments.map((a) => (
                            <div key={a._id}>
                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                    {a.namaMapel} • {a.kelas}
                                </label>
                                <input
                                    value={links[a._id] || ""}
                                    onChange={(e) => setLinks({ ...links, [a._id]: e.target.value })}
                                    placeholder="https://zoom.us/j/..."
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                                />
                            </div>
                        ))}
                        {error && (
                            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
                        )}
                        <button
                            onClick={handleSaveAll}
                            disabled={loading}
                            className="mt-2 w-full rounded-lg bg-[#0B1440] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                        >
                            {loading ? "Menyimpan..." : "Simpan Semua Link"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}