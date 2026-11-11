import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { blackBoxConfig } from "./config";
import { createBlackBoxBridge } from "./controller";
import { BlackBoxContext } from "./useBlackBox";
import BlackBoxLink from "./BlackBoxLink";

function initialStatus() {
  return {
    enabled: Boolean(blackBoxConfig.enabled), user: null,
    phase: blackBoxConfig.enabled ? "loading" : "disabled",
    pending: 0, syncing: false, error: null, message: "", receipts: {},
  };
}

function pausedStatus(status) {
  return { ...status, user: null, receipts: {}, pending: 0, syncing: false,
    phase: status.phase === "loading" ? "loading" : "guest",
    message: "اختر حساب BlackBox لنتائجك الجديدة. نتائج الانتظار تبقى مرتبطة بحسابها السابق." };
}

export default function BlackBoxProvider({ children }) {
  const [status, setStatus] = useState(initialStatus);
  const [modalVersion, setModalVersion] = useState(0);
  const controller = useRef(null);
  const dialog = useRef(null);
  const authEpoch = useRef(0);
  const paused = useRef(false);

  useEffect(() => {
    let active = true;
    let primaryResolved = false;
    let primaryUid = null;
    const bridge = createBlackBoxBridge({ config: blackBoxConfig, onStatus: next => { if (active) setStatus(paused.current ? pausedStatus(next) : next); } });
    controller.current = bridge;
    void bridge.start();
    const unsubscribePrimary = onAuthStateChanged(auth, user => {
      if (!active) return;
      const nextUid = user?.uid ?? null;
      if (blackBoxConfig.enabled && primaryResolved && primaryUid !== nextUid) {
        authEpoch.current += 1;
        paused.current = true;
        setStatus(pausedStatus(bridge.getStatus()));
        void bridge.disconnect().catch(() => {});
      }
      primaryResolved = true;
      primaryUid = nextUid;
    });
    return () => {
      active = false;
      unsubscribePrimary();
      bridge.dispose();
      if (controller.current === bridge) controller.current = null;
    };
  }, []);

  const openLink = useCallback(() => {
    if (!blackBoxConfig.enabled) return;
    setModalVersion(version => version + 1);
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  const signIn = useCallback(async (method, ...args) => {
    const bridge = controller.current;
    if (!bridge) return false;
    const epoch = authEpoch.current;
    const result = await bridge[method](...args);
    if (controller.current !== bridge || epoch !== authEpoch.current) {
      await bridge.disconnect().catch(() => {});
      throw Object.assign(new Error("تغيّر الحساب أثناء الربط. أعد اختيار حساب BlackBox."), { code: "bridge/session-changed" });
    }
    paused.current = false;
    setStatus(bridge.getStatus());
    return result;
  }, []);
  const signInEmail = useCallback((email, password) => signIn("signInEmail", email, password), [signIn]);
  const signInGoogle = useCallback(() => signIn("signInGoogle"), [signIn]);
  const disconnect = useCallback(async () => {
    const bridge = controller.current;
    if (!bridge) return;
    authEpoch.current += 1;
    paused.current = true;
    setStatus(pausedStatus(bridge.getStatus()));
    await bridge.disconnect();
  }, []);
  const recordCompletion = useCallback((caseId, score) => paused.current ? Promise.resolve(false) : controller.current?.recordCompletion(caseId, score) ?? Promise.resolve(false), []);
  const importHistory = useCallback(results => paused.current ? Promise.resolve({ imported: 0, skipped: 0, pending: 0 }) : controller.current?.importHistory(results) ?? Promise.resolve({ imported: 0, skipped: 0, pending: 0 }), []);
  const retryPending = useCallback(() => paused.current ? Promise.resolve(false) : controller.current?.retryPending() ?? Promise.resolve(false), []);
  const value = useMemo(() => ({ status, modalVersion, openLink, signInEmail, signInGoogle, disconnect, recordCompletion, importHistory, retryPending }),
    [status, modalVersion, openLink, signInEmail, signInGoogle, disconnect, recordCompletion, importHistory, retryPending]);

  return <BlackBoxContext.Provider value={value}>
    <div className={status.enabled ? "bb-linked-layout" : undefined}>{children}</div>
    {status.enabled && <BlackBoxLink dialogRef={dialog} />}
  </BlackBoxContext.Provider>;
}
