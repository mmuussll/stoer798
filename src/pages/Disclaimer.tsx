import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle } from "lucide-react";

const LEGAL_LINKS = [
  { path: "/terms", label: "شروط الاستخدام" },
  { path: "/privacy", label: "سياسة الخصوصية" },
  { path: "/disclaimer", label: "إخلاء المسؤولية" },
  { path: "/cookies", label: "سياسة ملفات تعريف الارتباط" },
  { path: "/acceptable-use", label: "سياسة الاستخدام المقبول" },
] as const;

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      <header className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-bold text-lg bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              إخلاء المسؤولية القانوني الشامل
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
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">إخلاء المسؤولية القانوني الشامل</h2>
                <p className="text-xs text-slate-500">آخر تحديث: 12 مايو 2026</p>
              </div>
            </div>

            <div className="bg-red-50 border-2 border-red-400 rounded-xl p-5">
              <p className="font-bold text-red-900 text-justify text-lg leading-relaxed">
                هذه الوثيقة هي إخلاء مسؤولية شامل وملزم قانوناً. باستخدامك لنظام الكوثر للحسابات بأي شكل من الأشكال، فإنك تقر بقراءة وفهم وقبول جميع ما ورد في هذا الإخلاء دون أي تحفظات. إذا كنت لا توافق على أي جزء منه، فعليك التوقف فوراً عن استخدام النظام.
              </p>
            </div>
          </section>

          <hr className="border-slate-200" />

          {/* المادة 1: الخدمة كما هي */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">أولاً: الخدمة مقدمة "كما هي" دون أي ضمانات</h3>
            <ol className="list-decimal list-inside space-y-3 pr-2 text-justify">
              <li>
                يتم توفير نظام الكوثر للحسابات وجميع خدماته وميزاته ومحتوياته "كما هي" (AS IS) و"حسب توفرها" (AS AVAILABLE)، دون أي ضمانات من أي نوع، سواء كانت صريحة أو ضمنية.
              </li>
              <li>
                نخلي مسؤوليتنا - بأوسع نطاق يجيزه القانون - عن جميع الضمانات الصريحة والضمنية، بما في ذلك على سبيل المثال لا الحصر: ضمانات القابلية للتسويق (Merchantability)، والملاءمة لغرض معين (Fitness for a Particular Purpose)، وعدم الانتهاك (Non-Infringement)، والملكية (Title)، والتوافق مع الأنظمة الأخرى.
              </li>
              <li>
                لا نضمن أن النظام سيلبي جميع احتياجات المستخدم أو توقعاته، أو أن تشغيله سيكون بلا انقطاع أو أخطاء، أو أن العيوب سيتم تصحيحها.
              </li>
            </ol>
          </section>

          {/* المادة 2: البيانات والمعلومات */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">ثانياً: إخلاء المسؤولية عن البيانات والمعلومات</h3>
            <ol className="list-decimal list-inside space-y-3 pr-2 text-justify">
              <li>
                <strong>لا ضمان على دقة البيانات:</strong> لا نضمن - بأي حال من الأحوال - دقة أو كمال أو حداثة أو موثوقية أي بيانات أو معلومات يتم إدخالها أو تخزينها أو معالجتها عبر النظام.
              </li>
              <li>
                <strong>لا ضمان على استمرارية البيانات:</strong> لا نضمن استمرارية حفظ البيانات أو عدم فقدانها أو تلفها أو تشويهها لأي سبب كان.
              </li>
              <li>
                <strong>مسؤولية المستخدم الكاملة:</strong> يتحمل المستخدم وحده المسؤولية الكاملة عن دقة بياناته المدخلة، ويتحمل تبعات أي أخطاء في الإدخال أو المعالجة أو الاعتماد على بيانات غير دقيقة.
              </li>
              <li>
                <strong>السجلات الورقية:</strong> النظام أداة مساعدة فقط. يتحمل المستخدم المسؤولية الحصرية عن الاحتفاظ بالسجلات الورقية الرسمية ويكون الاعتماد عليها واجباً في جميع الأحوال.
              </li>
            </ol>
          </section>

          {/* المادة 3: الأضرار والخسائر */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">ثالثاً: إخلاء المسؤولية عن الأضرار والخسائر</h3>
            <ol className="list-decimal list-inside space-y-3 pr-2 text-justify">
              <li>
                <strong>لا مسؤولية عن الأضرار المباشرة:</strong> لا يتحمل نظام الكوثر للحسابات أو مالكه أو مطوروه أو شركاؤه أو مستضيفوه أو موظفوه أي مسؤولية عن أي أضرار مباشرة من أي نوع.
              </li>
              <li>
                <strong>لا مسؤولية عن الأضرار غير المباشرة:</strong> لا نتحمل أية مسؤولية عن الأضرار غير المباشرة أو العرضية أو التبعية أو الخاصة أو التأديبية أو المعنوية، بما في ذلك على سبيل المثال لا الحصر:
                <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                  <li>خسارة الأرباح أو الإيرادات أو المدخرات المتوقعة.</li>
                  <li>خسارة البيانات أو المعلومات أو البرمجيات.</li>
                  <li>خسارة العملاء أو السمعة التجارية أو الشهرة.</li>
                  <li>تعطل الأعمال أو توقف العمليات التجارية.</li>
                  <li>الغرامات أو العقوبات القانونية أو الضريبية أو الإدارية.</li>
                  <li>تكاليف شراء سلع أو خدمات بديلة.</li>
                  <li>الدعاوى القضائية أو المطالبات القانونية من أطراف ثالثة.</li>
                </ul>
              </li>
            </ol>
          </section>

          {/* المادة 4: الأمن الإلكتروني */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">رابعاً: إخلاء المسؤولية عن الأمن الإلكتروني</h3>
            <ol className="list-decimal list-inside space-y-3 pr-2 text-justify">
              <li>لا يمكن ضمان الأمان المطلق لأي نظام متصل بالإنترنت. نستخدم إجراءات أمنية معقولة ولكننا لا نضمن - ولا يمكننا أن نضمن - منع الوصول غير المصرح به أو الاختراقات أو الهجمات الإلكترونية.</li>
              <li>لا نتحمل أي مسؤولية عن أي أضرار أو خسائر ناجمة عن:
                <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                  <li>فيروسات أو برمجيات خبيثة أو برامج فدية.</li>
                  <li>هجمات حجب الخدمة (DDoS) أو الاختراقات أو التصيد.</li>
                  <li>سرقة بيانات أو انتحال هوية.</li>
                  <li>ثغرات أمنية في خدمات الطرف الثالث المرتبطة بالنظام.</li>
                </ul>
              </li>
            </ol>
          </section>

          {/* المادة 5: خدمات الطرف الثالث */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">خامساً: إخلاء المسؤولية عن خدمات الطرف الثالث</h3>
            <ol className="list-decimal list-inside space-y-3 pr-2 text-justify">
              <li>النظام يعتمد على خدمات ومزودين خارجيين (مثل Supabase لتخزين البيانات، وWhatsApp للدعم، وNetlify للاستضافة). لا نتحمل أي مسؤولية عن:
                <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                  <li>توفر هذه الخدمات أو جودتها أو أدائها أو أمنها.</li>
                  <li>فقدان البيانات بسبب توقف هذه الخدمات أو إفلاس مزوديها.</li>
                  <li>انتهاكات البيانات أو الثغرات الأمنية لدى هذه الأطراف.</li>
                  <li>تغيير سياسات أو شروط هذه الخدمات.</li>
                </ul>
              </li>
              <li>أي روابط لمواقع أو خدمات خارجية يتم توفيرها للراحة فقط، ولا نتحمل مسؤولية محتوى أو ممارسات هذه المواقع.</li>
            </ol>
          </section>

          {/* المادة 6: المحتوى والنصائح */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">سادساً: إخلاء المسؤولية عن المحتوى والنصائح</h3>
            <ol className="list-decimal list-inside space-y-3 pr-2 text-justify">
              <li>النظام ليس بديلاً عن المحاسب القانوني أو المستشار المالي أو المستشار الضريبي أو المحامي. أي معلومات أو تقارير يقدمها النظام هي لأغراض إعلامية فقط.</li>
              <li>لا نقدم - عبر النظام - أية استشارات قانونية أو محاسبية أو ضريبية أو مالية. يجب على المستخدم استشارة المتخصصين المؤهلين قبل اتخاذ أي قرارات مالية أو قانونية.</li>
              <li>جميع الحسابات والتقارير التي يولدها النظام يجب مراجعتها والتحقق منها من قبل المستخدم قبل الاعتماد عليها.</li>
            </ol>
          </section>

          {/* المادة 7: القوة القاهرة */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">سابعاً: القوة القاهرة والظروف الخارجة عن الإرادة</h3>
            <ol className="list-decimal list-inside space-y-3 pr-2 text-justify">
              <li>لا نتحمل أي مسؤولية عن أي فشل أو تأخير في أداء الخدمة بسبب ظروف خارجة عن إرادتنا المعقولة، بما في ذلك على سبيل المثال لا الحصر:
                <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                  <li>الكوارث الطبيعية (زلازل، فيضانات، أعاصير، حرائق).</li>
                  <li>الحروب أو الاضطرابات المدنية أو الأعمال الإرهابية.</li>
                  <li>الأوبئة أو الجوائح أو حالات الطوارئ الصحية.</li>
                  <li>انقطاع خدمات الإنترنت أو الاتصالات أو الكهرباء على نطاق واسع.</li>
                  <li>إضرابات عمالية أو نقابية.</li>
                  <li>قرارات حكومية أو تنظيمية تعيق تقديم الخدمة.</li>
                  <li>أعطال في الأجهزة أو البرمجيات أو الشبكات خارجة عن سيطرتنا.</li>
                </ul>
              </li>
            </ol>
          </section>

          {/* المادة 8: قابلية الفصل */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">ثامناً: قابلية الفصل واستمرارية الأحكام</h3>
            <ol className="list-decimal list-inside space-y-3 pr-2 text-justify">
              <li>إذا تبين أن أي حكم من أحكام هذا الإخلاء غير قانوني أو باطل أو غير قابل للتنفيذ في أي ولاية قضائية، فإن ذلك لا يؤثر على:
                <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                  <li>قانونية أو صحة أو قابلية تنفيذ باقي الأحكام.</li>
                  <li>قانونية أو صحة أو قابلية تنفيذ هذا الحكم في أي ولاية قضائية أخرى.</li>
                </ul>
              </li>
            </ol>
          </section>

          {/* المادة 9: القانون الحاكم */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">تاسعاً: القانون الواجب التطبيق والاختصاص القضائي</h3>
            <ol className="list-decimal list-inside space-y-3 pr-2 text-justify">
              <li>يخضع هذا الإخلاء وجميع المسائل المتعلقة به لقوانين جمهورية العراق.</li>
              <li>تختص محاكم العراق حصراً بنظر أي نزاع أو دعوى تنشأ عن أو تتعلق بهذا الإخلاء أو باستخدام النظام.</li>
              <li>يتنازل المستخدم عن أي اعتراض على الاختصاص القضائي للمحاكم العراقية.</li>
            </ol>
          </section>

          {/* المادة 10: الإقرار النهائي */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">عاشراً: الإقرار النهائي الملزم</h3>
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl p-5 space-y-3 text-center">
              <p className="font-bold text-lg">
                إقرار المستخدم النهائي وغير القابل للرجوع
              </p>
              <p className="text-justify leading-relaxed">
                باستخدامك لنظام الكوثر للحسابات، فإنك تقر إقراراً صريحاً لا رجعة فيه وغير مشروط بالآتي:
              </p>
              <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
                <li>أنك قد قرأت وفهمت جميع ما ورد في إخلاء المسؤولية هذا.</li>
                <li>أنك توافق على جميع بنوده دون أي تحفظ أو شرط.</li>
                <li>أنك تتحمل وحدك المسؤولية الكاملة عن استخدامك للنظام.</li>
                <li>أنك تتنازل عن أي حق في مقاضاة أو مطالبة نظام الكوثر للحسابات أو مالكه أو مطوريه أو شركائه عن أي أضرار أو خسائر.</li>
                <li>أنك تعتمد على السجلات الورقية الأصلية كمرجع أساسي وحيد لمعاملاتك.</li>
              </ol>
            </div>
          </section>

          {/* المادة 11: الاتصال */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">حادي عشر: الاتصال والاستفسارات</h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p><strong>واتساب:</strong>{" "}
                <a href="https://wa.me/9647850572326?text=السلام+عليكم،+لدي+استفسار+عن+إخلاء+المسؤولية" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" dir="ltr">
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
