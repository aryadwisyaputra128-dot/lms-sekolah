"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import ExportPdfButton from "@/components/ExportPdfButton";

type Hari = "SEN" | "SEL" | "RAB" | "KAM" | "JUM";

interface Jadwal {
    _id: string;
    guruId: string;
    guruNama: string;
    judul: string;
    kelas: string;
    hari: Hari;
    jamMulai: string;
    jamSelesai: string;
}

interface Guru {
    _id: string;
    name: string;
}

const HARI: { key: Hari; label: string }[] = [
    { key: "SEN", label: "Senin" },
    { key: "SEL", label: "Selasa" },
    { key: "RAB", label: "Rabu" },
    { key: "KAM", label: "Kamis" },
    { key: "JUM", label: "Jumat" },
];
const hariLabel = Object.fromEntries(HARI.map((h) => [h.key, h.label])) as Record<Hari, string>;

const input =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white outline-none focus:border-[#2F5FEA]";

export default function AdminJadwalPage() {
    const [jadwal, setJadwal] = useState<Jadwal[]>([]);
    const [gurus, setGurus] = useState<Guru[]>([]);
    const [kelasList, setKelasList] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterGuru, setFilterGuru] = useState("");
    const [filterKelas, setFilterKelas] = useState("");
    const [modal, setModal] = useState<null | "TAMBAH" | Jadwal>(null);
    const [showGenerate, setShowGenerate] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/jadwal");
            const data = await res.json();
            if (!data.success) throw new Error(data.message || "Gagal memuat");
            setJadwal(data.jadwal);
            setGurus(data.gurus);
            setKelasList(data.kelas);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Tidak dapat terhubung ke server");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const tampil = useMemo(
        () =>
            jadwal.filter(
                (j) => (!filterGuru || j.guruId === filterGuru) && (!filterKelas || j.kelas.toLowerCase() === filterKelas.toLowerCase())
            ),
        [jadwal, filterGuru, filterKelas]
    );

    async function handleDelete(j: Jadwal) {
        if (!confirm(`Hapus jadwal "${j.judul}" (${hariLabel[j.hari]} ${j.jamMulai})?`)) return;
        try {
            const res = await fetch(`/api/admin/jadwal/${j._id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) load();
            else alert(data.message || "Gagal menghapus");
        } catch {
            alert("Tidak dapat terhubung ke server");
        }
    }

    return (
        <div className="p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Jadwal Guru</h1>
                    <p className="mt-1 text-sm text-slate-500">Kelola jadwal mengajar semua guru. Bentrok jam dicek otomatis.</p>
                </div>
                <div className="flex gap-2">
                    <ExportPdfButton
                        label="Export PDF"
                        disabled={loading}
                        getReport={() => ({
                            title: "Jadwal Guru",
                            subtitle: [
                                filterGuru ? `Guru: ${gurus.find((g) => g._id === filterGuru)?.name}` : "Semua guru",
                                filterKelas ? `Kelas: ${filterKelas}` : "Semua kelas",
                            ].join("  |  "),
                            sections: [
                                {
                                    heading: "Daftar jadwal",
                                    head: ["Hari", "Jam", "Mapel / Kegiatan", "Kelas", "Guru"],
                                    body: tampil.map((j) => [hariLabel[j.hari], `${j.jamMulai}-${j.jamSelesai}`, j.judul, j.kelas || "-", j.guruNama]),
                                },
                            ],
                            filename: "jadwal-guru",
                        })}
                    />
                    <button
                        onClick={() => setShowGenerate(true)}
                        className="flex items-center gap-2 rounded-lg border border-[#2F5FEA] bg-white px-3.5 py-2 text-sm font-semibold text-[#2F5FEA] hover:bg-blue-50"
                    >
                        <Sparkles size={16} /> Generate Jadwal
                    </button>
                    <button
                        onClick={() => setModal("TAMBAH")}
                        className="flex items-center gap-2 rounded-lg bg-[#2F5FEA] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                        <Plus size={16} /> Tambah Jadwal
                    </button>
                </div>
            </div>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

            <div className="mt-5 flex flex-wrap gap-3">
                <select value={filterGuru} onChange={(e) => setFilterGuru(e.target.value)} className={`${input} max-w-xs`}>
                    <option value="">Semua guru</option>
                    {gurus.map((g) => (
                        <option key={g._id} value={g._id}>
                            {g.name}
                        </option>
                    ))}
                </select>
                <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className={`${input} max-w-xs`}>
                    <option value="">Semua kelas</option>
                    {kelasList.map((k) => (
                        <option key={k} value={k}>
                            {k}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm">
                <table className="w-full text-left text-sm text-slate-700">
                    <thead>
                        <tr className="text-xs text-slate-400">
                            <th className="px-5 py-3 font-medium">HARI</th>
                            <th className="px-5 py-3 font-medium">JAM</th>
                            <th className="px-5 py-3 font-medium">MAPEL / KEGIATAN</th>
                            <th className="px-5 py-3 font-medium">KELAS</th>
                            <th className="px-5 py-3 font-medium">GURU</th>
                            <th className="px-5 py-3 font-medium">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Memuat data...</td></tr>
                        )}
                        {!loading && tampil.length === 0 && (
                            <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Belum ada jadwal.</td></tr>
                        )}
                        {!loading &&
                            tampil.map((j) => (
                                <tr key={j._id} className="border-t border-slate-50">
                                    <td className="px-5 py-3 font-medium text-slate-800">{hariLabel[j.hari]}</td>
                                    <td className="px-5 py-3 text-slate-600">{j.jamMulai} - {j.jamSelesai}</td>
                                    <td className="px-5 py-3 text-slate-800">{j.judul}</td>
                                    <td className="px-5 py-3 text-slate-600">{j.kelas || <span className="text-slate-300">-</span>}</td>
                                    <td className="px-5 py-3 text-slate-600">{j.guruNama}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex gap-3">
                                            <button onClick={() => setModal(j)} className="text-xs font-medium text-[#2F5FEA] hover:underline">Edit</button>
                                            <button onClick={() => handleDelete(j)} className="text-xs font-medium text-red-500 hover:underline">Hapus</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {modal && (
                <JadwalModal
                    initial={modal === "TAMBAH" ? null : modal}
                    gurus={gurus}
                    kelasList={kelasList}
                    onClose={() => setModal(null)}
                    onSaved={() => {
                        setModal(null);
                        load();
                    }}
                />
            )}

            {showGenerate && (
                <GenerateModal
                    kelasList={kelasList}
                    onClose={() => setShowGenerate(false)}
                    onSaved={() => {
                        setShowGenerate(false);
                        load();
                    }}
                />
            )}
        </div>
    );
}

function JadwalModal({
    initial,
    gurus,
    kelasList,
    onClose,
    onSaved,
}: {
    initial: Jadwal | null;
    gurus: Guru[];
    kelasList: string[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [guruId, setGuruId] = useState(initial?.guruId || "");
    const [judul, setJudul] = useState(initial?.judul || "");
    const [kelas, setKelas] = useState(initial?.kelas || "");
    const [hari, setHari] = useState<Hari>(initial?.hari || "SEN");
    const [jamMulai, setJamMulai] = useState(initial?.jamMulai || "07:00");
    const [jamSelesai, setJamSelesai] = useState(initial?.jamSelesai || "07:45");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch(initial ? `/api/admin/jadwal/${initial._id}` : "/api/admin/jadwal", {
                method: initial ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ guruId, judul, kelas, hari, jamMulai, jamSelesai }),
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
        <Overlay title={initial ? "Edit Jadwal" : "Tambah Jadwal"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <Field label="Guru">
                    <select value={guruId} onChange={(e) => setGuruId(e.target.value)} required className={input}>
                        <option value="">Pilih guru</option>
                        {gurus.map((g) => (
                            <option key={g._id} value={g._id}>{g.name}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Mapel / Kegiatan">
                    <input value={judul} onChange={(e) => setJudul(e.target.value)} required placeholder="cth: Basis Data atau Office Hours" className={input} />
                </Field>
                <Field label="Kelas (kosongkan kalau bukan jam mengajar)">
                    <select value={kelas} onChange={(e) => setKelas(e.target.value)} className={input}>
                        <option value="">- Tidak ada kelas -</option>
                        {kelasList.map((k) => (
                            <option key={k} value={k}>{k}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Hari">
                    <select value={hari} onChange={(e) => setHari(e.target.value as Hari)} className={input}>
                        {HARI.map((h) => (
                            <option key={h.key} value={h.key}>{h.label}</option>
                        ))}
                    </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Jam mulai">
                        <input type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} required className={input} />
                    </Field>
                    <Field label="Jam selesai">
                        <input type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} required className={input} />
                    </Field>
                </div>
                {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
                <SubmitButton loading={loading} label="Simpan Jadwal" />
            </form>
        </Overlay>
    );
}

interface HasilGenerate {
    guruNama: string;
    judul: string;
    kelas: string;
    hari: Hari;
    jamMulai: string;
    jamSelesai: string;
}

function GenerateModal({ kelasList, onClose, onSaved }: { kelasList: string[]; onClose: () => void; onSaved: () => void }) {
    const [kelas, setKelas] = useState("");
    const [sesiPerMinggu, setSesi] = useState(2);
    const [jamMulai, setJamMulai] = useState("07:00");
    const [durasiMenit, setDurasi] = useState(45);
    const [jumlahSlot, setSlot] = useState(8);
    const [istirahatSetelahSlot, setIstSlot] = useState(4);
    const [istirahatMenit, setIstMenit] = useState(30);
    const [ganti, setGanti] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState<{ jadwal: HasilGenerate[]; gagal: { guruNama: string; judul: string; kelas: string; sesiKe: number }[]; dihapus: number } | null>(null);

    async function jalankan(simpan: boolean) {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/jadwal/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ simpan, ganti, kelas, sesiPerMinggu, jamMulai, durasiMenit, jumlahSlot, istirahatSetelahSlot, istirahatMenit }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || "Gagal membuat jadwal");
                return;
            }
            if (simpan) onSaved();
            else setPreview({ jadwal: data.jadwal, gagal: data.gagal, dihapus: data.dihapus });
        } catch {
            setError("Tidak dapat terhubung ke server");
        } finally {
            setLoading(false);
        }
    }

    const ubah = (setter: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(Number(e.target.value));
        setPreview(null);
    };

    return (
        <Overlay title="Generate Jadwal Guru" onClose={onClose} wide>
            <p className="mb-3 text-xs text-slate-500">
                Jadwal dibuat dari data Kelas &amp; Mapel yang sudah diisi guru, tanpa bentrok guru maupun kelas. Lihat pratinjau dulu sebelum disimpan.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Field label="Kelas">
                    <select value={kelas} onChange={(e) => { setKelas(e.target.value); setPreview(null); }} className={input}>
                        <option value="">Semua kelas</option>
                        {kelasList.map((k) => (
                            <option key={k} value={k}>{k}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Pertemuan per minggu">
                    <input type="number" min={1} max={5} value={sesiPerMinggu} onChange={ubah(setSesi)} className={input} />
                </Field>
                <Field label="Jam mulai sekolah">
                    <input type="time" value={jamMulai} onChange={(e) => { setJamMulai(e.target.value); setPreview(null); }} className={input} />
                </Field>
                <Field label="Durasi per jam (menit)">
                    <input type="number" min={30} max={180} value={durasiMenit} onChange={ubah(setDurasi)} className={input} />
                </Field>
                <Field label="Jumlah jam per hari">
                    <input type="number" min={1} max={12} value={jumlahSlot} onChange={ubah(setSlot)} className={input} />
                </Field>
                <Field label="Istirahat setelah jam ke-">
                    <input type="number" min={0} max={12} value={istirahatSetelahSlot} onChange={ubah(setIstSlot)} className={input} />
                </Field>
                <Field label="Lama istirahat (menit)">
                    <input type="number" min={0} max={120} value={istirahatMenit} onChange={ubah(setIstMenit)} className={input} />
                </Field>
            </div>

            <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={ganti} onChange={(e) => { setGanti(e.target.checked); setPreview(null); }} className="mt-0.5" />
                <span>Ganti jadwal mengajar lama milik guru terkait (Office Hours dan kegiatan tanpa kelas tidak dihapus)</span>
            </label>

            {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

            {preview && (
                <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-700">
                        Pratinjau: {preview.jadwal.length} jadwal baru{preview.dihapus > 0 && `, ${preview.dihapus} jadwal lama akan dihapus`}
                    </p>
                    {preview.gagal.length > 0 && (
                        <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            <p className="font-semibold">{preview.gagal.length} pertemuan tidak mendapat slot (jam penuh):</p>
                            <ul className="mt-1 list-disc pl-4">
                                {preview.gagal.slice(0, 6).map((g, i) => (
                                    <li key={i}>{g.judul} - {g.kelas} ({g.guruNama}), pertemuan ke-{g.sesiKe}</li>
                                ))}
                            </ul>
                            <p className="mt-1">Tambah jumlah jam per hari atau kurangi pertemuan per minggu.</p>
                        </div>
                    )}
                    <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-slate-100">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="sticky top-0 bg-slate-50 text-slate-400">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Hari</th>
                                    <th className="px-3 py-2 font-medium">Jam</th>
                                    <th className="px-3 py-2 font-medium">Mapel</th>
                                    <th className="px-3 py-2 font-medium">Kelas</th>
                                    <th className="px-3 py-2 font-medium">Guru</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...preview.jadwal]
                                    .sort((a, b) => HARI.findIndex((h) => h.key === a.hari) - HARI.findIndex((h) => h.key === b.hari) || a.jamMulai.localeCompare(b.jamMulai))
                                    .map((r, i) => (
                                        <tr key={i} className="border-t border-slate-50">
                                            <td className="px-3 py-1.5">{hariLabel[r.hari]}</td>
                                            <td className="px-3 py-1.5">{r.jamMulai}-{r.jamSelesai}</td>
                                            <td className="px-3 py-1.5">{r.judul}</td>
                                            <td className="px-3 py-1.5">{r.kelas}</td>
                                            <td className="px-3 py-1.5">{r.guruNama}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => jalankan(false)} disabled={loading} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                    {loading && !preview ? "Memproses..." : "Pratinjau"}
                </button>
                <button type="button" onClick={() => jalankan(true)} disabled={loading || !preview || preview.jadwal.length === 0} className="flex-1 rounded-lg bg-[#0B1440] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">
                    Simpan Jadwal
                </button>
            </div>
        </Overlay>
    );
}

function Overlay({ title, onClose, wide, children }: { title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 text-slate-900 shadow-xl ${wide ? "max-w-2xl" : "max-w-md"}`}>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
            {children}
        </div>
    );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
    return (
        <button type="submit" disabled={loading} className="mt-2 w-full rounded-lg bg-[#0B1440] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
            {loading ? "Menyimpan..." : label}
        </button>
    );
}