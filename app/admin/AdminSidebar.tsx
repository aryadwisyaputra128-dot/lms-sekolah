"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutGrid,
    Users,
    BookOpen,
    ClipboardList,
    BarChart3,
    CalendarDays,
    Settings,
    HelpCircle,
    LogOut,
} from "lucide-react";

const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutGrid },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/kelas", label: "Kelas Management", icon: BookOpen },
    { href: "/admin/assessments", label: "Assessments", icon: ClipboardList },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/jadwal", label: "Jadwal Guru", icon: CalendarDays },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        try {
            await fetch("/api/logout", { method: "POST" });
        } finally {
            router.push("/");
            router.refresh();
        }
    }

    return (
        <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white">
            <div>
                <div className="flex items-center gap-2 px-6 py-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1440] text-white text-sm font-bold">
                        R
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight">
                            RuangIlmu
                        </p>
                        <p className="text-[11px] text-slate-400 leading-tight">
                            Admin Portal
                        </p>
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
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active
                                    ? "bg-[#2F5FEA] text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="space-y-1 border-t border-slate-100 px-3 py-4">
                <Link
                    href="/admin/settings"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                    <Settings size={18} />
                    System Settings
                </Link>
                <Link
                    href="/admin/support"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                    <HelpCircle size={18} />
                    Support
                </Link>
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