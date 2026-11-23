import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Assessment from "@/models/Assessment";
import { getCurrentUser } from "@/lib/auth";

const ALLOWED_ROLES = ["KEPSEK"];

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, message: "Belum login" }, { status: 401 });
        }
        if (!ALLOWED_ROLES.includes(user.role)) {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 403 });
        }

        await connectDB();

        const [guru, siswa, petugasCount, assessments] = await Promise.all([
            User.find({ role: "GURU" }).select("name email status mapel zoomLink").lean(),
            User.find({ role: "MURID" }).select("name email status kelas").lean(),
            User.countDocuments({ role: { $in: ["WAKAKURI", "KEPSEK"] } }),
            Assessment.find({}).sort({ createdAt: -1 }).lean(),
        ]);

        const aCounts = {
            totalAktif: assessments.filter((a: { status: string }) => a.status === "LIVE").length,
            totalScheduled: assessments.filter((a: { status: string }) => a.status === "SCHEDULED").length,
            totalArchived: assessments.filter((a: { status: string }) => a.status === "ARCHIVED").length,
            total: assessments.length,
        };

        const userCounts = {
            guru: guru.length,
            siswa: siswa.length,
            petugas: petugasCount,
            total: guru.length + siswa.length + petugasCount,
        };

        return NextResponse.json(
            JSON.parse(
                JSON.stringify({
                    success: true,
                    guru,
                    siswa,
                    userCounts,
                    assessments,
                    aCounts,
                    logs: [], // diisi nanti, lihat catatan di bawah
                })
            )
        );
    } catch (err) {
        console.error("Kepsek overview error:", err);
        return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
    }
}