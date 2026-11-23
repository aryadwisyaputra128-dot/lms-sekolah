import { NextResponse } from "next/server";

import { connectDB } from "../../../../../lib/mongodb";
import Kelas from "../../../../../models/Kelas";

// PATCH /api/admin/kelas/[id]
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();

        const updates: Record<string, unknown> = {};
        if (body.namaKelas !== undefined) updates.namaKelas = body.namaKelas;
        if (body.jurusan !== undefined) updates.jurusan = body.jurusan;
        if (body.mataPelajaran !== undefined) {
            updates.mataPelajaran = Array.isArray(body.mataPelajaran)
                ? body.mataPelajaran
                : String(body.mataPelajaran)
                    .split(",")
                    .map((m: string) => m.trim())
                    .filter(Boolean);
        }

        const updated = await Kelas.findByIdAndUpdate(id, updates, { new: true });

        if (!updated) {
            return NextResponse.json(
                { success: false, message: "Kelas tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, kelas: updated });
    } catch (error) {
        console.error("Update Kelas Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal update kelas" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/kelas/[id]
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const deleted = await Kelas.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json(
                { success: false, message: "Kelas tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: "Kelas berhasil dihapus" });
    } catch (error) {
        console.error("Delete Kelas Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal hapus kelas" },
            { status: 500 }
        );
    }
}