import { NextResponse } from "next/server";

import { connectDB } from "../../../../../../../lib/mongodb";
import { getCurrentUser } from "../../../../../../../lib/auth";
import Assessment from "../../../../../../../models/Assessment";
import Soal from "../../../../../../../models/Soal";

// DELETE /api/guru/assessments/[id]/soal/[soalId]
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; soalId: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "GURU") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();
        const { id, soalId } = await params;

        // pastikan ujiannya memang milik guru ini
        const assessment = await Assessment.findOne({ _id: id, guruId: currentUser.id });
        if (!assessment) {
            return NextResponse.json(
                { success: false, message: "Ujian tidak ditemukan" },
                { status: 404 }
            );
        }

        const deleted = await Soal.findOneAndDelete({ _id: soalId, assessmentId: id });
        if (!deleted) {
            return NextResponse.json(
                { success: false, message: "Soal tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: "Soal berhasil dihapus" });
    } catch (error) {
        console.error("Delete Soal Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal menghapus soal" },
            { status: 500 }
        );
    }
}