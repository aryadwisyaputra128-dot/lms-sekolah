import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { DAYS, JadwalLean, isValidTime, normKelas, overlap, toHHmm, toMin } from "@/lib/jadwal";
import Schedule from "@/models/Schedule";
import TeachingAssignment from "@/models/TeachingAssignment";
import User from "@/models/User";

interface Body {
    simpan?: boolean; // false = pratinjau saja, true = simpan ke database
    ganti?: boolean; // true = hapus jadwal mengajar lama milik guru terkait sebelum menyimpan
    kelas?: string; // kosong = semua kelas
    sesiPerMinggu?: number;
    jamMulai?: string;
    durasiMenit?: number;
    jumlahSlot?: number;
    istirahatSetelahSlot?: number;
    istirahatMenit?: number;
}

function num(v: unknown, def: number, min: number, max: number): number {
    const n = Number(v);
    if (!Number.isFinite(n)) return def;
    return Math.min(max, Math.max(min, Math.round(n)));
}

type Interval = [number, number];

export async function POST(req: Request) {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        const b = (await req.json()) as Body;

        const sesi = num(b.sesiPerMinggu, 2, 1, 5);
        const durasi = num(b.durasiMenit, 45, 30, 180);
        const jumlahSlot = num(b.jumlahSlot, 8, 1, 12);
        const istSetelah = num(b.istirahatSetelahSlot, 0, 0, 12);
        const istMenit = num(b.istirahatMenit, 0, 0, 120);
        const jamMulai = isValidTime(b.jamMulai) ? b.jamMulai : "07:00";

        // Susun slot jam dalam sehari
        const slots: Interval[] = [];
        let t = toMin(jamMulai);
        for (let i = 0; i < jumlahSlot; i++) {
            slots.push([t, t + durasi]);
            t += durasi;
            if (istSetelah === i + 1) t += istMenit;
        }

        await connectDB();

        const semua = (await TeachingAssignment.find({}).sort({ guruId: 1, namaMapel: 1 }).lean()) as unknown as {
            guruId: { toString(): string };
            namaMapel: string;
            kelas: string;
        }[];
        const assignments = b.kelas ? semua.filter((a) => normKelas(a.kelas) === normKelas(b.kelas)) : semua;

        if (assignments.length === 0) {
            return NextResponse.json(
                { success: false, message: "Belum ada penugasan mapel guru. Isi dulu di menu Mapel Guru." },
                { status: 400 }
            );
        }

        const existing = (await Schedule.find({}).lean()) as unknown as JadwalLean[];
        const guruIds = new Set(assignments.map((a) => a.guruId.toString()));

        // Jadwal lama yang akan diganti: jam mengajar kelas milik guru terkait (Office Hours tidak ikut)
        const toDelete = b.ganti
            ? existing.filter(
                (s) =>
                    s.kelas &&
                    guruIds.has(s.guruId.toString()) &&
                    (!b.kelas || normKelas(s.kelas) === normKelas(b.kelas))
            )
            : [];
        const deleteIds = new Set(toDelete.map((s) => s._id.toString()));
        const kept = existing.filter((s) => !deleteIds.has(s._id.toString()));

        // Peta jam yang sudah terpakai per guru/hari dan per kelas/hari
        const busy = new Map<string, Interval[]>();
        const addBusy = (key: string, iv: Interval) => {
            const list = busy.get(key) || [];
            list.push(iv);
            busy.set(key, list);
        };
        const isFree = (key: string, iv: Interval) =>
            !(busy.get(key) || []).some((x) => overlap(iv[0], iv[1], x[0], x[1]));

        for (const s of kept) {
            const iv: Interval = [toMin(s.jamMulai), toMin(s.jamSelesai)];
            addBusy(`g|${s.guruId.toString()}|${s.hari}`, iv);
            if (s.kelas) addBusy(`k|${normKelas(s.kelas)}|${s.hari}`, iv);
        }

        const guruRows = (await User.find({ _id: { $in: Array.from(guruIds) } })
            .select("name")
            .lean()) as unknown as { _id: { toString(): string }; name: string }[];
        const namaGuru = new Map(guruRows.map((g) => [g._id.toString(), g.name]));

        const hasil: {
            guruId: string;
            guruNama: string;
            judul: string;
            kelas: string;
            hari: string;
            jamMulai: string;
            jamSelesai: string;
        }[] = [];
        const gagal: { guruNama: string; judul: string; kelas: string; sesiKe: number }[] = [];

        const usedDays = assignments.map(() => new Set<string>());
        const load = new Map<string, number>();
        const bump = (key: string) => load.set(key, (load.get(key) || 0) + 1);

        // Putaran per sesi supaya semua mapel kebagian slot awal secara adil
        for (let s = 0; s < sesi; s++) {
            assignments.forEach((a, idx) => {
                const gid = a.guruId.toString();
                const kn = normKelas(a.kelas);

                const days = [...DAYS].sort((d1, d2) => {
                    const score = (d: string) =>
                        (usedDays[idx].has(d) ? 100 : 0) +
                        (load.get(`k|${kn}|${d}`) || 0) * 2 +
                        (load.get(`g|${gid}|${d}`) || 0);
                    return score(d1) - score(d2);
                });

                for (const day of days) {
                    const slot = slots.find((iv) => isFree(`g|${gid}|${day}`, iv) && isFree(`k|${kn}|${day}`, iv));
                    if (!slot) continue;

                    addBusy(`g|${gid}|${day}`, slot);
                    addBusy(`k|${kn}|${day}`, slot);
                    bump(`g|${gid}|${day}`);
                    bump(`k|${kn}|${day}`);
                    usedDays[idx].add(day);

                    hasil.push({
                        guruId: gid,
                        guruNama: namaGuru.get(gid) || "(guru)",
                        judul: a.namaMapel,
                        kelas: a.kelas,
                        hari: day,
                        jamMulai: toHHmm(slot[0]),
                        jamSelesai: toHHmm(slot[1]),
                    });
                    return;
                }

                gagal.push({ guruNama: namaGuru.get(gid) || "(guru)", judul: a.namaMapel, kelas: a.kelas, sesiKe: s + 1 });
            });
        }

        if (b.simpan) {
            if (deleteIds.size) await Schedule.deleteMany({ _id: { $in: Array.from(deleteIds) } });
            if (hasil.length) {
                await Schedule.insertMany(
                    hasil.map((r) => ({
                        guruId: r.guruId,
                        judul: r.judul,
                        kelas: r.kelas,
                        hari: r.hari,
                        jamMulai: r.jamMulai,
                        jamSelesai: r.jamSelesai,
                    }))
                );
            }
        }

        return NextResponse.json({
            success: true,
            tersimpan: !!b.simpan,
            jadwal: hasil,
            gagal,
            dihapus: deleteIds.size,
        });
    } catch (err) {
        console.error("Admin jadwal generate error:", err);
        return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
    }
}