const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {identity,matches,message}=require('../js/core/learning-auth.js');
function setup(){
 const state={locked:false,profile:{uid:'student',classId:'2-1',studentNum:1,name:'검사 학생',enabled:true},failLogin:false,failProfile:false,calls:[]};
 const auth={currentUser:null,async signInWithEmailAndPassword(email,code){state.calls.push('signIn');if(state.failLogin)throw {code:'auth/invalid-credential'};this.currentUser={uid:'student',email,isAnonymous:false};},async signOut(){state.calls.push('signOut');this.currentUser=null;}};
 const doc={collection:()=>({doc:()=>doc}),get:async options=>{assert.equal(options.source,'server');if(state.failProfile)throw {code:'unavailable'};return {exists:!!state.profile,data:()=>state.profile};}};
 const root={authService:{isDemo:()=>false,ready:async()=>auth},firebaseDb:{collection:()=>({doc:()=>doc})}};
 const context={window:root,console,isAssessmentLocked:()=>state.locked};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../js/core/learning-auth.js'),'utf8'),context);
 return {service:root.learningAuth,auth,state};
}
test('student login identity rejects invalid class and number',()=>{
 assert.equal(identity('2-1','1').email,'s-2-1-1@students.donghyun-hackthon.invalid');
 assert.equal(identity('2-11',28).studentNum,28);
 for(const num of ['',0,29,'1.2','1e0',' 1'])assert.throws(()=>identity('2-1',num));
 assert.throws(()=>identity('3-1',1));assert.equal(matches({email:'other'}, {classId:'2-1',studentNum:1,enabled:true}),false);
});
test('student login verifies roster and rejects wrong code without disclosure',async()=>{
 const {service,auth,state}=setup();const input={classId:'2-1',studentNum:1,entryCode:'secret'};
 state.failLogin=true;await assert.rejects(service.signIn(input),/비밀번호/);assert.equal(auth.currentUser,null);
 state.failLogin=false;const profile=await service.signIn(input);assert.equal(profile.uid,'student');
 await assert.rejects(service.signIn(input),/사용 종료/);assert.equal(auth.currentUser.uid,'student');
 assert.equal(message({code:'auth/user-not-found'}),message({code:'auth/wrong-password'}));
});
test('disabled, missing, mismatching or unavailable roster never yields a session',async()=>{
 for(const profile of [null,{classId:'2-1',studentNum:1,enabled:false},{classId:'2-2',studentNum:1,enabled:true}]){
  const {service,auth,state}=setup();state.profile=profile;
  await assert.rejects(service.signIn({classId:'2-1',studentNum:1,entryCode:'secret'}));assert.equal(auth.currentUser,null);assert.equal(service.busy,false);
 }
 const {service,auth,state}=setup();state.failProfile=true;await assert.rejects(service.signIn({classId:'2-1',studentNum:1,entryCode:'secret'}));assert.equal(auth.currentUser,null);
});
test('assessment lock and duplicate request do not change authentication',async()=>{
 const {service,state}=setup();state.locked=true;
 await assert.rejects(service.signIn({classId:'2-1',studentNum:1,entryCode:'secret'}),/평가/);assert.deepEqual(state.calls,[]);
 state.locked=false;service.busy=true;await assert.rejects(service.signIn({classId:'2-1',studentNum:1,entryCode:'secret'}),/기다려/);assert.deepEqual(state.calls,[]);
});
