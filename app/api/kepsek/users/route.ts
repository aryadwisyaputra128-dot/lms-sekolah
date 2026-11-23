import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User"; // samakan dengan import di api/kepsek/overview/route.ts
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, message: "Belum login" }, { status: 401 });
        }
        if (user.role !== "KEPSEK") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 403 });
        }

        const group = new URL(req.url).searchParams.get("group") || "ALL";
        const roles = group === "GURU" ? ["GURU"] : group === "SISWA" ? ["MURID"] : ["GURU", "MURID"];

        await connectDB();

        const [users, guru, siswa] = await Promise.all([
            User.find({ role: { $in: roles } })
                .select("name email role status kelas mapel")
                .sort({ name: 1 })
                .lean(),
            User.countDocuments({ role: "GURU" }),
            User.countDocuments({ role: "MURID" }),
        ]);

        return NextResponse.json(
            JSON.parse(JSON.stringify({ success: true, users, counts: { guru, siswa, total: guru + siswa } }))
        );
    } catch (err) {
        console.error("Kepsek users error:", err);
        return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
    }
}