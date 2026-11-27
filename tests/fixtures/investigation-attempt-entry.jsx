import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Investigation from "../../src/pages/Investigation.jsx";
import { CASES } from "../../src/data/cases.js";
import { setProgressOwner, progressKey } from "../../src/utils/progressScope.js";
import { getCaseResults } from "../../src/utils/caseProgress.js";
import { getXP } from "../../src/utils/xp.js";
import { BlackBoxContext } from "../../src/blackbox/useBlackBox.js";
import "../../src/index.css";
import "../../src/styles/design-system.css";

document.documentElement.dataset.ctText = new URL(location.href).searchParams.get("text") || "normal";
const initialOwner = sessionStorage.getItem("fixture-owner");
setProgressOwner(initialOwner);
const calls = () => JSON.parse(sessionStorage.getItem("fixture-bridge-calls") || "[]");
const bridge = { status: { enabled: false, user: null }, recordCompletion: async (caseId, score) => {
  sessionStorage.setItem("fixture-bridge-calls", JSON.stringify([...calls(), { owner: sessionStorage.getItem("fixture-owner"), caseId, score }]));
} };
const control = {};
window.__attemptFixture = control;
export default function Fixture() {
  const [owner, setOwner] = useState(initialOwner);
  const [caseId, setCaseId] = useState(new URL(location.href).searchParams.get("case") || CASES[0].id);
  useEffect(() => { Object.assign(control, {
    setOwner(uid) { if (uid === null) sessionStorage.removeItem("fixture-owner"); else sessionStorage.setItem("fixture-owner", uid); setProgressOwner(uid); setOwner(uid); },
    setCase(id) { const url = new URL(location.href); url.searchParams.set("case", id); history.replaceState(null, "", url); setCaseId(id); },
    inspect: () => ({ owner, xp: getXP(), results: getCaseResults(), calls: calls(), pendingKey: progressKey("cybertrace_pending_attempt:" + caseId) }),
  }); }, [owner, caseId]);
  return <BlackBoxContext.Provider value={bridge}><Investigation caseData={CASES.find(item => item.id === caseId)} onBack={() => {}} onNext={() => window.__attemptFixture.setCase(CASES[1].id)} /></BlackBoxContext.Provider>;
}
createRoot(document.getElementById("root")).render(<Fixture />);
