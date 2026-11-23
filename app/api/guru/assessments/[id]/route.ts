import { NextResponse } from "next/server";

import { connectDB } from "../../../../../lib/mongodb";
import { getCurrentUser } from "../../../../../lib/auth";
import Assessment from "../../../../../models/Assessment";
import Soal from "../../../../../models/Soal";
import Submission from "../../../../../models/Submission";

// PATCH /api/guru/assessments/[id]
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "GURU") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;
        const body = await request.json();

        const updates: Record<string, unknown> = {};
        if (body.status !== undefined) updates.status = body.status;
        if (body.namaUjian !== undefined) updates.namaUjian = body.namaUjian;

        const updated = await Assessment.findOneAndUpdate(
            { _id: id, guruId: currentUser.id },
            updates,
            { new: true }
        );

        if (!updated) {
            return NextResponse.json(
                { success: false, message: "Ujian tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, assessment: updated });
    } catch (error) {
        console.error("Update Guru Assessment Error:", error);
        return NextResponse.json({ success: false, message: "Gagal update" }, { status: 500 });
    }
}

// DELETE /api/guru/assessments/[id]
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "GURU") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;

        const deleted = await Assessment.findOneAndDelete({ _id: id, guruId: currentUser.id });

        if (!deleted) {
            return NextResponse.json(
                { success: false, message: "Ujian tidak ditemukan" },
                { status: 404 }
            );
        }

        // bersihkan data terkait biar tidak nyangkut
        await Promise.all([
            Soal.deleteMany({ assessmentId: id }),
            Submission.deleteMany({ assessmentId: id }),
        ]);

        return NextResponse.json({ success: true, message: "Ujian berhasil dihapus" });
    } catch (error) {
        console.error("Delete Guru Assessment Error:", error);
        return NextResponse.json({ success: false, message: "Gagal menghapus" }, { status: 500 });
    }
}