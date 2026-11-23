import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import Assessment from "../../../../models/Assessment";
import User from "../../../../models/User";

// GET /api/admin/assessments
export async function GET() {
    try {
        await connectDB();

        const assessments = await Assessment.find().sort({ createdAt: -1 }).lean();

        // hitung jumlah peserta (siswa di kelas terkait) untuk tiap assessment
        const withParticipants = await Promise.all(
            assessments.map(async (a) => {
                const totalPeserta = await User.countDocuments({
                    role: "MURID",
                    kelas: a.kelas,
                });
                return { ...a, totalPeserta };
            })
        );

        const counts = {
            totalAktif: assessments.filter((a) => a.status === "LIVE").length,
            totalScheduled: assessments.filter((a) => a.status === "SCHEDULED").length,
            totalArchived: assessments.filter((a) => a.status === "ARCHIVED").length,
            total: assessments.length,
        };

        return NextResponse.json({
            success: true,
            counts,
            assessments: withParticipants,
        });
    } catch (error) {
        console.error("Get Assessments Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data assessment" },
            { status: 500 }
        );
    }
}

// POST /api/admin/assessments
export async function POST(request: Request) {
    try {
        await connectDB();

        const body = await request.json();
        const { namaUjian, tipe, kelas, mapel, status } = body;

        if (!namaUjian || !kelas) {
            return NextResponse.json(
                { success: false, message: "Nama ujian dan kelas wajib diisi" },
                { status: 400 }
            );
        }

        const newAssessment = await Assessment.create({
            namaUjian,
            tipe: tipe || "EXAM",
            kelas,
            mapel,
            status: status || "SCHEDULED",
        });

        return NextResponse.json({
            success: true,
            message: "Assessment berhasil dibuat",
            assessment: newAssessment,
        });
    } catch (error) {
        console.error("Create Assessment Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal membuat assessment" },
            { status: 500 }
        );
    }
}