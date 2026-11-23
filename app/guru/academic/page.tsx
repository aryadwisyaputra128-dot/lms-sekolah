"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, BookOpen, Plus, X, Trash2 } from "lucide-react";

interface Assignment {
    _id: string;
    namaMapel: string;
    kelas: string;
    warna: string;
    jumlahSiswa: number;
}

interface ScheduleItem {
    _id: string;
    judul: string;
    kelas?: string;
    hari: "SEN" | "SEL" | "RAB" | "KAM" | "JUM";
    jamMulai: string;
    jamSelesai: string;
}

const HARI_LIST: ScheduleItem["hari"][] = ["SEN", "SEL", "RAB", "KAM", "JUM"];
const HARI_LABEL: Record<string, string> = {
    SEN: "Mon",
    SEL: "Tue",
    RAB: "Wed",
    KAM: "Thu",
    JUM: "Fri",
};

const cardColors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
};

export default function AcademicPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [stats, setStats] = useState({ totalSiswa: 0, kelasAktif: 0 });
    const [loading, setLoading] = useState(true);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [academicRes, scheduleRes] = await Promise.all([
                fetch("/api/guru/academic"),
                fetch("/api/guru/schedule"),
            ]);
            const academicData = await academicRes.json();
            const scheduleData = await scheduleRes.json();

            if (academicData.success) {
                setAssignments(academicData.assignments);
                setStats(academicData.stats);
            }
            if (scheduleData.success) setSchedules(scheduleData.schedules);
        } catch (err) {
            console.error("Fetch academic error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    async function handleDeleteAssignment(id: string, nama: string) {
        if (!confirm(`Hapus mata pelajaran "${nama}"?`)) return;
        try {
            const res = await fetch(`/api/guru/academic/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) fetchAll();
        } catch {
            alert("Tidak dapat terhubung ke server");
        }
    }

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold text-slate-900">Academic Management</h1>

            {/* stat cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2F5FEA]">
                        <Users size={18} />
                    </span>
                    <p className="mt-3 text-xs font-medium text-slate-400">TOTAL SISWA</p>
                    <p className="text-2xl font-bold text-slate-900">
                        {loading ? "…" : stats.totalSiswa.toLocaleString("id-ID")}
                    </p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <BookOpen size={18} />
                    </span>
                    <p className="mt-3 text-xs font-medium text-slate-400">KELAS AKTIF</p>
                    <p className="text-2xl font-bold text-slate-900">
                        {loading ? "…" : stats.kelasAktif}
                    </p>
                </div>
            </div>

            {/* kelas saya */}
            <div className="mt-8 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">KELAS SAYA</p>
                <button
                    onClick={() => setShowAssignmentModal(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-[#2F5FEA] hover:underline"
                >
                    <Plus size={15} /> Tambah Kelas &amp; Mapel
                </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {!loading && assignments.length === 0 && (
                    <p className="col-span-full rounded-2xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
                        Belum ada kelas/mapel yang kamu ajar. Klik &quot;Tambah Kelas &amp; Mapel&quot; untuk mulai.
                    </p>
                )}
                {assignments.map((a) => (
                    <div key={a._id} className="rounded-2xl bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <span
                                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${cardColors[a.warna] || cardColors.indigo
                                    }`}
                            >
                                {a.namaMapel.charAt(0)}
                            </span>
                            <button
                                onClick={() => handleDeleteAssignment(a._id, a.namaMapel)}
                                className="text-slate-300 hover:text-red-500"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                        <p className="mt-3 font-semibold text-slate-800">{a.namaMapel}</p>
                        <p className="text-xs text-slate-400">
                            {a.kelas} • {a.jumlahSiswa} Students
                        </p>
                    </div>
                ))}
            </div>

            {/* JADWAL HARIAN */}
            <div className="mt-8 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">JADWAL SAYA</p>
                <button
                    onClick={() => setShowScheduleModal(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-[#2F5FEA] hover:underline"
                >
                    <Plus size={15} /> Tambah Jadwal
                </button>
            </div>

            <div className="mt-3 overflow-x-auto rounded-2xl bg-white p-5 shadow-sm">
                <div className="grid min-w-[600px] grid-cols-5 gap-3 text-center text-xs font-medium text-slate-400">
                    {HARI_LIST.map((h) => (
                        <div key={h}>{HARI_LABEL[h]}</div>
                    ))}
                </div>
                <div className="mt-3 grid min-w-[600px] grid-cols-5 gap-3">
                    {HARI_LIST.map((h) => (
                        <div key={h} className="space-y-2">
                            {schedules
                                .filter((s) => s.hari === h)
                                .map((s) => (
                                    <div
                                        key={s._id}
                                        className="rounded-lg border-l-4 border-[#2F5FEA] bg-blue-50 p-2 text-left"
                                    >
                                        <p className="text-[11px] font-semibold text-slate-700">{s.judul}</p>
                                        <p className="text-[10px] text-slate-400">
                                            {s.jamMulai}–{s.jamSelesai}
                                        </p>
                                        {s.kelas && <p className="text-[10px] text-slate-400">{s.kelas}</p>}
                                    </div>
                                ))}
                            {schedules.filter((s) => s.hari === h).length === 0 && (
                                <p className="py-4 text-center text-[11px] text-slate-300">-</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {showAssignmentModal && (
                <AssignmentModal
                    onClose={() => setShowAssignmentModal(false)}
                    onSaved={() => {
                        setShowAssignmentModal(false);
                        fetchAll();
                    }}
                />
            )}

            {showScheduleModal && (
                <ScheduleModal
                    onClose={() => setShowScheduleModal(false)}
                    onSaved={() => {
                        setShowScheduleModal(false);
                        fetchAll();
                    }}
                />
            )}
        </div>
    );
}

function AssignmentModal({
    onClose,
    onSaved,
}: {
    onClose: () => void;
    onSaved: () => void;
}) {
    const [namaMapel, setNamaMapel] = useState("");
    const [kelas, setKelas] = useState("");
    const [warna, setWarna] = useState("indigo");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/guru/academic", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ namaMapel, kelas, warna }),
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
                    <h3 className="text-lg font-bold text-slate-900">Tambah Kelas &amp; Mapel</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                            Nama Mata Pelajaran
                        </label>
                        <input
                            value={namaMapel}
                            onChange={(e) => setNamaMapel(e.target.value)}
                            required
                            placeholder="cth: Basis Data"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                            Nama Kelas (persis seperti di data siswa)
                        </label>
                        <input
                            value={kelas}
                            onChange={(e) => setKelas(e.target.value)}
                            required
                            placeholder="cth: 12 PPLG 1"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Warna Card</label>
                        <select
                            value={warna}
                            onChange={(e) => setWarna(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                        >
                            <option value="indigo">Indigo</option>
                            <option value="blue">Biru</option>
                            <option value="amber">Amber</option>
                            <option value="emerald">Emerald</option>
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
                        {loading ? "Menyimpan..." : "Simpan"}
                    </button>
                </form>
            </div>
        </div>
    );
}

function ScheduleModal({
    onClose,
    onSaved,
}: {
    onClose: () => void;
    onSaved: () => void;
}) {
    const [judul, setJudul] = useState("");
    const [kelas, setKelas] = useState("");
    const [hari, setHari] = useState<ScheduleItem["hari"]>("SEN");
    const [jamMulai, setJamMulai] = useState("09:00");
    const [jamSelesai, setJamSelesai] = useState("10:00");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/guru/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ judul, kelas, hari, jamMulai, jamSelesai }),
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
                    <h3 className="text-lg font-bold text-slate-900">Tambah Jadwal</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Judul</label>
                        <input
                            value={judul}
                            onChange={(e) => setJudul(e.target.value)}
                            required
                            placeholder="cth: Basis Data / Office Hours"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                            Kelas (opsional)
                        </label>
                        <input
                            value={kelas}
                            onChange={(e) => setKelas(e.target.value)}
                            placeholder="cth: 12 PPLG 1"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Hari</label>
                        <select
                            value={hari}
                            onChange={(e) => setHari(e.target.value as ScheduleItem["hari"])}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                        >
                            {HARI_LIST.map((h) => (
                                <option key={h} value={h}>
                                    {HARI_LABEL[h]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Jam Mulai</label>
                            <input
                                type="time"
                                value={jamMulai}
                                onChange={(e) => setJamMulai(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Jam Selesai</label>
                            <input
                                type="time"
                                value={jamSelesai}
                                onChange={(e) => setJamSelesai(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                            />
                        </div>
                    </div>
                    {error && (
                        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full rounded-lg bg-[#0B1440] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                        {loading ? "Menyimpan..." : "Simpan Jadwal"}
                    </button>
                </form>
            </div>
        </div>
    );
}