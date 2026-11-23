"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Menu, X } from "lucide-react";
import GuruSidebar from "./GuruSidebar";

export default function GuruShell({
    name,
    children,
}: {
    name: string;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    // tutup drawer otomatis setiap pindah halaman
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <div className="flex min-h-screen bg-[#F4F6FB]">
            {/* sidebar desktop */}
            <div className="hidden md:block">
                <GuruSidebar name={name} />
            </div>

            {/* drawer mobile */}
            {open && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-0 h-full shadow-xl">
                        <GuruSidebar name={name} />
                    </div>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                {/* top bar mobile */}
                <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="text-slate-600"
                        aria-label="Buka menu"
                    >
                        {open ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2F5FEA] text-xs font-bold text-white">
                            R
                        </div>
                        <p className="text-sm font-bold text-slate-900">RuangIlmu</p>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}