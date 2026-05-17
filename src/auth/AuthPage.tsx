import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Loader2, Info, Sparkles, Shield, BarChart3, Package, Users, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import WhatsAppSupport from "@/components/WhatsAppSupport";

const LEGAL_DOCS = [
  { path: "/terms", label: "شروط الاستخدام" },
  { path: "/privacy", label: "سياسة الخصوصية" },
  { path: "/disclaimer", label: "إخلاء المسؤولية" },
  { path: "/cookies", label: "سياسة ملفات تعريف الارتباط" },
  { path: "/acceptable-use", label: "سياسة الاستخدام المقبول" },
] as const;

const FEATURES = [
  { icon: BarChart3, label: "تقارير متقدمة", color: "text-blue-500 bg-blue-50" },
  { icon: Package, label: "إدارة مخزون", color: "text-emerald-500 bg-emerald-50" },
  { icon: Users, label: "قاعدة عملاء", color: "text-purple-500 bg-purple-50" },
  { icon: Shield, label: "حماية متكاملة", color: "text-rose-500 bg-rose-50" },
];

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!acceptedTerms) {
      setError("يجب الموافقة على جميع الشروط والسياسات القانونية للمتابعة.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) setError(error.message);
      } else {
        if (!fullName.trim()) { setError("يرجى إدخال الاسم الكامل"); setLoading(false); return; }
        if (!phone.trim()) { setError("يرجى إدخال رقم الهاتف"); setLoading(false); return; }
        const { error } = await signUp(email, password, fullName, phone);
        if (error) { setError(error.message); }
        else {
          toast.success("تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.");
          setIsLogin(true);
          setPassword("");
        }
      }
    } catch (err: unknown) {
      setError((err as Error).message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row" dir="rtl">
      <WhatsAppSupport />

      {/* ── Left Side: Brand Showcase (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950 relative overflow-hidden flex-col justify-center p-12 xl:p-16">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-primary/70 to-purple-500 rounded-3xl blur-xl opacity-50" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30">
                <Calculator className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl xl:text-4xl font-bold text-white tracking-tight leading-tight">
                الكوثر للحسابات
              </h1>
              <p className="text-slate-300/80 text-sm mt-1 font-medium">
                نظام إدارة ذكي للمبيعات والمخزون
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-10">
            <h2 className="text-xl xl:text-2xl font-bold text-white leading-snug">
              منصة متكاملة لإدارة
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                أعمالك التجارية بذكاء
              </span>
            </h2>
            <p className="text-slate-300/70 text-sm leading-relaxed max-w-md">
              نقطة بيع متطورة، إدارة مخزون دقيقة، تقارير شاملة، وتتبع للديون — كل ما تحتاجه في مكان واحد.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {FEATURES.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/8 hover:bg-white/10 transition-colors duration-200">
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-white/80 text-[13px] font-medium">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-white/8">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-primary border-2 border-slate-900 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">✓</span>
                  </div>
                ))}
              </div>
              <p className="text-slate-400/60 text-xs font-medium">
                ينضم إليه المئات من أصحاب المتاجر يومياً
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Side: Auth Form ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-slate-50 via-primary/5 to-purple-50/20 min-h-screen">
        <div className="w-full max-w-md">
          {/* Mobile-only brand header */}
          <div className="lg:hidden text-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-primary/70 to-purple-500 rounded-3xl blur-xl opacity-40" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 mx-auto">
                <Calculator className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-4">الكوثر للحسابات</h1>
            <p className="text-slate-500 text-sm mt-1">نظام إدارة ذكي للمبيعات والمخزون</p>
            <Link to="/welcome" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <Info className="w-3.5 h-3.5" />
              تعرف على النظام
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Auth Card */}
          <Card className="border-border/60 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
            <CardHeader className="space-y-1.5 pb-5">
              <CardTitle className="text-xl font-bold tracking-tight">
                {isLogin ? "تسجيل الدخول" : "إنشاء حساب جديد"}
              </CardTitle>
              <CardDescription className="text-sm">
                {isLogin
                  ? "أدخل بياناتك للوصول إلى لوحة التحكم"
                  : "أنشئ حساباً وابدأ رحلة إدارة متجرك بذكاء"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-semibold">الاسم الكامل</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                        required={!isLogin}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07xx xxx xxxx"
                        required={!isLogin}
                        dir="ltr"
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@domain.com"
                    required
                    dir="ltr"
                    autoComplete="email"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    dir="ltr"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Legal Acceptance */}
                <div className="pt-3 border-t border-border/50">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <span className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                      أوافق على{" "}
                      {LEGAL_DOCS.map((doc, i) => (
                        <span key={doc.path}>
                          <Link to={doc.path} target="_blank" className="text-primary underline hover:text-primary/80 font-medium">
                            {doc.label}
                          </Link>
                          {i < LEGAL_DOCS.length - 2 ? "، " : i === LEGAL_DOCS.length - 2 ? "، و" : ""}
                        </span>
                      ))}
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200/60 p-3 rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl text-sm font-bold bg-gradient-brand hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : isLogin ? (
                    "تسجيل الدخول"
                  ) : (
                    "إنشاء حساب"
                  )}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(""); setAcceptedTerms(false); }}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {isLogin ? "ليس لديك حساب؟ سجل الآن" : "لديك حساب؟ سجل الدخول"}
                </button>
              </div>

              {/* Legal Links Footer */}
              <div className="mt-5 pt-4 border-t border-border/50 text-center">
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                  {LEGAL_DOCS.map((doc) => (
                    <Link key={doc.path} to={doc.path} target="_blank" className="hover:text-primary transition-colors font-medium">
                      {doc.label}
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
