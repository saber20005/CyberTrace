// Preview-only comparison. No account, progress, or local preference storage.
const key = "cybertracePreview";
document.documentElement.dataset[key] = "gold";

function initializeComparison(){
  if(document.querySelector(".ct-amber-compare")) return;
  const panel=document.createElement("aside");
  panel.className="ct-amber-compare";
  panel.setAttribute("role","region");
  panel.setAttribute("aria-label","مقارنة الهوية الذهبية");

  const heading=document.createElement("div");
  heading.className="ct-amber-compare-heading";
  const title=document.createElement("strong");
  title.textContent="معاينة CyberTrace الذهبية";
  const toggle=document.createElement("button");
  toggle.type="button";
  toggle.className="ct-amber-compare-toggle";
  toggle.setAttribute("aria-controls","ct-amber-compare-options");
  heading.append(title,toggle);

  const note=document.createElement("small");
  note.className="ct-amber-compare-note";
  note.textContent="موقع تجريبي تفاعلي — لا تغيير في الموقع الرسمي";

  const controls=document.createElement("div");
  controls.id="ct-amber-compare-options";
  controls.className="ct-amber-compare-actions";
  const gold=document.createElement("button");
  gold.type="button";gold.textContent="الذهبي الجديد";
  const current=document.createElement("button");
  current.type="button";current.textContent="التصميم الحالي";

  const status=document.createElement("span");
  status.className="ct-amber-compare-status";
  status.setAttribute("role","status");
  status.setAttribute("aria-live","polite");
  const setGold=(active)=>{
    if(active) document.documentElement.dataset[key]="gold";
    else delete document.documentElement.dataset[key];
    gold.setAttribute("aria-pressed",String(active));
    current.setAttribute("aria-pressed",String(!active));
    status.textContent=active?"الوضع: الذهبي":"الوضع: الحالي";
  };
  const setExpanded=(expanded)=>{
    controls.hidden=!expanded;
    note.hidden=!expanded;
    status.hidden=expanded;
    panel.classList.toggle("is-collapsed",!expanded);
    toggle.setAttribute("aria-expanded",String(expanded));
    toggle.setAttribute("aria-label",expanded?"طي المقارنة":"فتح خيارات المقارنة");
    toggle.textContent=expanded?"−":"＋";
  };
  toggle.addEventListener("click",()=>setExpanded(controls.hidden));
  gold.addEventListener("click",()=>setGold(true));
  current.addEventListener("click",()=>setGold(false));
  controls.append(gold,current);
  panel.append(heading,note,status,controls);
  document.body.appendChild(panel);
  setGold(true);
  // Minimize the overlay on narrow phones. One tap reveals both choices.
  const compact=typeof window.matchMedia==="function"&&window.matchMedia("(max-width: 600px)").matches;
  setExpanded(!compact);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",initializeComparison,{once:true});
else initializeComparison();
