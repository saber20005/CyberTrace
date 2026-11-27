// Browser-test-only Firebase transport. Production imports never reference this file.
const apps=[];
const primary={name:'fixture-primary',currentUser:null,listeners:new Set()};
const secondary={name:'fixture-blackbox',currentUser:null,listeners:new Set()};
const reads=[];
const change=(auth,uid)=>{auth.currentUser=uid?{uid,email:uid+'@example.test'}:null;for(const next of auth.listeners)next(auth.currentUser);};
const fixture={primary,secondary,reads,writes:[],changePrimary:uid=>change(primary,uid),changeLinked:uid=>change(secondary,uid),emit(index,value,{fromCache=false,exists=true,pending=false}={}){const read=reads[index];read.next({metadata:{fromCache,hasPendingWrites:pending},exists:()=>exists,data:()=>value,docs:[]});},fail(index,code='unavailable'){reads[index].error({code});}};
window.__journeySDK=fixture;
export const auth=primary;
export const db={};
export const initializeApp=(options,name)=>{const app={options,name};apps.push(app);return app;};
export const getApps=()=>apps;
export const getAuth=()=>secondary;
export const browserLocalPersistence={};
export const setPersistence=async()=>{};
export function onAuthStateChanged(auth,next){auth.listeners.add(next);queueMicrotask(()=>{if(auth.listeners.has(next))next(auth.currentUser);});return()=>auth.listeners.delete(next);}
export const signInWithEmailAndPassword=async(auth,email)=>{change(auth,email.split('@')[0]);return{user:auth.currentUser};};
export const signInWithPopup=async auth=>{change(auth,'linked-A');return{user:auth.currentUser};};
export const signOut=async auth=>change(auth,null);
export const getIdToken=async()=>{throw Error('Token requests are not part of this read-only fixture');};
export class GoogleAuthProvider{setCustomParameters(){}}
export const getFirestore=()=>({});
export const doc=(_db,...path)=>({kind:'doc',path});
export const collection=(_db,...path)=>({kind:'collection',path});
export function onSnapshot(reference,_options,next,error){
 const read={...reference,next,error,stopped:false};reads.push(read);
 if(reference.kind==='collection')queueMicrotask(()=>{if(!read.stopped)next({docs:[],metadata:{fromCache:false,hasPendingWrites:false}});});
 return()=>{read.stopped=true;};
}
export const runTransaction=async()=>{fixture.writes.push('unexpected');throw Error('Shared journey must not write');};
export const serverTimestamp=()=>{throw Error('No writes allowed');};
