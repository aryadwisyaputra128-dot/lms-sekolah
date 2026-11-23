import { NextResponse } from "next/server";

import { connectDB } from "../../../../../lib/mongodb";
import User from "../../../../../models/User";

// PATCH /api/admin/users/[id]  -> update status (ACTIVE/OFFLINE/SUSPENDED) atau field lain
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();

        const allowedFields = ["name", "status", "kelas", "mapel", "jabatan"];
        const updates: Record<string, unknown> = {};

        for (const field of allowedFields) {
            if (body[field] !== undefined) updates[field] = body[field];
        }

        const updated = await User.findByIdAndUpdate(id, updates, {
            new: true,
        }).select("-password");

        if (!updated) {
            return NextResponse.json(
                { success: false, message: "User tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, user: updated });
    } catch (error) {
        console.error("Update User Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal update user" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/users/[id]
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const deleted = await User.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json(
                { success: false, message: "User tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: "User berhasil dihapus" });
    } catch (error) {
        console.error("Delete User Error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal hapus user" },
            { status: 500 }
        );
    }
}