"use client";

import { useEffect, useState } from "react";

type Group = "ALL" | "GURU" | "SISWA";

interface UserRow {
    _id: string;
    name: string;
    email: string;
    role: "GURU" | "MURID";
    status: "ACTIVE" | "OFFLINE" | "SUSPENDED";
    kelas?: string;
    mapel?: string;
}

const tabs: { key: Group; label: string }[] = [
    { key: "ALL", label: "Semua" },
    { key: "GURU", label: "Guru" },
    { key: "SISWA", label: "Siswa" },
];

const statusStyle: Record<UserRow["status"], string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    OFFLINE: "bg-slate-100 text-slate-500",
    SUSPENDED: "bg-red-100 text-red-600",
};

const statusLabel: Record<UserRow["status"], string> = {
    ACTIVE: "Aktif",
    OFFLINE: "Offline",
    SUSPENDED: "Disuspend",
};

export default function KepsekUsersPage() {
    const [group, setGroup] = useState<Group>("ALL");
    const [users, setUsers] = useState<UserRow[]>([]);
    const [counts, setCounts] = useState({ guru: 0, siswa: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/kepsek/users?group=${group}`);
                const data = await res.json();
                if (!data.success) throw new Error(data.message || "Gagal memuat");
                if (!cancelled) {
                    setUsers(data.users);
                    setCounts(data.counts);
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : "Tidak dapat terhubung ke server");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [group]);

    return (
        <div className="p-8">
            <p className="text-xs font-medium text-[#2F5FEA]">Akses hanya-baca</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Guru &amp; Siswa</h1>
            <p className="mt-1 text-sm text-slate-500">
                {counts.guru} guru dan {counts.siswa} siswa terdaftar.
            </p>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

            <div className="mt-6 rounded-2xl bg-white shadow-sm">
                <div className="flex gap-6 border-b border-slate-100 px-5 pt-4 text-sm">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setGroup(t.key)}
                            className={`relative pb-3 font-medium transition-colors ${group === t.key ? "text-[#2F5FEA]" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            {t.label}
                            {group === t.key && <span className="absolute -bottom-px left-0 h-0.5 w-full bg-[#2F5FEA]" />}
                        </button>
                    ))}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-xs text-slate-400">
                                <th className="px-5 py-3 font-medium">Nama</th>
                                <th className="px-5 py-3 font-medium">Peran</th>
                                <th className="px-5 py-3 font-medium">Kelas / Mapel</th>
                                <th className="px-5 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Memuat data...</td></tr>
                            )}
                            {!loading && users.length === 0 && (
                                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Belum ada data.</td></tr>
                            )}
                            {!loading &&
                                users.map((u) => (
                                    <tr key={u._id} className="border-t border-slate-50">
                                        <td className="px-5 py-3">
                                            <p className="font-medium text-slate-800">{u.name}</p>
                                            <p className="text-xs text-slate-400">{u.email}</p>
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">{u.role === "GURU" ? "Guru" : "Siswa"}</td>
                                        <td className="px-5 py-3 text-slate-600">{u.kelas || u.mapel || "-"}</td>
                                        <td className="px-5 py-3">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[u.status]}`}>
                                                {statusLabel[u.status]}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}