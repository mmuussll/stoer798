import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Scale, AlertTriangle } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              شروط الاستخدام
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

          {/* تمهيد */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Scale className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">شروط وأحكام الاستخدام</h2>
                <p className="text-xs text-slate-500">آخر تحديث: 12 مايو 2026</p>
              </div>
            </div>

            <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="font-bold text-red-800 text-justify">
                  تحذير قانوني هام: يرجى قراءة هذه الشروط والأحكام بعناية فائقة قبل استخدام نظام الكوثر للحسابات. باستخدامك للنظام أو تسجيلك لحساب أو دخولك إلى أي جزء من أجزائه، فإنك تقر وتوافق على الالتزام بجميع هذه الشروط والأحكام بشكل كامل وغير قابل للتجزئة. إذا كنت لا توافق على أي بند من هذه البنود، فيتعين عليك عدم استخدام النظام إطلاقاً.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-slate-200" />

          {/* المادة 1: تعريفات */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (1): تعريفات</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li><strong>"النظام" أو "الخدمة":</strong> نظام الكوثر للحسابات، وهو منصة إلكترونية لإدارة نقاط البيع والمخزون والزبائن والديون.</li>
              <li><strong>"نحن" أو "مزود الخدمة":</strong> مالك ومطور ومشغل نظام الكوثر للحسابات.</li>
              <li><strong>"المستخدم" أو "أنت":</strong> أي شخص طبيعي أو اعتباري يقوم بالوصول إلى النظام أو استخدامه أو التسجيل فيه.</li>
              <li><strong>"المحتوى":</strong> جميع البيانات والمعلومات والنصوص والصور والملفات التي يتم إدخالها أو تخزينها في النظام.</li>
              <li><strong>"الحساب":</strong> حساب المستخدم المسجل في النظام والذي يمكنه من الوصول إلى الخدمات.</li>
            </ol>
          </section>

          {/* المادة 2: قبول الشروط */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (2): قبول الشروط والأحكام</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>باستخدامك للنظام بأي شكل من الأشكال، فإنك توافق موافقة صريحة لا رجعة فيها على جميع بنود هذه الاتفاقية.</li>
              <li>إذا كنت تستخدم النظام نيابة عن شركة أو مؤسسة، فإنك تقر بأنك مخول قانوناً بإلزام هذه الجهة بهذه الشروط.</li>
              <li>نحتفظ بالحق في رفض الخدمة لأي شخص أو جهة في أي وقت ولأي سبب.</li>
            </ol>
          </section>

          {/* المادة 3: الأهلية */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (3): الأهلية والتسجيل</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>يجب أن يكون عمر المستخدم 18 عاماً على الأقل (أو سن الرشد القانوني في بلده).</li>
              <li>يلتزم المستخدم بتقديم معلومات صحيحة ودقيقة وكاملة عند التسجيل.</li>
              <li>المستخدم مسؤول مسؤولية كاملة عن الحفاظ على سرية بيانات تسجيل الدخول وكلمة المرور.</li>
              <li>المستخدم مسؤول عن جميع الأنشطة التي تتم من خلال حسابه، سواء كانت مصرحاً بها أم لا.</li>
              <li>يجب على المستخدم إبلاغنا فوراً عن أي استخدام غير مصرح به لحسابه.</li>
            </ol>
          </section>

          {/* المادة 4: التزامات المستخدم */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (4): التزامات المستخدم</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>استخدام النظام للأغراض المشروعة فقط وبما يتوافق مع جميع القوانين واللوائح المحلية والدولية السارية.</li>
              <li>عدم استخدام النظام في أي نشاط غير قانوني أو احتيالي أو ضار.</li>
              <li>عدم محاولة اختراق النظام أو تعطيله أو إلحاق الضرر به أو ببناه التحتية.</li>
              <li>عدم تحميل أو نقل أي فيروسات أو برمجيات خبيثة أو شيفرات ضارة.</li>
              <li>عدم استخدام أي وسيلة آلية (مثل الروبوتات أو الكاشطات) للوصول إلى النظام أو جمع بيانات منه.</li>
              <li>عدم انتحال شخصية أي شخص أو جهة أو تزوير الانتماءات.</li>
              <li>الالتزام بكافة شروط وأحكام مزود الخدمة السحابية (Supabase) المرتبطة باستخدام النظام.</li>
            </ol>
          </section>

          {/* المادة 5: السجلات الورقية - بند أساسي */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (5): الالتزام بحفظ السجلات الورقية</h3>
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
              <p className="font-bold text-amber-900 text-justify">
                هذا البند جوهري في هذه الاتفاقية، ويعتبر شرطاً أساسياً لاستخدام النظام:
              </p>
              <ol className="list-decimal list-inside space-y-3 pr-2 text-justify text-amber-900">
                <li>
                  <strong>النظام كأداة مساعدة فقط:</strong> يقر المستخدم إقراراً صريحاً بأن نظام الكوثر للحسابات هو أداة مساعدة اختيارية لتسهيل إدارة العمليات التجارية، وليس سجلاً رسمياً أو نظاماً محاسبياً معتمداً. النظام غير مخصص لأن يكون بديلاً عن السجلات الورقية أو الدفاتر التجارية أو المستندات المحاسبية الرسمية.
                </li>
                <li>
                  <strong>الالتزام القانوني للمستخدم:</strong> يتحمل المستخدم وحده المسؤولية الكاملة عن الامتثال لجميع القوانين واللوائح المحلية المتعلقة بحفظ السجلات التجارية والمحاسبية والضريبية، بما في ذلك على سبيل المثال لا الحصر:
                  <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                    <li>حفظ الدفاتر التجارية والسجلات المحاسبية للمدد التي يفرضها القانون.</li>
                    <li>إصدار الفواتير الورقية المعتمدة قانوناً.</li>
                    <li>تقديم الإقرارات الضريبية في مواعيدها.</li>
                    <li>الاحتفاظ بالمستندات الأصلية للمعاملات التجارية.</li>
                  </ul>
                </li>
                <li>
                  <strong>حظر الاعتماد الحصري على النظام:</strong> يحظر على المستخدم - حظراً باتاً - الاعتماد الكلي أو الحصري على بيانات النظام الإلكتروني كسجل وحيد لمعاملاته التجارية أو المحاسبية. يجب أن تكون السجلات الورقية الأصلية هي المرجع الأساسي والوحيد المعتمد قانوناً.
                </li>
                <li>
                  <strong>عدم تحمل مسؤولية المخالفات القانونية:</strong> لا يتحمل نظام الكوثر للحسابات أو مالكه أو مطوروه أي مسؤولية - قانونية كانت أو ضريبية أو مالية - عن أي مخالفة يرتكبها المستخدم بسبب اعتماده الحصري على النظام وإهماله للسجلات الورقية.
                </li>
              </ol>
            </div>
          </section>

          {/* المادة 6: فقدان البيانات وإخلاء المسؤولية المطلق */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (6): فقدان البيانات وإخلاء المسؤولية المطلق</h3>
            <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="font-bold text-red-900 text-justify">
                  هذه المادة هي حجر الزاوية في هذه الاتفاقية. يرجى قراءتها بمنتهى الدقة:
                </p>
              </div>

              <div className="space-y-4 text-red-900">
                <div>
                  <h4 className="font-bold mb-2">أولاً: لا ضمانات على البيانات</h4>
                  <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
                    <li>النظام والخدمات مقدمة "كما هي" (AS IS) و"حسب توفرها" (AS AVAILABLE) دون أي ضمانات من أي نوع، سواء كانت صريحة أم ضمنية.</li>
                    <li>لا نضمن - بأي حال من الأحوال - استمرارية الخدمة أو عدم انقطاعها أو خلوها من الأخطاء.</li>
                    <li>لا نضمن دقة البيانات أو كمالها أو سلامتها أو عدم تلفها أو فقدانها.</li>
                    <li>لا نضمن توافق النظام مع متطلبات المستخدم الخاصة أو توقعاته.</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-bold mb-2">ثانياً: إخلاء كامل وشامل من المسؤولية</h4>
                  <p className="text-justify mb-2">
                    يخلي نظام الكوثر للحسابات ومالكه ومطوروه وشركاؤه وموظفوه ومستضيفوه ومستشاروه مسؤوليتهم الكاملة والمطلقة - وبأوسع نطاق يجيزه القانون - عن:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
                    <li>أي فقدان جزئي أو كلي للبيانات أو المعلومات المخزنة في النظام، أياً كان السبب.</li>
                    <li>أي تلف أو تشويه أو تغيير في البيانات المخزنة.</li>
                    <li>أي أضرار مباشرة أو غير مباشرة أو عرضية أو تبعية أو خاصة أو تأديبية.</li>
                    <li>أي خسارة في الأرباح أو الإيرادات أو العملاء أو السمعة التجارية أو الفرص التجارية.</li>
                    <li>أي تعطل في الأعمال أو توقف في العمليات التجارية.</li>
                    <li>أي غرامات ضريبية أو عقوبات قانونية أو تعويضات قضائية.</li>
                    <li>أي مطالبات من أطراف ثالثة تنشأ عن استخدام المستخدم للنظام.</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-bold mb-2">ثالثاً: أسباب فقدان البيانات غير المضمونة</h4>
                  <p className="text-justify mb-2">
                    تشمل الأسباب التي لا نتحمل مسؤوليتها - على سبيل المثال لا الحصر - ما يلي:
                  </p>
                  <ul className="list-disc list-inside pr-4 space-y-1">
                    <li>أعطال الخوادم أو الشبكات أو البنية التحتية التقنية.</li>
                    <li>الهجمات الإلكترونية أو الاختراقات أو الفيروسات أو برامج الفدية.</li>
                    <li>أخطاء مزود الخدمة السحابية (Supabase) أو توقف خدماته أو إفلاسه.</li>
                    <li>أخطاء برمجية أو عيوب تقنية أو فشل في التحديثات.</li>
                    <li>أخطاء بشرية من المستخدم أو موظفيه أو أي شخص مخول بالوصول للحساب.</li>
                    <li>الحذف غير المقصود أو العمدي للبيانات من قبل المستخدم أو من يفوضه.</li>
                    <li>القوة القاهرة والحوادث الاستثنائية والكوارث الطبيعية والحروب والاضطرابات.</li>
                    <li>انقطاع خدمات الإنترنت أو الاتصالات أو الكهرباء.</li>
                    <li>توقف أو إنهاء النظام أو الخدمة بشكل دائم أو مؤقت.</li>
                    <li>أي سبب آخر خارج عن إرادتنا المعقولة، سواء كان متوقعاً أم غير متوقع.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold mb-2">رابعاً: التنازل عن حق التقاضي</h4>
                  <p className="text-justify">
                    باستخدامه للنظام، يتنازل المستخدم تنازلاً صريحاً لا رجعة فيه وغير مشروط عن حقه في مقاضاة أو ملاحقة أو رفع دعاوى - فردية كانت أم جماعية - ضد نظام الكوثر للحسابات أو مالكه أو مطوريه أو شركائه أو مستضيفيه أو موظفيه، وذلك عن أي مطالبة أو دعوى أو نزاع ينشأ عن أو يتعلق بـ:
                  </p>
                  <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                    <li>فقدان البيانات أو تلفها أو عدم دقتها.</li>
                    <li>انقطاع الخدمة أو تعطل النظام أو توقفه.</li>
                    <li>أي أضرار أو خسائر من أي نوع، سواء كانت مادية أو معنوية أو تجارية.</li>
                    <li>أي إخلال بالالتزامات القانونية أو الضريبية للمستخدم.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold mb-2">خامساً: تحديد المسؤولية المالية</h4>
                  <p className="text-justify">
                    في حال حكمت أي محكمة مختصة بمسؤوليتنا - على الرغم من التنازل أعلاه - فإن الحد الأقصى لمسؤوليتنا المالية تجاه المستخدم أو أي طرف ثالث، عن جميع المطالبات مجتمعة، لا يتجاوز بأي حال من الأحوال مجموع المبالغ التي دفعها المستخدم للنظام خلال الـ 12 شهراً السابقة لنشوء المطالبة، أو مبلغ 100 دولار أمريكي أيهما أقل. وهذا التحديد ينطبق على جميع أنواع المسؤولية، سواء كانت عقدية أو تقصيرية أو غير ذلك.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold mb-2">سادساً: التعويض</h4>
                  <p className="text-justify">
                    يوافق المستخدم على تعويضنا والدفاع عنا وحمايتنا من أي وجميع المطالبات أو الدعاوى أو الخسائر أو الأضرار أو التكاليف (بما في ذلك أتعاب المحاماة) التي تنشأ عن أو تتعلق بـ:
                  </p>
                  <ul className="list-disc list-inside pr-4 mt-2 space-y-1">
                    <li>استخدام المستخدم للنظام.</li>
                    <li>إخلال المستخدم بهذه الشروط والأحكام.</li>
                    <li>انتهاك المستخدم لأي قانون أو لائحة أو حقوق طرف ثالث.</li>
                    <li>المحتوى الذي يقدمه أو يخزنه المستخدم في النظام.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* المادة 7: الاشتراكات والمدفوعات */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (7): الاشتراكات والمدفوعات</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>يقدم النظام فترة تجريبية مجانية مدتها 14 يوماً. بعد انتهاء الفترة التجريبية، يلزم دفع رسوم اشتراك شهري قدرها 25,000 دينار عراقي لاستمرار الخدمة.</li>
              <li>يتم تفعيل الاشتراك يدوياً من قبل إدارة النظام بعد استلام الدفع. آلية الدفع تتم عبر التواصل المباشر مع الدعم على واتساب.</li>
              <li>جميع المدفوعات غير قابلة للاسترداد ما لم ينص القانون على خلاف ذلك.</li>
              <li>نحتفظ بالحق في تعديل أسعار الاشتراكات بعد إشعار المستخدم بمدة معقولة.</li>
              <li>في حال انتهاء الاشتراك أو عدم سداد الرسوم، يحق لنا تعليق أو إنهاء الخدمة دون سابق إنذار، ويتم منع المستخدم من الوصول للنظام بالكامل.</li>
              <li>لا نضمن استمرارية حفظ بيانات الحسابات المنتهية أو المعلقة بعد مرور 90 يوماً من تاريخ التعليق.</li>
            </ol>
          </section>

          {/* المادة 8: حقوق الملكية الفكرية */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (8): حقوق الملكية الفكرية</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>جميع حقوق الملكية الفكرية المتعلقة بالنظام - بما في ذلك الشيفرة المصدرية والتصميم والواجهات والشعارات والعلامات التجارية - مملوكة حصراً لمزود الخدمة.</li>
              <li>لا يجوز للمستخدم نسخ أو تعديل أو توزيع أو بيع أو تأجير أي جزء من النظام.</li>
              <li>المحتوى الذي يدخله المستخدم في النظام يبقى مملوكاً له، ويمنح المستخدم مزود الخدمة ترخيصاً غير حصري لتخزينه ومعالجته لغرض تقديم الخدمة.</li>
              <li>يمنع منعاً باتاً إجراء هندسة عكسية (Reverse Engineering) للنظام أو أي جزء منه.</li>
            </ol>
          </section>

          {/* المادة 9: إنهاء الخدمة */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (9): إنهاء الخدمة وتعليقها</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>يحق لنا - وفقاً لتقديرنا المنفرد - تعليق أو إنهاء حساب المستخدم أو وصوله إلى النظام في أي وقت، ودون إشعار مسبق، وذلك لأي سبب بما في ذلك الإخلال بهذه الشروط.</li>
              <li>يحق للمستخدم إنهاء حسابه في أي وقت عبر التواصل مع فريق الدعم.</li>
              <li>عند إنهاء الحساب، يجوز لنا حذف جميع بيانات المستخدم بعد مدة لا تتجاوز 90 يوماً دون أي مسؤولية علينا.</li>
              <li>تبقى البنود المتعلقة بإخلاء المسؤولية وتحديد المسؤولية والتعويض سارية المفعول بعد إنهاء الخدمة.</li>
            </ol>
          </section>

          {/* المادة 10: خدمات الطرف الثالث */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (10): خدمات الطرف الثالث</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>النظام يعتمد على خدمات طرف ثالث (مثل Supabase وWhatsApp). لا نتحمل أي مسؤولية عن أداء أو أمن أو توفر هذه الخدمات.</li>
              <li>أي تعاملات بين المستخدم وأطراف ثالثة تتم على مسؤولية المستخدم الخاصة.</li>
              <li>قد يؤدي توقف خدمات الطرف الثالث إلى توقف النظام كلياً أو جزئياً دون تحملنا أية مسؤولية.</li>
            </ol>
          </section>

          {/* المادة 11: التعديلات على الشروط */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (11): تعديل الشروط والأحكام</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li>نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت وبدون إشعار مسبق.</li>
              <li>يتم نشر التعديلات على هذه الصفحة وتصبح سارية المفعول فور نشرها.</li>
              <li>استمرار المستخدم في استخدام النظام بعد التعديلات يعتبر موافقة صريحة على الشروط المعدلة.</li>
              <li>يتحمل المستخدم مسؤولية مراجعة هذه الصفحة بشكل دوري للاطلاع على أي تحديثات.</li>
            </ol>
          </section>

          {/* المادة 12: أحكام عامة */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (12): أحكام عامة</h3>
            <ol className="list-decimal list-inside space-y-2 pr-2 text-justify">
              <li><strong>الاتفاقية الكاملة:</strong> تشكل هذه الشروط والأحكام - مع سياسة الخصوصية - الاتفاقية الكاملة بين الطرفين، وتلغي أي اتفاقيات أو تفاهمات سابقة.</li>
              <li><strong>عدم التنازل عن الحقوق:</strong> عدم ممارستنا لأي حق من حقوقنا لا يعتبر تنازلاً عن ذلك الحق.</li>
              <li><strong>قابلية الفصل:</strong> إذا تبين أن أي بند من هذه الشروط غير قانوني أو غير قابل للتنفيذ، يظل باقي البنود سارياً ونافذاً.</li>
              <li><strong>التنازل عن الحقوق:</strong> لا يجوز للمستخدم التنازل عن أي من حقوقه أو التزاماته بموجب هذه الاتفاقية دون موافقتنا الخطية المسبقة.</li>
              <li><strong>القانون الحاكم:</strong> تخضع هذه الشروط والأحكام وتفسر وفقاً لقوانين جمهورية العراق، وتختص محاكم العراق حصراً بنظر أي نزاع.</li>
              <li><strong>اللغة:</strong> في حال وجود أي تعارض بين النص العربي والنص المترجم لأي لغة أخرى، تكون النسخة العربية هي المعتمدة والرسمية.</li>
            </ol>
          </section>

          {/* المادة 13: الاتصال */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">المادة (13): الاتصال</h3>
            <p className="text-justify">
              للاستفسارات المتعلقة بهذه الشروط والأحكام:
            </p>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p><strong>واتساب:</strong>{" "}
                <a href="https://wa.me/9647850572326?text=السلام+عليكم،+لدي+استفسار+عن+شروط+الاستخدام" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" dir="ltr">
                  +964 785 057 2326
                </a>
              </p>
            </div>
          </section>

          {/* تذييل حاسم */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-5 text-center">
            <p className="font-bold text-lg mb-1">
              باستخدامك لنظام الكوثر للحسابات، أنت تقر بأنك قد قرأت وفهمت وقبلت جميع ما ورد أعلاه.
            </p>
            <p className="text-sm text-white/80">
              استخدامك للنظام يعتبر موافقة صريحة وملزمة قانوناً على جميع هذه الشروط.
            </p>
          </div>
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
