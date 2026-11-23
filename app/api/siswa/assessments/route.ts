import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import User from "../../../../models/User";
import Assessment from "../../../../models/Assessment";
import Submission from "../../../../models/Submission";
import Soal from "../../../../models/Soal";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "MURID") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        const siswa = await User.findById(currentUser.id).select("kelas").lean();
        const kelasSiswa = siswa?.kelas;

        const mySubmissions = await Submission.find({ siswaId: currentUser.id }).lean();
        const submittedMap = new Map(mySubmissions.map((s) => [s.assessmentId.toString(), s]));

        const assessments = kelasSiswa
            ? await Assessment.find({ kelas: kelasSiswa, status: "LIVE" }).lean()
            : [];

        const toDo = [];
        for (const a of assessments) {
            if (submittedMap.has(a._id.toString())) continue;
            const jumlahSoal = await Soal.countDocuments({ assessmentId: a._id });
            toDo.push({
                _id: a._id,
                namaUjian: a.namaUjian,
                tipe: a.tipe,
                mapel: a.mapel,
                tenggat: a.tenggat,
                jumlahSoal,
            });
        }

        const nilaiSaya = mySubmissions
            .filter((s) => s.status === "GRADED")
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
            .map((s) => ({
                _id: s._id,
                judulTugas: s.judulTugas,
                nilai: s.nilai,
                submittedAt: s.submittedAt,
            }));

        const menungguDinilai = mySubmissions.filter(
            (s) => s.status === "PENDING"
        ).length;

        return NextResponse.json({ success: true, toDo, nilaiSaya, menungguDinilai });
    } catch (error) {
        console.error("Get Siswa Assessments Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data tugas" },
            { status: 500 }
        );
    }
}