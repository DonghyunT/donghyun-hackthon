// Explicit administrator operation; resumable per-class journals never enter Git or deployment.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const a=require('./firebase-admin.cjs'),distribution=require('./account-distribution.cjs'),{generate}=require('../js/core/student-password.js');
(async()=>{
 if(process.argv[2]!=='--apply')throw Error('Requires --apply. Changes 308 student passwords in donghyun-hackthon only.');
 assert.equal(a.PROJECT,'donghyun-hackthon');
 const saved=distribution.read();assert.equal(saved.students.length,308);
 const token=await a.adminToken(),users=await a.request(`https://identitytoolkit.googleapis.com/v1/projects/${a.PROJECT}/accounts:batchGet?maxResults=1000`,{token});
 const byUid=new Map(users.users.map(u=>[u.localId,u]));
 for(const s of saved.students){assert.equal(byUid.get(s.uid)?.email,s.email);assert.equal(s.email,`s-${s.classId}-${s.studentNum}@students.donghyun-hackthon.invalid`);}
 const journal=path.resolve('scratch/password-rotation-6char');fs.mkdirSync(journal,{recursive:true});
 const used=new Set(),batches=[];
 for(let c=1;c<=11;c++){
   const file=path.join(journal,`2-${c}.json`),entries=saved.students.filter(s=>s.classId===`2-${c}`);assert.equal(entries.length,28);
   let rows;
   if(fs.existsSync(file))rows=JSON.parse(fs.readFileSync(file,'utf8'));
   else rows=entries.map(s=>{let password;do{password=generate();}while(used.has(password));used.add(password);return {uid:s.uid,password,applied:false};});
   for(const row of rows){assert.ok(entries.some(s=>s.uid===row.uid));assert.match(row.password,/^[a-z0-9]{6}$/);used.add(row.password);}
   fs.writeFileSync(file,JSON.stringify(rows,null,2));batches.push({file,rows});
 }
 assert.equal(new Set(batches.flatMap(b=>b.rows.map(r=>r.password))).size,308);
 let count=0;
 for(const batch of batches){
   for(let i=0;i<batch.rows.length;i+=4){
     await Promise.all(batch.rows.slice(i,i+4).map(async row=>{
       if(!row.applied){
         const result=await a.request(`https://identitytoolkit.googleapis.com/v1/projects/${a.PROJECT}/accounts:update`,{method:'POST',token,body:{localId:row.uid,password:row.password}});
         assert.equal(result.localId,row.uid);row.applied=true;fs.writeFileSync(batch.file,JSON.stringify(batch.rows,null,2));
       }
       saved.students.find(s=>s.uid===row.uid).password=row.password;count++;
     }));
     distribution.save(saved);
   }
   distribution.publish(saved);console.log(`${path.basename(batch.file,'.json')}: 28 student passwords updated`);
 }
 console.log(JSON.stringify({project:a.PROJECT,students:count,length:6,alphabet:'lowercase + digits',unique:used.size,teacherPasswordUnchanged:true}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
