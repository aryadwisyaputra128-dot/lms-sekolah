import { NextResponse } from "next/server";

import { connectDB } from "../../../../../../lib/mongodb";
import { getCurrentUser } from "../../../../../../lib/auth";
import Assessment from "../../../../../../models/Assessment";
import Soal from "../../../../../../models/Soal";

// GET /api/guru/assessments/[id]/soal
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

        const assessment = await Assessment.findOne({ _id: id, guruId: currentUser.id }).lean();
        if (!assessment) {
            return NextResponse.json(
                { success: false, message: "Ujian tidak ditemukan" },
                { status: 404 }
            );
        }

        const soalList = await Soal.find({ assessmentId: id }).sort({ createdAt: 1 }).lean();

        return NextResponse.json({ success: true, assessment, soalList });
    } catch (error) {
        console.error("Get Soal Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data soal" },
            { status: 500 }
        );
    }
}

// POST /api/guru/assessments/[id]/soal
export async function POST(
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

        const assessment = await Assessment.findOne({ _id: id, guruId: currentUser.id });
        if (!assessment) {
            return NextResponse.json(
                { success: false, message: "Ujian tidak ditemukan" },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { mapel, tipeSoal, pertanyaan, pilihan } = body;

        if (!pertanyaan) {
            return NextResponse.json(
                { success: false, message: "Pertanyaan wajib diisi" },
                { status: 400 }
            );
        }

        if (tipeSoal === "PILIHAN_GANDA") {
            const hasKunci = Array.isArray(pilihan) && pilihan.some((p: { benar: boolean }) => p.benar);
            if (!hasKunci) {
                return NextResponse.json(
                    { success: false, message: "Pilih salah satu jawaban sebagai kunci jawaban benar" },
                    { status: 400 }
                );
            }
        }

        const newSoal = await Soal.create({
            assessmentId: id,
            mapel: mapel || assessment.mapel || "",
            tipeSoal: tipeSoal || "PILIHAN_GANDA",
            pertanyaan,
            pilihan: tipeSoal === "ESSAY" ? [] : pilihan,
        });

        return NextResponse.json({ success: true, soal: newSoal });
    } catch (error) {
        console.error("Create Soal Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal menyimpan soal" },
            { status: 500 }
        );
    }
}