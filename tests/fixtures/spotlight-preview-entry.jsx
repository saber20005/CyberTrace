import {useState} from "react";
import {createRoot} from "react-dom/client";
import SpotlightPreview from "../../src/components/SpotlightPreview.jsx";
function Demo(){
 const [view,setView]=useState("library");
 return <>
  <nav className="ct-home-navbar">
   <button type="button" className="ct-primary-route" onClick={()=>setView("library")}>التحقيقات</button>
   <details className="ct-more"><summary>المزيد</summary><div className="ct-nav-dropdown-panel">
    <button type="button" data-ct-spotlight="soc" onClick={event=>{event.currentTarget.closest("details").open=false;setView("soc");}}>مناوبات SOC</button>
   </div></details>
  </nav>
  <div data-fixture-view={view}>{view==="library"
   ?<section className="library-filters"><h1>مكتبة التحقيقات</h1><label>ابحث عن تحقيق<input type="search" aria-label="بحث التحقيقات"/></label></section>
   :<section className="soc-switcher"><h1>مناوبات SOC</h1><p>سيناريو تدريب تجريبي</p></section>}</div>
  <SpotlightPreview view={view}/>
 </>;
}
createRoot(document.getElementById("root")).render(<Demo/>);
