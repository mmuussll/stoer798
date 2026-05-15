import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calculator,
  ShoppingCart,
  Package,
  Users,
  Wallet,
  Landmark,
  BarChart3,
  Settings,
  ArrowLeft,
  Shield,
  Zap,
  Cloud,
  Smartphone,
  RotateCcw,
  Printer,
  Check,
  X,
  Clock,
  Store,
  TrendingUp,
  Star,
  Crown,
  Percent,
  Tag,
} from "lucide-react";
import WhatsAppSupport from "@/components/WhatsAppSupport";
import { PLANS, DISCOUNT_TIERS, getDiscountPrice, getTotalPrice } from "@/constants";
import type { PlanType } from "@/constants";

const FEATURES = [
  { icon: ShoppingCart, title: "نقطة البيع السريعة", desc: "واجهة كاشير احترافية تدعم مسح الباركود، البحث الفوري، الخصومات، المبيعات الآجلة، وتعليق الفواتير." },
  { icon: Package, title: "المخزون والمنتجات", desc: "إدارة كاملة مع صور، باركود، أسعار جملة وتجزئة، تنبيهات نفاد المخزون، وتصدير CSV." },
  { icon: Wallet, title: "سجل الديون", desc: "متابعة ديون الزبائن مع دفعات، تواريخ استحقاق، الضامن، وتنبيهات الديون المتأخرة." },
  { icon: Users, title: "الزبائن", desc: "سجل متكامل مع تتبع المشتريات، النقاط، الزيارات، حد الدين، ومكافآت ولاء تلقائية." },
  { icon: Landmark, title: "جلسات الصندوق", desc: "فتح وإغلاق جلسات نقدية مع تتبع التدفق المالي والفروقات." },
  { icon: RotateCcw, title: "مرتجعات المبيعات", desc: "إدارة مرتجعات مع استعادة تلقائية للمخزون وربط بالفاتورة الأصلية." },
  { icon: BarChart3, title: "التقارير والتحليلات", desc: "تقارير مبيعات شاملة مع تصفية بالفترة وإمكانية التصدير." },
  { icon: Printer, title: "طباعة الفواتير", desc: "دعم طباعة حرارية ESC/POS عبر USB وشبكة TCP مع تخصيص الفاتورة." },
  { icon: Settings, title: "إعدادات متقدمة", desc: "أكثر من 60 إعداد لتخصيص المتجر، الضرائب، الولاء، الطابعة، والأمان." },
];

const ADVANTAGES = [
  { icon: Cloud, title: "سحابي بالكامل", desc: "بياناتك مخزنة بأمان على سيرفرات Supabase - تصل لها من أي جهاز وفي أي وقت." },
  { icon: Smartphone, title: "يعمل على كل الأجهزة", desc: "تطبيق PWA يُثبّت على الهاتف والحاسوب والتابلت بدون تحميل برامج." },
  { icon: Shield, title: "آمن ومشفر", desc: "تشفير TLS/SSL مع حماية Supabase الحاصلة على شهادات SOC 2 وISO 27001." },
];

export default function Welcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      {/* Header */}
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
            <Link to="/pricing" className="flex items-center gap-1 text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium">
              <Tag className="w-4 h-4" />
              الباقات والأسعار
            </Link>
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
        {/* Hero */}
        <section className="py-20 px-4 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-6">
            <Calculator className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            الكوثر للحسابات
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-3">
            نظام نقاط بيع سحابي متكامل مصمم خصيصاً لأصحاب المتاجر والمحلات التجارية.
            أدر مبيعاتك، مخزونك، زبائنك، وديونك من أي جهاز وفي أي مكان.
          </p>
          <p className="text-sm text-gray-400 max-w-xl mx-auto mb-10">
            يعمل على الهاتف، الحاسوب، والتابلت - كل ما تحتاجه متصفح وإنترنت. بدون تنصيب أي برامج.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 text-lg">
                ابدأ الآن مجاناً
              </Button>
            </Link>
            <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <Clock className="w-4 h-4" />
              14 يوم تجريبي - كل الميزات مفتوحة
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { value: "مجاني", label: "باقة محدودة للأبد", icon: Star, color: "text-gray-500" },
              { value: "10,000 د.ع", label: "باقة أساسي شهرياً", icon: Zap, color: "text-blue-600" },
              { value: "25,000 د.ع", label: "باقة برو شهرياً", icon: Crown, color: "text-amber-500" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/80 rounded-xl py-4 px-5 border border-slate-100 shadow-sm">
                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                <p className="font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="py-14 px-4 bg-white/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-3 text-gray-800">
              كل ما تحتاجه لإدارة متجرك
            </h2>
            <p className="text-center text-gray-500 mb-10 max-w-xl mx-auto">
              نظام شامل يغطي جميع جوانب إدارة المبيعات - من الكاشير إلى التقارير
            </p>
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

        {/* Why Us */}
        <section className="py-14 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-3 text-gray-800">
              صُمم ليكون رفيق متجرك اليومي
            </h2>
            <p className="text-center text-gray-500 mb-10 max-w-xl mx-auto">
              لسنا مجرد نظام - نحن شريك تقني يضمن إدارة سلسة وآمنة لمتجرك
            </p>
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

        {/* Pricing */}
        <section className="py-14 px-4 bg-white/50">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              ابدأ مجاناً - وترقى حسب نمو متجرك
            </h2>
            <p className="text-gray-500 mb-4">
              ثلاث باقات تناسب كل حجم من المتاجر. لا رسوم خفية ولا عقود.
            </p>
            <div className="flex justify-center items-center gap-2 text-sm text-green-700 mb-8">
              <Percent className="w-4 h-4" />
              <span>خصم 10% على 3 أشهر | 20% على 6 أشهر | 30% على سنة كاملة</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(["free", "basic", "pro"] as PlanType[]).map((planKey) => {
                const plan = PLANS[planKey];
                const isPro = planKey === "pro";
                const isBasic = planKey === "basic";
                return (
                  <Card
                    key={planKey}
                    className={`overflow-hidden shadow-lg relative ${isPro ? "ring-2 ring-purple-400 scale-[1.02]" : ""}`}
                  >
                    {isPro && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md z-10">
                        الأكثر طلباً
                      </div>
                    )}
                    <div className={`bg-gradient-to-r ${plan.gradient} text-white py-3 px-4 text-sm font-bold`}>
                      باقة {plan.nameAr}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-baseline justify-center gap-1 mb-1">
                        <span className={`text-4xl font-extrabold ${planKey === "free" ? "text-gray-600" : "text-slate-800"}`}>
                          {plan.monthlyPrice.toLocaleString()}
                        </span>
                        <span className="text-base text-gray-500">د.ع</span>
                      </div>
                      <p className="text-gray-500 mb-5 text-sm">
                        {planKey === "free" ? "مجاني مدى الحياة" : "شهرياً"}
                      </p>

                      <div className="space-y-2.5 mb-6 text-right">
                        {plan.features.map((item) => (
                          <div key={item} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="text-sm text-slate-700">{item}</span>
                          </div>
                        ))}
                        {plan.missingFeatures.map((item) => (
                          <div key={item} className="flex items-center gap-2 opacity-50">
                            <X className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-400">{item}</span>
                          </div>
                        ))}
                      </div>

                      {planKey !== "free" && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100">
                          <p className="text-xs font-semibold text-gray-700 mb-2">خصومات الالتزام طويل المدى:</p>
                          <div className="space-y-1.5">
                            {DISCOUNT_TIERS.filter((t) => t.discountPercent > 0).map((tier) => (
                              <div key={tier.months} className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">{tier.label}</span>
                                <span className="text-green-600 font-bold">
                                  {getDiscountPrice(plan.monthlyPrice, tier.discountPercent).toLocaleString()} د.ع/شهري
                                  <span className="text-[10px] text-gray-400 mr-1">(خصم {tier.discountPercent}%)</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {planKey !== "free" && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4">
                          {DISCOUNT_TIERS.filter((t) => t.discountPercent > 0).slice(0, 3).map((tier) => (
                            <p key={tier.months} className="text-[10px] text-amber-700 leading-relaxed">
                              {tier.label}: {getTotalPrice(plan.monthlyPrice, tier.months, tier.discountPercent).toLocaleString()} د.ع كامل
                              <span className="text-amber-400"> (بدلاً من {(plan.monthlyPrice * tier.months).toLocaleString()})</span>
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5">
                        <p className="text-xs font-bold text-blue-800">
                          14 يوم تجريبي مجاني - كل الميزات مفتوحة
                        </p>
                        <p className="text-[10px] text-blue-600 mt-0.5">
                          بدون إدخال بيانات دفع
                        </p>
                      </div>

                      <Link to="/auth">
                        <Button
                          className={`w-full py-5 text-base font-bold ${
                            isPro
                              ? "bg-purple-600 hover:bg-purple-700 text-white"
                              : isBasic
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                          }`}
                          variant={planKey === "free" ? "outline" : "default"}
                        >
                          ابدأ الفترة التجريبية المجانية
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* For Who */}
        <section className="py-14 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-3 text-gray-800">
              مناسب لجميع أنواع المتاجر
            </h2>
            <p className="text-center text-gray-500 mb-10">
              أي نشاط تجاري يحتاج نظام مبيعات - الكوثر للحسابات هو الحل
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Store, title: "السوبر ماركت", desc: "والمواد الغذائية" },
                { icon: ShoppingCart, title: "محلات الملابس", desc: "والأزياء والإكسسوارات" },
                { icon: Package, title: "مخازن الجملة", desc: "وتجارة المواد" },
                { icon: TrendingUp, title: "جميع المتاجر", desc: "أي نشاط تجاري" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="text-center p-4 rounded-xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">هل تحتاج مساعدة؟</h2>
            <p className="mb-6 text-white/80">
              فريق الدعم جاهز للإجابة على استفساراتك عبر واتساب
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

      {/* Footer */}
      <footer className="border-t py-6 px-4 text-center text-sm text-gray-500 bg-white/80">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-2">
          <Link to="/terms" className="text-blue-600 hover:underline">
            شروط الاستخدام
          </Link>
          <span>|</span>
          <Link to="/privacy" className="text-blue-600 hover:underline">
            سياسة الخصوصية
          </Link>
          <span>|</span>
          <Link to="/disclaimer" className="text-blue-600 hover:underline">
            إخلاء المسؤولية
          </Link>
          <span>|</span>
          <Link to="/cookies" className="text-blue-600 hover:underline">
            ملفات تعريف الارتباط
          </Link>
          <span>|</span>
          <Link to="/acceptable-use" className="text-blue-600 hover:underline">
            الاستخدام المقبول
          </Link>
        </div>
        جميع الحقوق محفوظة &copy; {new Date().getFullYear()} الكوثر للحسابات
      </footer>

      <WhatsAppSupport />
    </div>
  );
}
