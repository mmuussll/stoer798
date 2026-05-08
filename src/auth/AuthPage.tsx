import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Loader2, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import WhatsAppSupport from "@/components/WhatsAppSupport";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) setError(error.message);
      } else {
        if (!fullName.trim()) {
          setError("يرجى إدخال الاسم الكامل");
          setLoading(false);
          return;
        }
        if (!phone.trim()) {
          setError("يرجى إدخال رقم الهاتف");
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName, phone);
        if (error) {
          setError(error.message);
        } else {
          toast.success("تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.");
          setIsLogin(true);
          setPassword("");
        }
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4" dir="rtl">
      <WhatsAppSupport />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            نظام نقطة البيع
          </h1>
          <p className="text-gray-500 mt-1">تسجيل الدخول لإدارة المتجر</p>
          <Link
            to="/welcome"
            className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:underline"
          >
            <Info className="w-3.5 h-3.5" />
            تعرف على النظام
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? "تسجيل الدخول" : "إنشاء حساب"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "أدخل بياناتك للوصول إلى النظام"
                : "أنشئ حساباً جديداً للبدء"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">الاسم الكامل</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                      required={!isLogin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07xx xxx xxxx"
                      required={!isLogin}
                      dir="ltr"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@domain.com"
                  required
                  dir="ltr"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : isLogin ? (
                  "تسجيل الدخول"
                ) : (
                  "إنشاء حساب"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="text-sm text-blue-600 hover:underline"
              >
                {isLogin ? "ليس لديك حساب؟ سجل الآن" : "لديك حساب؟ سجل الدخول"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
