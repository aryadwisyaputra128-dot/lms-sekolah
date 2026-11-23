import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import Assessment from "../../../../models/Assessment";
import User from "../../../../models/User";
import Submission from "../../../../models/Submission";
import Soal from "../../../../models/Soal";

// GET /api/guru/assessments
export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "GURU") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        const assessments = await Assessment.find({ guruId: currentUser.id })
            .sort({ createdAt: -1 })
            .lean();

        const withDetail = await Promise.all(
            assessments.map(async (a) => {
                const [totalPeserta, jumlahSubmission, jumlahSoal] = await Promise.all([
                    User.countDocuments({ role: "MURID", kelas: a.kelas }),
                    Submission.countDocuments({ assessmentId: a._id }),
                    Soal.countDocuments({ assessmentId: a._id }),
                ]);
                return { ...a, totalPeserta, jumlahSubmission, jumlahSoal };
            })
        );

        return NextResponse.json({ success: true, assessments: withDetail });
    } catch (error) {
        console.error("Get Guru Assessments Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data ujian" },
            { status: 500 }
        );
    }
}

// POST /api/guru/assessments
export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "GURU") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { namaUjian, tipe, kelas, mapel, status, tenggat } = body;

        if (!namaUjian || !kelas) {
            return NextResponse.json(
                { success: false, message: "Nama ujian dan kelas wajib diisi" },
                { status: 400 }
            );
        }

        let tenggatDate: Date | undefined;
        if (tenggat) {
            tenggatDate = new Date(tenggat);
            if (Number.isNaN(tenggatDate.getTime())) {
                return NextResponse.json(
                    { success: false, message: "Format tenggat tidak valid" },
                    { status: 400 }
                );
            }
        }

        const newAssessment = await Assessment.create({
            namaUjian,
            tipe: tipe || "EXAM",
            kelas,
            mapel,
            status: status || "SCHEDULED",
            guruId: currentUser.id,
            tenggat: tenggatDate,
        });

        return NextResponse.json({ success: true, assessment: newAssessment });
    } catch (error) {
        console.error("Create Guru Assessment Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal membuat ujian" },
            { status: 500 }
        );
    }
}