import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "../../../lib/mongodb";
import User from "../../../models/User";

// PERINGATAN: route ini hanya untuk development/testing.
// HAPUS file ini (app/api/seed/route.ts) sebelum deploy ke production.

const dummyUsers = [
    { name: "Admin Sekolah", email: "admin@sekolah.com", password: "admin123", role: "ADMIN" },
    { name: "Budi Guru", email: "guru@sekolah.com", password: "guru123", role: "GURU" },
    { name: "Siti Murid", email: "murid@sekolah.com", password: "murid123", role: "MURID" },
    { name: "Wakakur", email: "wakakur@sekolah.com", password: "wakakur123", role: "WAKAKURI" },
    { name: "Kepala Sekolah", email: "kepsek@sekolah.com", password: "kepsek123", role: "KEPSEK" },
];

export async function GET() {
    try {
        await connectDB();

        const results = [];

        for (const dummy of dummyUsers) {
            const existing = await User.findOne({ email: dummy.email });

            if (existing) {
                results.push({ email: dummy.email, status: "sudah ada, dilewati" });
                continue;
            }

            const hashedPassword = await bcrypt.hash(dummy.password, 10);

            await User.create({
                name: dummy.name,
                email: dummy.email,
                password: hashedPassword,
                role: dummy.role,
            });

            results.push({ email: dummy.email, status: "berhasil dibuat" });
        }

        return NextResponse.json({
            success: true,
            message: "Seeding selesai. Gunakan kredensial di bawah untuk login.",
            credentials: dummyUsers.map((u) => ({
                role: u.role,
                email: u.email,
                password: u.password,
            })),
            results,
        });
    } catch (error) {
        console.error("Seed Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal seeding", error: String(error) },
            { status: 500 }
        );
    }
}