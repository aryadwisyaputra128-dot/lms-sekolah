"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Users,
    BookOpen,
    GraduationCap,
    UserPlus,
    FolderPlus,
} from "lucide-react";

interface Counts {
    guru: number;
    siswa: number;
    petugas: number;
    kelasAktif: number;
    total: number;
}

interface KelasSummary {
    namaKelas: string;
    jurusan: string;
    jumlahSiswa: number;
}

interface RecentUser {
    _id: string;
    name: string;
    role: string;
    createdAt: string;
}

interface RecentLogin {
    _id: string;
    name: string;
    role: string;
    loginAt: string;
}

const roleLabelMap: Record<string, string> = {
    GURU: "Guru",
    MURID: "Siswa",
    WAKAKURI: "Petugas",
    KEPSEK: "Petugas",
};

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

export default function AdminOverviewPage() {
    const router = useRouter();
    const [counts, setCounts] = useState<Counts>({
        guru: 0,
        siswa: 0,
        petugas: 0,
        kelasAktif: 0,
        total: 0,
    });
    const [kelasSummary, setKelasSummary] = useState<KelasSummary[]>([]);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [recentLogins, setRecentLogins] = useState<RecentLogin[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOverview = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, kelasRes, siswaRes, activityRes] = await Promise.all([
                fetch("/api/admin/users?group=ALL"),
                fetch("/api/admin/kelas"),
                fetch("/api/admin/users?group=SISWA"),
                fetch("/api/admin/activity"),
            ]);

            const usersData = await usersRes.json();
            const kelasData = await kelasRes.json();
            const siswaData = await siswaRes.json();
            const activityData = await activityRes.json();

            if (usersData.success) setCounts(usersData.counts);
            if (activityData.success) {
                setRecentUsers(activityData.recentUsers);
                setRecentLogins(activityData.recentLogins);
            }

            if (kelasData.success && siswaData.success) {
                const summary = kelasData.kelas.map(
                    (k: { namaKelas: string; jurusan: string }) => ({
                        namaKelas: k.namaKelas,
                        jurusan: k.jurusan,
                        jumlahSiswa: siswaData.users.filter(
                            (u: { kelas?: string }) => u.kelas === k.namaKelas
                        ).length,
                    })
                );
                setKelasSummary(summary);
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

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900">Sistem Overview</h1>
            <p className="mt-1 text-sm text-slate-500">Selamat datang, Administrator.</p>

            {/* stat cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border-l-4 border-[#0B1440] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2F5FEA]">
                            <Users size={18} />
                        </span>
                    </div>
                    <p className="mt-4 text-xs font-medium text-slate-400">TOTAL USERS</p>
                    <p className="text-2xl font-bold text-slate-900">
                        {loading ? "…" : counts.total.toLocaleString("id-ID")}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        {counts.siswa.toLocaleString("id-ID")} Siswa | {counts.guru.toLocaleString("id-ID")} Guru
                    </p>
                </div>

                <div className="rounded-2xl border-l-4 border-emerald-400 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <BookOpen size={18} />
                        </span>
                    </div>
                    <p className="mt-4 text-xs font-medium text-slate-400">KELAS AKTIF</p>
                    <p className="text-2xl font-bold text-slate-900">
                        {loading ? "…" : counts.kelasAktif.toLocaleString("id-ID")}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Terdaftar di sistem</p>
                </div>

                <div className="rounded-2xl border-l-4 border-amber-400 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                            <GraduationCap size={18} />
                        </span>
                    </div>
                    <p className="mt-4 text-xs font-medium text-slate-400">TOTAL PETUGAS</p>
                    <p className="text-2xl font-bold text-slate-900">
                        {loading ? "…" : counts.petugas.toLocaleString("id-ID")}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Wakakuri &amp; Kepala Sekolah</p>
                </div>
            </div>

            {/* user terbaru & aktivitas login */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-slate-700">USER TERBARU</p>
                    <div className="space-y-3">
                        {!loading && recentUsers.length === 0 && (
                            <p className="py-4 text-center text-sm text-slate-400">Belum ada user.</p>
                        )}
                        {recentUsers.map((u) => (
                            <div key={u._id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                        {u.name.charAt(0).toUpperCase()}
                                    </span>
                                    <div>
                                        <p className="font-medium text-slate-800">{u.name}</p>
                                        <p className="text-xs text-slate-400">{roleLabelMap[u.role] || u.role}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">{timeAgo(u.createdAt)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-slate-700">AKTIVITAS LOGIN TERBARU</p>
                    <div className="space-y-3">
                        {!loading && recentLogins.length === 0 && (
                            <p className="py-4 text-center text-sm text-slate-400">Belum ada aktivitas login.</p>
                        )}
                        {recentLogins.map((l) => (
                            <div key={l._id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <div>
                                        <p className="font-medium text-slate-800">{l.name}</p>
                                        <p className="text-xs text-slate-400">
                                            Login sebagai {roleLabelMap[l.role] || l.role}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">{timeAgo(l.loginAt)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* ringkasan kelas */}
                <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-slate-700">RINGKASAN KELAS</p>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-xs text-slate-400">
                                <th className="py-2 font-medium">Nama Kelas</th>
                                <th className="py-2 font-medium">Jurusan</th>
                                <th className="py-2 font-medium">Jumlah Siswa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && kelasSummary.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="py-6 text-center text-slate-400">
                                        Belum ada kelas terdaftar.
                                    </td>
                                </tr>
                            )}
                            {kelasSummary.map((k) => (
                                <tr key={k.namaKelas} className="border-t border-slate-50">
                                    <td className="py-2.5 font-medium text-slate-800">{k.namaKelas}</td>
                                    <td className="py-2.5 text-slate-500">{k.jurusan || "-"}</td>
                                    <td className="py-2.5 text-slate-500">{k.jumlahSiswa} siswa</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* quick actions */}
                <div className="rounded-2xl bg-white p-5 shadow-sm h-fit">
                    <p className="mb-3 text-sm font-semibold text-slate-700">QUICK ACTIONS</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => router.push("/admin/users?add=MURID")}
                            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                            <UserPlus size={18} className="text-[#2F5FEA]" />
                            Add Siswa
                        </button>
                        <button
                            onClick={() => router.push("/admin/users?add=GURU")}
                            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                            <GraduationCap size={18} className="text-[#2F5FEA]" />
                            Add Guru
                        </button>
                        <button
                            onClick={() => router.push("/admin/users?add=PETUGAS")}
                            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                            <Users size={18} className="text-[#2F5FEA]" />
                            Add Petugas
                        </button>
                        <button
                            onClick={() => router.push("/admin/kelas?add=1")}
                            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                            <FolderPlus size={18} className="text-[#2F5FEA]" />
                            Tambah Kelas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}