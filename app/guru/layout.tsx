import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import GuruShell from "./GuruShell";

export default async function GuruRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user || user.role !== "GURU") {
        redirect("/");
    }

    return <GuruShell name={user.name}>{children}</GuruShell>;
}