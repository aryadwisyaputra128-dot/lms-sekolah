import AdminSidebar from "./AdminSidebar";

export default function AdminRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#F4F6FB]">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    );
}