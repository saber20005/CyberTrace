// Repository-only guard. Never invokes Firebase, accepts credentials, or reads production data.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const LEGACY = "security/firestore.current.rules";
const REFERENCE = "security/firestore.cybertrace-progress.rules";
const LEGACY_CONFIG = "security/firebase.emulator.json";
const REFERENCE_CONFIG = "security/firebase.cybertrace-emulator.json";

const read = (root,path) => readFileSync(join(root,path),"utf8");
const exists = (root,path) => existsSync(join(root,path));

export function auditFirebaseRuleSources(root) {
  const errors = [];
  for(const [path,marker] of [
    [LEGACY,/LEGACY REFERENCE ONLY[\s\S]{0,100}DO NOT DEPLOY/i],
    [REFERENCE,/reference ruleset/i],
  ]) {
    if(!exists(root,path)) { errors.push("Missing explicit reference-only rules source: "+path); continue; }
    if(!marker.test(read(root,path))) errors.push("Rules source lost its explicit reference-only warning: "+path);
  }
  for(const [config,rulePath] of [[LEGACY_CONFIG,LEGACY],[REFERENCE_CONFIG,REFERENCE]]) {
    if(!exists(root,config)) { errors.push("Missing required emulator-only configuration: "+config); continue; }
    try {
      const parsed=JSON.parse(read(root,config));
      if(parsed.firestore?.rules!==rulePath) errors.push("Unexpected rules source in emulator configuration: "+config);
      if(parsed.emulators?.firestore?.host!=="127.0.0.1") errors.push("Emulator config must bind only to localhost: "+config);
      if(parsed.emulators?.ui?.enabled!==false) errors.push("Emulator UI must remain off: "+config);
    } catch { errors.push("Malformed emulator configuration: "+config); }
  }
  // A root Firebase configuration is deployable with the Firebase CLI.
  // CyberTrace has no reviewed production rules bundle checked into Git.
  // Don't introduce one accidentally based on either reference-only file.
  if(exists(root,"firebase.json")) {
    errors.push("Production firebase.json requires a separate reviewed, exported full production ruleset and release approval; references are never deployable.");
  }
  const workflowDir=join(root,".github","workflows");
  if(existsSync(workflowDir)) {
    for(const name of readdirSync(workflowDir).filter(n=>/\.ya?ml$/.test(n))) {
      const content=readFileSync(join(workflowDir,name),"utf8");
      // There must be no automatic Firebase publication until source-of-truth
      // and administrator approval are reviewed. Emulator tests are allowed.
      if(/\bfirebase(?:\s+--[a-z-]+(?:=\S+)?)?\s+deploy\b|\bfirebase\s+firestore:rules:release\b/i.test(content))
        errors.push("CI workflow may not deploy unverified Firebase rules: "+name);
    }
  }
  return errors;
}
