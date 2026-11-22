import { createElement } from "react";
import { createRoot } from "react-dom/client";
import Admin from "../../src/pages/Admin.jsx";
const root=createRoot(document.getElementById("root"));
window.__adminTest=Object.freeze({
  setIdentity(uid) {
    const user=uid?{
      uid,
      getIdToken:async (fresh)=>{
        if(fresh!==true)throw Error("Admin must refresh the token");
        return "fixture-"+uid;
      },
    }:null;
    root.render(createElement(Admin,{user,onHome:()=>{}}));
  },
});
window.__adminTest.setIdentity(null);
