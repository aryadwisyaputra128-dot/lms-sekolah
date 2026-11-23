"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

interface Pilihan {
    teks: string;
}

interface SoalItem {
    _id: string;
    tipeSoal: "PILIHAN_GANDA" | "ESSAY";
    pertanyaan: string;
    pilihan: Pilihan[];
}

interface AssessmentInfo {
    namaUjian: string;
    mapel?: string;
}

export default function KerjakanUjianPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();

    const [assessment, setAssessment] = useState<AssessmentInfo | null>(null);
    const [soalList, setSoalList] = useState<SoalItem[]>([]);
    const [jawaban, setJawaban] = useState<Record<string, { pilihanIndex?: number; teksEssay?: string }>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [hasil, setHasil] = useState<string | null>(null);

    const fetchSoal = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/siswa/assessments/${id}/soal`);
            const data = await res.json();
            if (!data.success) {
                setError(data.message || "Gagal memuat soal");
                return;
            }
            setAssessment(data.assessment);
            setSoalList(data.soalList);
        } catch {
            setError("Tidak dapat terhubung ke server");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchSoal();
    }, [fetchSoal]);

    function pilihJawaban(soalId: string, pilihanIndex: number) {
        setJawaban((prev) => ({ ...prev, [soalId]: { pilihanIndex } }));
    }

    function tulisEssay(soalId: string, teksEssay: string) {
        setJawaban((prev) => ({ ...prev, [soalId]: { teksEssay } }));
    }

    async function handleSubmit() {
        const belumDijawab = soalList.filter((s) => !jawaban[s._id]);
        if (belumDijawab.length > 0) {
            if (!confirm(`Masih ada ${belumDijawab.length} soal belum dijawab. Tetap kirim?`)) return;
        }

        setSubmitting(true);
        setError("");
        try {
            const payload = Object.entries(jawaban).map(([soalId, j]) => ({ soalId, ...j }));
            const res = await fetch(`/api/siswa/assessments/${id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jawaban: payload }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || "Gagal mengirim jawaban");
                return;
            }
            setHasil(data.message);
        } catch {
            setError("Tidak dapat terhubung ke server");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <div className="p-4 md:p-8 text-sm text-slate-400">Memuat soal...</div>;
    }

    if (error && soalList.length === 0) {
        return (
            <div className="p-4 md:p-8">
                <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
                    <p className="text-sm text-red-500">{error}</p>
                    <button
                        onClick={() => router.push("/siswa/assessments")}
                        className="mt-4 rounded-lg bg-[#0B1440] px-4 py-2 text-sm font-semibold text-white"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        );
    }

    if (hasil) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
                    <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                    <p className="mt-3 font-semibold text-slate-800">Jawaban Terkirim</p>
                    <p className="mt-1 text-sm text-slate-500">{hasil}</p>
                    <button
                        onClick={() => router.push("/siswa/assessments")}
                        className="mt-5 w-full rounded-lg bg-[#0B1440] py-2.5 text-sm font-semibold text-white hover:opacity-90"
                    >
                        Kembali ke Tugas &amp; Ujian
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-xl font-bold text-slate-900">{assessment?.namaUjian}</h1>
            <p className="mt-1 text-sm text-slate-400">
                {assessment?.mapel} • {soalList.length} soal
            </p>

            <div className="mt-6 space-y-4">
                {soalList.map((s, i) => (
                    <div key={s._id} className="rounded-2xl bg-white p-5 shadow-sm">
                        <p className="text-xs font-medium text-slate-400">Soal {i + 1}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-800">
                            {s.pertanyaan}
                        </p>

                        {s.tipeSoal === "PILIHAN_GANDA" ? (
                            <div className="mt-3 space-y-2">
                                {s.pilihan.map((p, idx) => (
                                    <label
                                        key={idx}
                                        className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm cursor-pointer ${jawaban[s._id]?.pilihanIndex === idx
                                                ? "border-[#2F5FEA] bg-blue-50/50"
                                                : "border-slate-200"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`soal-${s._id}`}
                                            checked={jawaban[s._id]?.pilihanIndex === idx}
                                            onChange={() => pilihJawaban(s._id, idx)}
                                            className="h-4 w-4 accent-[#2F5FEA]"
                                        />
                                        <span className="font-semibold">{String.fromCharCode(65 + idx)}.</span>
                                        <span>{p.teks}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <textarea
                                value={jawaban[s._id]?.teksEssay || ""}
                                onChange={(e) => tulisEssay(s._id, e.target.value)}
                                rows={4}
                                placeholder="Tulis jawabanmu di sini..."
                                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                            />
                        )}
                    </div>
                ))}
            </div>

            {error && (
                <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}

            <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-6 w-full rounded-lg bg-[#2F5FEA] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 md:w-auto md:px-8"
            >
                {submitting ? "Mengirim..." : "Kirim Jawaban"}
            </button>
        </div>
    );
}