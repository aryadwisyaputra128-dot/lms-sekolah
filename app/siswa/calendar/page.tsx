"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";

type Hari = "SEN" | "SEL" | "RAB" | "KAM" | "JUM";

interface ScheduleItem {
    _id: string;
    judul: string;
    hari: Hari;
    jamMulai: string;
    jamSelesai: string;
    namaGuru: string;
    zoomLink: string | null;
}

interface Deadline {
    _id: string;
    namaUjian: string;
    tipe: "EXAM" | "QUIZ";
    mapel?: string;
    tenggat: string;
}

const HARI_LIST: Hari[] = ["SEN", "SEL", "RAB", "KAM", "JUM"];
const HARI_LABEL: Record<Hari, string> = {
    SEN: "Senin",
    SEL: "Selasa",
    RAB: "Rabu",
    KAM: "Kamis",
    JUM: "Jumat",
};
const HARI_DARI_INDEX: Record<number, Hari> = { 1: "SEN", 2: "SEL", 3: "RAB", 4: "KAM", 5: "JUM" };
const BULAN = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const HARI_PENDEK = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

// hanya izinkan link http(s)
function linkAman(link?: string | null) {
    return !!link && /^https?:\/\//i.test(link);
}

export default function SiswaCalendarPage() {
    const [kelas, setKelas] = useState<string | null>(null);
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [loading, setLoading] = useState(true);
    const [bulan, setBulan] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/siswa/calendar");
            const data = await res.json();
            if (data.success) {
                setKelas(data.kelas);
                setSchedules(data.schedules);
                setDeadlines(data.deadlines);
            }
        } catch (err) {
            console.error("Fetch calendar error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const hariIni = HARI_DARI_INDEX[new Date().getDay()]; // undefined kalau akhir pekan
    const today = new Date();

    // kalender bulanan (minggu dimulai hari Senin)
    const tahun = bulan.getFullYear();
    const idxBulan = bulan.getMonth();
    const jumlahHari = new Date(tahun, idxBulan + 1, 0).getDate();
    const offset = (new Date(tahun, idxBulan, 1).getDay() + 6) % 7;
    const sel: (number | null)[] = [
        ...Array(offset).fill(null),
        ...Array.from({ length: jumlahHari }, (_, i) => i + 1),
    ];

    const tanggalAdaTenggat = useMemo(() => {
        const set = new Set<number>();
        for (const d of deadlines) {
            const t = new Date(d.tenggat);
            if (t.getFullYear() === tahun && t.getMonth() === idxBulan) set.add(t.getDate());
        }
        return set;
    }, [deadlines, tahun, idxBulan]);

    function adalahHariIni(tgl: number) {
        return (
            today.getFullYear() === tahun && today.getMonth() === idxBulan && today.getDate() === tgl
        );
    }

    function geserBulan(arah: number) {
        setBulan(new Date(tahun, idxBulan + arah, 1));
    }

    function formatTenggat(iso: string) {
        return new Date(iso).toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function mendesak(iso: string) {
        return new Date(iso).getTime() - Date.now() < 48 * 60 * 60 * 1000;
    }

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold text-slate-900">Jadwal Pelajaran</h1>
            <p className="mt-1 text-sm text-slate-400">
                {kelas ? `Kelas ${kelas} — ` : ""}Lihat jadwal pelajaran dan tenggat tugasmu.
            </p>

            {!loading && !kelas && (
                <div className="mt-6 rounded-2xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
                    Kelas kamu belum terdaftar. Hubungi admin sekolah untuk mendaftarkan kelasmu.
                </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* jadwal mingguan */}
                <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
                    <p className="text-sm font-semibold text-slate-700">Jadwal Mingguan</p>

                    {loading && <p className="py-6 text-center text-sm text-slate-400">Memuat...</p>}

                    {!loading && kelas && schedules.length === 0 && (
                        <p className="py-6 text-center text-sm text-slate-400">
                            Belum ada jadwal untuk kelasmu. Jadwal akan muncul setelah guru menambahkannya.
                        </p>
                    )}

                    {!loading && schedules.length > 0 && (
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            {HARI_LIST.map((h) => {
                                const items = schedules
                                    .filter((s) => s.hari === h)
                                    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
                                const aktif = h === hariIni;
                                return (
                                    <div
                                        key={h}
                                        className={`rounded-xl p-3 ${aktif ? "bg-blue-50 ring-1 ring-[#2F5FEA]" : "bg-slate-50"
                                            }`}
                                    >
                                        <p
                                            className={`text-xs font-semibold uppercase tracking-wide ${aktif ? "text-[#2F5FEA]" : "text-slate-400"
                                                }`}
                                        >
                                            {HARI_LABEL[h]}
                                            {aktif && " • Hari ini"}
                                        </p>

                                        <div className="mt-2 space-y-2">
                                            {items.length === 0 && (
                                                <p className="py-2 text-xs text-slate-300">Tidak ada jadwal</p>
                                            )}
                                            {items.map((s) => (
                                                <div
                                                    key={s._id}
                                                    className="rounded-lg border-l-4 border-[#2F5FEA] bg-white p-2.5 shadow-sm"
                                                >
                                                    <p className="text-sm font-semibold text-slate-800">{s.judul}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {s.jamMulai}–{s.jamSelesai}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{s.namaGuru}</p>
                                                    {linkAman(s.zoomLink) && (
                                                        <a
                                                            href={s.zoomLink!}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#2F5FEA] hover:underline"
                                                        >
                                                            <Video size={12} /> Gabung Kelas Virtual
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* kalender + tenggat */}
                <div className="space-y-6">
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-700">
                                {BULAN[idxBulan]} {tahun}
                            </p>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => geserBulan(-1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                                    aria-label="Bulan sebelumnya"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <button
                                    onClick={() => geserBulan(1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                                    aria-label="Bulan berikutnya"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-medium text-slate-400">
                            {HARI_PENDEK.map((h) => (
                                <div key={h} className="py-1">
                                    {h}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 text-center">
                            {sel.map((tgl, i) =>
                                tgl === null ? (
                                    <div key={`k${i}`} />
                                ) : (
                                    <div key={tgl} className="flex flex-col items-center py-0.5">
                                        <span
                                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${adalahHariIni(tgl)
                                                    ? "bg-[#2F5FEA] font-semibold text-white"
                                                    : "text-slate-700"
                                                }`}
                                        >
                                            {tgl}
                                        </span>
                                        <span
                                            className={`mt-0.5 h-1 w-1 rounded-full ${tanggalAdaTenggat.has(tgl) ? "bg-red-500" : "bg-transparent"
                                                }`}
                                        />
                                    </div>
                                )
                            )}
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400">Titik merah = ada tenggat tugas.</p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-700">Tenggat Mendatang</p>
                        <div className="mt-3 space-y-3">
                            {!loading && deadlines.length === 0 && (
                                <p className="py-3 text-center text-xs text-slate-400">
                                    Tidak ada tenggat tugas yang akan datang.
                                </p>
                            )}
                            {deadlines.slice(0, 6).map((d) => (
                                <div key={d._id} className="flex items-start gap-2.5">
                                    <span
                                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${mendesak(d.tenggat) ? "bg-red-500" : "bg-[#2F5FEA]"
                                            }`}
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{d.namaUjian}</p>
                                        <p className="text-xs text-slate-400">
                                            {d.mapel ? `${d.mapel} • ` : ""}
                                            {formatTenggat(d.tenggat)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}