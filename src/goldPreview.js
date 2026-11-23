// Only imported by the isolated Vercel preview branch. No storage or API calls.
const key = "cybertracePreview";
document.documentElement.dataset[key] = "gold";
function initializeComparison(){
 if(document.querySelector(".ct-amber-compare"))return;
 const panel=document.createElement("aside");
 panel.className="ct-amber-compare";
 panel.setAttribute("role","region");
 panel.setAttribute("aria-label","مقارنة الهوية الذهبية");
 const heading=document.createElement("strong");
 heading.textContent="معاينة CyberTrace الذهبية";
 const note=document.createElement("small");
 note.textContent="موقع تفاعلي تجريبي — لا تغيير في الموقع الرسمي";
 const controls=document.createElement("div");
 controls.className="ct-amber-compare-actions";
 const gold=document.createElement("button");
 gold.type="button";gold.textContent="الذهبي الجديد";
 const current=document.createElement("button");
 current.type="button";current.textContent="التصميم الحالي";
 const setGold=(active)=>{
   if(active)document.documentElement.dataset[key]="gold";
   else delete document.documentElement.dataset[key];
   gold.setAttribute("aria-pressed",String(active));
   current.setAttribute("aria-pressed",String(!active));
 };
 gold.addEventListener("click",()=>setGold(true));
 current.addEventListener("click",()=>setGold(false));
 controls.append(gold,current);panel.append(heading,note,controls);
 document.body.appendChild(panel);setGold(true);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initializeComparison,{once:true});
else initializeComparison();
