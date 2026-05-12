import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";

const LEGAL_LINKS = [
  { path: "/terms", label: "شروط الاستخدام" },
  { path: "/privacy", label: "سياسة الخصوصية" },
  { path: "/disclaimer", label: "إخلاء المسؤولية" },
  { path: "/cookies", label: "سياسة ملفات تعريف الارتباط" },
  { path: "/acceptable-use", label: "سياسة الاستخدام المقبول" },
] as const;

export default function AcceptableUsePolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      <header className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              سياسة الاستخدام المقبول
            </span>
          </div>
          <Link to="/welcome">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowRight className="w-4 h-4" />
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 md:p-10 space-y-8 text-slate-700 leading-relaxed">

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">سياسة الاستخدام المقبول</h2>
                <p className="text-xs text-slate-500">آخر تحديث: 12 مايو 2026</p>
              </div>
            </div>
            <p className="text-justify">
              تحدد هذه السياسة القواعد والضوابط التي يجب على جميع مستخدمي نظام الكوثر للحسابات الالتزام بها. أي انتهاك لهذه السياسة قد يؤدي إلى تعليق أو إنهاء حساب المستخدم فوراً ودون سابق إنذار، بالإضافة إلى اتخاذ الإجراءات القانونية المناسبة.
            </p>
          </section>

          <hr className="border-slate-200" />

          {/* الاستخدامات المسموحة */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">أولاً: الاستخدامات المسموح بها</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>يُسمح باستخدام النظام فقط للأغراض التجارية المشروعة والقانونية.</li>
              <li>يجب أن يتوافق استخدام النظام مع جميع القوانين واللوائح المحلية والوطنية والدولية السارية.</li>
              <li>يجب استخدام النظام وفقاً للغرض المخصص له وهو إدارة عمليات البيع بالتجزئة ونقاط البيع.</li>
            </ol>
          </section>

          {/* الاستخدامات المحظورة */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">ثانياً: الاستخدامات المحظورة - محظورات قطعية</h3>
            <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4">
              <p className="font-bold text-red-900 mb-3">
                يُمنع منعاً باتاً استخدام النظام في أي من الأمور التالية:
              </p>

              <h4 className="font-bold text-red-900">1. الأنشطة غير القانونية:</h4>
              <ul className="list-disc list-inside pr-4 space-y-1 mb-3 text-red-900">
                <li>أي نشاط يخالف القوانين المحلية أو الوطنية أو الدولية.</li>
                <li>غسيل الأموال أو تمويل الإرهاب.</li>
                <li>الاحتيال أو الخداع أو التضليل.</li>
                <li>بيع أو توزيع سلع أو خدمات غير قانونية.</li>
                <li>انتهاك العقوبات الدولية أو قيود التصدير.</li>
              </ul>

              <h4 className="font-bold text-red-900">2. الأنشطة الضارة:</h4>
              <ul className="list-disc list-inside pr-4 space-y-1 mb-3 text-red-900">
                <li>توزيع فيروسات أو برمجيات خبيثة أو برامج فدية.</li>
                <li>محاولة اختراق النظام أو شبكاته أو خوادمه.</li>
                <li>هجمات حجب الخدمة (DDoS).</li>
                <li>استخدام النظام كمنصة لشن هجمات على أطراف ثالثة.</li>
                <li>محاولة الوصول غير المصرح به إلى حسابات أو بيانات مستخدمين آخرين.</li>
              </ul>

              <h4 className="font-bold text-red-900">3. إساءة استخدام الموارد:</h4>
              <ul className="list-disc list-inside pr-4 space-y-1 mb-3 text-red-900">
                <li>تحميل كميات كبيرة جداً من البيانات بشكل يعطل النظام.</li>
                <li>استخدام برمجيات آلية (Bots, Scrapers, Crawlers) للوصول إلى النظام.</li>
                <li>استهلاك موارد النظام بشكل مفرط يؤثر على المستخدمين الآخرين.</li>
                <li>تخزين بيانات غير مرتبطة بالغرض التجاري للنظام.</li>
              </ul>

              <h4 className="font-bold text-red-900">4. المحتوى المحظور:</h4>
              <ul className="list-disc list-inside pr-4 space-y-1 mb-3 text-red-900">
                <li>محتوى إباحي أو فاضح أو غير لائق.</li>
                <li>محتوى يحرض على الكراهية أو العنف أو التمييز.</li>
                <li>محتوى ينتهك حقوق الملكية الفكرية للغير.</li>
                <li>محتوى تشهيري أو قذفي أو مسيء.</li>
                <li>محتوى يتضمن معلومات شخصية لأفراد دون موافقتهم.</li>
              </ul>

              <h4 className="font-bold text-red-900">5. الأنشطة التجارية المحظورة:</h4>
              <ul className="list-disc list-inside pr-4 space-y-1 mb-3 text-red-900">
                <li>استخدام النظام في أنشطة هرمية أو تسويق شبكي غير قانوني.</li>
                <li>انتهاك عقود حصرية أو اتفاقيات عدم منافسة.</li>
                <li>استخدام علامات تجارية أو شعارات بشكل غير مصرح به.</li>
              </ul>

              <h4 className="font-bold text-red-900">6. الهندسة العكسية والنسخ:</h4>
              <ul className="list-disc list-inside pr-4 space-y-1 text-red-900">
                <li>إجراء هندسة عكسية (Reverse Engineering) للنظام أو أي جزء منه.</li>
                <li>تفكيك (Decompiling) أو فك تشفير (Decrypting) الشيفرة المصدرية.</li>
                <li>نسخ أو إعادة إنتاج واجهة المستخدم أو التصميم.</li>
                <li>إنشاء أنظمة أو خدمات منافسة مبنية على النظام.</li>
              </ul>
            </div>
          </section>

          {/* التزامات المستخدم */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">ثالثاً: التزامات المستخدم</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li><strong>أمن الحساب:</strong> المستخدم مسؤول عن الحفاظ على سرية بيانات تسجيل الدخول ومنع الوصول غير المصرح به لحسابه.</li>
              <li><strong>الإبلاغ عن الانتهاكات:</strong> يجب على المستخدم الإبلاغ فوراً عن أي استخدام غير مصرح به أو انتهاك أمني.</li>
              <li><strong>دقة البيانات:</strong> يتحمل المستخدم مسؤولية دقة وصحة جميع البيانات المدخلة في النظام.</li>
              <li><strong>الامتثال القانوني:</strong> المستخدم مسؤول عن التأكد من أن استخدامه للنظام يتوافق مع جميع القوانين السارية في بلده.</li>
              <li><strong>النسخ الاحتياطي:</strong> المستخدم مسؤول عن الاحتفاظ بنسخ احتياطية منفصلة لبياناته الهامة.</li>
            </ol>
          </section>

          {/* عواقب الانتهاكات */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">رابعاً: عواقب انتهاك السياسة</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>في حال انتهاك هذه السياسة، نحتفظ بالحق في اتخاذ أي من الإجراءات التالية - وفقاً لتقديرنا المنفرد - دون سابق إنذار:
                <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                  <li>تحذير المستخدم.</li>
                  <li>تعليق الحساب مؤقتاً.</li>
                  <li>إنهاء الحساب بشكل دائم.</li>
                  <li>حذف جميع البيانات المرتبطة بالحساب.</li>
                  <li>منع المستخدم من إنشاء حسابات جديدة.</li>
                  <li>إبلاغ السلطات القانونية المختصة.</li>
                  <li>اتخاذ الإجراءات القانونية المدنية والجنائية.</li>
                </ul>
              </li>
              <li>لا تتحمل أي مسؤولية عن أي خسائر أو أضرار يتكبدها المستخدم نتيجة لهذه الإجراءات.</li>
            </ol>
          </section>

          {/* المراقبة والتحقيق */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">خامساً: المراقبة والتحقيق</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>نحتفظ بالحق - دون التزام - في مراقبة استخدام النظام للتحقق من الامتثال لهذه السياسة.</li>
              <li>نحتفظ بالحق في التحقيق في أي استخدام مشبوه أو انتهاك محتمل لهذه السياسة.</li>
              <li>نتعاون بشكل كامل مع السلطات القانونية المختصة في التحقيقات المتعلقة بالاستخدام غير القانوني للنظام.</li>
              <li>يجوز لنا الكشف عن أي معلومات يطلبها القانون أو السلطات المختصة.</li>
            </ol>
          </section>

          {/* التعديلات */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">سادساً: الإبلاغ عن الانتهاكات</h3>
            <p className="text-justify">
              إذا كنت على علم بأي استخدام ينتهك هذه السياسة، يرجى الإبلاغ عنه فوراً عبر:
            </p>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p><strong>واتساب:</strong>{" "}
                <a href="https://wa.me/9647850572326?text=السلام+عليكم،+لدي+استفسار+عن+سياسة+الاستخدام+المقبول" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" dir="ltr">
                  +964 785 057 2326
                </a>
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">سابعاً: أحكام ختامية</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>نحتفظ بالحق في تعديل هذه السياسة في أي وقت دون إشعار مسبق.</li>
              <li>استمرار المستخدم في استخدام النظام بعد التعديلات يعتبر موافقة صريحة على السياسة المعدلة.</li>
              <li>تخضع هذه السياسة لقوانين جمهورية العراق.</li>
              <li>عدم ممارستنا لأي حق من حقوقنا لا يعتبر تنازلاً عن ذلك الحق.</li>
            </ol>
          </section>
        </div>
      </main>

      <footer className="border-t py-6 px-4 text-center text-sm text-gray-500 bg-white/80">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-2">
          {LEGAL_LINKS.map((doc, i) => (
            <span key={doc.path}>
              <Link to={doc.path} className="text-blue-600 hover:underline">
                {doc.label}
              </Link>
              {i < LEGAL_LINKS.length - 1 && <span className="mx-2">|</span>}
            </span>
          ))}
        </div>
        <p className="mt-2">
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()} الكوثر للحسابات
        </p>
      </footer>
    </div>
  );
}
