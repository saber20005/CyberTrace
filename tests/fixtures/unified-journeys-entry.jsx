import React from "react";
import { createRoot } from "react-dom/client";
import UnifiedJourneys from "../../src/pages/UnifiedJourneys.jsx";
import { setProgressOwner } from "../../src/utils/progressScope.js";
import "../../src/App.css";
import "../../src/styles/design-system.css";

// Test-only fixture; not referenced by production entry or included in Vite dist.
const root = createRoot(document.getElementById("root"));
const render = uid => {
  setProgressOwner(uid);
  root.render(<UnifiedJourneys key={uid ?? "guest"} onHome={() => {}} onLibrary={() => {}} />);
};
window.__suiteFixture = Object.freeze({ setOwner: render });
render(null);
