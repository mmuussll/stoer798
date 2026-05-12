import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Cookie } from "lucide-react";

const LEGAL_LINKS = [
  { path: "/terms", label: "شروط الاستخدام" },
  { path: "/privacy", label: "سياسة الخصوصية" },
  { path: "/disclaimer", label: "إخلاء المسؤولية" },
  { path: "/cookies", label: "سياسة ملفات تعريف الارتباط" },
  { path: "/acceptable-use", label: "سياسة الاستخدام المقبول" },
] as const;

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      <header className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-lg bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              سياسة ملفات تعريف الارتباط
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
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Cookie className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">سياسة ملفات تعريف الارتباط (Cookies)</h2>
                <p className="text-xs text-slate-500">آخر تحديث: 12 مايو 2026</p>
              </div>
            </div>
            <p className="text-justify">
              توضح هذه السياسة كيفية استخدام نظام الكوثر للحسابات لملفات تعريف الارتباط والتقنيات المشابهة. باستخدامك للنظام، فإنك توافق على استخدام ملفات تعريف الارتباط وفقاً لهذه السياسة.
            </p>
          </section>

          <hr className="border-slate-200" />

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (1): ما هي ملفات تعريف الارتباط؟</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>ملفات تعريف الارتباط (Cookies) هي ملفات نصية صغيرة يتم تخزينها على جهاز المستخدم (حاسوب، هاتف، جهاز لوحي) عند زيارة المواقع الإلكترونية.</li>
              <li>تساعد هذه الملفات في التعرف على جهاز المستخدم وتذكر تفضيلاته وإعداداته، مما يحسن تجربة الاستخدام.</li>
              <li>يمكن أن تكون ملفات تعريف الارتباط "دائمة" (Persistent) تبقى على الجهاز لفترة محددة، أو "مؤقتة" (Session) تنتهي بانتهاء جلسة التصفح.</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (2): أنواع ملفات تعريف الارتباط التي نستخدمها</h3>

            <h4 className="font-bold text-slate-800">أولاً: ملفات تعريف الارتباط الضرورية (Strictly Necessary)</h4>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>هذه الملفات أساسية لعمل النظام ولا يمكن تعطيلها.</li>
              <li>تشمل:
                <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                  <li>ملفات جلسة تسجيل الدخول (Authentication Session).</li>
                  <li>ملفات تذكر حالة تسجيل الدخول (Persistent Login).</li>
                  <li>ملفات حفظ تفضيلات اللغة والاتجاه (RTL/LTR).</li>
                  <li>ملفات أمنية للحماية من هجمات تزوير الطلبات (CSRF).</li>
                </ul>
              </li>
              <li>لا تجمع هذه الملفات معلومات شخصية لأغراض تسويقية.</li>
            </ol>

            <h4 className="font-bold text-slate-800 mt-4">ثانياً: ملفات تعريف الارتباط الوظيفية (Functional)</h4>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>تساعد في تحسين وظائف النظام وتخصيص تجربة المستخدم.</li>
              <li>تشمل:
                <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                  <li>تذكر تفضيلات واجهة المستخدم (حجم الخط، الثيم).</li>
                  <li>حفظ حالة القوائم الجانبية (مفتوحة/مغلقة).</li>
                  <li>حفظ آخر الصفحات التي تمت زيارتها.</li>
                </ul>
              </li>
            </ol>

            <h4 className="font-bold text-slate-800 mt-4">ثالثاً: ملفات تعريف ارتباط الطرف الثالث (Third-Party Cookies)</h4>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>يستخدم النظام خدمات طرف ثالث قد تقوم بتعيين ملفات تعريف ارتباط خاصة بها، وتشمل:
                <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                  <li><strong>Supabase:</strong> مزود قاعدة البيانات والمصادقة - يستخدم ملفات تعريف ارتباط لإدارة جلسات المستخدم والمصادقة.</li>
                  <li><strong>Netlify:</strong> مزود الاستضافة - قد يستخدم ملفات تعريف ارتباط لتحسين أداء التوصيل والتخزين المؤقت.</li>
                </ul>
              </li>
              <li>لا نتحكم في ملفات تعريف الارتباط الخاصة بالأطراف الثالثة، وتخضع لسياسات الخصوصية الخاصة بهم.</li>
              <li>نوصي بمراجعة سياسات الخصوصية وملفات تعريف الارتباط الخاصة بهذه الأطراف.</li>
            </ol>

            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mt-4">
              <h4 className="font-bold text-amber-900">ملفات تعريف ارتباط لا نستخدمها:</h4>
              <ul className="list-disc list-inside pr-4 mt-2 space-y-1 text-amber-900">
                <li>ملفات تعريف ارتباط إعلانية (Advertising Cookies).</li>
                <li>ملفات تعريف ارتباط تتبع السلوك (Behavioral Tracking).</li>
                <li>ملفات تعريف ارتباط تحليلات طرف ثالث (Third-Party Analytics).</li>
                <li>بيكسلات التتبع (Tracking Pixels) أو بصمات المتصفح (Browser Fingerprinting).</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (3): مدة الاحتفاظ بملفات تعريف الارتباط</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li><strong>جلسة التصفح:</strong> تنتهي فور إغلاق المتصفح.</li>
              <li><strong>ملفات التذكر:</strong> تحفظ لمدة أقصاها 30 يوماً أو حتى يقوم المستخدم بتسجيل الخروج يدوياً.</li>
              <li><strong>ملفات التفضيلات:</strong> تحفظ لمدة 365 يوماً من آخر زيارة.</li>
              <li>يمكن للمستخدم حذف جميع ملفات تعريف الارتباط في أي وقت من إعدادات متصفحه.</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (4): كيفية التحكم في ملفات تعريف الارتباط</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>يمكن للمستخدم إدارة ملفات تعريف الارتباط أو حذفها من خلال إعدادات المتصفح.</li>
              <li>يمكن تعطيل ملفات تعريف الارتباط كلياً من المتصفح، ولكن ذلك سيؤدي إلى:
                <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                  <li>عدم القدرة على تسجيل الدخول.</li>
                  <li>فقدان وظائف النظام الأساسية.</li>
                  <li>توقف النظام عن العمل بشكل صحيح.</li>
                </ul>
              </li>
              <li>فيما يلي روابط لإعدادات ملفات تعريف الارتباط في المتصفحات الشائعة:
                <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                  <li>Google Chrome: Settings → Privacy and Security → Cookies</li>
                  <li>Mozilla Firefox: Options → Privacy & Security → Cookies</li>
                  <li>Microsoft Edge: Settings → Cookies and Site Permissions</li>
                  <li>Safari: Preferences → Privacy → Cookies</li>
                </ul>
              </li>
            </ol>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (5): التحديثات على هذه السياسة</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>نحتفظ بالحق في تحديث سياسة ملفات تعريف الارتباط في أي وقت دون إشعار مسبق.</li>
              <li>يتم نشر أي تعديلات على هذه الصفحة وتصبح سارية فور نشرها.</li>
              <li>استمرار المستخدم في استخدام النظام بعد التعديلات يعتبر موافقة صريحة على السياسة المعدلة.</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (6): الموافقة على استخدام ملفات تعريف الارتباط</h3>
            <div className="bg-blue-50 border border-blue-300 rounded-xl p-4">
              <p className="text-justify text-blue-900">
                باستخدامك لنظام الكوثر للحسابات، فإنك توافق على استخدام ملفات تعريف الارتباط وفقاً لما هو موضح في هذه السياسة. إذا كنت لا ترغب في قبول ملفات تعريف الارتباط، فيرجى عدم استخدام النظام، حيث أن تعطيلها سيمنع النظام من العمل بشكل صحيح.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (7): القانون الحاكم</h3>
            <p className="text-justify">
              تخضع هذه السياسة لقوانين جمهورية العراق، وتختص محاكم العراق حصراً بنظر أي نزاع ينشأ عنها.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (8): الاتصال</h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p><strong>واتساب:</strong>{" "}
                <a href="https://wa.me/9647850572326?text=السلام+عليكم،+لدي+استفسار+عن+سياسة+ملفات+تعريف+الارتباط" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" dir="ltr">
                  +964 785 057 2326
                </a>
              </p>
            </div>
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
