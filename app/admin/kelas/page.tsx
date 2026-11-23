"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

interface KelasRow {
    _id: string;
    namaKelas: string;
    jurusan: string;
    mataPelajaran: string[];
}

export default function KelasManagementPage() {
    const [kelasList, setKelasList] = useState<KelasRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<KelasRow | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get("add") === "1") {
            setEditing(null);
            setShowModal(true);
        }
    }, [searchParams]);

    const fetchKelas = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/kelas");
            const data = await res.json();
            if (data.success) setKelasList(data.kelas);
        } catch (err) {
            console.error("Fetch kelas error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKelas();
    }, [fetchKelas]);

    async function handleDelete(id: string, nama: string) {
        if (!confirm(`Hapus kelas "${nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
        try {
            const res = await fetch(`/api/admin/kelas/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) fetchKelas();
            else alert(data.message || "Gagal menghapus kelas");
        } catch {
            alert("Tidak dapat terhubung ke server");
        }
    }

    return (
        <div className="p-8">
            <p className="text-xs text-slate-400">
                Management <span className="mx-1">›</span>{" "}
                <span className="text-[#2F5FEA] font-medium">Kelas Management</span>
            </p>

            <div className="mt-1 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Data Kelas</h1>
                <button
                    onClick={() => {
                        setEditing(null);
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-[#2F5FEA] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                    <Plus size={16} /> Create New
                </button>
            </div>

            <div className="mt-6 rounded-2xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-xs text-slate-400">
                            <th className="px-5 py-3 font-medium">NAMA KELAS</th>
                            <th className="px-5 py-3 font-medium">JURUSAN</th>
                            <th className="px-5 py-3 font-medium">MATA PELAJARAN</th>
                            <th className="px-5 py-3 font-medium">ACTIONS</th>
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

                        {!loading && kelasList.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                                    Belum ada kelas. Klik "Create New" untuk menambahkan.
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            kelasList.map((k) => (
                                <tr key={k._id} className="border-t border-slate-50">
                                    <td className="px-5 py-3 font-medium text-slate-800">{k.namaKelas}</td>
                                    <td className="px-5 py-3 text-slate-600">
                                        {k.jurusan || <span className="text-slate-300">-</span>}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {k.mataPelajaran.length === 0 && (
                                                <span className="text-slate-300">-</span>
                                            )}
                                            {k.mataPelajaran.map((m, i) => (
                                                <span
                                                    key={i}
                                                    className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600"
                                                >
                                                    {m}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setEditing(k);
                                                    setShowModal(true);
                                                }}
                                                className="text-slate-400 hover:text-[#2F5FEA]"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(k._id, k.namaKelas)}
                                                className="text-slate-400 hover:text-red-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <KelasModal
                    initial={editing}
                    onClose={() => setShowModal(false)}
                    onSaved={() => {
                        setShowModal(false);
                        fetchKelas();
                    }}
                />
            )}
        </div>
    );
}

function KelasModal({
    initial,
    onClose,
    onSaved,
}: {
    initial: KelasRow | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [namaKelas, setNamaKelas] = useState(initial?.namaKelas || "");
    const [jurusan, setJurusan] = useState(initial?.jurusan || "");
    const [mataPelajaran, setMataPelajaran] = useState(
        initial?.mataPelajaran?.join(", ") || ""
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const payload = { namaKelas, jurusan, mataPelajaran };
        const url = initial ? `/api/admin/kelas/${initial._id}` : "/api/admin/kelas";
        const method = initial ? "PATCH" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || "Gagal menyimpan kelas");
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
                        {initial ? "Edit Kelas" : "Tambah Kelas Baru"}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Nama Kelas</label>
                        <input
                            value={namaKelas}
                            onChange={(e) => setNamaKelas(e.target.value)}
                            required
                            placeholder="cth: XII-IPA-1"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Jurusan</label>
                        <input
                            value={jurusan}
                            onChange={(e) => setJurusan(e.target.value)}
                            placeholder="cth: IPA"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                            Mata Pelajaran (pisahkan pakai koma)
                        </label>
                        <input
                            value={mataPelajaran}
                            onChange={(e) => setMataPelajaran(e.target.value)}
                            placeholder="cth: Matematika, Fisika, Kimia"
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
                        {loading ? "Menyimpan..." : "Simpan Kelas"}
                    </button>
                </form>
            </div>
        </div>
    );
}