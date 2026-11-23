import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import SiswaShell from "./SiswaShell";

export default async function SiswaRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user || user.role !== "MURID") {
        redirect("/");
    }

    return <SiswaShell name={user.name}>{children}</SiswaShell>;
}