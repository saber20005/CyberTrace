import { createContext, useContext } from "react";

const idleStatus = {
  enabled: false,
  user: null,
  phase: "disabled",
  pending: 0,
  syncing: false,
  error: null,
  message: "",
  receipts: {},
};

export const BlackBoxContext = createContext({
  status: idleStatus,
  modalVersion: 0,
  openLink: () => {},
  signInEmail: async () => false,
  signInGoogle: async () => false,
  disconnect: async () => {},
  recordCompletion: async () => false,
  importHistory: async () => ({ imported: 0, skipped: 0, pending: 0 }),
  retryPending: async () => false,
});

export function useBlackBox() {
  return useContext(BlackBoxContext);
}
