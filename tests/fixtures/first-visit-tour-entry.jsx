import {useState} from "react";
import {createRoot} from "react-dom/client";
import WelcomeTour from "../../src/pages/WelcomeTour.jsx";
import {shouldOpenFirstVisitTour,finishFirstVisitTour} from "../../src/utils/firstVisitTour.js";
import {readRoute} from "../../src/utils/routes.js";
import {applyUIPreferences,readUIPreferences} from "../../src/utils/uiPreferences.js";
import "../../src/App.css";
import "../../src/styles/design-system.css";
import "../../src/styles/royal-gold-theme.css";

applyUIPreferences(readUIPreferences());
export function Fixture(){
 const [view,setView]=useState(()=>{
  const route=readRoute(window.location.href);
  return route.view==="welcome"||shouldOpenFirstVisitTour(route)?"tour":route.view;
 });
 const leave=to=>{finishFirstVisitTour();setView(to);};
 if(view==="tour")return <WelcomeTour onSkip={()=>leave("home")} onHome={()=>leave("home")}
  onLibrary={()=>leave("library")} onSoc={()=>leave("soc")} onJourneys={()=>leave("journeys")}
  onCertificates={()=>leave("certificates")} onSettings={()=>leave("settings")}
  onAuth={()=>leave("auth")}/>;
 return <main data-test-view={view} dir="rtl" style={{padding:30}}>
  <h1>{view==="home"?"CyberTrace الرئيسية":"CyberTrace "+view}</h1>
  <button data-replay-tour type="button" onClick={()=>setView("tour")}>الدليل التفاعلي للمستخدم الجديد</button>
 </main>;
}
createRoot(document.getElementById("root")).render(<Fixture/>);
