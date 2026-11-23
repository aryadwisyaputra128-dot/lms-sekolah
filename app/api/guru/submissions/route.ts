import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import Assessment from "../../../../models/Assessment";
import Submission from "../../../../models/Submission";

// GET /api/guru/submissions?tipe=ALL|QUIZ|EXAM
export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "GURU") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        // ambil semua id assessment milik guru ini
        const myAssessments = await Assessment.find({ guruId: currentUser.id }).select("_id tipe").lean();
        const assessmentIds = myAssessments.map((a) => a._id);

        const { searchParams } = new URL(request.url);
        const tipe = searchParams.get("tipe") || "ALL";

        let filterIds = assessmentIds;
        if (tipe === "QUIZ" || tipe === "EXAM") {
            filterIds = myAssessments.filter((a) => a.tipe === tipe).map((a) => a._id);
        }

        const submissions = await Submission.find({ assessmentId: { $in: filterIds } })
            .populate("assessmentId", "namaUjian tipe")
            .sort({ submittedAt: -1 })
            .lean();

        return NextResponse.json({ success: true, submissions });
    } catch (error) {
        console.error("Get Submissions Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data submission" },
            { status: 500 }
        );
    }
}

// PATCH /api/guru/submissions  (body: { id, nilai })
export async function PATCH(request: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "GURU") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { id, nilai } = body;

        if (!id || nilai === undefined || nilai === null || nilai === "") {
            return NextResponse.json(
                { success: false, message: "id dan nilai wajib diisi" },
                { status: 400 }
            );
        }

        const nilaiAngka = Number(nilai);
        if (Number.isNaN(nilaiAngka) || nilaiAngka < 0 || nilaiAngka > 100) {
            return NextResponse.json(
                { success: false, message: "Nilai harus berupa angka 0 sampai 100" },
                { status: 400 }
            );
        }

        // pastikan submission ini memang milik ujian si guru yang login
        const target = await Submission.findById(id).select("assessmentId").lean();
        const punyaGuru = target
            ? await Assessment.exists({ _id: target.assessmentId, guruId: currentUser.id })
            : null;

        if (!target || !punyaGuru) {
            return NextResponse.json(
                { success: false, message: "Submission tidak ditemukan" },
                { status: 404 }
            );
        }

        const updated = await Submission.findByIdAndUpdate(
            id,
            { nilai: nilaiAngka, status: "GRADED" },
            { new: true }
        );

        return NextResponse.json({ success: true, submission: updated });
    } catch (error) {
        console.error("Grade Submission Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal menyimpan nilai" },
            { status: 500 }
        );
    }
}