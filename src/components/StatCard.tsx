import { Card, CardContent } from "@/components/ui/card";
import type { ComponentType } from "react";

interface StatCardProps {
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  sub?: string;
}

export function StatCard({ title, value, icon: Icon, color, bg, sub }: StatCardProps) {
  return (
    <Card className={bg}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
          </div>
          <Icon className={`w-9 h-9 opacity-40 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}
