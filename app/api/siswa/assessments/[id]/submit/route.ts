import { NextResponse } from "next/server";

import { connectDB } from "../../../../../../lib/mongodb";
import { getCurrentUser } from "../../../../../../lib/auth";
import User from "../../../../../../models/User";
import Assessment from "../../../../../../models/Assessment";
import Submission from "../../../../../../models/Submission";
import Soal from "../../../../../../models/Soal";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // =====================================================
        // 1. CEK USER
        // =====================================================
        const currentUser = await getCurrentUser();

        if (!currentUser || currentUser.role !== "MURID") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Tidak diizinkan",
                },
                { status: 401 }
            );
        }

        // =====================================================
        // 2. CONNECT DATABASE
        // =====================================================
        await connectDB();

        // =====================================================
        // 3. AMBIL ID ASSESSMENT
        // =====================================================
        const { id: assessmentId } = await params;

        if (!assessmentId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "ID ujian tidak ditemukan",
                },
                { status: 400 }
            );
        }

        // =====================================================
        // 4. AMBIL BODY
        // =====================================================
        const body = await request.json();

        const jawabanInput = Array.isArray(body?.jawaban)
            ? body.jawaban
            : [];

        // =====================================================
        // 5. AMBIL DATA SISWA
        // =====================================================
        const siswa = await User.findById(currentUser.id)
            .select("name email role kelas")
            .lean();

        if (!siswa) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Data siswa tidak ditemukan",
                },
                { status: 404 }
            );
        }

        // Pastikan memang murid
        if (siswa.role !== "MURID") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Akun ini bukan akun siswa",
                },
                { status: 403 }
            );
        }

        // =====================================================
        // 6. AMBIL ASSESSMENT
        // =====================================================
        const assessment = await Assessment.findById(assessmentId).lean();

        if (!assessment) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Ujian tidak ditemukan",
                },
                { status: 404 }
            );
        }

        // =====================================================
        // 7. CEK STATUS UJIAN
        // =====================================================
        if (assessment.status !== "LIVE") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Ujian ini sudah tidak aktif.",
                },
                { status: 400 }
            );
        }

        // =====================================================
        // 8. CEK SUDAH SUBMIT ATAU BELUM
        // =====================================================
        const existingSubmission = await Submission.findOne({
            assessmentId: assessmentId,
            siswaId: currentUser.id,
        }).lean();

        if (existingSubmission) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Kamu sudah mengirim jawaban untuk ujian ini.",
                },
                { status: 400 }
            );
        }

        // =====================================================
        // 9. AMBIL SOAL
        // =====================================================
        const soalList = await Soal.find({
            assessmentId: assessmentId,
        })
            .sort({ createdAt: 1 })
            .lean();

        if (soalList.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Ujian ini belum memiliki soal.",
                },
                { status: 400 }
            );
        }

        // =====================================================
        // 10. BUAT MAP JAWABAN SISWA
        // =====================================================
        const jawabanMap = new Map<string, any>();

        for (const item of jawabanInput) {
            if (!item || !item.soalId) {
                continue;
            }

            jawabanMap.set(String(item.soalId), item);
        }

        // =====================================================
        // 11. PROSES DAN AUTO-GRADING
        // =====================================================
        let jumlahBenar = 0;
        let jumlahPilihanGanda = 0;
        let jumlahEssay = 0;

        const jawabanTersimpan = soalList.map((soal: any) => {
            const jawabanSiswa = jawabanMap.get(
                String(soal._id)
            );

            // =================================================
            // PILIHAN GANDA
            // =================================================
            if (soal.tipeSoal === "PILIHAN_GANDA") {
                jumlahPilihanGanda++;

                const pilihanIndex =
                    jawabanSiswa?.pilihanIndex;

                let benar = false;

                if (
                    typeof pilihanIndex === "number" &&
                    Array.isArray(soal.pilihan) &&
                    pilihanIndex >= 0 &&
                    pilihanIndex < soal.pilihan.length
                ) {
                    benar =
                        soal.pilihan[pilihanIndex]?.benar === true;

                    if (benar) {
                        jumlahBenar++;
                    }
                }

                return {
                    soalId: soal._id,
                    pilihanIndex:
                        typeof pilihanIndex === "number"
                            ? pilihanIndex
                            : undefined,
                    benar,
                };
            }

            // =================================================
            // ESSAY
            // =================================================
            jumlahEssay++;

            return {
                soalId: soal._id,
                teksEssay:
                    typeof jawabanSiswa?.teksEssay === "string"
                        ? jawabanSiswa.teksEssay
                        : "",
            };
        });

        // =====================================================
        // 12. TENTUKAN NILAI
        // =====================================================
        let nilai: number | undefined;
        let status: "PENDING" | "GRADED";
        let butuhNilaiManual = false;

        /*
         * Kalau tidak ada essay:
         * semua pilihan ganda -> otomatis dinilai.
         *
         * Kalau ada essay:
         * status PENDING karena guru harus menilai essay.
         */
        if (jumlahEssay === 0 && jumlahPilihanGanda > 0) {
            nilai = Math.round(
                (jumlahBenar / jumlahPilihanGanda) * 100
            );

            status = "GRADED";
            butuhNilaiManual = false;
        } else if (jumlahEssay > 0) {
            status = "PENDING";
            butuhNilaiManual = true;
        } else {
            status = "PENDING";
            butuhNilaiManual = false;
        }

        // =====================================================
        // 13. SIMPAN SUBMISSION
        // =====================================================
        const submission = await Submission.create({
            assessmentId: assessment._id,
            siswaId: siswa._id,

            // PENTING:
            // User menggunakan "name", bukan "nama"
            namaSiswa: siswa.name,
            emailSiswa: siswa.email,

            judulTugas: assessment.namaUjian,

            jawaban: jawabanTersimpan,

            submittedAt: new Date(),

            status,

            nilai,

            butuhNilaiManual,
        });

        // =====================================================
        // 14. RESPONSE
        // =====================================================
        return NextResponse.json({
            success: true,

            message:
                status === "GRADED"
                    ? `Jawaban berhasil dikirim. Nilai kamu: ${nilai}`
                    : "Jawaban berhasil dikirim dan menunggu penilaian guru.",

            submissionId: submission._id,

            status,

            nilai,

            butuhNilaiManual,
        });
    } catch (error: any) {
        // =====================================================
        // ERROR LOG
        // =====================================================
        console.error("====================================");
        console.error("Submit Siswa Error:");
        console.error(error);
        console.error("====================================");

        return NextResponse.json(
            {
                success: false,
                message:
                    error?.message ||
                    "Gagal mengirim jawaban",
            },
            { status: 500 }
        );
    }
}
