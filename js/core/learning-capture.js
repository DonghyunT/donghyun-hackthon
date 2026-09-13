/* Capture only the activity the student explicitly chooses to save. No AI chats or keystroke history. */
(function(root){
  const units=['abstraction','algorithm','flowchart'];
  function build({unitKey,kind,questions=[],answers={},stage='',content={}}){
    if(!units.includes(unitKey)||!['quiz','practice'].includes(kind))throw Error('저장할 단원과 활동을 확인해 주세요.');
    const snapshot={schemaVersion:2,unitKey,activityKind:kind,activityId:unitKey+'-'+kind,contentVersion:unitKey+'-v1',quiz:null,practice:null};
    if(kind==='quiz')snapshot.quiz={answers:questions.map(q=>{const idx=answers[q.id]?.choiceIdx;return {questionId:q.id,choiceIndex:Number.isInteger(idx)&&idx>=0&&idx<q.options.length?idx:null};})};
    else{
      const contentJson=JSON.stringify(content);
      if(contentJson.length>100000)throw Error('기록이 너무 커요. 작성 내용을 줄인 뒤 다시 저장해 주세요.');
      snapshot.practice={stage,contentJson};
    }
    return snapshot;
  }
  function capture(unitKey,kind){
    if(root.learningAuth.isLocked())throw Error('수행평가 중에는 수업 기록을 저장할 수 없어요.');
    const read=id=>document.getElementById(id)?.value||'';
    if(kind==='quiz')return build({unitKey,kind,questions:UNIT_QUIZ_DATA[unitKey]?.questions,answers:userQuizAnswers[unitKey]});
    let stage,content;
    if(unitKey==='abstraction'){
      stage=currentAbstractionSubTab==='tutorial'?'tutorial':'workspace';
      content=stage==='tutorial'?{currentState:read('tut-inp-current'),goalState:read('tut-inp-goal'),conditions:[read('tut-inp-condition')].filter(Boolean),keptInformation:tutPoolTags.filter(tag=>!tutTrashTags.includes(tag)),discardedInformation:[...tutTrashTags],scenario:currentTutScenario}:root.learningSnapshot.captureAbstraction().practice;
    }else if(unitKey==='algorithm'){
      stage='sandwich';content={commands:studentCommandAttempts.map(item=>({...item,interpretedActions:[...item.interpretedActions]})),draft:read('cmd-input'),robotState:{...state},executionLabel:document.getElementById('robot-sub')?.textContent||''};
    }else if(unitKey==='flowchart'){
      stage='step-'+currentFlowchartStep;
      if(currentFlowchartStep<=3){const m=missions[currentMissionIdx];content={mission:m.title,slots:m.slots.map(slot=>({id:slot.id,shape:slot.shape,fixed:!!slot.fixed,text:slot.fixed?slot.label:(m.palette.find(b=>b.id===placedBlocks[slot.id])?.text||''),selectedId:placedBlocks[slot.id]||null}))};}
      else if(currentFlowchartStep===4)content={revealedSteps:l2RevealedStep,note:'등교 알고리즘 예시에서 펼쳐 본 단계입니다. 직접 작성한 작품이나 성취 점수가 아닙니다.'};
      else content={cards:nlCards,blocks:freeBlocks,connections:freeConnections};
    }
    return build({unitKey,kind,stage,content});
  }
  if(root)root.learningCapture={build,capture};
  if(typeof module!=='undefined')module.exports={build};
})(typeof window==='undefined'?null:window);
