import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calculator,
  ShoppingCart,
  Package,
  Users,
  Receipt,
  RotateCcw,
  Wallet,
  Landmark,
  BarChart3,
  Settings,
  ArrowLeft,
  Store,
  Shield,
  Zap,
} from "lucide-react";
import WhatsAppSupport from "@/components/WhatsAppSupport";

const FEATURES = [
  { icon: ShoppingCart, title: "نقطة البيع", desc: "واجهة بيع سريعة وسهلة مع دعم الباركود والبحث الفوري" },
  { icon: Package, title: "إدارة المنتجات", desc: "إدارة كاملة للمنتجات مع تتبع المخزون والتنبيهات" },
  { icon: Users, title: "إدارة الزبائن", desc: "سجل كامل للزبائن مع تتبع المبيعات والديون" },
  { icon: Receipt, title: "فواتير المبيعات", desc: "طباعة فواتير احترافية وإرسالها عبر واتساب" },
  { icon: RotateCcw, title: "المرتجعات", desc: "إدارة مرتجعات المبيعات بسهولة وشفافية" },
  { icon: Wallet, title: "الديون", desc: "متابعة ديون الزبائن وتحصيل المدفوعات" },
  { icon: Landmark, title: "جلسات الصندوق", desc: "إدارة الجلسات النقدية ومراقبة التدفق المالي" },
  { icon: BarChart3, title: "التقارير", desc: "تقارير شاملة للمبيعات والأرباح مع إمكانية التصدير" },
  { icon: Settings, title: "الإعدادات", desc: "تخصيص كامل للنظام وإعدادات التكامل مع واتساب" },
];

const ADVANTAGES = [
  { icon: Zap, title: "سريع وفعال", desc: "أداء فائق السرعة مع واجهة مستخدم سلسة" },
  { icon: Shield, title: "آمن وموثوق", desc: "حماية كاملة للبيانات مع نسخ احتياطي سحابي" },
  { icon: Store, title: "متكامل", desc: "نظام شامل يغطي جميع جوانب إدارة متجرك" },
];

export default function Welcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              الكوثر للحسابات
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowLeft className="w-4 h-4" />
                تسجيل الدخول
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-16 px-4 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-6">
            <Calculator className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            الكوثر للحسابات
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            نظام إدارة متكامل لنقاط البيع مصمم خصيصاً لتلبية احتياجات المتاجر والمحلات التجارية. يوفر النظام حلاً شاملاً لإدارة المبيعات والمخزون والزبائن بكل سهولة واحترافية.
          </p>
          <div className="mt-8">
            <Link to="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                ابدأ الآن مجاناً
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-12 px-4 bg-white/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">
              مميزات النظام
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-base">{title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">
              لماذا الكوثر للحسابات؟
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ADVANTAGES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="text-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">هل تحتاج مساعدة؟</h2>
            <p className="mb-6 text-white/80">
              فريق الدعم جاهز للإجابة على استفساراتك عبر واتساب على مدار الساعة
            </p>
            <a
              href={`https://wa.me/9647850572326?text=${encodeURIComponent("السلام عليكم، لدي استفسار عن نظام الكوثر للحسابات")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white">
                تواصل معنا عبر واتساب
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 px-4 text-center text-sm text-gray-500 bg-white/80">
        جميع الحقوق محفوظة &copy; {new Date().getFullYear()} الكوثر للحسابات
      </footer>

      <WhatsAppSupport />
    </div>
  );
}
