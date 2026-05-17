import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

interface StatCardProps {
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  sub?: string;
}

const COLOR_MAP: Record<string, { bg: string; border: string; iconBg: string; value: string }> = {
  "text-blue-600": { bg: "bg-gradient-to-br from-white to-blue-50/60", border: "border-blue-100", iconBg: "bg-blue-100", value: "text-blue-700" },
  "text-emerald-600": { bg: "bg-gradient-to-br from-white to-emerald-50/60", border: "border-emerald-100", iconBg: "bg-emerald-100", value: "text-emerald-700" },
  "text-purple-600": { bg: "bg-gradient-to-br from-white to-purple-50/60", border: "border-purple-100", iconBg: "bg-purple-100", value: "text-purple-700" },
  "text-amber-600": { bg: "bg-gradient-to-br from-white to-amber-50/60", border: "border-amber-100", iconBg: "bg-amber-100", value: "text-amber-700" },
  "text-rose-600": { bg: "bg-gradient-to-br from-white to-rose-50/60", border: "border-rose-100", iconBg: "bg-rose-100", value: "text-rose-700" },
  "text-indigo-600": { bg: "bg-gradient-to-br from-white to-primary/10", border: "border-primary/20", iconBg: "bg-primary/10", value: "text-primary" },
  "text-cyan-600": { bg: "bg-gradient-to-br from-white to-cyan-50/60", border: "border-cyan-100", iconBg: "bg-cyan-100", value: "text-cyan-700" },
  "text-orange-600": { bg: "bg-gradient-to-br from-white to-orange-50/60", border: "border-orange-100", iconBg: "bg-orange-100", value: "text-orange-700" },
};

export function StatCard({ title, value, icon: Icon, color, bg, sub }: StatCardProps) {
  const scheme = COLOR_MAP[color] || { bg: "bg-white", border: "border-border/40", iconBg: "bg-muted", value: "text-foreground/80" };

  return (
    <Card className={cn(
      "group relative overflow-hidden rounded-2xl border-border/60",
      "transition-all duration-300",
      "hover:shadow-lg hover:-translate-y-1 hover:border-primary/15",
      scheme.bg
    )}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-600/80 leading-tight">{title}</p>
            <p className={cn("text-2xl md:text-3xl font-extrabold mt-1.5 tracking-tight tabular-nums", scheme.value)}>
              {value}
            </p>
            {sub && (
              <p className="text-[12px] text-slate-400 font-medium mt-1">{sub}</p>
            )}
          </div>
          <div className={cn(
            "w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0",
            "transition-all duration-300 group-hover:scale-110 group-hover:shadow-md",
            scheme.iconBg
          )}>
            <Icon className={cn("w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:rotate-6", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
