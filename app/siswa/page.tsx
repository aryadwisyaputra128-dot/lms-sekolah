"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { BookOpen, Video } from "lucide-react";

interface Course {
    namaMapel: string;
    kelas: string;
    warna: string;
    namaGuru: string;
    belumDikerjakan: number;
    zoomLink?: string | null;
}

// hanya izinkan link http(s) supaya tidak ada link berbahaya
function linkAman(link?: string | null) {
    return !!link && /^https?:\/\//i.test(link);
}

const cardAccent: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
};

export default function SiswaCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [kelas, setKelas] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/siswa/courses");
            const data = await res.json();
            if (data.success) {
                setCourses(data.courses);
                setKelas(data.kelas);
            }
        } catch (err) {
            console.error("Fetch courses error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold text-slate-900">Mata Pelajaran</h1>
            <p className="mt-1 text-sm text-slate-400">
                {kelas ? `Kelas ${kelas} — ayo simak materi dan kerjakan tugasmu!` : "Ayo simak materi dan kerjakan tugasmu!"}
            </p>

            {!loading && !kelas && (
                <div className="mt-6 rounded-2xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
                    Kelas kamu belum terdaftar. Hubungi admin sekolah untuk mendaftarkan kelasmu.
                </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {loading && (
                    <p className="col-span-full py-6 text-center text-sm text-slate-400">Memuat...</p>
                )}

                {!loading && kelas && courses.length === 0 && (
                    <p className="col-span-full rounded-2xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
                        Belum ada mata pelajaran untuk kelasmu.
                    </p>
                )}

                {courses.map((c) => (
                    <div key={c.namaMapel} className="rounded-2xl bg-white p-5 shadow-sm">
                        <span
                            className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${cardAccent[c.warna] || cardAccent.indigo
                                }`}
                        >
                            <BookOpen size={18} />
                        </span>
                        <p className="mt-3 font-semibold text-slate-800">{c.namaMapel}</p>
                        <p className="text-xs text-slate-400">Diajar oleh {c.namaGuru}</p>

                        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                            {c.belumDikerjakan > 0
                                ? `${c.belumDikerjakan} tugas belum dikerjakan`
                                : "Semua tugas sudah dikerjakan"}
                        </div>

                        <Link
                            href="/siswa/assessments"
                            className="mt-3 block rounded-lg bg-[#0B1440] py-2 text-center text-sm font-semibold text-white hover:opacity-90"
                        >
                            Lihat Tugas
                        </Link>

                        {linkAman(c.zoomLink) && (
                            <a
                                href={c.zoomLink!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-[#2F5FEA] py-2 text-sm font-semibold text-[#2F5FEA] hover:bg-blue-50"
                            >
                                <Video size={15} /> Gabung Kelas Virtual
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}