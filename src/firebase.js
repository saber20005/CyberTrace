import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC4ZcRoXRXA_jFRtR7ziy8pOOxZwyY7tY8",
  authDomain: "cybertrace-48ab0.firebaseapp.com",
  projectId: "cybertrace-48ab0",
  storageBucket: "cybertrace-48ab0.firebasestorage.app",
  messagingSenderId: "647399578008",
  appId: "1:647399578008:web:67d8a59aeb98b59c0cb3ed",
  measurementId: "G-B9KJQGYNY9",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);