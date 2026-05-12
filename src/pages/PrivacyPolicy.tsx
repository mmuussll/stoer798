import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              سياسة الخصوصية
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

          {/* مقدمة */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">سياسة الخصوصية</h2>
                <p className="text-xs text-slate-500">آخر تحديث: 12 مايو 2026</p>
              </div>
            </div>
            <p className="text-justify">
              مرحباً بك في نظام <strong className="text-blue-700">الكوثر للحسابات</strong>. نحن نلتزم بحماية خصوصيتك وبياناتك. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا للمعلومات التي تقدمها عند استخدامك للنظام. باستخدامك للنظام، فإنك توافق على جميع البنود الواردة في هذه السياسة.
            </p>
          </section>

          <hr className="border-slate-200" />

          {/* المادة 1: المعلومات التي نجمعها */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (1): المعلومات التي نجمعها</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li><strong>معلومات الحساب:</strong> الاسم الكامل، البريد الإلكتروني، ورقم الهاتف عند إنشاء الحساب. يمكن لاحقاً إضافة اسم المتجر وبياناته التجارية عبر صفحة الإعدادات.</li>
              <li><strong>معلومات المعاملات التجارية:</strong> بيانات المبيعات، المشتريات، المنتجات، الفئات، الزبائن، الديون ودفعاتها، المرتجعات، وجلسات الصندوق التي يتم إدخالها عبر النظام.</li>
              <li><strong>معلومات الجهاز والاستخدام:</strong> نوع المتصفح، نظام التشغيل، عنوان IP، صفحات النظام التي تمت زيارتها، وقت وتاريخ الزيارة، وغيرها من بيانات التشخيص الفنية.</li>
              <li><strong>معلومات الاتصال والدعم:</strong> محتوى الرسائل المتبادلة عبر واتساب أو أي قناة دعم أخرى.</li>
            </ol>
          </section>

          {/* المادة 2: كيفية استخدام المعلومات */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (2): كيفية استخدام المعلومات</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>تقديم خدمات النظام وتشغيله وصيانته وتحسينه.</li>
              <li>إدارة حساب المستخدم وتقديم الدعم الفني.</li>
              <li>إرسال إشعارات وتنبيهات متعلقة بالخدمة (انتهاء الاشتراك، تحديثات النظام، تنبيهات أمنية).</li>
              <li>تحليل استخدام النظام لتحسين تجربة المستخدم وتطوير ميزات جديدة.</li>
              <li>الامتثال للمتطلبات القانونية والتنظيمية السارية.</li>
              <li>منع الاحتيال وإساءة الاستخدام وضمان أمن النظام.</li>
            </ol>
          </section>

          {/* المادة 3: تخزين البيانات وأمنها */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (3): تخزين البيانات وأمنها</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>يتم تخزين بيانات المستخدم على خوادم سحابية آمنة مقدمة من Supabase تتمتع بحماية تشمل التشفير أثناء النقل (TLS/SSL) والتشفير أثناء التخزين.</li>
              <li>يعتمد النظام على مزود الخدمة السحابية Supabase لتخزين البيانات وقاعدة البيانات وإدارة المصادقة والملفات. يخضع هذا المزود لمعايير أمنية صارمة وشهادات اعتماد دولية (SOC 2، ISO 27001).</li>
              <li>يوفر النظام إعدادات للنسخ الاحتياطي (معطلة افتراضياً) يمكن للمستخدم تفعيلها. لا نضمن اكتمال أو سلامة أي نسخ احتياطية يتم إجراؤها.</li>
              <li>نحن نتخذ إجراءات أمنية معقولة لحماية بيانات المستخدم من الوصول غير المصرح به أو التعديل أو الإتلاف أو الكشف.</li>
              <li className="font-bold text-red-700 bg-red-50 rounded-lg p-2 list-none">
                ⚠️ تنويه هام: لا يمكن ضمان الأمان المطلق لأي نظام إلكتروني. يقر المستخدم بأن أي نظام تقني معرض بطبيعته لمخاطر الاختراق أو الفقدان أو التلف أو التعطل أو التوقف عن العمل، ولا يتحمل نظام الكوثر للحسابات أو مالكه أو مطوروه أو شركاؤه أية مسؤولية عن ذلك.
              </li>
            </ol>
          </section>

          {/* المادة 4: مشاركة البيانات مع الغير */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (4): مشاركة البيانات مع الغير</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>لا نقوم ببيع أو تأجير بيانات المستخدم لأي طرف ثالث لأغراض تسويقية.</li>
              <li>قد نشارك البيانات مع مقدمي الخدمات الذين يساعدوننا في تشغيل النظام (مثل مزود الاستضافة السحابية Supabase)، شريطة التزامهم باتفاقيات سرية صارمة.</li>
              <li>قد نكشف عن المعلومات إذا تطلب القانون ذلك، أو لحماية حقوقنا أو ممتلكاتنا أو سلامتنا أو سلامة مستخدمينا.</li>
            </ol>
          </section>

          {/* المادة 5: حقوق المستخدم */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (5): حقوق المستخدم</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li><strong>الوصول للبيانات:</strong> يحق للمستخدم الوصول إلى بياناته المخزنة في النظام ومراجعتها عبر واجهة النظام.</li>
              <li><strong>تصحيح البيانات:</strong> يحق للمستخدم تعديل بياناته الشخصية وتصحيحها عبر إعدادات الحساب.</li>
              <li><strong>تصدير البيانات:</strong> يمكن للمستخدم تصدير بيانات المنتجات بصيغة CSV وإعدادات المتجر بصيغة JSON من داخل النظام.</li>
              <li><strong>حذف البيانات:</strong> يحق للمستخدم طلب حذف حسابه وبياناته، وسيتم حذفها خلال مدة لا تتجاوز 30 يوماً من تاريخ الطلب، باستثناء البيانات التي يتطلب القانون الاحتفاظ بها.</li>
            </ol>
          </section>

          {/* المادة 6: الاحتفاظ بالسجلات الورقية - بند أساسي */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (6): الالتزام بحفظ السجلات الورقية</h3>
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
              <p className="font-bold text-amber-900 text-justify">
                هذا البند جوهري وأساسي في اتفاقية الاستخدام ولا يجوز تجاهله أو التهاون فيه:
              </p>
              <ol className="list-decimal list-inside space-y-2 pr-2 text-justify text-amber-900">
                <li>يقر المستخدم إقراراً صريحاً لا رجعة فيه بأن نظام الكوثر للحسابات هو <strong>أداة مساعدة فقط</strong> لإدارة العمليات التجارية، وليس بديلاً عن السجلات الورقية الرسمية أو الدفاتر المحاسبية المعتمدة قانوناً.</li>
                <li>يلتزم المستخدم التزاماً تاماً بالاحتفاظ بنسخ ورقية أصلية لجميع الفواتير والسندات والمعاملات المالية والمستندات المحاسبية، وذلك وفقاً للقوانين واللوائح المحلية السارية في بلده.</li>
                <li>لا يعفي استخدام النظام الإلكتروني المستخدم من أي التزام قانوني أو ضريبي أو محاسبي يفرضه القانون المحلي، بما في ذلك على سبيل المثال لا الحصر: حفظ الدفاتر التجارية، تقديم الإقرارات الضريبية، والاحتفاظ بالمستندات للمدد القانونية المقررة.</li>
                <li>يقر المستخدم بأن السجلات الورقية هي المرجع الوحيد والمعتمد في حال حدوث أي تعارض أو تباين بين بيانات النظام الإلكتروني والسجلات الورقية.</li>
                <li>يحظر على المستخدم الاعتماد الكلي أو الحصري على النظام الإلكتروني كسجل وحيد لمعاملاته التجارية أو المحاسبية.</li>
              </ol>
            </div>
          </section>

          {/* المادة 7: فقدان البيانات - إخلاء المسؤولية */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (7): فقدان البيانات وإخلاء المسؤولية</h3>
            <div className="bg-red-50 border border-red-300 rounded-xl p-4 space-y-3">
              <p className="font-bold text-red-900 text-justify">
                هذا البند جوهري وحاسم - يرجى قراءته بعناية فائقة:
              </p>
              <ol className="list-decimal list-inside space-y-3 pr-2 text-justify text-red-900">
                <li>
                  <strong>عدم ضمان استمرارية البيانات:</strong> لا يقدم نظام الكوثر للحسابات أو مالكه أو مطوروه أو المستضيفون أو الشركاء أو أي طرف مرتبط به أي ضمان - صريحاً كان أم ضمنياً - بشأن استمرارية حفظ البيانات أو سلامتها أو دقتها أو كمالها أو عدم فقدانها أو تلفها.
                </li>
                <li>
                  <strong>إخلاء كامل من المسؤولية:</strong> يُخلي نظام الكوثر للحسابات ومالكه ومطوروه والمستضيفون والشركاء والموظفون مسؤوليتهم الكاملة وبشكل مطلق عن أي فقدان للبيانات - جزئياً كان أم كلياً - أياً كان سببه، بما في ذلك على سبيل المثال لا الحصر:
                  <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                    <li>الأعطال التقنية أو انقطاع الخدمة أو توقف الخوادم.</li>
                    <li>الهجمات الإلكترونية أو الاختراقات أو الفيروسات أو البرمجيات الخبيثة.</li>
                    <li>الأخطاء البشرية أو الإهمال أو سوء الاستخدام من قبل المستخدم أو موظفيه.</li>
                    <li>القوة القاهرة أو الكوارث الطبيعية أو الحروب أو الاضطرابات.</li>
                    <li>توقف مزود الخدمة السحابية أو إفلاسه أو إنهاء خدماته.</li>
                    <li>أخطاء برمجية أو عيوب في التصميم أو التحديثات أو التعديلات على النظام.</li>
                    <li>أي سبب آخر سواء كان متوقعاً أم غير متوقع، معروفاً أم غير معروف.</li>
                  </ul>
                </li>
                <li>
                  <strong>عدم تحمل أية تعويضات:</strong> لا يتحمل نظام الكوثر للحسابات أو مالكه أو مطوروه أو المستضيفون أو الشركاء أية مسؤولية - مدنية كانت أم جنائية أم تجارية أم إدارية - عن أية أضرار مباشرة أو غير مباشرة أو عرضية أو تبعية أو تأديبية أو خاصة، بما في ذلك على سبيل المثال لا الحصر: خسارة الأرباح، خسارة الإيرادات، خسارة البيانات، خسارة العملاء، تعطل الأعمال، الغرامات الضريبية أو القانونية، الدعاوى القضائية، أو أي خسارة مالية أو تجارية أخرى.
                </li>
                <li>
                  <strong>عدم جواز المقاضاة:</strong> يتنازل المستخدم - بشكل صريح لا رجعة فيه وغير مشروط - عن حقه في مقاضاة أو ملاحقة أو مقاضاة نظام الكوثر للحسابات أو مالكه أو مطوريه أو المستضيفين أو الشركاء أو أي طرف مرتبط به، وذلك عن أي مطالبة أو دعوى أو شكوى ناشئة عن أو متعلقة بفقدان البيانات أو تلفها أو عدم دقتها، سواء كانت هذه المطالبة مبنية على العقد أو الضرر أو المسؤولية التقصيرية أو أي أساس قانوني آخر.
                </li>
                <li>
                  <strong>إقرار المستخدم:</strong> باستخدامه للنظام، يقر المستخدم بأنه قد قرأ وفهم وقبل هذا البند بشكل كامل، ويتحمل وحده المسؤولية الكاملة عن اتخاذ التدابير اللازمة لحفظ بياناته وحمايتها بشكل مستقل عن النظام.
                </li>
              </ol>
            </div>
          </section>

          {/* المادة 8: ملفات تعريف الارتباط */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (8): ملفات تعريف الارتباط (Cookies)</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>يستخدم النظام ملفات تعريف ارتباط ضرورية لعمل النظام (مثل جلسات تسجيل الدخول وحفظ التفضيلات).</li>
              <li>لا يستخدم النظام ملفات تعريف ارتباط لأغراض إعلانية أو تتبعية.</li>
              <li>يمكن للمستخدم تعطيل ملفات تعريف الارتباط من إعدادات متصفحه، ولكن قد يؤثر ذلك على وظائف النظام الأساسية.</li>
            </ol>
          </section>

          {/* المادة 9: خصوصية القاصرين */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (9): خصوصية القاصرين</h3>
            <p className="text-justify">
              النظام موجه للاستخدام التجاري من قبل البالغين ولا يستهدف الأفراد الذين تقل أعمارهم عن 18 عاماً. لا نقوم عن قصد بجمع معلومات شخصية من القاصرين. إذا تبين لنا أننا جمعنا معلومات من قاصر دون موافقة ولي الأمر، سنقوم بحذفها فوراً.
            </p>
          </section>

          {/* المادة 10: التعديلات على سياسة الخصوصية */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (10): التعديلات على سياسة الخصوصية</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>نحتفظ بالحق في تعديل سياسة الخصوصية هذه في أي وقت دون إشعار مسبق.</li>
              <li>يتم نشر أي تعديلات على هذه الصفحة، ويصبح ساري المفعول فور نشره.</li>
              <li>استمرار المستخدم في استخدام النظام بعد إجراء التعديلات يعتبر موافقة صريحة منه على التعديلات.</li>
            </ol>
          </section>

          {/* المادة 11: القانون الواجب التطبيق وتسوية النزاعات */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (11): القانون الواجب التطبيق وتسوية النزاعات</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>تخضع هذه السياسة وتفسر وفقاً لقوانين جمهورية العراق، وتختص محاكم العراق حصراً بنظر أي نزاع ينشأ عنها.</li>
              <li>في حال نشوء أي نزاع، يتعهد الطرفان باللجوء إلى التفاوض الودي أولاً قبل اتخاذ أي إجراء قضائي.</li>
              <li>إذا تعذر حل النزاع ودياً خلال 60 يوماً، يحق لأي من الطرفين اللجوء إلى القضاء.</li>
            </ol>
          </section>

          {/* المادة 12: الاتصال */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (12): الاتصال والاستفسارات</h3>
            <p className="text-justify">
              لأي استفسار أو طلب متعلق بهذه السياسة أو ببياناتك الشخصية، يمكنك التواصل معنا عبر:
            </p>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p><strong>واتساب:</strong>{" "}
                <a href="https://wa.me/9647850572326?text=السلام+عليكم،+لدي+استفسار+عن+سياسة+الخصوصية" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" dir="ltr">
                  +964 785 057 2326
                </a>
              </p>
            </div>
          </section>
        </div>
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
        <p className="mt-2">
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()} الكوثر للحسابات
        </p>
      </footer>
    </div>
  );
}
