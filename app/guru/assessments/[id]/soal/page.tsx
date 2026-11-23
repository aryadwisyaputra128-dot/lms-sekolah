"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";

interface Pilihan {
    teks: string;
    benar: boolean;
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

export default function InputSoalPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();

    const [assessment, setAssessment] = useState<AssessmentInfo | null>(null);
    const [soalList, setSoalList] = useState<SoalItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [tipeSoal, setTipeSoal] = useState<"PILIHAN_GANDA" | "ESSAY">("PILIHAN_GANDA");
    const [pertanyaan, setPertanyaan] = useState("");
    const [pilihan, setPilihan] = useState<Pilihan[]>([
        { teks: "", benar: true },
        { teks: "", benar: false },
        { teks: "", benar: false },
    ]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/guru/assessments/${id}/soal`);
            const data = await res.json();
            if (data.success) {
                setAssessment(data.assessment);
                setSoalList(data.soalList);
            }
        } catch (err) {
            console.error("Fetch soal error:", err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    function resetForm() {
        setPertanyaan("");
        setPilihan([
            { teks: "", benar: true },
            { teks: "", benar: false },
            { teks: "", benar: false },
        ]);
    }

    function updatePilihanTeks(idx: number, teks: string) {
        setPilihan((prev) => prev.map((p, i) => (i === idx ? { ...p, teks } : p)));
    }

    function setPilihanBenar(idx: number) {
        setPilihan((prev) => prev.map((p, i) => ({ ...p, benar: i === idx })));
    }

    function addPilihan() {
        setPilihan((prev) => [...prev, { teks: "", benar: false }]);
    }

    function removePilihan(idx: number) {
        setPilihan((prev) => prev.filter((_, i) => i !== idx));
    }

    async function handleSave(andContinue: boolean) {
        if (!pertanyaan.trim()) {
            setError("Editor soal tidak boleh kosong");
            return;
        }
        if (tipeSoal === "PILIHAN_GANDA" && pilihan.some((p) => !p.teks.trim())) {
            setError("Semua pilihan jawaban harus diisi");
            return;
        }

        setSaving(true);
        setError("");
        try {
            const res = await fetch(`/api/guru/assessments/${id}/soal`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mapel: assessment?.mapel,
                    tipeSoal,
                    pertanyaan,
                    pilihan: tipeSoal === "PILIHAN_GANDA" ? pilihan : [],
                }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || "Gagal menyimpan soal");
                return;
            }

            resetForm();
            await fetchData();

            if (!andContinue) {
                router.push("/guru/assessments");
            }
        } catch {
            setError("Tidak dapat terhubung ke server");
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteSoal(soalId: string) {
        if (!confirm("Hapus soal ini?")) return;
        try {
            const res = await fetch(`/api/guru/assessments/${id}/soal/${soalId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) fetchData();
            else alert(data.message || "Gagal menghapus soal");
        } catch {
            alert("Tidak dapat terhubung ke server");
        }
    }

    return (
        <div className="p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Input Soal Ujian</h1>
                    <p className="text-sm text-slate-400">
                        {loading ? "Memuat..." : `${assessment?.namaUjian} — Tambahkan pertanyaan baru ke bank soal.`}
                    </p>
                </div>
                <a
                    href="#daftar-soal"
                    className="text-xs font-medium text-[#2F5FEA] hover:underline"
                >
                    Lihat {soalList.length} soal ↓
                </a>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* form */}
                <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm">
                    <p className="text-sm font-semibold text-slate-700">Detail Pertanyaan</p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Mata Pelajaran / Kategori
                            </label>
                            <input
                                value={assessment?.mapel || ""}
                                disabled
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Tipe Soal</label>
                            <select
                                value={tipeSoal}
                                onChange={(e) => setTipeSoal(e.target.value as "PILIHAN_GANDA" | "ESSAY")}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                            >
                                <option value="PILIHAN_GANDA">Pilihan Ganda</option>
                                <option value="ESSAY">Essay</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="mb-1 block text-xs font-medium text-slate-600">Editor Soal</label>
                        <textarea
                            value={pertanyaan}
                            onChange={(e) => setPertanyaan(e.target.value)}
                            rows={4}
                            placeholder="Ketik soal ujian di sini..."
                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                        />
                    </div>

                    {tipeSoal === "PILIHAN_GANDA" && (
                        <div className="mt-4">
                            <label className="mb-2 block text-xs font-medium text-slate-600">
                                Pilihan Jawaban (Kunci Jawaban)
                            </label>
                            <div className="space-y-2">
                                {pilihan.map((p, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-2 rounded-lg border p-2.5 ${p.benar ? "border-[#2F5FEA] bg-blue-50/40" : "border-slate-200"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            checked={p.benar}
                                            onChange={() => setPilihanBenar(idx)}
                                            className="h-4 w-4 accent-[#2F5FEA]"
                                        />
                                        <div className="flex-1">
                                            <p className="mb-1 text-xs font-medium text-slate-500">
                                                Pilihan {String.fromCharCode(65 + idx)}
                                                {p.benar && (
                                                    <span className="ml-1 text-[#2F5FEA]">(Jawaban Benar)</span>
                                                )}
                                            </p>
                                            <input
                                                value={p.teks}
                                                onChange={(e) => updatePilihanTeks(idx, e.target.value)}
                                                placeholder="Masukkan teks pilihan..."
                                                className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                                            />
                                        </div>
                                        {pilihan.length > 2 && (
                                            <button
                                                onClick={() => removePilihan(idx)}
                                                className="text-slate-300 hover:text-red-500"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={addPilihan}
                                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#2F5FEA] hover:underline"
                            >
                                <Plus size={13} /> Tambah Pilihan
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
                    )}

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                        <button
                            onClick={() => router.push("/guru/assessments")}
                            className="text-sm font-medium text-slate-500 hover:underline"
                        >
                            Batal
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSave(true)}
                                disabled={saving}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                            >
                                {saving ? "Menyimpan..." : "Simpan & Tambah Lagi"}
                            </button>
                            <button
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                className="rounded-lg bg-[#2F5FEA] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>

                {/* preview soal yang sudah dibuat */}
                <div id="daftar-soal" className="h-fit rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-700">
                        Preview Soal ({soalList.length})
                    </p>
                    <div className="mt-3 space-y-3">
                        {soalList.length === 0 && (
                            <p className="py-4 text-center text-xs text-slate-400">
                                Belum ada soal ditambahkan.
                            </p>
                        )}
                        {soalList.map((s, i) => (
                            <div key={s._id} className="rounded-xl border border-slate-100 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                        Soal {i + 1} • {s.tipeSoal === "PILIHAN_GANDA" ? "Pilihan Ganda" : "Essay"}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteSoal(s._id)}
                                        className="text-slate-300 hover:text-red-500"
                                        aria-label="Hapus soal"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                                    {s.pertanyaan}
                                </p>
                                {s.tipeSoal === "PILIHAN_GANDA" ? (
                                    <ul className="mt-2 space-y-1">
                                        {s.pilihan.map((p, idx) => (
                                            <li
                                                key={idx}
                                                className={`flex items-start gap-2 rounded-md px-2 py-1 text-xs ${p.benar
                                                        ? "bg-emerald-50 font-medium text-emerald-700"
                                                        : "text-slate-600"
                                                    }`}
                                            >
                                                <span className="font-semibold">
                                                    {String.fromCharCode(65 + idx)}.
                                                </span>
                                                <span>{p.teks}</span>
                                                {p.benar && <span className="ml-auto shrink-0">✓ Kunci</span>}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-2 text-xs italic text-slate-400">
                                        Soal essay, dijawab siswa dengan teks bebas.
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}