import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as settingsApi from "@/api/settings";
import { generateTestPage, connectSerialPrinter, printViaSerial, disconnectSerialPrinter, isWebSerialSupported } from "@/lib/thermalPrinter";
import type { StoreSettings } from "@/types";
import {
  Store, Receipt, Percent, Coins, Settings2,
  Printer, Save, RotateCcw,
  Users,
  AlertTriangle, Shield, HardDrive, Clock,
  Usb, Network, Monitor,
  MessageCircle, Key, Database, Download, Upload,
  TestTube,
} from "lucide-react";

// ==================== Helper Components ====================

function SettingRow({
  label, description, children, className = "",
}: { label: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 ${className}`}>
      <div className="space-y-0.5 min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SettingSwitch({
  label, description, checked, onCheckedChange,
}: { label: string; description?: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <SettingRow label={label} description={description}>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </SettingRow>
  );
}

function SettingInput({
  label, value, onChange, placeholder = "", type = "text", dir,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; dir?: string }) {
  return (
    <SettingRow label={label}>
      <Input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} className="w-full sm:w-64" dir={dir}
      />
    </SettingRow>
  );
}

function SettingNumberInput({
  label, value, onChange, min = 0, max,
}: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <SettingRow label={label}>
      <Input
        type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min} max={max} className="w-full sm:w-32" dir="ltr"
      />
    </SettingRow>
  );
}

function SettingSelect({
  label, value, onValueChange, options,
}: { label: string; value: string; onValueChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <SettingRow label={label}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingRow>
  );
}

// ==================== Main Component ====================

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("store");
  const [serialPort, setSerialPort] = useState<Record<string, unknown> | null>(null);
  const [printerTesting, setPrinterTesting] = useState(false);
  const [serialSupported] = useState(() => isWebSerialSupported());

  const isOwner = profile?.role === "owner";

  const { data: fetchedSettings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.fetchSettings,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (fetchedSettings && !hasChanges) {
      setSettings(fetchedSettings);
    }
  }, [fetchedSettings, hasChanges]);

  const update = (key: keyof StoreSettings, value: unknown) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
    setHasChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!settings) throw new Error("لا توجد إعدادات");
      const { id: _id, created_at: _created_at, updated_at: _updated_at, ...rest } = settings;
      return settingsApi.updateSettings(rest);
    },
    onSuccess: (saved) => {
      setSettings(saved);
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "تم حفظ الإعدادات بنجاح" });
    },
    onError: (error: Error) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
  });

  const resetDefaults = () => {
    settingsApi.fetchSettings().then((s) => {
      setSettings(s);
      setHasChanges(false);
      toast({ title: "تم إعادة تحميل الإعدادات" });
    });
  };

  const handleConnectSerial = async () => {
    try {
      const port = await connectSerialPrinter();
      if (port) {
        setSerialPort(port);
        toast({ title: "تم الاتصال بالطابعة عبر USB" });
      } else {
        toast({ title: "تعذر الاتصال", description: "لم يتم العثور على طابعة USB", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في الاتصال", variant: "destructive" });
    }
  };

  const handleDisconnectSerial = async () => {
    if (serialPort) {
      await disconnectSerialPrinter(serialPort);
      setSerialPort(null);
      toast({ title: "تم قطع الاتصال بالطابعة" });
    }
  };

  const handleTestPrint = async () => {
    if (!settings) return;
    setPrinterTesting(true);
    try {
      if (settings.printer_type === "serial" && serialPort) {
        const data = generateTestPage({
          type: "serial", paperSize: settings.receipt_paper_size,
          charsPerLine: settings.printer_chars_per_line,
          encoding: settings.printer_encoding,
          density: settings.thermal_print_density,
          speed: settings.thermal_print_speed,
          cutterEnabled: settings.printer_cutter_enabled,
          drawerEnabled: false, drawerPin: settings.printer_drawer_pin,
        });
        const ok = await printViaSerial(serialPort, data);
        if (ok) toast({ title: "تم إرسال صفحة الاختبار إلى الطابعة" });
        else toast({ title: "فشل إرسال البيانات للطابعة", variant: "destructive" });
      } else {
        // Browser print test
        const w = window.open("", "_blank", "width=400,height=300");
        if (w) {
          w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><style>
            body{font-family:monospace;text-align:center;padding:20px;}
            h1{font-size:18px;} .divider{border-top:1px dashed #999;margin:10px 0;}
          </style></head><body>
            <h1>اختبار الطباعة</h1>
            <div class="divider"></div>
            <p>حجم الورق: ${settings.receipt_paper_size}</p>
            <p>نوع الطابعة: ${settings.printer_type === "browser" ? "متصفح" : settings.printer_type === "serial" ? "USB مباشر" : "شبكة"}</p>
            <p>عدد الأحرف: ${settings.printer_chars_per_line}</p>
            <p>الترميز: ${settings.printer_encoding}</p>
            <div class="divider"></div>
            <p>✓ تم الاختبار بنجاح</p>
            <p style="color:#666;font-size:10px;">${new Date().toLocaleString("ar-SA")}</p>
            <script>window.onload=function(){setTimeout(function(){window.print()},500)}</script>
          </body></html>`);
          w.document.close();
        }
        toast({ title: "تم فتح نافذة اختبار الطباعة" });
      }
    } catch (e: Record<string, unknown>) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setPrinterTesting(false);
    }
  };

  const handleExportSettings = () => {
    if (!settings) return;
    const { id: _id, created_at: _created_at, updated_at: _updated_at, ...exportData } = settings;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settings-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "تم تصدير الإعدادات بنجاح" });
  };

  const handleImportSettings = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: Record<string, unknown>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const { id: _id, created_at: _created_at, updated_at: _updated_at, ...rest } = data;
        await settingsApi.updateSettings(rest);
        const fresh = await settingsApi.fetchSettings();
        setSettings(fresh);
        setHasChanges(false);
        queryClient.invalidateQueries({ queryKey: ["settings"] });
        toast({ title: "تم استيراد الإعدادات بنجاح" });
      } catch {
        toast({ title: "فشل استيراد الملف", description: "تأكد من صحة الملف", variant: "destructive" });
      }
    };
    input.click();
  };

  if (isLoading || !fetchedSettings) {
    return (
      <div className="space-y-4 p-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-[500px] rounded-lg" />
      </div>
    );
  }

  if (!settings) return <div className="p-8 text-center text-muted-foreground" dir="rtl">تعذر تحميل الإعدادات</div>;

  const tabs = [
    { id: "store", label: "المتجر", icon: Store },
    { id: "printer", label: "الطابعة", icon: Printer },
    { id: "receipt", label: "الفاتورة", icon: Receipt },
    { id: "tax", label: "الضرائب", icon: Percent },
    { id: "loyalty", label: "الولاء", icon: Users },
    { id: "currency", label: "العملة", icon: Coins },
    { id: "prefs", label: "تفضيلات", icon: Settings2 },
    { id: "security", label: "الأمان", icon: Shield },
    { id: "backup", label: "النسخ الاحتياطي", icon: HardDrive },
    { id: "integration", label: "التكامل", icon: MessageCircle },
  ];

  return (
    <div className="space-y-6 p-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإعدادات المتقدمة</h1>
          <p className="text-sm text-gray-500 mt-1">جميع إعدادات النظام - الطابعة، الفواتير، الضرائب، الأمان والتكامل</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isOwner ? (
            <>
              <Button variant="outline" size="sm" onClick={handleExportSettings} className="gap-1 active:scale-95">
                <Download className="w-3.5 h-3.5" /> تصدير
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportSettings} className="gap-1 active:scale-95">
                <Upload className="w-3.5 h-3.5" /> استيراد
              </Button>
              <Button variant="outline" onClick={resetDefaults} className="gap-2 active:scale-95">
                <RotateCcw className="w-4 h-4" /> إعادة تعيين
              </Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending} className="gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95">
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
              </Button>
            </>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Shield className="w-3 h-3" /> للقراءة فقط
            </Badge>
          )}
        </div>
      </div>

      {hasChanges && (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" /> توجد تغييرات غير محفوظة
        </Badge>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start gap-1 flex-wrap h-auto p-1">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="gap-1.5 text-xs sm:text-sm min-h-[44px] px-3">
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ============ 1. STORE INFO ============ */}
        <TabsContent value="store" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Store className="w-5 h-5 text-blue-600" />معلومات المتجر الأساسية</CardTitle>
              <CardDescription>البيانات الرسمية التي تظهر في الفواتير والتقارير والمراسلات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingInput label="اسم المتجر التجاري" value={settings.store_name} onChange={(v) => update("store_name", v)} />
              <SettingInput label="اسم المالك / المدير" value={settings.store_owner_name} onChange={(v) => update("store_owner_name", v)} />
              <Separator className="my-3" />
              <SettingInput label="رقم الهاتف الأرضي" value={settings.store_phone} onChange={(v) => update("store_phone", v)} type="tel" dir="ltr" />
              <SettingInput label="رقم الجوال" value={settings.store_mobile} onChange={(v) => update("store_mobile", v)} type="tel" dir="ltr" />
              <SettingInput label="البريد الإلكتروني" value={settings.store_email} onChange={(v) => update("store_email", v)} type="email" dir="ltr" />
              <SettingInput label="الموقع الإلكتروني" value={settings.store_website} onChange={(v) => update("store_website", v)} dir="ltr" placeholder="https://example.com" />
              <SettingInput label="العنوان الكامل" value={settings.store_address} onChange={(v) => update("store_address", v)} />
              <Separator className="my-3" />
              <SettingInput label="رقم السجل التجاري" value={settings.store_registration_number} onChange={(v) => update("store_registration_number", v)} />
              <SettingInput label="الرقم الضريبي" value={settings.store_tax_number} onChange={(v) => update("store_tax_number", v)} />
              <Separator className="my-3" />
              <SettingInput label="رابط شعار المتجر (URL)" value={settings.store_logo_url} onChange={(v) => update("store_logo_url", v)} dir="ltr" placeholder="https://..." />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ 2. PRINTER ============ */}
        <TabsContent value="printer" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Printer className="w-5 h-5 text-violet-600" />إعدادات الطابعة الحرارية</CardTitle>
              <CardDescription>تكوين اتصال الطابعة الحرارية ونوع الطباعة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingSelect label="نوع اتصال الطابعة" value={settings.printer_type} onValueChange={(v) => update("printer_type", v)}
                options={[
                  { value: "browser", label: "طباعة المتصفح (Print Dialog)" },
                  { value: "serial", label: "USB مباشر (Web Serial)" },
                  { value: "network", label: "طابعة شبكة (IP/Port)" },
                ]} />

              {settings.printer_type === "browser" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                  <p className="text-xs text-blue-800 flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> وضع المتصفح: ستظهر نافذة الطباعة القياسية بعد كل عملية بيع. مناسب لجميع أنواع الطابعات.</p>
                </div>
              )}

              {settings.printer_type === "serial" && (
                <div className="space-y-3 mt-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800 flex items-center gap-1"><Usb className="w-3.5 h-3.5" /> وضع USB: يتطلب متصفح Chrome/Edge مع HTTPS. يتم الاتصال بالطابعة مباشرة عبر ESC/POS.</p>
                  </div>
                  {serialSupported ? (
                    <div className="flex gap-2">
                      {!serialPort ? (
                        <Button variant="outline" size="sm" onClick={handleConnectSerial} className="gap-1">
                          <Usb className="w-3.5 h-3.5" /> توصيل الطابعة
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={handleDisconnectSerial} className="gap-1 text-red-600">
                          <Usb className="w-3.5 h-3.5" /> قطع الاتصال
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={handleTestPrint} disabled={!serialPort || printerTesting} className="gap-1">
                        <TestTube className="w-3.5 h-3.5" /> {printerTesting ? "جاري..." : "اختبار الطباعة"}
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> متصفحك لا يدعم Web Serial API</Badge>
                  )}
                  <SettingSelect label="سرعة الاتصال (Baud Rate)" value="9600" onValueChange={() => {}}
                    options={[{ value: "9600", label: "9600 (قياسي)" }, { value: "19200", label: "19200" }, { value: "38400", label: "38400" }, { value: "115200", label: "115200" }]} />
                </div>
              )}

              {settings.printer_type === "network" && (
                <div className="space-y-3 mt-3">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-xs text-purple-800 flex items-center gap-1"><Network className="w-3.5 h-3.5" /> وضع الشبكة: يتطلب خادم طباعة محلي (Local Proxy) أو طابعة تدعم IP مباشر.</p>
                  </div>
                  <SettingInput label="عنوان IP الطابعة" value={settings.printer_ip} onChange={(v) => update("printer_ip", v)} dir="ltr" placeholder="192.168.1.100" />
                  <SettingInput label="منفذ الطابعة (Port)" value={settings.printer_port} onChange={(v) => update("printer_port", v)} dir="ltr" placeholder="9100" />
                </div>
              )}

              <Separator className="my-3" />
              <SettingSelect label="حجم ورق الطباعة" value={settings.receipt_paper_size} onValueChange={(v) => update("receipt_paper_size", v)}
                options={[
                  { value: "80mm", label: "حرارية 80mm (شائعة)" },
                  { value: "58mm", label: "حرارية 58mm (صغيرة)" },
                  { value: "A4", label: "A4 (ورق عادي)" },
                  { value: "A5", label: "A5" },
                ]} />
              <SettingSelect label="عدد الأحرف في السطر" value={String(settings.printer_chars_per_line)} onValueChange={(v) => update("printer_chars_per_line", parseInt(v))}
                options={[{ value: "32", label: "32 حرف (58mm)" }, { value: "42", label: "42 حرف (76mm)" }, { value: "48", label: "48 حرف (80mm)" }]} />
              <SettingSelect label="ترميز الطابعة" value={settings.printer_encoding} onValueChange={(v) => update("printer_encoding", v)}
                options={[{ value: "utf8", label: "UTF-8 (حديث)" }, { value: "cp1256", label: "Windows-1256 (عربي)" }, { value: "cp864", label: "CP864 (عربي IBM)" }, { value: "ascii", label: "ASCII (إنجليزي فقط)" }]} />
              <Separator className="my-3" />
              <SettingSwitch label="تفعيل قاطع الورق التلقائي" description="قص الورق تلقائياً بعد الطباعة (إذا كانت الطابعة تدعم)" checked={settings.printer_cutter_enabled} onCheckedChange={(v) => update("printer_cutter_enabled", v)} />
              <SettingSwitch label="فتح الدرج النقدي" description="فتح درج النقود تلقائياً بعد الطباعة" checked={settings.printer_drawer_enabled} onCheckedChange={(v) => update("printer_drawer_enabled", v)} />
              {settings.printer_drawer_enabled && (
                <SettingSelect label="رقم دبوس الدرج (Pin)" value={String(settings.printer_drawer_pin)} onValueChange={(v) => update("printer_drawer_pin", parseInt(v))}
                  options={[{ value: "0", label: "Pin 2 (DK)" }, { value: "1", label: "Pin 5 (DK)" }]} />
              )}
              <Separator className="my-3" />
              <SettingSelect label="كثافة الطباعة" value={String(settings.thermal_print_density)} onValueChange={(v) => update("thermal_print_density", parseInt(v))}
                options={Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `مستوى ${i + 1}` }))} />
              <SettingSelect label="سرعة الطباعة" value={String(settings.thermal_print_speed)} onValueChange={(v) => update("thermal_print_speed", parseInt(v))}
                options={[{ value: "1", label: "بطيئة (أفضل جودة)" }, { value: "2", label: "متوسطة" }, { value: "3", label: "سريعة" }]} />
              <Separator className="my-3" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleTestPrint} disabled={printerTesting} className="gap-1">
                  <TestTube className="w-3.5 h-3.5" /> {printerTesting ? "جاري..." : "طباعة صفحة اختبار"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ 3. RECEIPT / INVOICE ============ */}
        <TabsContent value="receipt" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Receipt className="w-5 h-5 text-emerald-600" />تصميم الفاتورة</CardTitle>
              <CardDescription>تخصيص شكل ومحتوى فاتورة البيع المطبوعة والإلكترونية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingInput label="نص رأس الفاتورة" value={settings.receipt_header} onChange={(v) => update("receipt_header", v)} placeholder="رسالة ترحيبية أعلى الفاتورة" />
              <SettingInput label="نص تذييل الفاتورة" value={settings.receipt_footer} onChange={(v) => update("receipt_footer", v)} placeholder="رسالة شكر وسياسة الإرجاع" />
              <Separator className="my-3" />
              <SettingSwitch label="إظهار معلومات المتجر" description="الاسم، العنوان، الهاتف في رأس الفاتورة" checked={settings.receipt_show_store_info} onCheckedChange={(v) => update("receipt_show_store_info", v)} />
              <SettingSwitch label="إظهار شعار المتجر" description="عرض اللوجو في رأس الفاتورة" checked={settings.receipt_show_logo} onCheckedChange={(v) => update("receipt_show_logo", v)} />
              <SettingSwitch label="إظهار اسم الكاشير" description="اسم البائع الذي أتم العملية" checked={settings.receipt_show_cashier} onCheckedChange={(v) => update("receipt_show_cashier", v)} />
              <Separator className="my-3" />
              <SettingSwitch label="إظهار باركود الفاتورة" description="باركود رقم الفاتورة أسفل الإيصال" checked={settings.receipt_show_barcode} onCheckedChange={(v) => update("receipt_show_barcode", v)} />
              <SettingSwitch label="إظهار رمز QR" description="رمز QR يحتوي على بيانات الفاتورة" checked={settings.receipt_show_qr} onCheckedChange={(v) => update("receipt_show_qr", v)} />
              <SettingSwitch label="إظهار إطار حول الفاتورة" checked={settings.receipt_show_border} onCheckedChange={(v) => update("receipt_show_border", v)} />
              <SettingSwitch label="وضع مضغوط" description="تصغير حجم الخط وتقليل المسافات للطباعة الحرارية" checked={settings.receipt_compact_mode} onCheckedChange={(v) => update("receipt_compact_mode", v)} />
              <Separator className="my-3" />
              <SettingNumberInput label="عدد النسخ المطبوعة" value={settings.receipt_copies} onChange={(v) => update("receipt_copies", v)} min={1} max={5} />
              <SettingSwitch label="طباعة تلقائية بعد البيع" description="تفتح نافذة الطباعة مباشرة بعد إتمام الفاتورة" checked={settings.receipt_auto_print} onCheckedChange={(v) => update("receipt_auto_print", v)} />
              <Separator className="my-3" />
              <SettingSelect label="نوع خط الفاتورة" value={settings.receipt_font_family} onValueChange={(v) => update("receipt_font_family", v)}
                options={[
                  { value: "monospace", label: "Monospace (قياسي)" },
                  { value: "cairo", label: "Cairo (عربي أنيق)" },
                  { value: "tajawal", label: "Tajawal (عصري)" },
                  { value: "arial", label: "Arial / Tahoma" },
                ]} />
              <SettingNumberInput label="حجم الخط الأساسي" value={settings.receipt_font_size} onChange={(v) => update("receipt_font_size", v)} min={8} max={20} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ 4. TAX ============ */}
        <TabsContent value="tax" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Percent className="w-5 h-5 text-orange-600" />إعدادات الضرائب</CardTitle>
              <CardDescription>تكوين نظام الضرائب والرسوم على الفواتير</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingSwitch label="تفعيل الضريبة الأساسية" description="تطبق على الفواتير عند البيع" checked={settings.tax_enabled} onCheckedChange={(v) => update("tax_enabled", v)} />
              <SettingInput label="اسم الضريبة" value={settings.tax_name} onChange={(v) => update("tax_name", v)} placeholder="ضريبة القيمة المضافة" />
              <SettingNumberInput label="نسبة الضريبة (%)" value={settings.tax_rate} onChange={(v) => update("tax_rate", v)} min={0} max={100} />
              <SettingSwitch label="الأسعار تشمل الضريبة" description="عند التفعيل، السعر المدخل للمنتج يشمل الضريبة" checked={settings.tax_include_in_price} onCheckedChange={(v) => update("tax_include_in_price", v)} />
              <Separator className="my-3" />
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">ضريبة إضافية</Badge>
              </div>
              <SettingSwitch label="تفعيل الضريبة الثانية" description="للحالات التي تتطلب ضريبتين مختلفتين" checked={settings.second_tax_enabled} onCheckedChange={(v) => update("second_tax_enabled", v)} />
              <SettingInput label="اسم الضريبة الثانية" value={settings.second_tax_name} onChange={(v) => update("second_tax_name", v)} placeholder="ضريبة إضافية" />
              <SettingNumberInput label="نسبة الضريبة الثانية (%)" value={settings.second_tax_rate} onChange={(v) => update("second_tax_rate", v)} min={0} max={100} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ 5. LOYALTY ============ */}
        <TabsContent value="loyalty" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Users className="w-5 h-5 text-pink-600" />نظام الولاء والنقاط</CardTitle>
              <CardDescription>إعدادات برنامج الولاء ومكافآت الزبائن</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingSwitch label="تفعيل نظام الولاء" description="يكسب الزبائن نقاطاً مع كل عملية شراء" checked={settings.enable_loyalty} onCheckedChange={(v) => update("enable_loyalty", v)} />
              <Separator className="my-3" />
              <SettingNumberInput label="كل (مبلغ) يمنح نقطة" value={settings.loyalty_points_per_amount} onChange={(v) => update("loyalty_points_per_amount", v)} />
              <SettingNumberInput label="قيمة النقطة الواحدة (بالعملة)" value={settings.loyalty_points_value} onChange={(v) => update("loyalty_points_value", v)} />
              <SettingNumberInput label="الحد الأدنى لاستبدال النقاط" value={settings.loyalty_min_points_redeem} onChange={(v) => update("loyalty_min_points_redeem", v)} />
              <SettingNumberInput label="نقاط ترحيبية للزبون الجديد" value={settings.loyalty_welcome_points} onChange={(v) => update("loyalty_welcome_points", v)} />
              <SettingNumberInput label="صلاحية النقاط (بالأيام)" value={settings.loyalty_points_expire_days} onChange={(v) => update("loyalty_points_expire_days", v)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ 6. CURRENCY & LOCALIZATION ============ */}
        <TabsContent value="currency" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Coins className="w-5 h-5 text-amber-600" />العملة والتنسيق</CardTitle>
              <CardDescription>إعدادات العملة والتاريخ والوقت واللغة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingInput label="رمز العملة" value={settings.currency} onChange={(v) => update("currency", v)} placeholder="د.ع" />
              <SettingSelect label="موضع رمز العملة" value={settings.currency_position} onValueChange={(v) => update("currency_position", v)}
                options={[
                  { value: "after", label: "بعد المبلغ (1000 د.ع)" },
                  { value: "before", label: "قبل المبلغ (د.ع 1000)" },
                ]} />
              <Separator className="my-3" />
              <SettingSelect label="تنسيق التاريخ" value={settings.date_format} onValueChange={(v) => update("date_format", v)}
                options={[
                  { value: "yyyy-MM-dd", label: "2025-05-05 (ISO)" },
                  { value: "dd/MM/yyyy", label: "05/05/2025 (يوم/شهر/سنة)" },
                  { value: "MM/dd/yyyy", label: "05/05/2025 (شهر/يوم/سنة)" },
                ]} />
              <SettingSelect label="تنسيق الوقت" value={settings.time_format} onValueChange={(v) => update("time_format", v)}
                options={[
                  { value: "12h", label: "12 ساعة (صباحاً/مساءً)" },
                  { value: "24h", label: "24 ساعة (عسكري)" },
                ]} />
              <SettingSelect label="لغة الواجهة" value={settings.language} onValueChange={(v) => update("language", v)}
                options={[
                  { value: "ar", label: "العربية" },
                  { value: "en", label: "English" },
                ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ 7. PREFERENCES ============ */}
        <TabsContent value="prefs" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Settings2 className="w-5 h-5 text-indigo-600" />تفضيلات النظام</CardTitle>
              <CardDescription>ضبط سلوك واجهة نقطة البيع والميزات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingSelect label="طريقة الدفع الافتراضية" value={settings.default_payment_method} onValueChange={(v) => update("default_payment_method", v)}
                options={[
                  { value: "cash", label: "نقداً" },
                  { value: "card", label: "بطاقة" },
                  { value: "mixed", label: "مختلط (نقد + بطاقة)" },
                ]} />
              <SettingInput label="بادئة رقم الفاتورة" value={settings.invoice_number_prefix} onChange={(v) => update("invoice_number_prefix", v)} placeholder="INV-" dir="ltr" />
              <Separator className="my-3" />
              <SettingNumberInput label="حد التنبيه لنفاد المخزون" value={settings.low_stock_alert} onChange={(v) => update("low_stock_alert", v)} min={1} />
              <SettingNumberInput label="أقصى نسبة خصم مسموح (%)" value={settings.max_discount_percentage} onChange={(v) => update("max_discount_percentage", v)} min={0} max={100} />
              <SettingNumberInput label="عدد أعمدة شبكة المنتجات" value={settings.grid_columns} onChange={(v) => update("grid_columns", v)} min={2} max={8} />
              <Separator className="my-3" />
              <SettingSwitch label="تفعيل تعليق الفواتير" description="حفظ واسترجاع الفواتير المعلقة" checked={settings.enable_hold_orders} onCheckedChange={(v) => update("enable_hold_orders", v)} />
              <SettingSwitch label="تفعيل البيع السريع" description="إضافة منتج سريع بدون باركود" checked={settings.enable_fast_sale} onCheckedChange={(v) => update("enable_fast_sale", v)} />
              <SettingSwitch label="إلزامية اختيار الزبون" description="يجب اختيار زبون قبل إتمام البيع" checked={settings.enable_customer_required} onCheckedChange={(v) => update("enable_customer_required", v)} />
              <SettingSwitch label="تفعيل مسح الباركود" checked={settings.enable_barcode_scanner} onCheckedChange={(v) => update("enable_barcode_scanner", v)} />
              <SettingSwitch label="إظهار صور المنتجات" description="عرض الصور في شبكة المنتجات" checked={settings.show_product_images} onCheckedChange={(v) => update("show_product_images", v)} />
              <SettingSwitch label="السماح بالمخزون السالب" checked={settings.enable_negative_stock} onCheckedChange={(v) => update("enable_negative_stock", v)} />
              <SettingSwitch label="تفعيل التنبيهات الصوتية" description="صوت عند إتمام البيع أو التنبيهات" checked={settings.enable_sound_notifications} onCheckedChange={(v) => update("enable_sound_notifications", v)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ 8. SECURITY ============ */}
        <TabsContent value="security" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Shield className="w-5 h-5 text-red-600" />إعدادات الأمان</CardTitle>
              <CardDescription>حماية النظام وحسابات المستخدمين</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingNumberInput label="مهلة انتهاء الجلسة (دقيقة)" value={settings.session_timeout_minutes} onChange={(v) => update("session_timeout_minutes", v)} min={5} max={480} />
              <SettingNumberInput label="الحد الأدنى لطول كلمة المرور" value={settings.password_min_length} onChange={(v) => update("password_min_length", v)} min={4} max={32} />
              <SettingSwitch label="تفعيل المصادقة الثنائية (2FA)" description="خطوة تحقق إضافية عند تسجيل الدخول" checked={settings.enable_2fa} onCheckedChange={(v) => update("enable_2fa", v)} />
              <SettingSwitch label="إشعارات سطح المكتب" description="تنبيهات تظهر على سطح المكتب" checked={settings.enable_desktop_notifications} onCheckedChange={(v) => update("enable_desktop_notifications", v)} />
              <SettingSwitch label="إجبارية جلسات الصندوق" description="يجب فتح جلسة صندوق قبل البيع - يمكن تعطيلها" checked={settings.require_cash_session} onCheckedChange={(v) => update("require_cash_session", v)} />
              <Separator className="my-3" />
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> مهلة الجلسة: سيتم تسجيل الخروج تلقائياً بعد فترة عدم النشاط المحددة.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 mt-2">
                <p className="text-xs text-gray-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> المصادقة الثنائية تتطلب إعداداً إضافياً في لوحة تحكم Supabase.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ 9. BACKUP ============ */}
        <TabsContent value="backup" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><HardDrive className="w-5 h-5 text-teal-600" />النسخ الاحتياطي والاستعادة</CardTitle>
              <CardDescription>حماية بياناتك من الفقدان</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingSwitch label="تفعيل النسخ الاحتياطي التلقائي" description="نسخ احتياطي دوري للإعدادات والبيانات" checked={settings.backup_enabled} onCheckedChange={(v) => update("backup_enabled", v)} />
              {settings.backup_enabled && (
                <SettingSelect label="تكرار النسخ الاحتياطي" value={settings.backup_frequency} onValueChange={(v) => update("backup_frequency", v)}
                  options={[
                    { value: "daily", label: "يومياً" },
                    { value: "weekly", label: "أسبوعياً" },
                    { value: "monthly", label: "شهرياً" },
                  ]} />
              )}
              {settings.last_backup_date && (
                <div className="bg-green-50 rounded-lg p-2.5">
                  <p className="text-xs text-green-700">آخر نسخ احتياطي: {settings.last_backup_date}</p>
                </div>
              )}
              <Separator className="my-3" />
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleExportSettings} className="gap-1">
                  <Download className="w-3.5 h-3.5" /> تصدير الإعدادات (JSON)
                </Button>
                <Button variant="outline" size="sm" onClick={handleImportSettings} className="gap-1">
                  <Upload className="w-3.5 h-3.5" /> استيراد الإعدادات (JSON)
                </Button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-blue-800 flex items-center gap-1"><Database className="w-3.5 h-3.5" /> ملاحظة: النسخ الاحتياطي الكامل لقاعدة البيانات يتم من خلال لوحة تحكم Supabase.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ 10. INTEGRATION ============ */}
        <TabsContent value="integration" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><MessageCircle className="w-5 h-5 text-green-600" />واتساب والتكامل</CardTitle>
              <CardDescription>ربط النظام مع واتساب وخدمات الطرف الثالث</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingSwitch label="تفعيل تكامل واتساب" description="إرسال الفواتير والإشعارات عبر واتساب" checked={settings.whatsapp_enabled} onCheckedChange={(v) => update("whatsapp_enabled", v)} />
              {settings.whatsapp_enabled && (
                <>
                  <SettingInput label="رقم واتساب الأعمال" value={settings.whatsapp_number} onChange={(v) => update("whatsapp_number", v)} dir="ltr" placeholder="+964XXXXXXXXX" />
                  <SettingSwitch label="إرسال الفاتورة عبر واتساب" description="إرسال نسخة من الفاتورة للزبون عبر واتساب بعد البيع" checked={settings.whatsapp_send_invoice} onCheckedChange={(v) => update("whatsapp_send_invoice", v)} />
                </>
              )}
              <Separator className="my-3" />
              <SettingSwitch label="تفعيل واجهة API خارجية" description="السماح للتطبيقات الخارجية بالاتصال بالنظام" checked={settings.api_key_enabled} onCheckedChange={(v) => update("api_key_enabled", v)} />
              {settings.api_key_enabled && (
                <SettingInput label="مفتاح API" value={settings.api_key} onChange={(v) => update("api_key", v)} dir="ltr" placeholder="sk-..." type="password" />
              )}
              <div className="bg-gray-50 rounded-lg p-3 mt-3">
                <p className="text-xs text-gray-600 flex items-center gap-1"><Key className="w-3.5 h-3.5" /> التكامل عبر API يتطلب إعداداً إضافياً في Supabase Edge Functions.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky Save Bar */}
      {isOwner && (
        <div className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center justify-between gap-3 transition-all duration-300 ${hasChanges ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}>
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-amber-700 font-medium">توجد تغييرات غير محفوظة</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetDefaults} className="gap-2 active:scale-95">
              <RotateCcw className="w-4 h-4" /> إعادة تعيين
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending} className="gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 min-w-[140px] shadow-lg shadow-blue-500/25">
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </Button>
          </div>
        </div>
      )}
      {/* Spacer for sticky bar when visible */}
      {isOwner && hasChanges && <div className="h-16" />}
    </div>
  );
}
