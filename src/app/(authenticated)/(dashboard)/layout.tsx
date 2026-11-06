import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default function layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Sidebar activePage="Dashboard">
            <div className="flex min-h-screen flex-col">

                <Topbar/>

                <main className="
                    flex-1
                    bg-background
                    p-7
                ">
                    {children}
                </main>

            </div>
        </Sidebar>
    );
}