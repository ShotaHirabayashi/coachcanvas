import { cn } from "@/lib/utils";

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={cn("flex-1 overflow-y-auto pb-20 md:pb-8")}>
      <div className={cn("max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6", className)}>
        {children}
      </div>
    </main>
  );
}
