// app/dashboard/layout.tsx
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/Sidebar/app-sidebar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="w-full">
          <div className="bg-background">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
