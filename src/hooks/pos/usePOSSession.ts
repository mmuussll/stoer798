import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as sessionsApi from "@/api/sessions";
import type { CashSession } from "@/types";

export function usePOSSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("0");
  const [closingBalance, setClosingBalance] = useState("0");
  const [showCloseSessionDialog, setShowCloseSessionDialog] = useState(false);

  const { data: activeSessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ["active-session", user?.id],
    queryFn: () => sessionsApi.getActiveSession(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (activeSessionData && !activeSession) {
      setActiveSession(activeSessionData);
    }
  }, [activeSessionData, activeSession]);

  const openSessionMutation = useMutation({
    mutationFn: () => sessionsApi.openSession({
      user_id: user!.id, cashier_name: user?.email || "البائع",
      opening_balance: parseFloat(openingBalance) || 0,
    }),
    onSuccess: (session) => {
      setActiveSession(session); setShowSessionDialog(false);
      toast({ title: "تم فتح الجلسة" });
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const closeSessionMutation = useMutation({
    mutationFn: () => sessionsApi.closeSession(activeSession!.id, parseFloat(closingBalance) || 0),
    onSuccess: () => {
      setActiveSession(null); setShowCloseSessionDialog(false);
      queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
      toast({ title: "تم إقفال الجلسة" });
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const updateSessionStats = async (stats: {
    total_sales: number; total_cash: number; total_card: number;
    total_returns: number; invoice_count: number;
  }) => {
    if (!activeSession) return;
    try {
      await sessionsApi.updateSessionStats(activeSession.id, stats);
      setActiveSession((prev) => prev ? {
        ...prev,
        total_sales: prev.total_sales + stats.total_sales,
        total_cash: prev.total_cash + stats.total_cash,
        total_card: prev.total_card + stats.total_card,
        invoice_count: prev.invoice_count + stats.invoice_count,
      } : null);
    } catch { /* non-critical */ }
  };

  return {
    activeSession, sessionLoading,
    showSessionDialog, setShowSessionDialog,
    openingBalance, setOpeningBalance,
    closingBalance, setClosingBalance,
    showCloseSessionDialog, setShowCloseSessionDialog,
    openSessionMutation, closeSessionMutation,
    updateSessionStats,
  };
}
