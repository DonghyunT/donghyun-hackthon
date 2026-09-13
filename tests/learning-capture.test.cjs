const test=require('node:test'),assert=require('node:assert/strict');
const {build}=require('../js/core/learning-capture.js');
test('all units retain their own quiz version and incomplete answers',()=>{
 const questions=[1,2,3,4].map(id=>({id,options:[{},{},{},{}]}));
 for(const unitKey of ['abstraction','algorithm','flowchart']){
   const snapshot=build({unitKey,kind:'quiz',questions,answers:{1:{choiceIdx:2},2:{choiceIdx:8}}});
   assert.equal(snapshot.activityId,unitKey+'-quiz');assert.equal(snapshot.contentVersion,unitKey+'-v1');assert.equal(snapshot.practice,null);
   assert.deepEqual(snapshot.quiz.answers.map(a=>a.choiceIndex),[2,null,null,null]);
 }
});
test('practice snapshots freeze raw graph and partial commands without promoting them to scores',()=>{
 const content={blocks:[{id:'a',text:'<img src=x onerror=alert(1)>',x:3,y:4}],connections:[],cards:[]};
 const snapshot=build({unitKey:'flowchart',kind:'practice',stage:'step-5',content});
 content.blocks[0].text='changed';assert.match(JSON.parse(snapshot.practice.contentJson).blocks[0].text,/<img/);assert.equal(snapshot.quiz,null);assert.equal(snapshot.scores,undefined);
 assert.doesNotThrow(()=>build({unitKey:'algorithm',kind:'practice',stage:'sandwich',content:{commands:[],draft:''}}));
 assert.throws(()=>build({unitKey:'flowchart',kind:'practice',content:{text:'x'.repeat(100001)}}),/너무 커/);
 assert.throws(()=>build({unitKey:'unknown',kind:'quiz'}));
});
