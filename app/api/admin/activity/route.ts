import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";
import LoginLog from "../../../../models/LoginLog";

export async function GET() {
    try {
        await connectDB();

        const [recentUsers, recentLogins] = await Promise.all([
            User.find({ role: { $ne: "ADMIN" } })
                .select("name role createdAt")
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            LoginLog.find().sort({ loginAt: -1 }).limit(8).lean(),
        ]);

        return NextResponse.json({
            success: true,
            recentUsers,
            recentLogins,
        });
    } catch (error) {
        console.error("Get Activity Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data aktivitas" },
            { status: 500 }
        );
    }
}