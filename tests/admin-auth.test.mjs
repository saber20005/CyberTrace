import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import { getAdminAuth, verifyAdminIdentity } from "../api/_lib/adminAuth.mjs";

const provider = (claims, record) => async () => ({
  verifyIdToken: async (_token, checkRevoked) => {
    assert.equal(checkRevoked, true, "never skip revoked-session checks");
    if (claims instanceof Error) throw claims;
    return claims;
  },
  getUser: async uid => record ?? { uid, disabled: false, customClaims: { admin: true } },
});

test("malformed tokens fail before creating a privileged SDK connection",async()=>{
  const noProvider=async()=>{ throw new Error("must not be used"); };
  for(const token of ["",null,"Bearer abc","a b","a".repeat(8193)]){
    await assert.rejects(verifyAdminIdentity(token,{authProvider:noProvider}));
  }
});

test("missing, malformed or wrong-project service credentials fail closed before loading the SDK",async()=>{
  const old=process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  try{
    delete process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
    await assert.rejects(getAdminAuth(),/not configured/);
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON="{invalid";
    await assert.rejects(getAdminAuth(),/Invalid Firebase Admin/);
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON=JSON.stringify({project_id:"wrong-project",client_email:"x@example.test",private_key:"-----BEGIN PRIVATE KEY-----"});
    await assert.rejects(getAdminAuth(),/Invalid Firebase Admin/);
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON=JSON.stringify({project_id:"cybertrace-48ab0",client_email:"",private_key:"-----BEGIN PRIVATE KEY-----"});
    await assert.rejects(getAdminAuth(),/Invalid Firebase Admin/);
  }finally{
    if(old===undefined)delete process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
    else process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON=old;
  }
});

test("allows an active admin only after current signed claims and current Firebase user state",async()=>{
  assert.deepEqual(await verifyAdminIdentity("signed",{
    authProvider:provider({uid:"u1",admin:true}),
  }),{uid:"u1",admin:true});
});

test("rejects non-admin, disabled, removed admin role and mismatched user records",async()=>{
  for(const [claims,record] of [
    [{uid:"u1",admin:false},undefined],
    [{uid:"u1",admin:true},{uid:"u1",disabled:true,customClaims:{admin:true}}],
    [{uid:"u1",admin:true},{uid:"u1",disabled:false,customClaims:{}}],
    [{uid:"u1",admin:true},{uid:"other-user",disabled:false,customClaims:{admin:true}}],
  ]){
    assert.equal((await verifyAdminIdentity("signed",{authProvider:provider(claims,record)})).admin,false);
  }
});

test("rejects revoked, expired, invalid, missing-UID and unreachable-provider states",async()=>{
  for(const claims of [
    new Error("auth/id-token-revoked"),
    new Error("auth/id-token-expired"),
    new Error("auth/user-disabled"),
    {uid:"",admin:true},
    {admin:true},
  ]){
    await assert.rejects(verifyAdminIdentity("signed",{authProvider:provider(claims)}));
  }
  await assert.rejects(verifyAdminIdentity("signed",{authProvider:async()=>{throw new Error("server unavailable");}}));
  await assert.rejects(verifyAdminIdentity("signed",{authProvider:async()=>({
    verifyIdToken:async()=>({uid:"u1",admin:true}),
    getUser:async()=>{throw new Error("Firebase unavailable");},
  })}));
});
