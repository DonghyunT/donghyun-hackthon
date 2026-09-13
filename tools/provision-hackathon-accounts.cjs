/* Administrator-only one-off provisioning. Passwords are written only to ignored, non-deployed scratch/private-access. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const a=require('./firebase-admin.cjs');
const distribution=require('./account-distribution.cjs');
async function main(){
 if(process.argv[2]!=='--apply')throw Error('Requires explicit --apply. Target: donghyun-hackthon; 11 classes × 28 students and one emergency teacher.');
 if(a.PROJECT!=='donghyun-hackthon')throw Error('Unexpected Firebase project.');
 const folder=distribution.folder,saved=distribution.read();
 const checkpoint=()=>distribution.save(saved);
 const token=await a.adminToken();
 const users=await a.request('https://identitytoolkit.googleapis.com/v1/projects/'+a.PROJECT+'/accounts:batchGet?maxResults=1000',{token});
 const byEmail=new Map((users.users||[]).map(u=>[u.email,u]));
 const password=()=>require('../js/core/student-password.js').generate();
 const create=async entry=>{
   let user=byEmail.get(entry.email);
   if(!user){
     if(!entry.password){entry.password=password();checkpoint();}
     user=await a.request('https://identitytoolkit.googleapis.com/v1/accounts:signUp',{method:'POST',token,body:{targetProjectId:a.PROJECT,email:entry.email,password:entry.password,displayName:entry.name}});
     byEmail.set(entry.email,user);
   }
   entry.uid=user.localId;if(!entry.uid)throw Error('Account UID missing.');checkpoint();
   return entry;
 };
 for(let c=1;c<=11;c++){
   const classPath='learning_classes/2-'+c;
   const roster=await a.request(a.root+'/'+classPath+'/students?pageSize=1000',{token});
   const existingRoster=new Set((roster.documents||[]).map(d=>d.fields.uid.stringValue));
   const pending=[];
   for(let n=1;n<=28;n++){
     const email=`s-2-${c}-${n}@students.donghyun-hackthon.invalid`;
     let entry=saved.students.find(s=>s.email===email);
     if(!entry){entry={classId:`2-${c}`,studentNum:n,name:`${n}번 학생`,email};saved.students.push(entry);}
     pending.push(entry);
   }
   for(let start=0;start<pending.length;start+=7)await Promise.all(pending.slice(start,start+7).map(create));
   const writes=pending.filter(e=>!existingRoster.has(e.uid)).map(e=>({update:{name:a.name(classPath+'/students/'+String(e.studentNum).padStart(2,'0')),fields:a.fields({uid:e.uid,classId:e.classId,studentNum:e.studentNum,name:e.name,enabled:true})},currentDocument:{exists:false}}));
   const parent=await a.request(a.root+'/'+classPath,{token}).catch(e=>{if(e.message.startsWith('404'))return null;throw e});
   if(!parent)writes.push({update:{name:a.name(classPath),fields:a.fields({classId:'2-'+c,label:`2학년 ${c}반`,studentCount:28})},currentDocument:{exists:false}});
   if(writes.length)await a.request(a.root+':commit',{method:'POST',token,body:{writes}});
   console.log(`Class 2-${c}: 28 accounts ready`);
 }
 if(!saved.teacher)saved.teacher={email:'teacher@teachers.donghyun-hackthon.invalid',name:'교사 비상계정',password:crypto.randomBytes(18).toString('base64url')};
 await create(saved.teacher);
 await a.request(a.root+'/teachers/'+saved.teacher.uid+'?updateMask.fieldPaths=enabled',{method:'PATCH',token,body:{fields:a.fields({enabled:true})}});
 checkpoint();
 distribution.publish(saved);
 console.log(JSON.stringify({project:a.PROJECT,students:saved.students.length,teacherEmergencyReady:true,privateFiles:folder}));
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
