import { NextResponse } from "next/server";

import { connectDB } from "../../../../../lib/mongodb";
import Assessment from "../../../../../models/Assessment";

// PATCH /api/admin/assessments/[id]
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();

        const allowedFields = ["namaUjian", "tipe", "kelas", "mapel", "status"];
        const updates: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) updates[field] = body[field];
        }

        const updated = await Assessment.findByIdAndUpdate(id, updates, { new: true });

        if (!updated) {
            return NextResponse.json(
                { success: false, message: "Assessment tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, assessment: updated });
    } catch (error) {
        console.error("Update Assessment Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal update assessment" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/assessments/[id]
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const deleted = await Assessment.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json(
                { success: false, message: "Assessment tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: "Assessment berhasil dihapus" });
    } catch (error) {
        console.error("Delete Assessment Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal hapus assessment" },
            { status: 500 }
        );
    }
}