// Defaults to a local plan. Run --apply only after approval to activate this release.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const a=require('./firebase-admin.cjs');
const {PROJECT,CLASS_ID,SIGNER,ACCOUNTS,customToken}=require('../server/guest-token.cjs');
function validateSigner(key){
  // Validate both the intended identity and usable key material without exchanging a token.
  customToken('student',key);
}
async function provision(){
  if(!process.argv.includes('--apply')){
    console.log(JSON.stringify({applied:false,project:PROJECT,classId:CLASS_ID,accounts:Object.keys(ACCOUNTS),note:'No network calls. Activation requires scoped rules first; --apply creates guest-only accounts/documents and a dedicated signer.'}));return;
  }
  const directory=path.join(__dirname,'../scratch/private-access/guest');
  const keyFile=path.join(directory,'service-account.json');
  // A broken existing key must stop setup before any remote account or document is created.
  if(fs.existsSync(keyFile))validateSigner(JSON.parse(fs.readFileSync(keyFile,'utf8')));
  const token=await a.adminToken();
  const call=(url,opts={})=>a.request(url,{...opts,token});
  // Never enable a public teacher while the old unrestricted teacher rules are active.
  const release=await call(`https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases/cloud.firestore`);
  const ruleSet=await call('https://firebaserules.googleapis.com/v1/'+release.rulesetName);
  const active=ruleSet.source?.files?.find(file=>file.name==='firestore.rules')?.content;
  const local=fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8');
  if(typeof active!=='string'||active.replace(/\r\n/g,'\n')!==local.replace(/\r\n/g,'\n'))throw Error('Deploy and verify this branch scoped Firestore rules before provisioning guests.');
  const lookup=await call(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:lookup`,{method:'POST',body:{localId:Object.values(ACCOUNTS).map(account=>account.uid),email:Object.values(ACCOUNTS).map(account=>account.email)}});
  const users=lookup.users||[];
  for(const account of Object.values(ACCOUNTS)){
    const existing=users.find(user=>user.localId===account.uid||user.email===account.email);
    if(existing){if(existing.localId!==account.uid||existing.email!==account.email||existing.disabled)throw Error('Guest identity conflict; existing account preserved.');continue;}
    await call('https://identitytoolkit.googleapis.com/v1/accounts:signUp',{method:'POST',body:{targetProjectId:PROJECT,localId:account.uid,email:account.email,displayName:account.name}});
  }
  const docs={
    [`learning_classes/${CLASS_ID}`]:{classId:CLASS_ID,label:'발표용 학급',studentCount:1},
    [`learning_classes/${CLASS_ID}/students/01`]:{uid:ACCOUNTS.student.uid,classId:CLASS_ID,studentNum:1,name:ACCOUNTS.student.name,enabled:true},
    [`teachers/${ACCOUNTS.teacher.uid}`]:{enabled:true,guest:true,classIds:[CLASS_ID]},
    [`classrooms/${CLASS_ID}`]:{classId:CLASS_ID,schemaVersion:2,questionVersion:3,status:'waiting',durationMinutes:30,maxStudents:28,attemptId:crypto.randomUUID(),preparedAt:new Date().toISOString()}
  };
  const writes=[];
  for(const [relative,expected] of Object.entries(docs)){
    try{
      const doc=await call(a.root+'/'+relative),data=Object.fromEntries(Object.entries(doc.fields||{}).map(([key,value])=>[key,a.decode(value)]));
      if(relative.startsWith('teachers/')&&(data.enabled!==true||data.guest!==true||JSON.stringify(data.classIds)!==JSON.stringify([CLASS_ID])))throw Error('Guest role conflict; no existing document modified.');
      if(relative.endsWith('/students/01')&&(data.uid!==ACCOUNTS.student.uid||data.classId!==CLASS_ID||data.studentNum!==1||data.enabled!==true))throw Error('Guest roster conflict; no existing document modified.');
      // Existing submissions and active assessment rounds are always preserved.
    }catch(error){if(!/^404\b/.test(error.message))throw error;writes.push({update:{name:a.name(relative),fields:a.fields(expected)},currentDocument:{exists:false}});}
  }
  if(writes.length)await call(a.root+':commit',{method:'POST',body:{writes}});
  if(fs.existsSync(keyFile)){
    validateSigner(JSON.parse(fs.readFileSync(keyFile,'utf8')));
  }else{
    const base=`https://iam.googleapis.com/v1/projects/${PROJECT}/serviceAccounts`;
    try{await call(base+'/'+SIGNER);}catch(error){if(!/^404\b/.test(error.message))throw error;await call(base,{method:'POST',body:{accountId:'hackathon-guest-login',serviceAccount:{displayName:'Hackathon guest login signer'}}});}
    // No project IAM roles are granted. This dedicated key signs the two fixed custom-token identities.
    const key=await call(base+'/'+SIGNER+'/keys',{method:'POST',body:{privateKeyType:'TYPE_GOOGLE_CREDENTIALS_FILE'}});
    const privateKeyData=Buffer.from(key.privateKeyData,'base64');
    validateSigner(JSON.parse(privateKeyData.toString('utf8')));
    fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(keyFile,privateKeyData,{flag:'wx',mode:0o600});
  }
  console.log(JSON.stringify({applied:true,project:PROJECT,classId:CLASS_ID,newDocuments:writes.length,signerFile:'scratch/private-access/guest/service-account.json',vercelConfigured:false}));
}
if(require.main===module)provision().catch(()=>{console.error('Guest setup stopped. Existing real accounts remain unchanged. Inspect setup stages without logging credentials.');process.exitCode=1;});
module.exports={provision};
