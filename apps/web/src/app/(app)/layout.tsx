import { OrgProvider } from "@/hooks/useOrg";
import { AppShell } from "@/components/layout/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrgProvider>
      <AppShell>{children}</AppShell>
    </OrgProvider>
  );
}
