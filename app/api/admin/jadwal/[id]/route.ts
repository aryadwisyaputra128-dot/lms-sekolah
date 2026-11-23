import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { JadwalLean, findConflict, validateJadwal } from "@/lib/jadwal";
import Schedule from "@/models/Schedule";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        const { id } = await params;
        await connectDB();

        const existing = (await Schedule.findById(id).lean()) as unknown as JadwalLean | null;
        if (!existing) {
            return NextResponse.json({ success: false, message: "Jadwal tidak ditemukan" }, { status: 404 });
        }

        const body = (await req.json()) as Record<string, unknown>;
        const merged = {
            guruId: existing.guruId.toString(),
            judul: existing.judul,
            kelas: existing.kelas || "",
            hari: existing.hari,
            jamMulai: existing.jamMulai,
            jamSelesai: existing.jamSelesai,
            ...body,
        };

        const parsed = validateJadwal(merged);
        if ("error" in parsed) {
            return NextResponse.json({ success: false, message: parsed.error }, { status: 400 });
        }
        const data = parsed.data;

        const conflict = await findConflict(data, id);
        if (conflict) {
            return NextResponse.json({ success: false, message: conflict }, { status: 409 });
        }

        const { kelas, ...rest } = data;
        await Schedule.findByIdAndUpdate(id, kelas ? { $set: { ...rest, kelas } } : { $set: rest, $unset: { kelas: "" } });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Admin jadwal PATCH error:", err);
        return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: Ctx) {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        const { id } = await params;
        await connectDB();
        const deleted = await Schedule.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ success: false, message: "Jadwal tidak ditemukan" }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Admin jadwal DELETE error:", err);
        return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
    }
}