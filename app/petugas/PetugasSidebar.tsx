"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, ClipboardCheck, LogOut } from "lucide-react";

const navItems = [
    { href: "/petugas", label: "Ringkasan", icon: LayoutGrid },
    { href: "/petugas/users", label: "Data Pengguna", icon: Users },
    { href: "/petugas/academic", label: "Pemantauan Akademik", icon: ClipboardCheck },
];

const labelPeran: Record<string, string> = {
    WAKAKURI: "Wakakur",
    KEPSEK: "Kepala Sekolah",
};

export default function PetugasSidebar({ name, role }: { name: string; role: string }) {
    const pathname = usePathname();
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    async function handleLogout() {
        try {
            await fetch("/api/logout", { method: "POST" });
        } finally {
            window.location.href = "/";
        }
    }

    return (
        <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white">
            <div>
                <div className="px-6 py-5">
                    <p className="text-base font-bold text-[#2F5FEA]">Portal Pemantauan</p>
                    <p className="text-[11px] text-slate-400">RuangIlmu</p>
                </div>

                <div className="mx-3 mb-4 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2F5FEA] text-xs font-semibold text-white">
                        {initials}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">{name}</p>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            {labelPeran[role] || "Petugas"}
                        </p>
                    </div>
                </div>

                <p className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Menu Utama
                </p>
                <nav className="space-y-1 px-3">
                    {navItems.map((item) => {
                        const active = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-blue-50 text-[#2F5FEA]" : "text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="border-t border-slate-100 px-3 py-4">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50"
                >
                    <LogOut size={18} />
                    Keluar
                </button>
            </div>
        </aside>
    );
}