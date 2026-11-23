import { NextResponse } from "next/server";

import { connectDB } from "../../../../../lib/mongodb";
import { getCurrentUser } from "../../../../../lib/auth";
import Assessment from "../../../../../models/Assessment";
import Soal from "../../../../../models/Soal";
import Submission from "../../../../../models/Submission";

// GET /api/guru/submissions/[id]
export async function GET(
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

        const submission = await Submission.findById(id).lean();
        if (!submission) {
            return NextResponse.json(
                { success: false, message: "Jawaban tidak ditemukan" },
                { status: 404 }
            );
        }

        // pastikan ujiannya milik guru ini
        const assessment = await Assessment.findOne({
            _id: submission.assessmentId,
            guruId: currentUser.id,
        })
            .select("namaUjian tipe mapel kelas")
            .lean();

        if (!assessment) {
            return NextResponse.json(
                { success: false, message: "Jawaban tidak ditemukan" },
                { status: 404 }
            );
        }

        const soalList = await Soal.find({ assessmentId: submission.assessmentId })
            .sort({ createdAt: 1 })
            .lean();

        return NextResponse.json({ success: true, submission, assessment, soalList });
    } catch (error) {
        console.error("Get Submission Detail Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil detail jawaban" },
            { status: 500 }
        );
    }
}