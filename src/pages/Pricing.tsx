import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, Star, Zap, Crown, Percent, MessageCircle, ArrowRight, Sparkles } from "lucide-react";
import WhatsAppSupport from "@/components/WhatsAppSupport";
import { PLANS, DISCOUNT_TIERS, getDiscountPrice, WHATSAPP_NUMBER, type PlanType } from "@/constants";

const WHATSAPP_TEXTS: Record<PlanType, string> = {
  free: "",
  basic: encodeURIComponent("السلام عليكم، أرغب في الاشتراك في باقة أساسي - 10,000 د.ع شهرياً في نظام الكوثر للحسابات"),
  pro: encodeURIComponent("السلام عليكم، أرغب في الاشتراك في باقة برو - 25,000 د.ع شهرياً في نظام الكوثر للحسابات"),
};

const PLAN_ICONS: Record<PlanType, React.ComponentType<{ className?: string }>> = {
  free: Star,
  basic: Zap,
  pro: Crown,
};

const PLAN_BG_GRADIENT: Record<PlanType, string> = {
  free: "from-slate-50 to-gray-50",
  basic: "from-blue-50/60 to-primary/5",
  pro: "from-purple-50/60 to-violet-50/40",
};

const PLAN_BUTTON_STYLE: Record<PlanType, string> = {
  free: "bg-slate-800 hover:bg-slate-900 text-white shadow-lg shadow-slate-500/20",
  basic: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25",
  pro: "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25",
};

const PLAN_BORDER: Record<PlanType, string> = {
  free: "border-slate-200 hover:border-slate-300",
  basic: "border-blue-200 hover:border-blue-300",
  pro: "border-purple-300 hover:border-purple-400 ring-2 ring-purple-300/50",
};

const PLAN_PRICE_COLOR: Record<PlanType, string> = {
  free: "text-slate-500",
  basic: "text-blue-600",
  pro: "text-purple-600",
};

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Elite Header */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowRight className="w-4 h-4" />
            العودة للتطبيق
          </Link>
          <Link to="/auth" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
            تسجيل الدخول
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center pt-16 pb-12 px-4 relative">
            <div className="inline-flex items-center gap-1.5 bg-amber-50/80 border border-amber-100 rounded-full px-4 py-1.5 text-xs font-medium text-amber-700 mb-6 backdrop-blur-sm">
              <Percent className="w-3.5 h-3.5" />
              خصم 10% للربع سنوي · 20% للنصف سنوي · 30% للسنوي
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              باقات تناسب
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> كل متجر</span>
            </h1>
            <p className="text-slate-500 max-w-lg mx-auto text-base leading-relaxed">
              14 يوم تجريبي مجاني بكل الميزات. لا بطاقة ائتمانية. ارتقِ لباقة أعلى في أي وقت.
            </p>
          </div>
        </section>

        {/* Plan Cards */}
        <section className="max-w-5xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(["free", "basic", "pro"] as PlanType[]).map((planKey) => {
              const plan = PLANS[planKey];
              const isPro = planKey === "pro";
              const isFree = planKey === "free";
              const Icon = PLAN_ICONS[planKey];

              return (
                <div
                  key={planKey}
                  className={`relative flex flex-col rounded-2xl border bg-white transition-all duration-300 ${PLAN_BORDER[planKey]} ${
                    isPro ? "md:-mt-3 md:mb-3" : ""
                  }`}
                >
                  {/* Badge */}
                  {isPro && (
                    <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-md shadow-amber-400/30">
                      الأكثر شعبية
                    </div>
                  )}

                  {/* Card Top */}
                  <div className={`p-5 pb-4 rounded-t-2xl bg-gradient-to-b ${PLAN_BG_GRADIENT[planKey]}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        planKey === "free" ? "bg-slate-200/80" : planKey === "basic" ? "bg-blue-100" : "bg-purple-100"
                      }`}>
                        <Icon className={`w-5 h-5 ${planKey === "free" ? "text-slate-500" : planKey === "basic" ? "text-blue-600" : "text-purple-600"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{plan.nameAr}</p>
                        <p className="text-[11px] text-slate-400">{isFree ? "مجاني مدى الحياة" : plan.name}</p>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-extrabold tracking-tight ${PLAN_PRICE_COLOR[planKey]}`}>
                        {plan.monthlyPrice.toLocaleString()}
                      </span>
                      <span className="text-sm text-slate-400">د.ع</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">شهرياً</p>
                  </div>

                  {/* Features */}
                  <div className="p-5 pt-3 flex-1">
                    <div className="space-y-2.5">
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-start gap-2.5">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isFree ? "text-slate-400" : "text-emerald-500"}`} />
                          <span className="text-sm text-slate-600">{f}</span>
                        </div>
                      ))}
                      {plan.missingFeatures.map((f) => (
                        <div key={f} className="flex items-start gap-2.5 opacity-35">
                          <X className="w-4 h-4 shrink-0 mt-0.5 text-slate-300" />
                          <span className="text-sm text-slate-400 line-through decoration-slate-200">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Discount */}
                  {!isFree && (
                    <div className="px-5 pb-2">
                      <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                        {DISCOUNT_TIERS.filter((t) => t.discountPercent > 0).map((tier) => {
                          const disc = getDiscountPrice(plan.monthlyPrice, tier.discountPercent);
                          return (
                            <div key={tier.months} className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">{tier.label}</span>
                              <span className="font-semibold text-slate-700">
                                {disc.toLocaleString()} د.ع/ش
                                <span className="text-green-600 font-medium mr-1">(%{tier.discountPercent})</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CTAs */}
                  <div className="p-5 pt-3 space-y-2.5 mt-auto">
                    <Link to="/auth">
                      <Button className={`w-full py-5 text-sm font-bold ${PLAN_BUTTON_STYLE[planKey]}`}>
                        {isFree ? "ابدأ مجاناً" : "ابدأ الفترة التجريبية"}
                      </Button>
                    </Link>

                    {!isFree && (
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_TEXTS[planKey]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-green-500" />
                        طلب الاشتراك عبر واتساب
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Features Comparison */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-xl font-bold text-center text-slate-800 mb-8">مقارنة شاملة</h2>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3.5 px-5 text-right font-bold text-slate-700">الميزة</th>
                  <th className="py-3.5 px-5 text-center font-bold text-slate-500">مجاني</th>
                  <th className="py-3.5 px-5 text-center font-bold text-blue-600">أساسي</th>
                  <th className="py-3.5 px-5 text-center font-bold text-purple-600">برو</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { feature: "المنتجات", free: "30", basic: "300", pro: "غير محدود" },
                  { feature: "الزبائن", free: "20", basic: "150", pro: "غير محدود" },
                  { feature: "فواتير يومية", free: "25", basic: "100", pro: "غير محدود" },
                  { feature: "جلسات الصندوق", free: "✓", basic: "✓", pro: "✓" },
                  { feature: "المرتجعات والاستبدال", free: "✓", basic: "✓", pro: "✓" },
                  { feature: "نظام الديون", free: "✗", basic: "✓", pro: "✓" },
                  { feature: "التقارير", free: "✗", basic: "أساسية", pro: "متقدمة" },
                  { feature: "المشتريات", free: "✗", basic: "✗", pro: "✓" },
                  { feature: "التخزين السحابي", free: "✓", basic: "✓", pro: "✓" },
                ].map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5 font-medium text-slate-700">{row.feature}</td>
                    <td className="py-3 px-5 text-center text-slate-500">{row.free}</td>
                    <td className="py-3 px-5 text-center text-slate-700 font-medium">{row.basic}</td>
                    <td className="py-3 px-5 text-center text-slate-700 font-medium">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-bold text-center text-slate-800 mb-8">أسئلة شائعة</h2>
          <div className="space-y-3">
            {[
              { q: "هل يمكنني الترقية من باقة إلى أخرى؟", a: "نعم، يمكنك الترقية أو التخفيض في أي وقت. يتم احتساب المبلغ المتبقي من اشتراكك الحالي." },
              { q: "كيف يتم الدفع؟", a: "يتم الدفع عبر التحويل البنكي أو الدفع النقدي. راسلنا عبر واتساب لتفعيل اشتراكك." },
              { q: "هل الباقة المجانية محدودة بمدة؟", a: "لا، الباقة المجانية مستمرة مدى الحياة دون أي رسوم، لكن بميزات محدودة." },
              { q: "هل يمكنني الإلغاء في أي وقت؟", a: "نعم، لا توجد عقود طويلة الأجل. ادفع شهرياً وألغِ متى شئت." },
            ].map((faq) => (
              <details key={faq.q} className="group bg-white rounded-xl border border-slate-200">
                <summary className="px-5 py-3.5 cursor-pointer text-sm font-medium text-slate-700 list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-slate-300 text-lg group-open:rotate-45 transition-transform duration-200">+</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-4 pb-16">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-10 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-3">جاهز لتبدأ؟</h2>
              <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                فريق الدعم جاهز لمساعدتك في اختيار الباقة الأنسب لمتجرك
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("السلام عليكم، أحتاج مساعدة في اختيار الباقة المناسبة لمتجري في نظام الكوثر للحسابات")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white px-8 shadow-lg shadow-green-500/25">
                  <MessageCircle className="w-5 h-5 ml-2" />
                  تواصل معنا واتساب
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-6 px-4 text-center text-sm text-slate-400">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mb-2">
          <Link to="/terms" className="hover:text-slate-600 transition-colors">شروط الاستخدام</Link>
          <Link to="/privacy" className="hover:text-slate-600 transition-colors">سياسة الخصوصية</Link>
          <Link to="/disclaimer" className="hover:text-slate-600 transition-colors">إخلاء المسؤولية</Link>
          <Link to="/cookies" className="hover:text-slate-600 transition-colors">ملفات تعريف الارتباط</Link>
          <Link to="/acceptable-use" className="hover:text-slate-600 transition-colors">الاستخدام المقبول</Link>
        </div>
        جميع الحقوق محفوظة &copy; {new Date().getFullYear()} الكوثر للحسابات
      </footer>

      <WhatsAppSupport />
    </div>
  );
}
