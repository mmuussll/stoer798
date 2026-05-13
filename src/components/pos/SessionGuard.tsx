import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Landmark } from "lucide-react";
import { CURRENCY } from "@/constants";

interface SessionGuardProps {
  openingBalance: string;
  setOpeningBalance: (v: string) => void;
  onOpenSession: () => void;
  isLoading: boolean;
}

export function SessionGuard({ openingBalance, setOpeningBalance, onOpenSession, isLoading }: SessionGuardProps) {
  return (
    <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      <Card className="max-w-md w-full mx-4 shadow-xl border-2 border-blue-200">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
            <Landmark className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">فتح جلسة صندوق</CardTitle>
          <p className="text-sm text-muted-foreground">يجب فتح جلسة صندوق قبل البدء بعمليات البيع</p>
          <p className="text-xs text-gray-400 mt-1">يمكن تعطيل هذه الميزة من الإعدادات</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">المبلغ الافتتاحي ({CURRENCY})</label>
            <Input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0"
              className="text-center text-lg font-bold"
              autoFocus
            />
          </div>
          <Button
            onClick={onOpenSession}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
          >
            {isLoading ? "جاري..." : "فتح الجلسة"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
