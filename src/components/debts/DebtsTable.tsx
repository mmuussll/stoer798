import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Landmark, User2, Phone, Calendar, FileText,
  History, Banknote, Pencil, Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { STATUS_MAP, getDueStatus } from "@/lib/debt-utils";
import type { Debt } from "@/types";

interface DebtsTableProps {
  debts: Debt[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onDetail: (debt: Debt) => void;
  onPayment: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
  onDebtorDetail: (debt: Debt) => void;
}

export default function DebtsTable({
  debts,
  totalPages,
  currentPage,
  onPageChange,
  onDetail,
  onPayment,
  onEdit,
  onDelete,
  onDebtorDetail,
}: DebtsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-5 h-5 text-blue-600" />
          قائمة الديون ({debts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Landmark className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">لا توجد ديون</p>
            <p className="text-sm mt-1">جرب تغيير معايير البحث</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الزبون</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">الفاتورة</TableHead>
                    <TableHead className="text-right">المبلغ الكلي</TableHead>
                    <TableHead className="text-right">المتبقي</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">تاريخ الاستحقاق</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debts.map((debt) => {
                    const status = STATUS_MAP[debt.status] || STATUS_MAP.active;
                    const StatusIcon = status.icon;
                    const dueStatus = getDueStatus(debt.due_date);
                    const paidPercent = debt.total_amount > 0
                      ? ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100 : 0;

                    return (
                      <TableRow key={debt.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => onDebtorDetail(debt)}>
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                              <User2 className="w-3.5 h-3.5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{debt.customer_name || "غير معروف"}</p>
                              {debt.customer_phone && (
                                <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{debt.customer_phone}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {debt.invoice_number ? (
                            <Badge variant="outline" className="text-xs font-mono text-blue-600">{debt.invoice_number}</Badge>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(debt.total_amount, 2)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold text-red-600">{formatCurrency(debt.remaining_amount, 2)}</p>
                            {paidPercent > 0 && (
                              <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 max-w-[100px]">
                                <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${paidPercent}%` }} />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-xs flex items-center gap-1 w-fit mx-auto ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />{status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className={`text-sm ${dueStatus.color}`}>
                              {debt.due_date || <span className="text-gray-300">-</span>}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-xl"
                              onClick={() => onDetail(debt)} title="التفاصيل والمدفوعات">
                              <History className="w-4 h-4" />
                            </Button>
                            {debt.status !== "paid" && (
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 rounded-xl"
                                onClick={() => onPayment(debt)} title="تسجيل دفعة">
                                <Banknote className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-amber-600 hover:bg-amber-50 active:bg-amber-100 rounded-xl"
                              onClick={() => onEdit(debt)} title="تعديل الدين">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50 active:bg-red-100 rounded-xl"
                              onClick={() => onDelete(debt)} title="إلغاء الدين">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink onClick={() => onPageChange(page)} isActive={currentPage === page} className="cursor-pointer">
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
