import {CATEGORIES,getCaseDetails} from './caseCatalog.js';

// Public learning objectives only. No assessment answers or credential logic.
export const CERTIFICATE_PREPARATION = Object.freeze({
  identity:Object.freeze({
    outcome:'تحليل مسار المصادقة والثقة وتوقيت النشاط المشبوه دون افتراض أن اختلاف المصدر يعني اختراقًا.',
    practice:'افصل تسجيل الدخول المشروع عن إعادة استخدام الجلسة، ثم اقترح إبطالًا محدد النطاق مع حفظ السجلات.',
  }),
  email:Object.freeze({
    outcome:'تمييز هوية المرسل ومسار الرد ومصادقة البريد عن الادعاءات المكتوبة داخل الرسالة.',
    practice:'قارن ترويسات SPF وDKIM وDMARC مع سياق البوابة، وابنِ بلاغ تصيد يذكر الأدلة وحدودها.',
  }),
  malware:Object.freeze({
    outcome:'قراءة أدلة EDR والحاويات والعمليات وربط الأثر بنطاق الاحتواء.',
    practice:'استخرج تسلسلًا زمنيًا، وميّز الإنذار الموثق عن الفرضية، وقدم إجراء احتواء قابلًا للرجوع.',
  }),
  web:Object.freeze({
    outcome:'تمييز عيوب إدخال SQL والصلاحيات عن الثغرات المفترضة، وتحديد المعالجة وإعادة الفحص.',
    practice:'اربط الطلب غير المعتاد بسجل التطبيق وقرار الوصول ثم تحقق من معالجة المدخلات والصلاحيات.',
  }),
  data:Object.freeze({
    outcome:'تحليل حركة البيانات والإذن والوجهة والتمييز بين تصدير مقرر وتسريب غير مصرح.',
    practice:'ابنِ فرضية دقيقة من الأدلة وتحقق من مالك التصدير وتصنيف البيانات قبل التصعيد.',
  }),
  cloud:Object.freeze({
    outcome:'فهم أثر صلاحيات السحابة والمفاتيح وحالات المشاركة الخارجية وإصلاح أقلّ الصلاحيات.',
    practice:'تتبع من منح الوصول وما هو النطاق، ثم اقترح احتواءً يحد الخطر ويحافظ على الأدلة.',
  }),
  network:Object.freeze({
    outcome:'ربط أحداث DHCP وDNS والانتقال الجانبي وقواعد التقسيم بالأصول والوقت المحددين.',
    practice:'ارسم مسار الاتصال وحدد أي أصل ومصدر يحتاجان إلى تحقق داخل نطاق مصرح به.',
  }),
  'supply-chain':Object.freeze({
    outcome:'تقييم مصدر صورة الحاوية وهوية مسار البناء وسلامة الاعتمادات والتواقيع.',
    practice:'قارن اعتماد الصورة والخطوة الآلية بأدلة بناء موثقة ثم قدم آلية منع تكرار.',
  }),
});

export function buildCertificateTrainingCurriculum(cases){
  if(!Array.isArray(cases))return [];
  const seen=new Set(),valid=[];
  for(const item of cases){
    if(typeof item?.id!=='string'||seen.has(item.id))continue;
    seen.add(item.id);
    const details=getCaseDetails(item);
    if(!Object.hasOwn(CERTIFICATE_PREPARATION,details.category))continue;
    valid.push({id:item.id,title:details.title,category:details.category});
  }
  return CATEGORIES.map(category=>{
    const related=valid.filter(item=>item.category===category.id);
    const goals=CERTIFICATE_PREPARATION[category.id];
    return {id:category.id,title:category.label,count:related.length,
      caseIds:related.map(item=>item.id),cases:related,goals};
  });
}
