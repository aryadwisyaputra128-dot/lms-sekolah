import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import TeachingAssignment from "../../../../models/TeachingAssignment";
import User from "../../../../models/User";

// GET /api/guru/academic
export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "GURU") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        const assignments = await TeachingAssignment.find({ guruId: currentUser.id })
            .sort({ createdAt: -1 })
            .lean();

        const withCounts = await Promise.all(
            assignments.map(async (a) => {
                const jumlahSiswa = await User.countDocuments({ role: "MURID", kelas: a.kelas });
                return { ...a, jumlahSiswa };
            })
        );

        const totalSiswa = withCounts.reduce((sum, a) => sum + a.jumlahSiswa, 0);

        return NextResponse.json({
            success: true,
            stats: {
                totalSiswa,
                kelasAktif: assignments.length,
            },
            assignments: withCounts,
        });
    } catch (error) {
        console.error("Get Academic Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data academic" },
            { status: 500 }
        );
    }
}

// POST /api/guru/academic
export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "GURU") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { namaMapel, kelas, warna } = body;

        if (!namaMapel || !kelas) {
            return NextResponse.json(
                { success: false, message: "Nama mata pelajaran dan kelas wajib diisi" },
                { status: 400 }
            );
        }

        const newAssignment = await TeachingAssignment.create({
            guruId: currentUser.id,
            namaMapel,
            kelas,
            warna: warna || "indigo",
        });

        return NextResponse.json({ success: true, assignment: newAssignment });
    } catch (error) {
        console.error("Create Academic Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal membuat penugasan mengajar" },
            { status: 500 }
        );
    }
}