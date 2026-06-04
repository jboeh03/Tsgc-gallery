import Sidebar from "@/components/admin/Sidebar";
import MobileNav from "@/components/admin/MobileNav";
import VoiceHQ from "@/components/admin/VoiceHQ";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bone">
      <Sidebar />
      {/* pb clears the mobile bottom tab bar; lg removes it */}
      <div className="flex-1 flex flex-col min-w-0 pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>
      <MobileNav />
      <VoiceHQ />
    </div>
  );
}
