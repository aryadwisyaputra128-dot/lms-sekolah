import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/** Mengembalikan response error kalau bukan ADMIN, atau null kalau boleh lanjut. */
export async function requireAdmin() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, message: "Belum login" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
        return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 403 });
    }
    return null;
}