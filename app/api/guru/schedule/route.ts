import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import Schedule from "../../../../models/Schedule";

// GET /api/guru/schedule
export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "GURU") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        const schedules = await Schedule.find({ guruId: currentUser.id })
            .sort({ jamMulai: 1 })
            .lean();

        return NextResponse.json({ success: true, schedules });
    } catch (error) {
        console.error("Get Schedule Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil jadwal" },
            { status: 500 }
        );
    }
}

// POST /api/guru/schedule
export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "GURU") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { judul, kelas, hari, jamMulai, jamSelesai } = body;

        if (!judul || !hari || !jamMulai || !jamSelesai) {
            return NextResponse.json(
                { success: false, message: "Judul, hari, jam mulai, dan jam selesai wajib diisi" },
                { status: 400 }
            );
        }

        const newSchedule = await Schedule.create({
            guruId: currentUser.id,
            judul,
            kelas,
            hari,
            jamMulai,
            jamSelesai,
        });

        return NextResponse.json({ success: true, schedule: newSchedule });
    } catch (error) {
        console.error("Create Schedule Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal membuat jadwal" },
            { status: 500 }
        );
    }
}