import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import PetugasShell from "./PetugasShell";
import ExportPageButton from "@/components/ExportPageButton";

export default async function PetugasRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user || (user.role !== "WAKAKURI" && user.role !== "KEPSEK")) {
        redirect("/");
    }

    return (
        <>
            <PetugasShell name={user.name} role={user.role}>
                {children}
            </PetugasShell>
            <ExportPageButton floating />
        </>
    );
}