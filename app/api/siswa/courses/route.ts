import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import User from "../../../../models/User";
import TeachingAssignment from "../../../../models/TeachingAssignment";
import Assessment from "../../../../models/Assessment";
import Submission from "../../../../models/Submission";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "MURID") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        const siswa = await User.findById(currentUser.id).select("kelas").lean();
        const kelasSiswa = siswa?.kelas;

        if (!kelasSiswa) {
            return NextResponse.json({ success: true, kelas: null, courses: [] });
        }

        const assignments = await TeachingAssignment.find({ kelas: kelasSiswa })
            .populate("guruId", "name")
            .lean();

        const courses = await Promise.all(
            assignments.map(async (a) => {
                const assessments = await Assessment.find({
                    kelas: kelasSiswa,
                    mapel: a.namaMapel,
                    status: { $in: ["LIVE", "SCHEDULED"] },
                })
                    .select("_id")
                    .lean();

                const assessmentIds = assessments.map((x) => x._id);

                const sudahSubmit = await Submission.find({
                    siswaId: currentUser.id,
                    assessmentId: { $in: assessmentIds },
                })
                    .select("assessmentId")
                    .lean();

                const sudahSubmitIds = new Set(sudahSubmit.map((s) => s.assessmentId.toString()));
                const belumDikerjakan = assessmentIds.filter(
                    (id) => !sudahSubmitIds.has(id.toString())
                ).length;

                return {
                    namaMapel: a.namaMapel,
                    kelas: a.kelas,
                    warna: a.warna,
                    namaGuru: (a.guruId as unknown as { name?: string })?.name || "-",
                    belumDikerjakan,
                    zoomLink: a.zoomLink || null,
                };
            })
        );

        return NextResponse.json({ success: true, kelas: kelasSiswa, courses });
    } catch (error) {
        console.error("Get Courses Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data mata pelajaran" },
            { status: 500 }
        );
    }
}