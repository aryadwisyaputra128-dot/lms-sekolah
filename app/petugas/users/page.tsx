"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Users, GraduationCap, BookOpen, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface UserRow {
    _id: string;
    name: string;
    email: string;
    role: "GURU" | "MURID";
    status: "ACTIVE" | "OFFLINE" | "SUSPENDED";
    kelas?: string;
    mapel?: string;
}

type RoleFilter = "ALL" | "GURU" | "MURID";

const PAGE_SIZE = 20;

const statusDot: Record<string, string> = {
    ACTIVE: "bg-emerald-500",
    OFFLINE: "bg-slate-400",
    SUSPENDED: "bg-red-500",
};
const statusText: Record<string, string> = {
    ACTIVE: "text-emerald-600",
    OFFLINE: "text-slate-500",
    SUSPENDED: "text-red-600",
};
const statusLabel: Record<string, string> = {
    ACTIVE: "Aktif",
    OFFLINE: "Offline",
    SUSPENDED: "Ditangguhkan",
};

function csvAman(v: string | number) {
    return `"${String(v).replace(/"/g, '""')}"`;
}

export default function PetugasUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [counts, setCounts] = useState({ total: 0, guru: 0, siswa: 0 });
    const [loading, setLoading] = useState(true);
    const [cari, setCari] = useState("");
    const [peran, setPeran] = useState<RoleFilter>("ALL");
    const [page, setPage] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/petugas/users");
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
                setCounts(data.counts);
            }
        } catch (err) {
            console.error("Fetch users error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setPage(0);
    }, [cari, peran]);

    const terfilter = useMemo(() => {
        const q = cari.trim().toLowerCase();
        return users.filter(
            (u) =>
                (peran === "ALL" || u.role === peran) &&
                (!q ||
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    (u.kelas || "").toLowerCase().includes(q) ||
                    (u.mapel || "").toLowerCase().includes(q))
        );
    }, [users, cari, peran]);

    const totalHalaman = Math.max(1, Math.ceil(terfilter.length / PAGE_SIZE));
    const tampil = terfilter.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    function handleExportCsv() {
        const rows = [
            "Nama,Email,Peran,Kelas / Mapel,Status",
            ...terfilter.map((u) =>
                [
                    csvAman(u.name),
                    csvAman(u.email),
                    csvAman(u.role === "GURU" ? "Guru" : "Siswa"),
                    csvAman(u.kelas || u.mapel || "-"),
                    csvAman(statusLabel[u.status] || u.status),
                ].join(",")
            ),
        ];
        const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `data-pengguna-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold text-slate-900">Data Pengguna</h1>
            <p className="mt-1 text-sm text-slate-400">
                Lihat daftar guru dan siswa. Halaman ini hanya untuk melihat, perubahan data dilakukan oleh
                admin.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#2F5FEA]">
                        <Users size={18} />
                    </span>
                    <div>
                        <p className="text-xs text-slate-400">Total Pengguna</p>
                        <p className="text-xl font-bold text-slate-900">{counts.total.toLocaleString("id-ID")}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <GraduationCap size={18} />
                    </span>
                    <div>
                        <p className="text-xs text-slate-400">Guru</p>
                        <p className="text-xl font-bold text-slate-900">{counts.guru.toLocaleString("id-ID")}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <BookOpen size={18} />
                    </span>
                    <div>
                        <p className="text-xs text-slate-400">Siswa</p>
                        <p className="text-xl font-bold text-slate-900">{counts.siswa.toLocaleString("id-ID")}</p>
                    </div>
                </div>
            </div>

            {/* toolbar */}
            <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <Search size={16} className="text-slate-400" />
                    <input
                        value={cari}
                        onChange={(e) => setCari(e.target.value)}
                        placeholder="Cari nama, email, kelas, atau mapel..."
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">Peran:</label>
                    <select
                        value={peran}
                        onChange={(e) => setPeran(e.target.value as RoleFilter)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                    >
                        <option value="ALL">Semua Peran</option>
                        <option value="GURU">Guru</option>
                        <option value="MURID">Siswa</option>
                    </select>
                    <button
                        onClick={handleExportCsv}
                        disabled={terfilter.length === 0}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <Download size={15} /> Unduh CSV
                    </button>
                </div>
            </div>

            {/* tabel */}
            <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-xs text-slate-400">
                                <th className="px-5 py-3 font-medium">Nama</th>
                                <th className="px-5 py-3 font-medium">Peran</th>
                                <th className="px-5 py-3 font-medium">Kelas / Mapel</th>
                                <th className="px-5 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                                        Memuat data...
                                    </td>
                                </tr>
                            )}
                            {!loading && tampil.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                                        Tidak ada pengguna yang cocok.
                                    </td>
                                </tr>
                            )}
                            {tampil.map((u) => (
                                <tr key={u._id} className="border-t border-slate-50">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                                {u.name.charAt(0).toUpperCase()}
                                            </span>
                                            <div>
                                                <p className="font-medium text-slate-800">{u.name}</p>
                                                <p className="text-xs text-slate-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.role === "GURU"
                                                    ? "bg-indigo-100 text-indigo-700"
                                                    : "bg-blue-100 text-blue-700"
                                                }`}
                                        >
                                            {u.role === "GURU" ? "Guru" : "Siswa"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-slate-600">
                                        {u.kelas || u.mapel || <span className="text-slate-300">-</span>}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusText[u.status]}`}
                                        >
                                            <span className={`h-1.5 w-1.5 rounded-full ${statusDot[u.status]}`} />
                                            {statusLabel[u.status] || u.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-50 px-5 py-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        {terfilter.length === 0
                            ? "Tidak ada data"
                            : `Menampilkan ${page * PAGE_SIZE + 1} - ${Math.min(
                                (page + 1) * PAGE_SIZE,
                                terfilter.length
                            )} dari ${terfilter.length.toLocaleString("id-ID")} pengguna`}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 disabled:opacity-30"
                            aria-label="Halaman sebelumnya"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span>
                            Halaman {page + 1} dari {totalHalaman}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalHalaman - 1, p + 1))}
                            disabled={page >= totalHalaman - 1}
                            className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 disabled:opacity-30"
                            aria-label="Halaman berikutnya"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}