import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import TeachingAssignment from "../../../../models/TeachingAssignment";
import Schedule from "../../../../models/Schedule";
import Assessment from "../../../../models/Assessment";
import User from "../../../../models/User";

const DAY_MAP: Record<number, string> = {
  1: "SEN",
  2: "SEL",
  3: "RAB",
  4: "KAM",
  5: "JUM",
};

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "GURU") {
      return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
    }

    await connectDB();

    const todayIdx = new Date().getDay(); // 0=Min, 1=Sen, ...
    const todayCode = DAY_MAP[todayIdx]; // undefined kalau weekend

    const [assignments, todaySchedule, recentAssessments] = await Promise.all([
      TeachingAssignment.find({ guruId: currentUser.id }).lean(),
      todayCode
        ? Schedule.find({ guruId: currentUser.id, hari: todayCode })
            .sort({ jamMulai: 1 })
            .lean()
        : Promise.resolve([]),
      Assessment.find({ guruId: currentUser.id }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const [siswaCounts, live, scheduled, archived] = await Promise.all([
      Promise.all(
        assignments.map((a) => User.countDocuments({ role: "MURID", kelas: a.kelas }))
      ),
      Assessment.countDocuments({ guruId: currentUser.id, status: "LIVE" }),
      Assessment.countDocuments({ guruId: currentUser.id, status: "SCHEDULED" }),
      Assessment.countDocuments({ guruId: currentUser.id, status: "ARCHIVED" }),
    ]);

    const totalSiswa = siswaCounts.reduce((sum, n) => sum + n, 0);
    const statusSummary = { live, scheduled, archived };

    return NextResponse.json({
      success: true,
      stats: {
        totalSiswa,
        kelasAktif: assignments.length,
      },
      todaySchedule,
      recentAssessments,
      statusSummary,
      assignments, // dipakai buat modal kelas virtual (pilih kelas + set link zoom)
    });
  } catch (error) {
    console.error("Get Guru Overview Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data overview" },
      { status: 500 }
    );
  }
}