const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('failed submission retries the same frozen payload and id without a duplicate',async()=>{
 let fail=true,value='first',idCount=0;const records=new Map();
 const root={crypto:{randomUUID:()=>String(++idCount)},authService:{isDemo:()=>false},learningAuth:{isLocked:()=>false,requireStudent:async()=>({uid:'u',classId:'2-1',studentNum:1})},learningSnapshot:{captureAbstraction:()=>({practice:{currentState:value}})},firebase:{firestore:{FieldValue:{serverTimestamp:()=>123}}},firebaseDb:{collection:()=>({doc:()=>({collection:()=>({doc:id=>({id})})})}),runTransaction:async fn=>{const writes=[];await fn({get:async ref=>({exists:records.has(ref.id)}),set:(ref,data)=>writes.push([ref.id,data])});if(fail)throw Error('network');writes.forEach(([id,data])=>records.set(id,data));}}};
 root.learningAuth.profileRef=()=>({collection:()=>({doc:id=>({id})})});
 const context=vm.createContext({window:root});vm.runInContext(fs.readFileSync(require.resolve('../js/core/learning-records.js'),'utf8'),context);
 await assert.rejects(root.learningRecords.submit());value='second';fail=false;
 await root.learningRecords.submit();assert.equal(records.size,1);assert.equal(records.get('1').practice.currentState,'first');assert.equal(root.learningRecords.pending,null);
 await root.learningRecords.submit();assert.equal(records.size,2);assert.equal(records.get('2').practice.currentState,'second');
});
