import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import KepsekSidebar from "./KepsekSidebar";
import ExportPageButton from "@/components/ExportPageButton";

export default async function KepsekLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) redirect("/login");
    if (user.role !== "KEPSEK") redirect("/login");

    return (
        <div className="flex min-h-screen bg-[#F4F6FB]">
            <KepsekSidebar name={user.name} />
            <main className="flex-1 overflow-y-auto">{children}</main>
            <ExportPageButton floating />
        </div>
    );
}