import { NextResponse } from "next/server";

import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";
import LoginLog from "../../../../models/LoginLog";
import Kelas from "../../../../models/Kelas";
import Assessment from "../../../../models/Assessment";

const DAY_LABELS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_LABELS_ID = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

export async function GET(request: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const range = searchParams.get("range") || "daily";

        const [totalGuru, totalSiswa, totalPetugas, totalKelas, kelasList, totalUjian] =
            await Promise.all([
                User.countDocuments({ role: "GURU" }),
                User.countDocuments({ role: "MURID" }),
                User.countDocuments({ role: { $in: ["WAKAKURI", "KEPSEK"] } }),
                Kelas.countDocuments(),
                Kelas.find().select("mataPelajaran").lean(),
                Assessment.countDocuments(),
            ]);

        const totalUserAktif = totalGuru + totalSiswa + totalPetugas;
        const uniqueMapel = new Set<string>();
        kelasList.forEach((k) => (k.mataPelajaran || []).forEach((m: string) => uniqueMapel.add(m)));

        let labels: string[] = [];
        let currentBucket: { start: Date; end: Date }[] = [];

        const now = new Date();

        if (range === "weekly") {
            // 4 minggu terakhir
            for (let i = 3; i >= 0; i--) {
                const end = startOfDay(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000));
                const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
                currentBucket.push({ start, end });
            }
            labels = ["3 Minggu lalu", "2 Minggu lalu", "Minggu lalu", "Minggu ini"];
        } else if (range === "termly") {
            // 6 bulan terakhir
            for (let i = 5; i >= 0; i--) {
                const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const start = ref;
                const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
                currentBucket.push({ start, end });
                labels.push(MONTH_LABELS_ID[ref.getMonth()]);
            }
        } else {
            // daily: 7 hari terakhir
            for (let i = 6; i >= 0; i--) {
                const start = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
                const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
                currentBucket.push({ start, end });
                labels.push(DAY_LABELS_ID[start.getDay()]);
            }
        }

        const values = await Promise.all(
            currentBucket.map(async (b) => {
                const count = await LoginLog.distinct("userId", {
                    loginAt: { $gte: b.start, $lt: b.end },
                });
                return count.length;
            })
        );

        const avgAktifCount = values.reduce((a, b) => a + b, 0) / (values.length || 1);
        const avgAktifPercent = totalUserAktif
            ? Math.round((avgAktifCount / totalUserAktif) * 1000) / 10
            : 0;

        const lastValue = values[values.length - 1] || 0;
        const prevValue = values[values.length - 2] || 0;
        const trend = prevValue
            ? Math.round(((lastValue - prevValue) / prevValue) * 1000) / 10
            : 0;

        return NextResponse.json({
            success: true,
            chart: { labels, values },
            avgAktifPercent,
            trend,
            roleDistribution: {
                guru: totalGuru,
                siswa: totalSiswa,
                petugas: totalPetugas,
            },
            systemSummary: {
                totalKelas,
                totalMapel: uniqueMapel.size,
                totalUjian,
            },
        });
    } catch (error) {
        console.error("Get Analytics Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data analytics" },
            { status: 500 }
        );
    }
}