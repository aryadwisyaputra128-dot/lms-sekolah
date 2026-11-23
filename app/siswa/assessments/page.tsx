"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Clock, FileText, ChevronRight, Video } from "lucide-react";

interface ToDoItem {
    _id: string;
    namaUjian: string;
    tipe: "EXAM" | "QUIZ";
    mapel?: string;
    tenggat?: string;
    jumlahSoal: number;
}

interface KelasVirtual {
    namaMapel: string;
    namaGuru: string;
    zoomLink: string;
}

interface NilaiItem {
    _id: string;
    judulTugas: string;
    nilai: number;
    submittedAt: string;
}

export default function SiswaAssessmentsPage() {
    const [toDo, setToDo] = useState<ToDoItem[]>([]);
    const [nilaiSaya, setNilaiSaya] = useState<NilaiItem[]>([]);
    const [menungguDinilai, setMenungguDinilai] = useState(0);
    const [kelasVirtual, setKelasVirtual] = useState<KelasVirtual[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [res, resCourses] = await Promise.all([
                fetch("/api/siswa/assessments"),
                fetch("/api/siswa/courses"),
            ]);
            const data = await res.json();
            const dataCourses = await resCourses.json();
            if (data.success) {
                setToDo(data.toDo);
                setNilaiSaya(data.nilaiSaya);
                setMenungguDinilai(data.menungguDinilai);
            }
            if (dataCourses.success) {
                // hanya tampilkan link http(s) yang valid
                setKelasVirtual(
                    dataCourses.courses.filter(
                        (c: { zoomLink?: string | null }) => c.zoomLink && /^https?:\/\//i.test(c.zoomLink)
                    )
                );
            }
        } catch (err) {
            console.error("Fetch assessments error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold text-slate-900">Tugas &amp; Ujian</h1>
            <p className="mt-1 text-sm text-slate-400">
                Kelola kuis, ujian, dan tugas yang sedang berjalan.
            </p>

            {kelasVirtual.length > 0 && (
                <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Video size={16} className="text-[#2F5FEA]" /> Kelas Virtual
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {kelasVirtual.map((v) => (
                            <div
                                key={v.namaMapel}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-800">{v.namaMapel}</p>
                                    <p className="truncate text-xs text-slate-400">{v.namaGuru}</p>
                                </div>
                                <a
                                    href={v.zoomLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 rounded-lg bg-[#2F5FEA] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                                >
                                    Gabung
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* to do */}
                <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">Harus Dikerjakan</p>
                        {toDo.length > 0 && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2F5FEA]">
                                {toDo.length} Pending
                            </span>
                        )}
                    </div>

                    <div className="mt-4 space-y-3">
                        {loading && <p className="py-6 text-center text-sm text-slate-400">Memuat...</p>}

                        {!loading && toDo.length === 0 && (
                            <p className="py-6 text-center text-sm text-slate-400">
                                Tidak ada tugas yang perlu dikerjakan. Kerja bagus!
                            </p>
                        )}

                        {toDo.map((t) => (
                            <div key={t._id} className="rounded-xl border border-slate-100 p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800">{t.namaUjian}</p>
                                        <p className="text-xs text-slate-400">
                                            {t.mapel} • {t.tipe === "QUIZ" ? "Kuis" : "Ujian"} • {t.jumlahSoal} soal
                                        </p>
                                    </div>
                                    {t.tenggat && (
                                        <span className="flex items-center gap-1 text-xs text-red-500">
                                            <Clock size={12} />
                                            {new Date(t.tenggat).toLocaleDateString("id-ID")}
                                        </span>
                                    )}
                                </div>
                                <Link
                                    href={`/siswa/assessments/${t._id}/kerjakan`}
                                    className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-[#2F5FEA] py-2 text-sm font-semibold text-white hover:opacity-90"
                                >
                                    {t.tipe === "QUIZ" ? "Mulai Kuis" : "Mulai Ujian"}
                                    <ChevronRight size={15} />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* nilai saya */}
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-700">Nilai Saya</p>
                    {menungguDinilai > 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                            {menungguDinilai} tugas menunggu dinilai guru
                        </p>
                    )}

                    <div className="mt-4 space-y-3">
                        {!loading && nilaiSaya.length === 0 && (
                            <p className="py-4 text-center text-xs text-slate-400">Belum ada nilai.</p>
                        )}
                        {nilaiSaya.map((n) => (
                            <div key={n._id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <FileText size={14} className="text-slate-300" />
                                    <div>
                                        <p className="font-medium text-slate-800">{n.judulTugas}</p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(n.submittedAt).toLocaleDateString("id-ID")}
                                        </p>
                                    </div>
                                </div>
                                <span className="font-semibold text-emerald-600">{n.nilai}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}