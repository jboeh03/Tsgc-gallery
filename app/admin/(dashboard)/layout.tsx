import Sidebar from "@/components/admin/Sidebar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bone">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
