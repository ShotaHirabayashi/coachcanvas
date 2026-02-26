import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info";
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variantClasses[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    active: { variant: "success", label: "アクティブ" },
    archived: { variant: "default", label: "アーカイブ" },
    scheduled: { variant: "info", label: "予定" },
    completed: { variant: "success", label: "完了" },
    cancelled: { variant: "error", label: "キャンセル" },
    no_show: { variant: "warning", label: "欠席" },
    draft: { variant: "default", label: "下書き" },
    sent: { variant: "success", label: "送信済み" },
  };
  const { variant, label } = config[status] || { variant: "default" as const, label: status };
  return <Badge variant={variant}>{label}</Badge>;
}
