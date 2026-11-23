import { NextResponse } from "next/server";

import { connectDB } from "../../../../../../lib/mongodb";
import { getCurrentUser } from "../../../../../../lib/auth";
import Assessment from "../../../../../../models/Assessment";
import Soal from "../../../../../../models/Soal";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || currentUser.role !== "MURID") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Tidak diizinkan",
                },
                { status: 401 }
            );
        }

        await connectDB();

        const { id } = await params;

        const assessment = await Assessment.findById(id)
            .select("namaUjian mapel kelas status")
            .lean();

        if (!assessment) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Ujian tidak ditemukan",
                },
                { status: 404 }
            );
        }

        const soalList = await Soal.find({
            assessmentId: id,
        })
            .select("_id tipeSoal pertanyaan pilihan.teks")
            .sort({ createdAt: 1 })
            .lean();

        return NextResponse.json({
            success: true,
            assessment,
            soalList,
        });
    } catch (error) {
        console.error("Get Siswa Soal Error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Gagal mengambil soal",
            },
            { status: 500 }
        );
    }
}
