"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Users, LogOut } from "lucide-react";

const navItems = [
    { href: "/kepsek", label: "Overview", icon: LayoutGrid },
    { href: "/kepsek/users", label: "Guru & Siswa", icon: Users },
];

export default function KepsekSidebar({ name }: { name: string }) {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        try {
            await fetch("/api/logout", { method: "POST" });
        } finally {
            router.push("/login");
        }
    }

    return (
        <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white">
            <div>
                <div className="flex items-center gap-2 px-6 py-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1440] text-sm font-bold text-white">
                        R
                    </div>
                    <div>
                        <p className="text-sm font-bold leading-tight text-slate-900">Kepala Sekolah</p>
                        <p className="max-w-40 truncate text-[11px] leading-tight text-slate-400">{name}</p>
                    </div>
                </div>

                <nav className="mt-2 space-y-1 px-3">
                    {navItems.map((item) => {
                        const active = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-[#2F5FEA] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
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
                    Logout
                </button>
            </div>
        </aside>
    );
}