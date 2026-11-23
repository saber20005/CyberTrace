import {createServer} from "vite";
const virtualAuth="\0presentation-auth";
const mockAuth=`
const auth={currentUser:null};const listeners=new Set();const calls=[];
export const presentationCalls=()=>calls.slice();
export const presentationUser=user=>{auth.currentUser=user;for(const fn of listeners)fn(user);};
export const getAuth=()=>auth;
export function onAuthStateChanged(_auth,callback){listeners.add(callback);let active=true;queueMicrotask(()=>{if(active)callback(auth.currentUser);});return()=>{active=false;listeners.delete(callback);};}
export async function signOut(){presentationUser(null);}
const denied=async()=>{calls.push('authentication');throw Object.assign(new Error('Authentication disabled in local presentation fixture'),{code:'fixture/disabled'});};
export const createUserWithEmailAndPassword=denied,signInWithEmailAndPassword=denied,sendPasswordResetEmail=denied,updateProfile=denied,signInWithPopup=denied,getIdToken=denied;
export class GoogleAuthProvider{setCustomParameters(){}}
`;
export async function createPresentationServer(){return createServer({server:{host:"127.0.0.1",port:0,strictPort:false},logLevel:"silent",plugins:[{
 name:"local-presentation-boundary",enforce:"pre",
 transformIndexHtml:{order:"pre",handler(html){
  // Preserve real root/admin/reload URLs while keeping the test boundary on
  // every load. No production index, Vite config or Firebase file is changed.
  return html.replace(/<link\b(?=[^>]*\bhref=["']https?:\/\/)[^>]*>/g,"")
    .replace(/src=["']\/src\/main\.jsx["']/,'src="/tests/fixtures/page-presentation-entry.jsx"');
 }},
 transform(code,id){
  if(id.replaceAll("\\","/").endsWith("/src/App.css"))return code.replace(/@import\s+url\(["']https:\/\/fonts\.googleapis\.com[^;]+;\s*/g,"");
 },
 resolveId(id){if(id==="firebase/auth")return virtualAuth;},
 load(id){if(id===virtualAuth)return mockAuth;if(id.replaceAll("\\","/").endsWith("/src/blackbox/config.js"))return 'export const blackBoxConfig={enabled:false,firebase:{},providers:{email:false,google:false},emulators:null};';}
}]});}
