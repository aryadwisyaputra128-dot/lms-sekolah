"use client";

import { useEffect, useState, useCallback } from "react";
import { Users } from "lucide-react";

interface StudentStat {
    _id: string;
    name: string;
    email: string;
    totalTugas: number;
    sudahDinilai: number;
    avgNilai: number | null;
}

interface Group {
    kelas: string;
    namaMapel: string;
    students: StudentStat[];
}

export default function StudentsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/guru/students");
            const data = await res.json();
            if (data.success) setGroups(data.groups);
        } catch (err) {
            console.error("Fetch students error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold text-slate-900">Kelola Siswa</h1>
            <p className="mt-1 text-sm text-slate-400">
                Daftar siswa per kelas yang kamu ajar, lengkap dengan rekap tugas dan nilai.
            </p>

            <div className="mt-6 space-y-6">
                {loading && (
                    <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
                        Memuat data...
                    </p>
                )}

                {!loading && groups.length === 0 && (
                    <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
                        Kamu belum punya kelas/mapel. Tambahkan dulu di halaman Academic.
                    </p>
                )}

                {groups.map((g) => (
                    <div key={`${g.kelas}-${g.namaMapel}`} className="rounded-2xl bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-slate-800">{g.namaMapel}</p>
                                <p className="text-xs text-slate-400">{g.kelas} • {g.students.length} siswa</p>
                            </div>
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2F5FEA]">
                                <Users size={18} />
                            </span>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-xs text-slate-400">
                                        <th className="py-2 font-medium">Nama Siswa</th>
                                        <th className="py-2 font-medium">Email</th>
                                        <th className="py-2 font-medium">Tugas Dikerjakan</th>
                                        <th className="py-2 font-medium">Sudah Dinilai</th>
                                        <th className="py-2 font-medium">Rata-rata Nilai</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {g.students.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-6 text-center text-slate-400">
                                                Belum ada siswa di kelas ini.
                                            </td>
                                        </tr>
                                    )}
                                    {g.students.map((s) => (
                                        <tr key={s._id} className="border-t border-slate-50">
                                            <td className="py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                                        {s.name.charAt(0).toUpperCase()}
                                                    </span>
                                                    <span className="font-medium text-slate-800">{s.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-2.5 text-slate-500">{s.email}</td>
                                            <td className="py-2.5 text-slate-600">{s.totalTugas}</td>
                                            <td className="py-2.5 text-slate-600">{s.sudahDinilai}</td>
                                            <td className="py-2.5">
                                                {s.avgNilai !== null ? (
                                                    <span className="font-semibold text-slate-800">{s.avgNilai}</span>
                                                ) : (
                                                    <span className="text-slate-300">Belum ada nilai</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}