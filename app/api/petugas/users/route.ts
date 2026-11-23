import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import User from "../../../../models/User";

const PETUGAS_ROLES = ["WAKAKURI", "KEPSEK"];

// GET /api/petugas/users  (hanya baca, tanpa password)
export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !PETUGAS_ROLES.includes(currentUser.role)) {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        const users = await User.find({ role: { $in: ["GURU", "MURID"] } })
            .select("name email role status kelas mapel")
            .sort({ name: 1 })
            .lean();

        const guru = users.filter((u) => u.role === "GURU").length;
        const siswa = users.filter((u) => u.role === "MURID").length;

        return NextResponse.json({
            success: true,
            counts: { total: users.length, guru, siswa },
            users,
        });
    } catch (error) {
        console.error("Get Petugas Users Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data pengguna" },
            { status: 500 }
        );
    }
}