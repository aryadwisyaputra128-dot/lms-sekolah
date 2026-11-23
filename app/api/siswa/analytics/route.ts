import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import { getCurrentUser } from "../../../../lib/auth";
import Assessment from "../../../../models/Assessment";
import Submission from "../../../../models/Submission";

const BULAN_PENDEK = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function bulatkan(n: number) {
    return Math.round(n * 10) / 10;
}

// GET /api/siswa/analytics
export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "MURID") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        const [graded, menunggu] = await Promise.all([
            Submission.find({ siswaId: currentUser.id, status: "GRADED" })
                .select("assessmentId judulTugas nilai submittedAt")
                .lean(),
            Submission.countDocuments({ siswaId: currentUser.id, status: "PENDING" }),
        ]);

        const bernilai = graded.filter((s) => typeof s.nilai === "number");

        const assessmentIds = Array.from(new Set(bernilai.map((s) => s.assessmentId.toString())));
        const assessments = assessmentIds.length
            ? await Assessment.find({ _id: { $in: assessmentIds } })
                .select("mapel tipe")
                .lean()
            : [];

        const infoMap = new Map(
            assessments.map((a) => [a._id.toString(), { mapel: a.mapel || "Lainnya", tipe: a.tipe }])
        );

        const riwayat = bernilai
            .map((s) => {
                const info = infoMap.get(s.assessmentId.toString());
                return {
                    _id: s._id,
                    judulTugas: s.judulTugas,
                    mapel: info?.mapel || "Lainnya",
                    tipe: info?.tipe || "EXAM",
                    nilai: s.nilai as number,
                    submittedAt: s.submittedAt,
                };
            })
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

        const rataRata = riwayat.length
            ? bulatkan(riwayat.reduce((sum, r) => sum + r.nilai, 0) / riwayat.length)
            : null;

        // rata-rata per mata pelajaran
        const perMapelMap = new Map<string, { total: number; jumlah: number }>();
        for (const r of riwayat) {
            const cur = perMapelMap.get(r.mapel) || { total: 0, jumlah: 0 };
            cur.total += r.nilai;
            cur.jumlah += 1;
            perMapelMap.set(r.mapel, cur);
        }
        const perMapel = Array.from(perMapelMap.entries())
            .map(([mapel, v]) => ({ mapel, rataRata: bulatkan(v.total / v.jumlah), jumlah: v.jumlah }))
            .sort((a, b) => b.rataRata - a.rataRata);

        // rata-rata per bulan, 6 bulan terakhir
        const now = new Date();
        const perBulan = [];
        for (let i = 5; i >= 0; i--) {
            const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nilaiBulanIni = riwayat.filter((r) => {
                const t = new Date(r.submittedAt);
                return t.getFullYear() === ref.getFullYear() && t.getMonth() === ref.getMonth();
            });
            perBulan.push({
                label: BULAN_PENDEK[ref.getMonth()],
                rataRata: nilaiBulanIni.length
                    ? bulatkan(nilaiBulanIni.reduce((sum, r) => sum + r.nilai, 0) / nilaiBulanIni.length)
                    : null,
            });
        }

        return NextResponse.json({
            success: true,
            rataRata,
            totalDinilai: riwayat.length,
            menunggu,
            perMapel,
            perBulan,
            riwayat,
        });
    } catch (error) {
        console.error("Get Siswa Analytics Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data nilai" },
            { status: 500 }
        );
    }
}