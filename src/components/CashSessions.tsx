import { useState, useEffect, useMemo } from "react";
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
  Landmark, Play, X, Eye,
  DollarSign, CreditCard, RotateCcw, CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as sessionsApi from "@/api/sessions";
import { useAuth } from "@/contexts/AuthContext";
import { CURRENCY } from "@/constants";
import { formatNumber, formatCurrency, formatNumberDisplay } from "@/lib/format";
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
    queryFn: () => sessionsApi.fetchCashSessions(),
    staleTime: 2 * 60_000,
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
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
      setShowCloseDialog(false);
      setClosingSession(null);
      toast({ title: "تم إقفال الجلسة" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const { totalPages, paginated, stats } = useMemo(() => {
    const tp = Math.ceil(sessions.length / perPage);
    const p = sessions.slice((page - 1) * perPage, page * perPage);
    const s = sessions.reduce(
      (acc, ss) => ({
        totalSales: acc.totalSales + ss.total_sales,
        totalCash: acc.totalCash + ss.total_cash,
        totalCard: acc.totalCard + ss.total_card,
        totalReturns: acc.totalReturns + ss.total_returns,
      }),
      { totalSales: 0, totalCash: 0, totalCard: 0, totalReturns: 0 }
    );
    return { totalPages: tp, paginated: p, stats: s };
  }, [sessions, page]);

  return (
    <div className="space-y-4 p-4" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-gradient-brand text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <Landmark className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{sessions.length}</div><div className="text-xs opacity-80">الجلسات</div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{formatNumberDisplay(stats.totalSales, 0)}</div><div className="text-xs opacity-80">المبيعات ({CURRENCY})</div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{formatNumberDisplay(stats.totalCash, 0)}</div><div className="text-xs opacity-80">نقدي ({CURRENCY})</div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <CreditCard className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{formatNumberDisplay(stats.totalCard, 0)}</div><div className="text-xs opacity-80">بطاقة ({CURRENCY})</div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <RotateCcw className="w-8 h-8 opacity-80" />
            <div><div className="text-2xl font-bold">{formatNumberDisplay(stats.totalReturns, 0)}</div><div className="text-xs opacity-80">مرتجعات ({CURRENCY})</div></div>
          </CardContent>
        </Card>
      </div>

      {/* Action bar */}
      <div className="flex gap-3 items-center flex-wrap">
        {activeSession ? (
          <div className="flex items-center gap-3 flex-1">
            <Badge variant="default" className="bg-success text-white gap-1 px-3 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> جلسة مفتوحة
            </Badge>
            <span className="text-sm text-muted-foreground">{activeSession.cashier_name} | {activeSession.start_date} {activeSession.start_time}</span>
            <span className="text-sm font-semibold">المبيعات: {formatCurrency(activeSession.total_sales, 2)}</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto text-destructive border-destructive/30 hover:bg-destructive/5 active:bg-destructive/10 active:scale-95"
              onClick={() => { setClosingSession(activeSession); setClosingBalance(activeSession.total_cash.toFixed(0)); setShowCloseDialog(true); }}
            >
              <X className="w-3.5 h-3.5 ml-1" /> إقفال الجلسة
            </Button>
          </div>
        ) : (
          <Button onClick={() => setShowOpenDialog(true)} className="bg-primary hover:bg-primary/90 active:bg-primary/80 active:scale-95 gap-2">
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
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/60">
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
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Landmark className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{session.cashier_name}</div>
                          <div className="text-xs text-muted-foreground">{session.start_time} - {session.end_time || "..."}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">{session.start_date}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={session.status === "open" ? "default" : "secondary"} className={session.status === "open" ? "bg-success" : ""}>
                        {session.status === "open" ? "مفتوحة" : "مقفلة"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{formatNumber(session.opening_balance, 2)}</TableCell>
                    <TableCell className="text-center font-semibold text-primary">{formatNumber(session.total_sales, 2)}</TableCell>
                    <TableCell className="text-center">{formatNumber(session.total_cash, 2)}</TableCell>
                    <TableCell className="text-center">{formatNumber(session.total_card, 2)}</TableCell>
                    <TableCell className="text-center">
                      <span className={session.difference === 0 ? "text-success" : session.difference > 0 ? "text-destructive" : "text-warning"}>
                        {session.status === "closed" ? formatNumber(session.difference, 2) : "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/5 active:bg-primary/10" onClick={() => { setSelectedSession(session); setShowDetailDialog(true); }}>
                        <Eye className="w-4 h-4 text-primary" />
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
        <DialogContent dir="rtl" className="max-w-sm max-sm:mx-2 max-sm:w-[calc(100%-16px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Play className="w-5 h-5 text-primary" />فتح جلسة جديدة</DialogTitle>
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
            <Button onClick={() => openSessionMutation.mutate()} disabled={openSessionMutation.isPending} className="bg-primary">
              {openSessionMutation.isPending ? "جاري..." : "فتح الجلسة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Session Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent dir="rtl" className="max-w-sm max-sm:mx-2 max-sm:w-[calc(100%-16px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><X className="w-5 h-5" />إقفال الجلسة</DialogTitle>
            <DialogDescription>أدخل المبلغ النقدي الفعلي الموجود في الصندوق الآن</DialogDescription>
          </DialogHeader>
          {closingSession && (
            <div className="space-y-3">
              <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>المبلغ الافتتاحي:</span><span>{formatCurrency(closingSession.opening_balance, 2)}</span></div>
                <div className="flex justify-between"><span>إجمالي المبيعات:</span><span>{formatCurrency(closingSession.total_sales, 2)}</span></div>
                <div className="flex justify-between"><span>نقدي مستلم:</span><span>{formatCurrency(closingSession.total_cash, 2)}</span></div>
                <div className="flex justify-between"><span>بطاقة:</span><span>{formatCurrency(closingSession.total_card, 2)}</span></div>
                <div className="flex justify-between"><span>مرتجعات:</span><span className="text-destructive">-{formatCurrency(closingSession.total_returns, 2)}</span></div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>النقدي المتوقع:</span>
                  <span>{formatCurrency(closingSession.opening_balance + closingSession.total_cash - closingSession.total_returns, 2)}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">النقدي الفعلي في الصندوق</label>
                <Input type="number" value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)} className="text-center text-lg font-bold" autoFocus />
              </div>
              {closingBalance && (
                <div className="text-center">
                  <Badge variant="outline" className={parseFloat(closingBalance) >= (closingSession.opening_balance + closingSession.total_cash - closingSession.total_returns) ? "bg-success/5 text-success/90" : "bg-destructive/5 text-destructive/90"}>
                    الفرق: {formatCurrency(parseFloat(closingBalance) - (closingSession.opening_balance + closingSession.total_cash - closingSession.total_returns), 2)}
                  </Badge>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>إلغاء</Button>
            <Button onClick={() => closeSessionMutation.mutate()} disabled={closeSessionMutation.isPending} className="bg-destructive hover:bg-destructive/90">
              {closeSessionMutation.isPending ? "جاري..." : "تأكيد الإقفال"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent dir="rtl" className="max-w-md max-sm:mx-2 max-sm:w-[calc(100%-16px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Landmark className="w-5 h-5 text-primary" />تفاصيل الجلسة</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm bg-muted/40 p-3 rounded-lg">
                <div><span className="text-muted-foreground">الكاشير:</span> <span className="font-medium">{selectedSession.cashier_name}</span></div>
                <div>
                  <Badge variant={selectedSession.status === "open" ? "default" : "secondary"} className={selectedSession.status === "open" ? "bg-success" : ""}>
                    {selectedSession.status === "open" ? "مفتوحة" : "مقفلة"}
                  </Badge>
                </div>
                <div><span className="text-muted-foreground">تاريخ البدء:</span> <span className="font-medium">{selectedSession.start_date} {selectedSession.start_time}</span></div>
                {selectedSession.end_date && <div><span className="text-muted-foreground">تاريخ الإقفال:</span> <span className="font-medium">{selectedSession.end_date} {selectedSession.end_time}</span></div>}
                <div><span className="text-muted-foreground">عدد الفواتير:</span> <span className="font-medium">{selectedSession.invoice_count}</span></div>
              </div>
              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span>مبلغ افتتاحي:</span><span className="font-bold">{formatCurrency(selectedSession.opening_balance, 2)}</span></div>
                <div className="flex justify-between"><span>إجمالي المبيعات:</span><span className="font-bold text-primary">{formatCurrency(selectedSession.total_sales, 2)}</span></div>
                <div className="flex justify-between"><span className="text-success">نقدي:</span><span className="font-semibold">{formatCurrency(selectedSession.total_cash, 2)}</span></div>
                <div className="flex justify-between"><span className="text-purple-600">بطاقة:</span><span className="font-semibold">{formatCurrency(selectedSession.total_card, 2)}</span></div>
                <div className="flex justify-between"><span className="text-destructive">مرتجعات:</span><span className="font-semibold">-{formatCurrency(selectedSession.total_returns, 2)}</span></div>
                <Separator />
                <div className="flex justify-between"><span>النقدي المتوقع:</span><span className="font-semibold">{formatCurrency(selectedSession.expected_cash, 2)}</span></div>
                {selectedSession.status === "closed" && (
                  <>
                    <div className="flex justify-between"><span>النقدي الفعلي:</span><span className="font-semibold">{formatCurrency(selectedSession.closing_balance, 2)}</span></div>
                    <div className="flex justify-between">
                      <span>الفرق:</span>
                      <span className={`font-bold text-lg ${selectedSession.difference === 0 ? "text-success" : selectedSession.difference > 0 ? "text-destructive" : "text-warning"}`}>
                        {selectedSession.difference >= 0 ? "+" : ""}{formatCurrency(selectedSession.difference, 2)}
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
