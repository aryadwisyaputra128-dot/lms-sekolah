"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import PetugasSidebar from "./PetugasSidebar";

export default function PetugasShell({
    name,
    role,
    children,
}: {
    name: string;
    role: string;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <div className="flex min-h-screen bg-[#F4F6FB]">
            <div className="hidden md:block">
                <PetugasSidebar name={name} role={role} />
            </div>

            {open && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-0 h-full shadow-xl">
                        <PetugasSidebar name={name} role={role} />
                    </div>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
                    <button onClick={() => setOpen((v) => !v)} className="text-slate-600" aria-label="Buka menu">
                        {open ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <p className="text-sm font-bold text-[#2F5FEA]">Portal Pemantauan</p>
                </header>

                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}