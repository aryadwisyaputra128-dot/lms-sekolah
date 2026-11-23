import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";

// GET /api/admin/users?group=ALL|GURU|SISWA|PETUGAS
export async function GET(request: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const group = searchParams.get("group") || "ALL";

        const roleFilterMap: Record<string, string[]> = {
            GURU: ["GURU"],
            SISWA: ["MURID"],
            PETUGAS: ["WAKAKURI", "KEPSEK"],
        };

        const query =
            group !== "ALL" && roleFilterMap[group]
                ? { role: { $in: roleFilterMap[group] } }
                : { role: { $ne: "ADMIN" } };

        const users = await User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .lean();

        const [totalGuru, totalSiswa, totalPetugas, kelasAktifList] = await Promise.all([
            User.countDocuments({ role: "GURU" }),
            User.countDocuments({ role: "MURID" }),
            User.countDocuments({ role: { $in: ["WAKAKURI", "KEPSEK"] } }),
            User.distinct("kelas", { role: "MURID", kelas: { $exists: true, $ne: "" } }),
        ]);

        return NextResponse.json({
            success: true,
            counts: {
                guru: totalGuru,
                siswa: totalSiswa,
                petugas: totalPetugas,
                kelasAktif: kelasAktifList.length,
                total: totalGuru + totalSiswa + totalPetugas,
            },
            users,
        });
    } catch (error) {
        console.error("Get Users Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data user" },
            { status: 500 }
        );
    }
}

// POST /api/admin/users
export async function POST(request: Request) {
    try {
        await connectDB();

        const body = await request.json();
        const { name, email, password, role, kelas, mapel, jabatan } = body;

        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { success: false, message: "Nama, email, password, dan role wajib diisi" },
                { status: 400 }
            );
        }

        const existing = await User.findOne({ email: email.toLowerCase() });

        if (existing) {
            return NextResponse.json(
                { success: false, message: "Email sudah terdaftar" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            kelas,
            mapel,
            jabatan,
            status: "ACTIVE",
        });

        return NextResponse.json({
            success: true,
            message: "User berhasil dibuat",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error("Create User Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal membuat user" },
            { status: 500 }
        );
    }
}