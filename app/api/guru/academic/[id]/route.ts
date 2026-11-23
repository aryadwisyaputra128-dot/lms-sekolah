import { NextResponse } from "next/server";

import { connectDB } from "../../../../../lib/mongodb";
import { getCurrentUser } from "../../../../../lib/auth";
import TeachingAssignment from "../../../../../models/TeachingAssignment";

// PATCH /api/guru/academic/[id]  -> dipakai buat set/update link Zoom kelas virtual
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "GURU") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;
        const body = await request.json();

        const updates: Record<string, unknown> = {};
        if (body.zoomLink !== undefined) {
            const link = String(body.zoomLink).trim();
            let valid = true;
            if (link) {
                try {
                    const u = new URL(link);
                    valid = /^https?:$/.test(u.protocol) && u.hostname.includes(".");
                } catch {
                    valid = false;
                }
            }
            if (!valid) {
                return NextResponse.json(
                    { success: false, message: "Link tidak valid. Contoh: https://zoom.us/j/1234567890" },
                    { status: 400 }
                );
            }
            updates.zoomLink = link;
        }
        if (body.namaMapel !== undefined) updates.namaMapel = body.namaMapel;
        if (body.kelas !== undefined) updates.kelas = body.kelas;
        if (body.warna !== undefined) updates.warna = body.warna;

        const updated = await TeachingAssignment.findOneAndUpdate(
            { _id: id, guruId: currentUser.id },
            updates,
            { new: true }
        );

        if (!updated) {
            return NextResponse.json(
                { success: false, message: "Data tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, assignment: updated });
    } catch (error) {
        console.error("Update Academic Error:", error);
        return NextResponse.json({ success: false, message: "Gagal update" }, { status: 500 });
    }
}

// DELETE /api/guru/academic/[id]
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "GURU") {
            return NextResponse.json({ success: false, message: "Tidak diizinkan" }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;

        const deleted = await TeachingAssignment.findOneAndDelete({
            _id: id,
            guruId: currentUser.id,
        });

        if (!deleted) {
            return NextResponse.json(
                { success: false, message: "Data tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: "Berhasil dihapus" });
    } catch (error) {
        console.error("Delete Academic Error:", error);
        return NextResponse.json({ success: false, message: "Gagal menghapus" }, { status: 500 });
    }
}