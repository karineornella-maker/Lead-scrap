import { Suspense } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Sidebar fixe desktop sous Suspense pour streaming usePathname() */}
      <Suspense
        fallback={
          <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block" />
        }
      >
        <AppSidebar userEmail="karine.friend@leadora.ai" />
      </Suspense>

      {/* Zone principale */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <Suspense
          fallback={
            <header className="h-14 border-b border-border bg-background" />
          }
        >
          <AppHeader />
        </Suspense>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
