import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import TeachingAssignment from "../../../../models/TeachingAssignment";
import User from "../../../../models/User";
import Assessment from "../../../../models/Assessment";
import Submission from "../../../../models/Submission";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "GURU") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        const assignments = await TeachingAssignment.find({ guruId: currentUser.id }).lean();

        const groups = await Promise.all(
            assignments.map(async (a) => {
                const [students, assessmentsForThis] = await Promise.all([
                    User.find({ role: "MURID", kelas: a.kelas })
                        .select("name email kelas")
                        .lean(),
                    Assessment.find({
                        guruId: currentUser.id,
                        kelas: a.kelas,
                        mapel: a.namaMapel,
                    })
                        .select("_id")
                        .lean(),
                ]);

                const assessmentIds = assessmentsForThis.map((x) => x._id);

                const studentsWithStats = await Promise.all(
                    students.map(async (s) => {
                        const submissions = await Submission.find({
                            siswaId: s._id,
                            assessmentId: { $in: assessmentIds },
                        }).lean();

                        const sudahDinilai = submissions.filter((x) => x.status === "GRADED");
                        const avgNilai = sudahDinilai.length
                            ? Math.round(
                                (sudahDinilai.reduce((sum, x) => sum + (x.nilai || 0), 0) /
                                    sudahDinilai.length) *
                                10
                            ) / 10
                            : null;

                        return {
                            _id: s._id,
                            name: s.name,
                            email: s.email,
                            totalTugas: submissions.length,
                            sudahDinilai: sudahDinilai.length,
                            avgNilai,
                        };
                    })
                );

                return {
                    kelas: a.kelas,
                    namaMapel: a.namaMapel,
                    students: studentsWithStats,
                };
            })
        );

        return NextResponse.json({ success: true, groups });
    } catch (error) {
        console.error("Get Students Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data siswa" },
            { status: 500 }
        );
    }
}