import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import Kelas from "../../../../models/Kelas";

// GET /api/admin/kelas
export async function GET() {
    try {
        await connectDB();

        const kelasList = await Kelas.find().sort({ namaKelas: 1 }).lean();

        return NextResponse.json({
            success: true,
            count: kelasList.length,
            kelas: kelasList,
        });
    } catch (error) {
        console.error("Get Kelas Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data kelas" },
            { status: 500 }
        );
    }
}

// POST /api/admin/kelas
export async function POST(request: Request) {
    try {
        await connectDB();

        const body = await request.json();
        const { namaKelas, jurusan, mataPelajaran } = body;

        if (!namaKelas) {
            return NextResponse.json(
                { success: false, message: "Nama kelas wajib diisi" },
                { status: 400 }
            );
        }

        const existing = await Kelas.findOne({ namaKelas });
        if (existing) {
            return NextResponse.json(
                { success: false, message: "Nama kelas sudah ada" },
                { status: 409 }
            );
        }

        const mapelArray = Array.isArray(mataPelajaran)
            ? mataPelajaran
            : String(mataPelajaran || "")
                .split(",")
                .map((m: string) => m.trim())
                .filter(Boolean);

        const newKelas = await Kelas.create({
            namaKelas,
            jurusan: jurusan || "",
            mataPelajaran: mapelArray,
        });

        return NextResponse.json({
            success: true,
            message: "Kelas berhasil dibuat",
            kelas: newKelas,
        });
    } catch (error) {
        console.error("Create Kelas Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal membuat kelas" },
            { status: 500 }
        );
    }
}