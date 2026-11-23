"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, X, Eye, Trash2 } from "lucide-react";

interface Assignment {
    _id: string;
    namaMapel: string;
    kelas: string;
}

interface AssessmentItem {
    _id: string;
    namaUjian: string;
    tipe: "EXAM" | "QUIZ";
    kelas: string;
    mapel?: string;
    status: "LIVE" | "SCHEDULED" | "ARCHIVED";
    totalPeserta: number;
    jumlahSubmission: number;
    jumlahSoal: number;
}

interface SubmissionItem {
    _id: string;
    namaSiswa: string;
    emailSiswa: string;
    judulTugas: string;
    submittedAt: string;
    status: "PENDING" | "GRADED";
    nilai?: number;
    assessmentId: { namaUjian: string; tipe: string };
}

type TabType = "ALL" | "QUIZ" | "EXAM";

export default function PusatAssessmentPage() {
    const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
    const [tab, setTab] = useState<TabType>("ALL");
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState<null | "QUIZ" | "EXAM">(null);
    const [detailId, setDetailId] = useState<string | null>(null);

    const fetchAssessments = useCallback(async () => {
        const res = await fetch("/api/guru/assessments");
        const data = await res.json();
        if (data.success) setAssessments(data.assessments);
    }, []);

    const fetchSubmissions = useCallback(async (t: TabType) => {
        const res = await fetch(`/api/guru/submissions?tipe=${t}`);
        const data = await res.json();
        if (data.success) setSubmissions(data.submissions);
    }, []);

    const fetchAssignments = useCallback(async () => {
        const res = await fetch("/api/guru/academic");
        const data = await res.json();
        if (data.success) setAssignments(data.assignments);
    }, []);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        await Promise.all([fetchAssessments(), fetchSubmissions(tab), fetchAssignments()]);
        setLoading(false);
    }, [fetchAssessments, fetchSubmissions, fetchAssignments, tab]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        fetchSubmissions(tab);
    }, [tab, fetchSubmissions]);

    async function handleDeleteAssessment(assessmentId: string, nama: string) {
        if (!confirm(`Hapus ujian "${nama}"? Semua soal dan data terkait ikut terhapus.`)) return;
        try {
            const res = await fetch(`/api/guru/assessments/${assessmentId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) fetchAll();
            else alert(data.message || "Gagal menghapus ujian");
        } catch {
            alert("Tidak dapat terhubung ke server");
        }
    }

    const liveAssessments = assessments.filter((a) => a.status === "LIVE");

    return (
        <div className="relative min-h-screen p-4 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pusat Assessment</h1>
                    <p className="mt-1 max-w-lg text-sm text-slate-400">
                        Kelola ujian, evaluasi hasil kerja siswa, dan pantau performa secara langsung dan
                        real-time.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateModal("QUIZ")}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        <Plus size={16} /> Buat Quiz
                    </button>
                    <button
                        onClick={() => setShowCreateModal("EXAM")}
                        className="flex items-center gap-2 rounded-lg bg-[#0B1440] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                        <Plus size={16} /> Buat Ujian
                    </button>
                </div>
            </div>

            {/* ujian berlangsung */}
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <span className="h-2 w-2 rounded-full bg-red-500" /> Ujian Berlangsung
                    </p>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">
                        {liveAssessments.length} ACTIVE EXAMS
                    </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {!loading && liveAssessments.length === 0 && (
                        <p className="col-span-full py-6 text-center text-sm text-slate-400">
                            Tidak ada ujian yang sedang live.
                        </p>
                    )}
                    {liveAssessments.map((a) => {
                        const pct = a.totalPeserta ? Math.round((a.jumlahSubmission / a.totalPeserta) * 100) : 0;
                        return (
                            <div key={a._id} className="rounded-xl border border-slate-100 p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800">{a.namaUjian}</p>
                                        <p className="text-xs text-slate-400">
                                            {a.kelas} • {a.totalPeserta} Students
                                        </p>
                                    </div>
                                    <Eye size={16} className="text-slate-300" />
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs">
                                    <span className="text-emerald-600 font-medium">In Progress</span>
                                    <span className="font-semibold text-slate-700">
                                        {a.jumlahSubmission} / {a.totalPeserta}
                                    </span>
                                </div>
                                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
                                    <div
                                        className="h-1.5 rounded-full bg-[#2F5FEA]"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* menunggu dinilai */}
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-700">Menunggu Dinilai</p>
                        <p className="text-xs text-slate-400">Lihat dan nilai tugas siswa</p>
                    </div>
                    <div className="flex gap-1 rounded-full bg-slate-100 p-1">
                        {(["ALL", "QUIZ", "EXAM"] as TabType[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${tab === t ? "bg-[#2F5FEA] text-white" : "text-slate-500 hover:bg-slate-200"
                                    }`}
                            >
                                {t === "ALL" ? "All Submissions" : t === "QUIZ" ? "Quizzes" : "Assignments"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-xs text-slate-400">
                                <th className="py-2 font-medium">Student Name</th>
                                <th className="py-2 font-medium">Assignment Title</th>
                                <th className="py-2 font-medium">Submission Date</th>
                                <th className="py-2 font-medium">Status</th>
                                <th className="py-2 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && submissions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400">
                                        Belum ada tugas yang perlu dinilai.
                                    </td>
                                </tr>
                            )}
                            {submissions.map((s) => (
                                <tr key={s._id} className="border-t border-slate-50">
                                    <td className="py-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                                {s.namaSiswa.charAt(0).toUpperCase()}
                                            </span>
                                            <div>
                                                <p className="font-medium text-slate-800">{s.namaSiswa}</p>
                                                <p className="text-xs text-slate-400">{s.emailSiswa}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 text-slate-600">{s.judulTugas}</td>
                                    <td className="py-3 text-slate-500">
                                        {new Date(s.submittedAt).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="py-3">
                                        {s.status === "PENDING" ? (
                                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                                Menunggu Dinilai
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                Nilai: {s.nilai}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3">
                                        <button
                                            onClick={() => setDetailId(s._id)}
                                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-[#2F5FEA] hover:bg-slate-50"
                                        >
                                            {s.status === "PENDING" ? "Periksa & Nilai" : "Lihat / Ubah"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* semua ujian (bukan cuma live) - tambahan biar bisa masuk ke input soal */}
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-700">Semua Ujian &amp; Quiz Saya</p>
                <div className="mt-3 divide-y divide-slate-50">
                    {!loading && assessments.length === 0 && (
                        <p className="py-6 text-center text-sm text-slate-400">
                            Belum ada ujian. Klik &quot;Buat Ujian&quot; atau &quot;Buat Quiz&quot; di atas.
                        </p>
                    )}
                    {assessments.map((a) => (
                        <div key={a._id} className="flex items-center justify-between py-3">
                            <div>
                                <p className="text-sm font-medium text-slate-800">{a.namaUjian}</p>
                                <p className="text-xs text-slate-400">
                                    {a.tipe} • {a.kelas} • {a.status}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/guru/assessments/${a._id}/soal`}
                                    className="text-xs font-medium text-[#2F5FEA] hover:underline"
                                >
                                    Kelola Soal ({a.jumlahSoal ?? 0}) →
                                </Link>
                                <button
                                    onClick={() => handleDeleteAssessment(a._id, a.namaUjian)}
                                    className="text-slate-300 hover:text-red-500"
                                    aria-label="Hapus ujian"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* floating add button */}
            <button
                onClick={() => setShowCreateModal("EXAM")}
                className="fixed bottom-8 right-8 flex h-12 w-12 items-center justify-center rounded-full bg-[#2F5FEA] text-white shadow-lg hover:opacity-90"
            >
                <Plus size={22} />
            </button>

            {detailId && (
                <SubmissionDetailModal
                    submissionId={detailId}
                    onClose={() => setDetailId(null)}
                    onSaved={() => {
                        setDetailId(null);
                        fetchSubmissions(tab);
                    }}
                />
            )}

            {showCreateModal && (
                <CreateModal
                    defaultTipe={showCreateModal}
                    assignments={assignments}
                    onClose={() => setShowCreateModal(null)}
                    onSaved={() => {
                        setShowCreateModal(null);
                        fetchAll();
                    }}
                />
            )}
        </div>
    );
}

function CreateModal({
    defaultTipe,
    assignments,
    onClose,
    onSaved,
}: {
    defaultTipe: "QUIZ" | "EXAM";
    assignments: Assignment[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [namaUjian, setNamaUjian] = useState("");
    const [tipe, setTipe] = useState(defaultTipe);
    const [assignmentId, setAssignmentId] = useState(assignments[0]?._id || "");
    const [tenggat, setTenggat] = useState("");
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
                    tenggat: tenggat ? new Date(tenggat).toISOString() : undefined,
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
                    <h3 className="text-lg font-bold text-slate-900">
                        Buat {tipe === "QUIZ" ? "Quiz" : "Ujian"} Baru
                    </h3>
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
                                placeholder="cth: Ulangan Harian Basis Data"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Tipe</label>
                            <select
                                value={tipe}
                                onChange={(e) => setTipe(e.target.value as "QUIZ" | "EXAM")}
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
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Tenggat (opsional)
                            </label>
                            <input
                                type="datetime-local"
                                value={tenggat}
                                onChange={(e) => setTenggat(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                            />
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

interface SoalDetail {
    _id: string;
    tipeSoal: "PILIHAN_GANDA" | "ESSAY";
    pertanyaan: string;
    pilihan: { teks: string; benar: boolean }[];
}

interface JawabanDetail {
    soalId: string;
    pilihanIndex?: number;
    teksEssay?: string;
}

interface DetailData {
    submission: {
        _id: string;
        namaSiswa: string;
        emailSiswa: string;
        judulTugas: string;
        submittedAt: string;
        status: "PENDING" | "GRADED";
        nilai?: number;
        butuhNilaiManual?: boolean;
        jawaban: JawabanDetail[];
    };
    assessment: { namaUjian: string; mapel?: string; kelas: string };
    soalList: SoalDetail[];
}

function SubmissionDetailModal({
    submissionId,
    onClose,
    onSaved,
}: {
    submissionId: string;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [data, setData] = useState<DetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [nilai, setNilai] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/guru/submissions/${submissionId}`);
                const json = await res.json();
                if (!json.success) {
                    setError(json.message || "Gagal memuat jawaban");
                    return;
                }
                setData(json);
                if (json.submission.nilai !== undefined && json.submission.nilai !== null) {
                    setNilai(String(json.submission.nilai));
                }
            } catch {
                setError("Tidak dapat terhubung ke server");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [submissionId]);

    function jawabanUntuk(soalId: string) {
        return data?.submission.jawaban.find((j) => j.soalId === soalId);
    }

    // hitung skor pilihan ganda dari kunci jawaban di soal
    const soalPG = data?.soalList.filter((s) => s.tipeSoal === "PILIHAN_GANDA") || [];
    const benarPG = soalPG.filter((s) => {
        const j = jawabanUntuk(s._id);
        return j?.pilihanIndex !== undefined && s.pilihan[j.pilihanIndex]?.benar === true;
    }).length;

    async function handleSave() {
        setSaving(true);
        setError("");
        try {
            const res = await fetch("/api/guru/submissions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: submissionId, nilai }),
            });
            const json = await res.json();
            if (!json.success) {
                setError(json.message || "Gagal menyimpan nilai");
                return;
            }
            onSaved();
        } catch {
            setError("Tidak dapat terhubung ke server");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
                <div className="flex items-start justify-between border-b border-slate-100 p-5">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Jawaban Siswa</h3>
                        {data && (
                            <p className="text-xs text-slate-400">
                                {data.submission.namaSiswa} • {data.assessment.namaUjian}
                                {data.assessment.mapel ? ` • ${data.assessment.mapel}` : ""}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    {loading && <p className="py-6 text-center text-sm text-slate-400">Memuat jawaban...</p>}
                    {!loading && error && !data && (
                        <p className="py-6 text-center text-sm text-red-500">{error}</p>
                    )}

                    {data && (
                        <>
                            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                Pilihan ganda benar: <b className="text-slate-700">{benarPG}</b> dari{" "}
                                <b className="text-slate-700">{soalPG.length}</b> soal
                                {data.submission.butuhNilaiManual &&
                                    " • Ada soal essay, nilai akhir perlu kamu isi manual."}
                            </div>

                            {data.soalList.map((s, i) => {
                                const j = jawabanUntuk(s._id);
                                return (
                                    <div key={s._id} className="rounded-xl border border-slate-100 p-4">
                                        <p className="text-xs font-medium text-slate-400">
                                            Soal {i + 1} • {s.tipeSoal === "PILIHAN_GANDA" ? "Pilihan Ganda" : "Essay"}
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-800">
                                            {s.pertanyaan}
                                        </p>

                                        {s.tipeSoal === "PILIHAN_GANDA" ? (
                                            <ul className="mt-2 space-y-1">
                                                {s.pilihan.map((p, idx) => {
                                                    const dipilih = j?.pilihanIndex === idx;
                                                    return (
                                                        <li
                                                            key={idx}
                                                            className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-xs ${p.benar
                                                                    ? "bg-emerald-50 text-emerald-700"
                                                                    : dipilih
                                                                        ? "bg-red-50 text-red-600"
                                                                        : "text-slate-600"
                                                                }`}
                                                        >
                                                            <span className="font-semibold">{String.fromCharCode(65 + idx)}.</span>
                                                            <span className="flex-1">{p.teks}</span>
                                                            <span className="shrink-0 font-medium">
                                                                {p.benar && "✓ Kunci"}
                                                                {dipilih && (p.benar ? " • Dipilih siswa" : "✗ Dipilih siswa")}
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                                {j?.pilihanIndex === undefined && (
                                                    <li className="px-2 text-xs italic text-slate-400">Tidak dijawab</li>
                                                )}
                                            </ul>
                                        ) : (
                                            <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                                                {j?.teksEssay ? (
                                                    <p className="whitespace-pre-wrap">{j.teksEssay}</p>
                                                ) : (
                                                    <p className="text-xs italic text-slate-400">Tidak dijawab</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {data.soalList.length === 0 && (
                                <p className="py-4 text-center text-sm text-slate-400">
                                    Soal untuk ujian ini sudah tidak ada.
                                </p>
                            )}
                        </>
                    )}
                </div>

                {data && (
                    <div className="border-t border-slate-100 p-5">
                        {error && (
                            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
                        )}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-slate-600">Nilai (0-100)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={nilai}
                                    onChange={(e) => setNilai(e.target.value)}
                                    className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                                />
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving || nilai === ""}
                                className="rounded-lg bg-[#2F5FEA] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                            >
                                {saving ? "Menyimpan..." : "Simpan Nilai"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}