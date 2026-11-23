import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import { kelasRegex } from "../../../../lib/kelas";
import User from "../../../../models/User";
import TeachingAssignment from "../../../../models/TeachingAssignment";
import Assessment from "../../../../models/Assessment";
import Submission from "../../../../models/Submission";

const PETUGAS_ROLES = ["WAKAKURI", "KEPSEK"];

function bulatkan(n: number) {
    return Math.round(n * 10) / 10;
}

// GET /api/petugas/overview?range=today|week|month
export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !PETUGAS_ROLES.includes(currentUser.role)) {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const range = searchParams.get("range") || "today";

        const sekarang = new Date();
        let mulai: Date;
        if (range === "month") {
            mulai = new Date(sekarang.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (range === "week") {
            mulai = new Date(sekarang.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
            mulai = new Date(sekarang);
            mulai.setHours(0, 0, 0, 0);
        }

        const [
            totalSiswa,
            totalGuru,
            assignments,
            liveAssessments,
            terjadwal,
            diarsipkan,
            submissionsPeriode,
        ] = await Promise.all([
            User.countDocuments({ role: "MURID" }),
            User.countDocuments({ role: "GURU" }),
            TeachingAssignment.find().select("kelas zoomLink").lean(),
            Assessment.find({ status: "LIVE" }).select("kelas").lean(),
            Assessment.countDocuments({ status: "SCHEDULED" }),
            Assessment.countDocuments({ status: "ARCHIVED" }),
            Submission.find({ submittedAt: { $gte: mulai } }).select("status nilai").lean(),
        ]);

        // kelas aktif = kelas yang punya minimal satu mata pelajaran yang diajar
        const kelasAktif = new Set(
            assignments.map((a) => String(a.kelas).trim().toLowerCase())
        ).size;

        // link zoom
        const totalKelasMapel = assignments.length;
        const zoomTerkirim = assignments.filter(
            (a) => a.zoomLink && String(a.zoomLink).trim()
        ).length;

        // pengerjaan ujian yang sedang live
        const kelasUnik = Array.from(
            new Set(liveAssessments.map((a) => String(a.kelas).trim().toLowerCase()))
        );
        const pesertaPerKelas = new Map<string, number>();
        await Promise.all(
            kelasUnik.map(async (k) => {
                pesertaPerKelas.set(k, await User.countDocuments({ role: "MURID", kelas: kelasRegex(k) }));
            })
        );

        let pesertaLive = 0;
        for (const a of liveAssessments) {
            pesertaLive += pesertaPerKelas.get(String(a.kelas).trim().toLowerCase()) || 0;
        }

        const liveIds = liveAssessments.map((a) => a._id);
        const sudahMengerjakan = liveIds.length
            ? await Submission.countDocuments({ assessmentId: { $in: liveIds } })
            : 0;

        const tingkatPengerjaan = pesertaLive
            ? Math.min(100, Math.round((sudahMengerjakan / pesertaLive) * 100))
            : 0;

        // metrik per periode
        const nilaiPeriode = submissionsPeriode
            .filter((s) => s.status === "GRADED" && typeof s.nilai === "number")
            .map((s) => s.nilai as number);
        const rataRataNilai = nilaiPeriode.length
            ? bulatkan(nilaiPeriode.reduce((sum, n) => sum + n, 0) / nilaiPeriode.length)
            : null;

        return NextResponse.json({
            success: true,
            stats: { kelasAktif, totalSiswa, totalGuru },
            ujian: { live: liveAssessments.length, terjadwal, diarsipkan },
            pengerjaanLive: { peserta: pesertaLive, sudah: sudahMengerjakan, persen: tingkatPengerjaan },
            zoom: { terkirim: zoomTerkirim, total: totalKelasMapel },
            periode: { jawabanMasuk: submissionsPeriode.length, rataRataNilai },
        });
    } catch (error) {
        console.error("Get Petugas Overview Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data ringkasan" },
            { status: 500 }
        );
    }
}