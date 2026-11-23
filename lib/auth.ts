import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "GURU" | "MURID" | "WAKAKURI" | "KEPSEK";
}

// Membaca cookie "token", verifikasi JWT, dan mengembalikan data user yang login.
// Return null kalau tidak ada token / token tidak valid / kadaluarsa.
export async function getCurrentUser(): Promise<AuthUser | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return null;

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) return null;

        const decoded = jwt.verify(token, jwtSecret) as AuthUser;
        return decoded;
    } catch {
        return null;
    }
}