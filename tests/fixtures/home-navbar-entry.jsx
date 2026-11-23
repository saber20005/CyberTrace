import { createRoot } from "react-dom/client";
import HomeNavbar from "../../src/components/HomeNavbar.jsx";
import { BlackBoxContext } from "../../src/blackbox/useBlackBox.js";
import "../../src/index.css";
import "../../src/styles/design-system.css";

// The real header opens a native dialog through a local mock; no provider,
// credentials, authentication controller, or external service is loaded.
const openLink = () => document.getElementById("blackboxLinkDialog").showModal();
export function Fixture() {
  return <BlackBoxContext.Provider value={{ status: { enabled: true, user: null }, openLink }}>
    <HomeNavbar blackBoxEnabled onBlackBoxLink={openLink} />
    <main><button type="button">خارج القائمة</button></main>
    <dialog id="blackboxLinkDialog" className="bb-link-dialog" aria-label="نافذة اختبار محلية">
      <label>حقل محلي للاختبار <input /></label>
      <form method="dialog"><button type="submit">إغلاق نافذة الاختبار</button></form>
    </dialog>
  </BlackBoxContext.Provider>;
}
createRoot(document.getElementById("root")).render(<Fixture />);
