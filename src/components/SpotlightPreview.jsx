import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import "./SpotlightPreview.css";

// This demo lives on the real navigation surfaces but never changes progress or cases.
const STEPS = [
 {selector:".ct-home-navbar .ct-primary-route",title:"افتح مكتبة التحقيقات",description:"اضغط «التحقيقات» في الشريط الأصلي. سينقلك الضوء إلى الأدوات التي تستخدمها للبحث عن الأدلة."},
 {selector:'.library-filters input[type="search"]',title:"ابحث في ملفات الحوادث",description:"اضغط حقل البحث الحقيقي. يمكنك البحث لاحقًا برقم القضية أو نوع الحادثة؛ لا نفتح أي تحقيق ولا نغيّر نتيجته."},
 {selector:".ct-home-navbar .ct-more > summary",title:"افتح قائمة العمليات",description:"اضغط «المزيد» لترى الأدوات الإضافية، ثم اختر مناوبات SOC من القائمة."},
 {selector:'[data-ct-spotlight="soc"]',title:"انتقل إلى مركز SOC",description:"اضغط «مناوبات SOC» لتصل إلى التنبيهات الفعلية للموقع. الجولة لا ترسل أي استجابة ولا تُسجّل درجات."}
];

function previewRequested(){
 try {
  const navigation=window.performance.getEntriesByType("navigation")[0]?.name;
  return new URL(navigation || window.location.href).searchParams.get("spotlight-preview")==="1";
 } catch {return false;}
}

export default function SpotlightPreview({view}){
 const [enabled]=useState(previewRequested);
 const [active,setActive]=useState(enabled);
 const [index,setIndex]=useState(0);
 const [geometry,setGeometry]=useState(null);
 const [missing,setMissing]=useState(false);
 const panel=useRef(null),targetRef=useRef(null),skipRef=useRef(null),positionFrame=useRef(0);
 const finished=index>=STEPS.length;
 const stop=()=>{setActive(false);targetRef.current=null;};
 const restart=()=>{setIndex(0);setMissing(false);setActive(true);};
 useEffect(()=>{if(active)skipRef.current?.focus({preventScroll:true});},[active]);
 useEffect(()=>{
  if(!enabled||!active||finished)return undefined;
  const update=()=>{
   const target=document.querySelector(STEPS[index].selector);
   const r=target?.getBoundingClientRect();
   if(!target||!r||r.width<1||r.height<1){targetRef.current=null;setMissing(true);return;}
   const style=getComputedStyle(target);
   if(style.display==="none"||style.visibility==="hidden"){targetRef.current=null;setMissing(true);return;}
   targetRef.current=target;
   const outOfView=r.bottom<0||r.top>innerHeight;
   if(outOfView)target.scrollIntoView({block:"center",behavior:"instant"});
   const b=target.getBoundingClientRect(),pad=7;
   const w=Math.min(340,innerWidth-24),h=panel.current?.offsetHeight||230;
   let x=innerWidth<720?(innerWidth-w)/2:b.left-w-24;
   if(x<12)x=b.right+22;
   x=Math.max(12,Math.min(innerWidth-w-12,x));
   let y=innerWidth<720?(b.top>innerHeight/2?12:innerHeight-h-12):b.top+b.height/2-h/2;
   y=Math.max(12,Math.min(innerHeight-h-12,y));
   // The original reference visibly rotates a rectangular lamp and casts a cone.
   // Aim the light at the actual interactive element; never intercept its click.
   const tx=b.left+b.width/2,ty=b.top+b.height/2;
   // On narrow phones, the open SOC dropdown fills nearly the whole width.
   // Move the flashlight below its LEFT edge (rather than beside the right edge).
   // Its head and cone then rotate toward the target, without crossing the text.
   const socOnPhone=innerWidth<=720&&index===STEPS.length-1;
   const lampX=socOnPhone
    ? Math.max(52,Math.min(innerWidth-58,b.left+36))
    : b.left>=innerWidth-b.right?Math.max(54,b.left-106):Math.min(innerWidth-54,b.right+106);
   const lampY=Math.max(58,Math.min(innerHeight-58,ty+(ty>innerHeight/2?-112:112)));
   const angle=Math.atan2(ty-lampY,tx-lampX),angleDeg=angle*180/Math.PI;
   const beamX=lampX+Math.cos(angle)*29,beamY=lampY+Math.sin(angle)*29;
   const beamLength=Math.max(26,Math.hypot(tx-beamX,ty-beamY));
   const beamHeight=socOnPhone?Math.min(110,Math.max(72,b.height*1.6)):Math.min(205,Math.max(84,b.width*.85+72));
   const next={x,y,left:Math.max(3,b.left-pad),top:Math.max(3,b.top-pad),
    width:Math.min(innerWidth-6,b.width+2*pad),height:Math.min(innerHeight-6,b.height+2*pad),
    lampX,lampY,beamX,beamY,beamLength,beamHeight,angleDeg};
   setGeometry(prev=>prev&&Object.keys(next).every(k=>Math.abs(prev[k]-next[k])<1)?prev:next);
   setMissing(false);
  };
  const schedule=()=>{cancelAnimationFrame(positionFrame.current);positionFrame.current=requestAnimationFrame(update);};
  schedule();
  const watcher=new MutationObserver(schedule);
  const root=document.getElementById("root");
  if(root)watcher.observe(root,{childList:true,subtree:true});
  window.addEventListener("resize",schedule);
  window.addEventListener("scroll",schedule,true);
  return ()=>{watcher.disconnect();cancelAnimationFrame(positionFrame.current);
   window.removeEventListener("resize",schedule);window.removeEventListener("scroll",schedule,true);};
 },[enabled,active,index,view,finished]);
 useEffect(()=>{
  if(!enabled||!active)return undefined;
  const onClick=event=>{
   if(panel.current?.contains(event.target))return;
   const target=targetRef.current;
   if(!finished&&target&&(target===event.target||target.contains(event.target))){
    // Navigation is performed by the original React event. Continue only after it fires.
    window.setTimeout(()=>setIndex(value=>value===index?value+1:value),90);
    return;
   }
   event.preventDefault();event.stopImmediatePropagation();
  };
  const onKey=event=>{
   if(event.key==="Escape"){event.preventDefault();event.stopPropagation();setActive(false);}
  };
  document.addEventListener("click",onClick,true);
  document.addEventListener("keydown",onKey,true);
  return ()=>{document.removeEventListener("click",onClick,true);document.removeEventListener("keydown",onKey,true);};
 },[enabled,active,index,finished]);
 if(!enabled)return null;
 return createPortal(<>
  <button type="button" className="ct-sp-replay" onClick={restart}>◉ إعادة الجولة الضوئية</button>
  {active&&<div className="ct-sp-overlay" dir="rtl" data-ct-spotlight-preview>
   {!finished&&!missing&&geometry&&<>
    <div className="ct-sp-hole" aria-hidden="true" style={{left:geometry.left,top:geometry.top,width:geometry.width,height:geometry.height}}/>
    <div className="ct-sp-beam" aria-hidden="true" style={{left:geometry.beamX,top:geometry.beamY,width:geometry.beamLength,height:geometry.beamHeight,transform:"translateY(-50%) rotate("+geometry.angleDeg+"deg)"}}/>
    <div className="ct-sp-lamp" aria-hidden="true" style={{left:geometry.lampX,top:geometry.lampY,transform:"translate(-50%,-50%) rotate("+geometry.angleDeg+"deg)"}}>
     <span className="ct-sp-lamp-grip"/><span className="ct-sp-lamp-head"/>
    </div>
   </>}
   <section ref={panel} className="ct-sp-panel" role="dialog" aria-modal="false" aria-labelledby="ct-sp-title" style={finished?{left:"50%",top:"50%",transform:"translate(-50%,-50%)"}:geometry?{left:geometry.x,top:geometry.y}:{left:12,top:12}}>
    <div className="ct-sp-meta"><span>◉ CYBERTRACE / INVESTIGATION GUIDE</span><span>{finished?"COMPLETE":String(index+1).padStart(2,"0")+" / 04"}</span></div>
    <div className="ct-sp-progress"><i style={{width:(finished?100:(index+1)/STEPS.length*100)+"%"}}/></div>
    <h2 id="ct-sp-title">{finished?"اكتشفت طريقك في مركز التحقيق":STEPS[index].title}</h2>
    <p>{finished?"انتقلت من البحث في مكتبة التحقيقات إلى مركز عمليات SOC داخل الصفحات الحقيقية. يمكنك متابعة التدريب الآن أو إعادة الجولة دون فقدان أي نتائج.":STEPS[index].description}</p>
    {!finished&&<p className="ct-sp-instruction">{missing?"أفتح القسم المطلوب...":"اضغط على العنصر المضيء للانتقال إلى الخطوة التالية."}</p>}
    <div className="ct-sp-actions">
     <button type="button" ref={skipRef} onClick={stop}>{finished?"إغلاق الجولة":"تخطي الجولة"}</button>
     {finished&&<button type="button" onClick={restart}>إعادة التجربة</button>}
    </div>
    <small>عرض تجريبي • بدون كتابة في الحساب أو ملف التحقيق أو نتائج SOC</small>
   </section>
  </div>}
 </>,document.body);
}