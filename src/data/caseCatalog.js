export const DIFFICULTIES = [
  { id: "beginner", label: "مبتدئ" },
  { id: "intermediate", label: "متوسط" },
  { id: "advanced", label: "متقدم" },
];

export const CATEGORIES = [
  { id: "identity", label: "الهوية والوصول" },
  { id: "email", label: "أمن البريد" },
  { id: "malware", label: "البرمجيات الخبيثة" },
  { id: "web", label: "تطبيقات الويب" },
  { id: "data", label: "حماية البيانات" },
  { id: "cloud", label: "الأمن السحابي" },
  { id: "network", label: "أمن الشبكات" },
  { id: "supply-chain", label: "سلسلة التوريد" },
];

const CATALOG = {
  "INC-0417": { title: "تسجيل دخول مشبوه", category: "identity", difficulty: "beginner" },
  "INC-0512": { title: "حملة تصيّد عبر البريد", category: "email", difficulty: "beginner" },
  "INC-0633": { title: "تنبيه تشفير ببرمجية فدية", category: "malware", difficulty: "intermediate" },
  "INC-0701": { title: "استغلال خادم غير محدّث", category: "web", difficulty: "intermediate" },
  "INC-0755": { title: "تسريب بيانات من الداخل", category: "data", difficulty: "intermediate" },
  "INC-0812": { title: "هجوم تخمين على لوحة الإدارة", category: "identity", difficulty: "beginner" },
  "INC-0890": { title: "حاوية تخزين سحابي مكشوفة", category: "cloud", difficulty: "intermediate" },
  "INC-0944": { title: "حجب خدمة على واجهة عامة", category: "network", difficulty: "intermediate" },
  "INC-1002": { title: "تصعيد صلاحيات غير مصرّح به", category: "identity", difficulty: "intermediate" },
  "INC-1055": { title: "اختراق سلسلة توريد برمجية", category: "supply-chain", difficulty: "intermediate" },
  "INC-1101": { title: "حقن SQL وتسريب بيانات العملاء", category: "web", difficulty: "intermediate" },
  "INC-1102": { title: "إساءة استخدام موافقة OAuth", category: "identity", difficulty: "intermediate" },
  "INC-1103": { title: "تعدين خفي داخل حاوية إنتاج", category: "malware", difficulty: "intermediate" },
  "INC-1104": { title: "تسريب بيانات عبر نفق DNS", category: "data", difficulty: "advanced" },
  "INC-1105": { title: "حركة جانبية بحساب خدمة مخترق", category: "network", difficulty: "advanced" },
  "INC-1106": { title: "استغلال مفتاح وصول سحابي مسرّب", category: "cloud", difficulty: "advanced" },
};

// Library labels are separate from investigation evidence and scoring data.
export function getCaseDetails(caseData) {
  const entry = Object.hasOwn(CATALOG, caseData?.id) ? CATALOG[caseData.id] : {
    title: caseData?.incidentTitle || "تحقيق أمني",
    category: "general",
    difficulty: "intermediate",
  };
  return {
    ...entry,
    categoryLabel: CATEGORIES.find((item) => item.id === entry.category)?.label ?? "تحقيقات عامة",
    difficultyLabel: DIFFICULTIES.find((item) => item.id === entry.difficulty)?.label ?? "متوسط",
  };
}
