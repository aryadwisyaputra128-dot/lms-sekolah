export type UserRole = "ADMIN" | "GURU" | "MURID" | "WAKAKURI" | "KEPSEK";

export type RoleGroup = "GURU" | "SISWA" | "PETUGAS";

// Petugas = gabungan Wakakuri & Kepsek
export function getRoleGroup(role: UserRole): RoleGroup | "ADMIN" {
    if (role === "GURU") return "GURU";
    if (role === "MURID") return "SISWA";
    if (role === "WAKAKURI" || role === "KEPSEK") return "PETUGAS";
    return "ADMIN";
}

export const roleGroupLabel: Record<RoleGroup, string> = {
    GURU: "Guru",
    SISWA: "Siswa",
    PETUGAS: "Petugas",
};

// Badge warna per role group, dipakai di tabel & tab
export const roleGroupBadgeClass: Record<RoleGroup, string> = {
    GURU: "bg-indigo-100 text-indigo-700",
    SISWA: "bg-blue-100 text-blue-700",
    PETUGAS: "bg-amber-100 text-amber-700",
};

export const statusDotClass: Record<string, string> = {
    ACTIVE: "bg-emerald-500",
    OFFLINE: "bg-slate-400",
    SUSPENDED: "bg-red-500",
};

export const statusTextClass: Record<string, string> = {
    ACTIVE: "text-emerald-600",
    OFFLINE: "text-slate-500",
    SUSPENDED: "text-red-600",
};

export const statusLabel: Record<string, string> = {
    ACTIVE: "Active",
    OFFLINE: "Offline",
    SUSPENDED: "Suspended",
};