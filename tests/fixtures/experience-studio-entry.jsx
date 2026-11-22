import { createRoot } from "react-dom/client";
import Settings from "../../src/pages/Settings.jsx";
import {applyUIPreferences,readUIPreferences} from "../../src/utils/uiPreferences.js";
import "../../src/index.css";
import "../../src/styles/design-system.css";
applyUIPreferences(readUIPreferences());
createRoot(document.getElementById("root")).render(<Settings onHome={()=>{}} />);
