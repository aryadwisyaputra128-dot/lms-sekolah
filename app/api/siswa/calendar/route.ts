import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import User from "../../../../models/User";
import Schedule from "../../../../models/Schedule";
import TeachingAssignment from "../../../../models/TeachingAssignment";
import Assessment from "../../../../models/Assessment";
import Submission from "../../../../models/Submission";

// GET /api/siswa/calendar
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
            return NextResponse.json({ success: true, kelas: null, schedules: [], deadlines: [] });
        }

        // cocokkan kelas tanpa peduli huruf besar-kecil dan spasi di pinggir
        const kelasEscaped = String(kelasSiswa).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const kelasRegex = new RegExp(`^\\s*${kelasEscaped}\\s*$`, "i");

        const [schedules, assignments, assessments, submissions] = await Promise.all([
            Schedule.find({ kelas: kelasRegex })
                .populate("guruId", "name")
                .sort({ jamMulai: 1 })
                .lean(),
            TeachingAssignment.find({ kelas: kelasSiswa }).select("namaMapel zoomLink").lean(),
            Assessment.find({
                kelas: kelasSiswa,
                status: { $in: ["LIVE", "SCHEDULED"] },
                tenggat: { $gte: new Date() },
            })
                .select("namaUjian tipe mapel tenggat")
                .sort({ tenggat: 1 })
                .limit(50)
                .lean(),
            Submission.find({ siswaId: currentUser.id }).select("assessmentId").lean(),
        ]);

        // link kelas virtual per mapel, dicocokkan dari judul jadwal
        const zoomPerMapel = new Map<string, string>();
        for (const a of assignments) {
            if (a.zoomLink) zoomPerMapel.set(String(a.namaMapel).trim().toLowerCase(), a.zoomLink);
        }

        const sudahDikerjakan = new Set(submissions.map((s) => s.assessmentId.toString()));

        return NextResponse.json({
            success: true,
            kelas: kelasSiswa,
            schedules: schedules.map((s) => ({
                _id: s._id,
                judul: s.judul,
                hari: s.hari,
                jamMulai: s.jamMulai,
                jamSelesai: s.jamSelesai,
                namaGuru: (s.guruId as unknown as { name?: string })?.name || "-",
                zoomLink: zoomPerMapel.get(String(s.judul).trim().toLowerCase()) || null,
            })),
            deadlines: assessments
                .filter((a) => !sudahDikerjakan.has(a._id.toString()))
                .map((a) => ({
                    _id: a._id,
                    namaUjian: a.namaUjian,
                    tipe: a.tipe,
                    mapel: a.mapel,
                    tenggat: a.tenggat,
                })),
        });
    } catch (error) {
        console.error("Get Siswa Calendar Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data kalender" },
            { status: 500 }
        );
    }
}