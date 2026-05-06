import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Landmark, Play, X, Eye, TrendingUp, TrendingDown,
  DollarSign, CreditCard, RotateCcw, Clock, CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as sessionsApi from "@/api/sessions";
import { useAuth } from "@/contexts/AuthContext";
import { CURRENCY } from "@/constants";
import type { CashSession } from "@/types";

export default function CashSessions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("0");
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closingSession, setClosingSession] = useState<CashSession | null>(null);
  const [closingBalance, setClosingBalance] = useState("0");
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CashSession | null>(null);

  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["cash-sessions"],
    queryFn: sessionsApi.fetchCashSessions,
  });

  const [activeSession, setActiveSession] = useState<CashSession | null>(null);

  useEffect(() => {
    const active = sessions.find((s) => s.status === "open");
    setActiveSession(active || null);
  }, [sessions]);

  const openSessionMutation = useMutation({
    mutationFn: async () => {
      return sessionsApi.openSession({
        user_id: user!.id,
        cashier_name: user?.email || "البائع",
        opening_balance: parseFloat(openingBalance) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
      setShowOpenDialog(false);
      toast({ title: "تم فتح الجلسة" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const closeSessionMutation = useMutation({
    mutationFn: async () => {
      if (!closingSession) throw new Error("لا توجد جلسة");
      return sessionsApi.closeSession(closingSession.id, parseFloat(closingBalance) || 0);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
      setShowCloseDialog(false);
      setClosingSession(null);
      toast({ title: "تم إقفال الجلسة" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const totalPages = Math.ceil(sessions.length / perPage);
  const paginated = sessions.slice((page - 1) * perPage, page * perPage);

  // Summary stats
  const totalSales = sessions.reduce((s, ss) => s + ss.total_sales, 0);
  const totalCash = sessions.reduce((s, ss) => s + ss.total_cash, 0);
  const totalCard = sessions.reduce((s, ss) => s + ss.total_card, 0);
  const totalReturns = sessions.reduce((s, ss) => s + ss.total_returns, 0);
  const totalInvoices = sessions.reduce((s, ss) => s + ss.invoice_count, 0);

  return (
    <div className="space-y-4 p-4" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <Landmark className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{sessions.length}</div><div className="text-xs opacity-80">الجلسات</div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{totalSales.toFixed(0)}</div><div className="text-xs opacity-80">المبيعات ({CURRENCY})</div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{totalCash.toFixed(0)}</div><div className="text-xs opacity-80">نقدي ({CURRENCY})</div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <CreditCard className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{totalCard.toFixed(0)}</div><div className="text-xs opacity-80">بطاقة ({CURRENCY})</div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <RotateCcw className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{totalReturns.toFixed(0)}</div><div className="text-xs opacity-80">مرتجعات ({CURRENCY})</div></div>
          </CardContent>
        </Card>
      </div>

      {/* Action bar */}
      <div className="flex gap-3 items-center flex-wrap">
        {activeSession ? (
          <div className="flex items-center gap-3 flex-1">
            <Badge variant="default" className="bg-green-500 text-white gap-1 px-3 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> جلسة مفتوحة
            </Badge>
            <span className="text-sm text-gray-600">{activeSession.cashier_name} | {activeSession.start_date} {activeSession.start_time}</span>
            <span className="text-sm font-semibold">المبيعات: {activeSession.total_sales.toFixed(2)} {CURRENCY}</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => { setClosingSession(activeSession); setClosingBalance(activeSession.total_cash.toFixed(0)); setShowCloseDialog(true); }}
            >
              <X className="w-3.5 h-3.5 ml-1" /> إقفال الجلسة
            </Button>
          </div>
        ) : (
          <Button onClick={() => setShowOpenDialog(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Play className="w-4 h-4" /> فتح جلسة جديدة
          </Button>
        )}
      </div>

      {/* Sessions Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Landmark className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">لا توجد جلسات</p>
              <p className="text-sm">لم يتم فتح أي جلسة صندوق بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الكاشير</TableHead>
                  <TableHead className="text-center">التاريخ</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">افتتاحي</TableHead>
                  <TableHead className="text-center">المبيعات</TableHead>
                  <TableHead className="text-center">نقدي</TableHead>
                  <TableHead className="text-center">بطاقة</TableHead>
                  <TableHead className="text-center">الفرق</TableHead>
                  <TableHead className="text-center">تفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Landmark className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{session.cashier_name}</div>
                          <div className="text-xs text-gray-500">{session.start_time} - {session.end_time || "..."}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">{session.start_date}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={session.status === "open" ? "default" : "secondary"} className={session.status === "open" ? "bg-green-500" : ""}>
                        {session.status === "open" ? "مفتوحة" : "مقفلة"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{session.opening_balance.toFixed(2)}</TableCell>
                    <TableCell className="text-center font-semibold text-blue-600">{session.total_sales.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{session.total_cash.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{session.total_card.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <span className={session.difference === 0 ? "text-green-600" : session.difference > 0 ? "text-red-600" : "text-amber-600"}>
                        {session.status === "closed" ? `${session.difference.toFixed(2)}` : "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedSession(session); setShowDetailDialog(true); }}>
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>السابق</PaginationLink>
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => (
              <PaginationItem key={i}>
                <PaginationLink onClick={() => setPage(i + 1)} isActive={page === i + 1}>{i + 1}</PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationLink onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>التالي</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Open Session Dialog */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Play className="w-5 h-5 text-blue-600" />فتح جلسة جديدة</DialogTitle>
            <DialogDescription>أدخل المبلغ الافتتاحي الموجود في الصندوق</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">المبلغ الافتتاحي ({CURRENCY})</label>
              <Input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} className="text-center text-lg font-bold" autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenDialog(false)}>إلغاء</Button>
            <Button onClick={() => openSessionMutation.mutate()} disabled={openSessionMutation.isPending} className="bg-blue-600">
              {openSessionMutation.isPending ? "جاري..." : "فتح الجلسة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Session Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><X className="w-5 h-5" />إقفال الجلسة</DialogTitle>
            <DialogDescription>أدخل المبلغ النقدي الفعلي الموجود في الصندوق الآن</DialogDescription>
          </DialogHeader>
          {closingSession && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>المبلغ الافتتاحي:</span><span>{closingSession.opening_balance.toFixed(2)} {CURRENCY}</span></div>
                <div className="flex justify-between"><span>إجمالي المبيعات:</span><span>{closingSession.total_sales.toFixed(2)} {CURRENCY}</span></div>
                <div className="flex justify-between"><span>نقدي مستلم:</span><span>{closingSession.total_cash.toFixed(2)} {CURRENCY}</span></div>
                <div className="flex justify-between"><span>بطاقة:</span><span>{closingSession.total_card.toFixed(2)} {CURRENCY}</span></div>
                <div className="flex justify-between"><span>مرتجعات:</span><span className="text-red-500">-{closingSession.total_returns.toFixed(2)} {CURRENCY}</span></div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>النقدي المتوقع:</span>
                  <span>{(closingSession.opening_balance + closingSession.total_cash - closingSession.total_returns).toFixed(2)} {CURRENCY}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">النقدي الفعلي في الصندوق</label>
                <Input type="number" value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)} className="text-center text-lg font-bold" autoFocus />
              </div>
              {closingBalance && (
                <div className="text-center">
                  <Badge variant="outline" className={parseFloat(closingBalance) >= (closingSession.opening_balance + closingSession.total_cash - closingSession.total_returns) ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}>
                    الفرق: {(parseFloat(closingBalance) - (closingSession.opening_balance + closingSession.total_cash - closingSession.total_returns)).toFixed(2)} {CURRENCY}
                  </Badge>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>إلغاء</Button>
            <Button onClick={() => closeSessionMutation.mutate()} disabled={closeSessionMutation.isPending} className="bg-red-600 hover:bg-red-700">
              {closeSessionMutation.isPending ? "جاري..." : "تأكيد الإقفال"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Landmark className="w-5 h-5 text-blue-600" />تفاصيل الجلسة</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                <div><span className="text-gray-500">الكاشير:</span> <span className="font-medium">{selectedSession.cashier_name}</span></div>
                <div>
                  <Badge variant={selectedSession.status === "open" ? "default" : "secondary"} className={selectedSession.status === "open" ? "bg-green-500" : ""}>
                    {selectedSession.status === "open" ? "مفتوحة" : "مقفلة"}
                  </Badge>
                </div>
                <div><span className="text-gray-500">تاريخ البدء:</span> <span className="font-medium">{selectedSession.start_date} {selectedSession.start_time}</span></div>
                {selectedSession.end_date && <div><span className="text-gray-500">تاريخ الإقفال:</span> <span className="font-medium">{selectedSession.end_date} {selectedSession.end_time}</span></div>}
                <div><span className="text-gray-500">عدد الفواتير:</span> <span className="font-medium">{selectedSession.invoice_count}</span></div>
              </div>
              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span>مبلغ افتتاحي:</span><span className="font-bold">{selectedSession.opening_balance.toFixed(2)} {CURRENCY}</span></div>
                <div className="flex justify-between"><span>إجمالي المبيعات:</span><span className="font-bold text-blue-600">{selectedSession.total_sales.toFixed(2)} {CURRENCY}</span></div>
                <div className="flex justify-between"><span className="text-emerald-600">نقدي:</span><span className="font-semibold">{selectedSession.total_cash.toFixed(2)} {CURRENCY}</span></div>
                <div className="flex justify-between"><span className="text-purple-600">بطاقة:</span><span className="font-semibold">{selectedSession.total_card.toFixed(2)} {CURRENCY}</span></div>
                <div className="flex justify-between"><span className="text-red-600">مرتجعات:</span><span className="font-semibold">-{selectedSession.total_returns.toFixed(2)} {CURRENCY}</span></div>
                <Separator />
                <div className="flex justify-between"><span>النقدي المتوقع:</span><span className="font-semibold">{selectedSession.expected_cash.toFixed(2)} {CURRENCY}</span></div>
                {selectedSession.status === "closed" && (
                  <>
                    <div className="flex justify-between"><span>النقدي الفعلي:</span><span className="font-semibold">{selectedSession.closing_balance.toFixed(2)} {CURRENCY}</span></div>
                    <div className="flex justify-between">
                      <span>الفرق:</span>
                      <span className={`font-bold text-lg ${selectedSession.difference === 0 ? "text-green-600" : selectedSession.difference > 0 ? "text-red-600" : "text-amber-600"}`}>
                        {selectedSession.difference >= 0 ? "+" : ""}{selectedSession.difference.toFixed(2)} {CURRENCY}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
