import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { DAYS, JadwalLean, findConflict, toMin, validateJadwal } from "@/lib/jadwal";
import Schedule from "@/models/Schedule";
import User from "@/models/User";
import Kelas from "@/models/Kelas";

export async function GET() {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        await connectDB();

        const [rows, gurus, kelas] = await Promise.all([
            Schedule.find({}).lean(),
            User.find({ role: "GURU" }).select("name").sort({ name: 1 }).lean(),
            Kelas.find({}).select("namaKelas").sort({ namaKelas: 1 }).lean(),
        ]);

        const guruList = gurus as unknown as { _id: { toString(): string }; name: string }[];
        const namaGuru = new Map(guruList.map((g) => [g._id.toString(), g.name]));

        const jadwal = (rows as unknown as JadwalLean[])
            .map((s) => ({
                _id: s._id.toString(),
                guruId: s.guruId.toString(),
                guruNama: namaGuru.get(s.guruId.toString()) || "(guru dihapus)",
                judul: s.judul,
                kelas: s.kelas || "",
                hari: s.hari,
                jamMulai: s.jamMulai,
                jamSelesai: s.jamSelesai,
            }))
            .sort(
                (a, b) =>
                    DAYS.indexOf(a.hari as (typeof DAYS)[number]) - DAYS.indexOf(b.hari as (typeof DAYS)[number]) ||
                    toMin(a.jamMulai) - toMin(b.jamMulai)
            );

        return NextResponse.json({
            success: true,
            jadwal,
            gurus: guruList.map((g) => ({ _id: g._id.toString(), name: g.name })),
            kelas: (kelas as unknown as { namaKelas: string }[]).map((k) => k.namaKelas),
        });
    } catch (err) {
        console.error("Admin jadwal GET error:", err);
        return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        const parsed = validateJadwal(await req.json());
        if ("error" in parsed) {
            return NextResponse.json({ success: false, message: parsed.error }, { status: 400 });
        }
        const data = parsed.data;

        await connectDB();

        const guru = await User.findOne({ _id: data.guruId, role: "GURU" }).select("_id").lean();
        if (!guru) {
            return NextResponse.json({ success: false, message: "Guru tidak ditemukan" }, { status: 404 });
        }

        const conflict = await findConflict(data);
        if (conflict) {
            return NextResponse.json({ success: false, message: conflict }, { status: 409 });
        }

        await Schedule.create(data);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Admin jadwal POST error:", err);
        return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
    }
}