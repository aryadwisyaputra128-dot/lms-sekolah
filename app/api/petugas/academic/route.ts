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

function namaDariPopulate(ref: unknown) {
    return (ref as { name?: string } | null)?.name || "-";
}

// GET /api/petugas/academic  (hanya baca, tidak ada aksi ubah)
export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !PETUGAS_ROLES.includes(currentUser.role)) {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();

        const [assessments, assignments, rekap] = await Promise.all([
            Assessment.find().populate("guruId", "name").sort({ createdAt: -1 }).lean(),
            TeachingAssignment.find().populate("guruId", "name").lean(),
            // jumlah jawaban masuk dan rata-rata nilai (hanya yang sudah dinilai) per ujian
            Submission.aggregate([
                {
                    $group: {
                        _id: "$assessmentId",
                        jumlah: { $sum: 1 },
                        rataRata: {
                            $avg: { $cond: [{ $eq: ["$status", "GRADED"] }, "$nilai", null] },
                        },
                    },
                },
            ]),
        ]);

        const rekapMap = new Map<string, { jumlah: number; rataRata: number | null }>();
        for (const r of rekap) {
            rekapMap.set(String(r._id), { jumlah: r.jumlah, rataRata: r.rataRata });
        }

        // jumlah siswa per kelas
        const kelasUnik = Array.from(
            new Set(assessments.map((a) => String(a.kelas).trim().toLowerCase()))
        );
        const pesertaPerKelas = new Map<string, number>();
        await Promise.all(
            kelasUnik.map(async (k) => {
                pesertaPerKelas.set(k, await User.countDocuments({ role: "MURID", kelas: kelasRegex(k) }));
            })
        );

        const ujian = assessments.map((a) => {
            const r = rekapMap.get(a._id.toString());
            return {
                _id: a._id,
                namaUjian: a.namaUjian,
                tipe: a.tipe,
                mapel: a.mapel || "-",
                kelas: a.kelas,
                status: a.status,
                tenggat: a.tenggat || null,
                namaGuru: namaDariPopulate(a.guruId),
                totalPeserta: pesertaPerKelas.get(String(a.kelas).trim().toLowerCase()) || 0,
                jumlahMengerjakan: r?.jumlah || 0,
                rataRata: r && r.rataRata !== null && r.rataRata !== undefined ? bulatkan(r.rataRata) : null,
            };
        });

        const zoom = assignments
            .map((a) => ({
                _id: a._id,
                namaGuru: namaDariPopulate(a.guruId),
                namaMapel: a.namaMapel,
                kelas: a.kelas,
                zoomLink: a.zoomLink && String(a.zoomLink).trim() ? a.zoomLink : null,
            }))
            .sort(
                (x, y) =>
                    x.namaGuru.localeCompare(y.namaGuru) || x.namaMapel.localeCompare(y.namaMapel)
            );

        return NextResponse.json({
            success: true,
            stats: {
                live: ujian.filter((u) => u.status === "LIVE").length,
                terjadwal: ujian.filter((u) => u.status === "SCHEDULED").length,
                diarsipkan: ujian.filter((u) => u.status === "ARCHIVED").length,
                zoomTerkirim: zoom.filter((z) => z.zoomLink).length,
                zoomTotal: zoom.length,
            },
            ujian,
            zoom,
        });
    } catch (error) {
        console.error("Get Petugas Academic Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data pemantauan" },
            { status: 500 }
        );
    }
}