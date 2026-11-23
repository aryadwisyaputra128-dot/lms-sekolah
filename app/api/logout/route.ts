import { NextResponse } from "next/server";

// POST /api/logout  -> hapus cookie login
export async function POST() {
    const response = NextResponse.json({ success: true, message: "Berhasil keluar" });

    response.cookies.set("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
    });

    return response;
}