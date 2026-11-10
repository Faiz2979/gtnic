import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { SidebarProvider } from "@/components/sidebar-context";

export default function layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SidebarProvider>
            <Sidebar>
                <div className="flex min-h-screen flex-col">
                    <Topbar/>
                    <main className="
                        flex-1
                        bg-[#F4F6F9]
                        p-6 sm:p-8
                    ">
                        {children}
                    </main>
                </div>
            </Sidebar>
        </SidebarProvider>
    );
}
