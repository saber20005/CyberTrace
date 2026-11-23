import { createRoot } from "react-dom/client";
import Settings from "../../src/pages/Settings.jsx";
import {applyUIPreferences,readUIPreferences} from "../../src/utils/uiPreferences.js";
import "../../src/index.css";
import "../../src/styles/design-system.css";
applyUIPreferences(readUIPreferences());
createRoot(document.getElementById("root")).render(<Settings onHome={()=>{}} />);

// Test the same isolated theme on investigation and SOC surfaces.
import "../../src/pages/Investigation.css";
import "../../src/pages/SocShift.css";
import "../../src/styles/royal-gold-theme.css";
