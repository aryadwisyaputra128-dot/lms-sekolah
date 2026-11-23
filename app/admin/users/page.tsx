"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, UserPlus, GraduationCap, Shield, X } from "lucide-react";
import ExportPdfButton from "@/components/ExportPdfButton";

type RoleGroupFilter = "ALL" | "GURU" | "SISWA" | "PETUGAS";

interface UserRow {
    _id: string;
    name: string;
    email: string;
    role: "GURU" | "MURID" | "WAKAKURI" | "KEPSEK";
    status: "ACTIVE" | "OFFLINE" | "SUSPENDED";
    kelas?: string;
    mapel?: string;
    jabatan?: string;
}

interface Counts {
    guru: number;
    siswa: number;
    petugas: number;
    kelasAktif: number;
    total: number;
}

const roleBadge: Record<string, string> = {
    GURU: "bg-indigo-100 text-indigo-700",
    MURID: "bg-blue-100 text-blue-700",
    WAKAKURI: "bg-amber-100 text-amber-700",
    KEPSEK: "bg-amber-100 text-amber-700",
};

const roleLabel: Record<string, string> = {
    GURU: "Guru",
    MURID: "Siswa",
    WAKAKURI: "Petugas",
    KEPSEK: "Petugas",
};

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

const tabs: { key: RoleGroupFilter; label: string }[] = [
    { key: "ALL", label: "Semua User" },
    { key: "GURU", label: "Guru (Teacher)" },
    { key: "SISWA", label: "Siswa (Student)" },
    { key: "PETUGAS", label: "Petugas (Staff)" },
];

export default function UserManagementPage() {
    return (
        <Suspense fallback={<div className="p-8 text-sm text-slate-400">Memuat...</div>}>
            <UserManagementContent />
        </Suspense>
    );
}

function UserManagementContent() {
    const [activeTab, setActiveTab] = useState<RoleGroupFilter>("ALL");
    const [users, setUsers] = useState<UserRow[]>([]);
    const [counts, setCounts] = useState<Counts>({ guru: 0, siswa: 0, petugas: 0, kelasAktif: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState<null | "GURU" | "MURID" | "PETUGAS">(null);
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        const addParam = searchParams.get("add");
        if (addParam === "GURU" || addParam === "MURID" || addParam === "PETUGAS") {
            setShowAddModal(addParam);
        }
    }, [searchParams]);

    const fetchUsers = useCallback(async (group: RoleGroupFilter) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users?group=${group}`);
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
        fetchUsers(activeTab);
    }, [activeTab, fetchUsers]);

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Hapus user "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                fetchUsers(activeTab);
            } else {
                alert(data.message || "Gagal menghapus user");
            }
        } catch {
            alert("Tidak dapat terhubung ke server");
        }
    }

    async function handleToggleStatus(user: UserRow) {
        const nextStatus = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
        try {
            const res = await fetch(`/api/admin/users/${user._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = await res.json();
            if (data.success) {
                fetchUsers(activeTab);
            }
        } catch {
            alert("Tidak dapat terhubung ke server");
        }
    }

    function initials(name: string) {
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }

    return (
        <div className="p-8">
            {/* breadcrumb */}
            <p className="text-xs text-slate-400">
                Management <span className="mx-1">›</span>{" "}
                <span className="text-[#2F5FEA] font-medium">User Management</span>
            </p>

            <div className="mt-1 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">
                    Guru, Siswa &amp; Petugas Directory
                </h1>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                        <Filter size={16} /> Filter
                    </button>
                    <ExportPdfButton
                        label="Export PDF"
                        disabled={loading}
                        getReport={() => ({
                            title: "Daftar Guru, Siswa dan Petugas",
                            subtitle: `Kategori: ${tabs.find((t) => t.key === activeTab)?.label}`,
                            summary: [
                                ["Total guru", counts.guru],
                                ["Total siswa", counts.siswa],
                                ["Total petugas", counts.petugas],
                                ["Total user", counts.total],
                            ],
                            sections: [
                                {
                                    heading: "Daftar pengguna",
                                    head: ["Nama", "Email", "Peran", "Kelas / Mapel / Jabatan", "Status"],
                                    body: users.map((u) => [
                                        u.name,
                                        u.email,
                                        roleLabel[u.role],
                                        u.kelas || u.mapel || u.jabatan || "-",
                                        u.status === "ACTIVE" ? "Active" : u.status === "OFFLINE" ? "Offline" : "Suspended",
                                    ]),
                                },
                            ],
                            filename: `daftar-user-${activeTab.toLowerCase()}`,
                        })}
                    />
                </div>
            </div>

            {/* stat cards */}
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="TOTAL GURU" value={counts.guru} border="border-[#0B1440]" />
                <StatCard label="TOTAL SISWA" value={counts.siswa} border="border-[#2F5FEA]" />
                <StatCard label="KELAS AKTIF" value={counts.kelasAktif} border="border-emerald-400" />
                <StatCard label="TOTAL PETUGAS" value={counts.petugas} border="border-amber-400" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* table */}
                <div className="lg:col-span-2 rounded-2xl bg-white shadow-sm">
                    <div className="flex items-center gap-6 border-b border-slate-100 px-5 pt-4 text-sm">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`relative pb-3 font-medium transition-colors ${activeTab === tab.key
                                        ? "text-[#2F5FEA]"
                                        : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                {tab.label}
                                {activeTab === tab.key && (
                                    <span className="absolute -bottom-px left-0 h-0.5 w-full bg-[#2F5FEA]" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-xs text-slate-400">
                                    <th className="px-5 py-3 font-medium">NAME &amp; EMAIL</th>
                                    <th className="px-5 py-3 font-medium">ROLE</th>
                                    <th className="px-5 py-3 font-medium">CLASS/MAPEL/JABATAN</th>
                                    <th className="px-5 py-3 font-medium">STATUS</th>
                                    <th className="px-5 py-3 font-medium">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                                            Memuat data...
                                        </td>
                                    </tr>
                                )}

                                {!loading && users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                                            Belum ada user di kategori ini.
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    users.map((u) => (
                                        <tr key={u._id} className="border-t border-slate-50">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                                        {initials(u.name)}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium text-slate-800">{u.name}</p>
                                                        <p className="text-xs text-slate-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadge[u.role]}`}
                                                >
                                                    {roleLabel[u.role]}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600">
                                                {u.kelas || u.mapel || u.jabatan || (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusText[u.status]}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${statusDot[u.status]}`} />
                                                    {u.status === "ACTIVE" ? "Active" : u.status === "OFFLINE" ? "Offline" : "Suspended"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setEditingUser(u)}
                                                        className="text-xs font-medium text-slate-500 hover:text-[#2F5FEA]"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(u)}
                                                        className="text-xs font-medium text-[#2F5FEA] hover:underline"
                                                    >
                                                        {u.status === "SUSPENDED" ? "Aktifkan" : "Suspend"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(u._id, u.name)}
                                                        className="text-xs font-medium text-red-500 hover:underline"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* right panel: add user */}
                <div className="rounded-2xl bg-white p-5 shadow-sm h-fit">
                    <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <UserPlus size={16} className="text-[#2F5FEA]" /> TAMBAH USER BARU
                    </p>
                    <div className="space-y-2">
                        <button
                            onClick={() => setShowAddModal("MURID")}
                            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <span className="flex items-center gap-2">
                                <UserPlus size={16} /> Add Siswa Baru
                            </span>
                            <span>›</span>
                        </button>
                        <button
                            onClick={() => setShowAddModal("GURU")}
                            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <span className="flex items-center gap-2">
                                <GraduationCap size={16} /> Add Guru Baru
                            </span>
                            <span>›</span>
                        </button>
                        <button
                            onClick={() => setShowAddModal("PETUGAS")}
                            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <span className="flex items-center gap-2">
                                <Shield size={16} /> Add Petugas Baru
                            </span>
                            <span>›</span>
                        </button>
                    </div>
                </div>
            </div>

            {showAddModal && (
                <AddUserModal
                    type={showAddModal}
                    onClose={() => setShowAddModal(null)}
                    onCreated={() => {
                        setShowAddModal(null);
                        fetchUsers(activeTab);
                    }}
                />
            )}

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSaved={() => {
                        setEditingUser(null);
                        fetchUsers(activeTab);
                    }}
                />
            )}
        </div>
    );
}

function StatCard({ label, value, border }: { label: string; value: number; border: string }) {
    return (
        <div className={`rounded-2xl border-l-4 bg-white p-4 shadow-sm ${border}`}>
            <p className="text-xs font-medium text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value.toLocaleString("id-ID")}</p>
        </div>
    );
}

function AddUserModal({
    type,
    onClose,
    onCreated,
}: {
    type: "GURU" | "MURID" | "PETUGAS";
    onClose: () => void;
    onCreated: () => void;
}) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [extra, setExtra] = useState(""); // kelas / mapel / jabatan
    const [jabatanRole, setJabatanRole] = useState<"WAKAKURI" | "KEPSEK">("WAKAKURI");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const titleMap = { GURU: "Guru", MURID: "Siswa", PETUGAS: "Petugas" };
    const extraLabelMap = { GURU: "Mata Pelajaran", MURID: "Kelas", PETUGAS: "Jabatan" };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const role = type === "PETUGAS" ? jabatanRole : type;
        const payload: Record<string, unknown> = { name, email, password, role };
        if (type === "GURU") payload.mapel = extra;
        if (type === "MURID") payload.kelas = extra;
        if (type === "PETUGAS") payload.jabatan = extra;

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || "Gagal membuat user");
                return;
            }
            onCreated();
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
                        Tambah {titleMap[type]} Baru
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Nama Lengkap</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                        />
                    </div>

                    {type === "PETUGAS" && (
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Jenis Petugas</label>
                            <select
                                value={jabatanRole}
                                onChange={(e) => setJabatanRole(e.target.value as "WAKAKURI" | "KEPSEK")}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                            >
                                <option value="WAKAKURI">Wakakuri</option>
                                <option value="KEPSEK">Kepala Sekolah</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                            {extraLabelMap[type]}
                        </label>
                        <input
                            value={extra}
                            onChange={(e) => setExtra(e.target.value)}
                            placeholder={
                                type === "GURU" ? "cth: Matematika" : type === "MURID" ? "cth: XII-IPA-1" : "cth: Wakil Kepala Kurikulum"
                            }
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
                        {loading ? "Menyimpan..." : `Simpan ${titleMap[type]}`}
                    </button>
                </form>
            </div>
        </div>
    );
}

function EditUserModal({
    user,
    onClose,
    onSaved,
}: {
    user: UserRow;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(user.name);
    const [extra, setExtra] = useState(user.kelas || user.mapel || user.jabatan || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const extraLabel =
        user.role === "GURU" ? "Mata Pelajaran" : user.role === "MURID" ? "Kelas" : "Jabatan";
    const extraField =
        user.role === "GURU" ? "mapel" : user.role === "MURID" ? "kelas" : "jabatan";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/admin/users/${user._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, [extraField]: extra }),
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
                    <h3 className="text-lg font-bold text-slate-900">Edit User</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Nama Lengkap</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
                        <input
                            value={user.email}
                            disabled
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">Email tidak bisa diubah dari sini.</p>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">{extraLabel}</label>
                        <input
                            value={extra}
                            onChange={(e) => setExtra(e.target.value)}
                            placeholder={
                                user.role === "GURU" ? "cth: Matematika" : user.role === "MURID" ? "cth: 12 PPLG 1" : "cth: Wakil Kepala Kurikulum"
                            }
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
                        {loading ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </form>
            </div>
        </div>
    );
}