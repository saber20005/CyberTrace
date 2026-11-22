// Strictly device-local presentation state; never share storage keys with user progress.
export const UI_PREFERENCES_KEY = "cybertrace.ui-preferences.v1";
export const DEFAULT_UI_PREFERENCES = Object.freeze({
  theme:"dark",accent:"brand",textSize:"normal",density:"comfortable",
  contrast:"standard",motion:"system",level:"unset",
});
export const UI_PRESETS = Object.freeze([
  {id:"signature",title:"الهوية الأصلية",description:"دفء ذهبي ومساحة واضحة للتحقيق",theme:"dark",accent:"brand",density:"comfortable",motion:"system",contrast:"standard",textSize:"normal"},
  {id:"focus",title:"وضع التركيز",description:"أزرق ليلي ومحتوى مكثف وحركة أقل",theme:"midnight",accent:"cyan",density:"compact",motion:"reduce",contrast:"standard",textSize:"normal"},
  {id:"reading",title:"قراءة مريحة",description:"خلفية فاتحة وتباين أعلى وخط أوضح",theme:"light",accent:"brand",density:"comfortable",motion:"reduce",contrast:"high",textSize:"large"},
]);
const allowed=Object.freeze({
  theme:["dark","light","midnight"],
  accent:["brand","cyan","violet"],
  textSize:["normal","large","xlarge"],
  density:["comfortable","compact"],
  contrast:["standard","high"],
  motion:["system","reduce"],
  level:["unset","beginner","intermediate","advanced"],
});
export function normalizeUIPreferences(input) {
  const source=input&&typeof input==="object"&&!Array.isArray(input)?input:{};
  return Object.fromEntries(Object.entries(DEFAULT_UI_PREFERENCES).map(([key,fallback])=>[
    key,allowed[key].includes(source[key])?source[key]:fallback
  ]));
}
export function applyUIPreset(current,id) {
  const preset=UI_PRESETS.find(item=>item.id===id);
  if(!preset)return normalizeUIPreferences(current);
  return normalizeUIPreferences({...normalizeUIPreferences(current),...preset});
}
export function readUIPreferences(storage) {
  try {
    const store=storage===undefined?(typeof window==="undefined"?null:window.localStorage):storage;
    const raw=store?.getItem(UI_PREFERENCES_KEY);
    return normalizeUIPreferences(raw?JSON.parse(raw):null);
  }catch{return normalizeUIPreferences(null);}
}
export function saveUIPreferences(value,storage) {
  try {
    const store=storage===undefined?(typeof window==="undefined"?null:window.localStorage):storage;
    if(!store)return false;
    store.setItem(UI_PREFERENCES_KEY,JSON.stringify(normalizeUIPreferences(value)));
    return true;
  }catch{return false;}
}
export function applyUIPreferences(value,target) {
  const p=normalizeUIPreferences(value);
  const node=target===undefined?(typeof document==="undefined"?null:document.documentElement):target;
  if(node?.dataset){
    node.dataset.ctTheme=p.theme;
    node.dataset.ctAccent=p.accent;
    node.dataset.ctText=p.textSize;
    node.dataset.ctDensity=p.density;
    node.dataset.ctContrast=p.contrast;
    node.dataset.ctMotion=p.motion;
  }
  return p;
}
