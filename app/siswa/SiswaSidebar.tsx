"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardCheck, CalendarDays, BarChart3 } from "lucide-react";

const navItems = [
    { href: "/siswa", label: "Mata Pelajaran", icon: BookOpen },
    { href: "/siswa/assessments", label: "Tugas & Ujian", icon: ClipboardCheck },
    { href: "/siswa/calendar", label: "Kalender", icon: CalendarDays },
    { href: "/siswa/analytics", label: "Nilai Saya", icon: BarChart3 },
];

export default function SiswaSidebar({ name }: { name: string }) {
    const pathname = usePathname();
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <aside className="flex h-screen w-60 shrink-0 flex-col justify-between border-r border-slate-200 bg-white">
            <div>
                <div className="flex items-center gap-2 px-5 py-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2F5FEA] text-white text-sm font-bold">
                        R
                    </div>
                    <p className="text-sm font-bold text-slate-900">RuangIlmu</p>
                </div>

                <div className="mx-3 mb-4 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2F5FEA] text-xs font-semibold text-white">
                        {initials}
                    </span>
                    <div>
                        <p className="text-xs font-semibold text-slate-800">{name}</p>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Siswa</p>
                    </div>
                </div>

                <nav className="space-y-1 px-3">
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
        </aside>
    );
}