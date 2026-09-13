(function(root){
  const names={abstraction:'문제 추상화',algorithm:'알고리즘 설계',flowchart:'순서도 연구소'};
  const stages={tutorial:'맛보기',workspace:'실전 워크북',sandwich:'샌드위치 로봇','step-1':'순차 구조','step-2':'선택 구조','step-3':'반복 구조','step-4':'예시 살펴보기','step-5':'나만의 순서도'};
  const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);if(cls)node.className=cls;return node;};
  const list=value=>Array.isArray(value)?value:[];
  function field(parent,title,value){const section=el('section',undefined,'record-field');section.append(el('h4',title),el('p',value||'아직 작성하지 않았어요.'));parent.append(section);}
  function graph(parent,blocks,connections){
    const rows=list(blocks).filter(b=>b&&Number.isFinite(b.x)&&Number.isFinite(b.y));if(!rows.length)return;
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('record-graph');svg.setAttribute('role','img');svg.setAttribute('aria-label','저장한 순서도 미리보기. 아래 블록과 연결 목록에서 전체 내용을 확인할 수 있습니다.');
    const x=Math.min(...rows.map(b=>b.x))-20,y=Math.min(...rows.map(b=>b.y))-20,w=Math.max(...rows.map(b=>b.x+180))-x+20,h=Math.max(...rows.map(b=>b.y+80))-y+20;
    svg.setAttribute('viewBox',`${x} ${y} ${Math.max(240,w)} ${Math.max(120,h)}`);
    const add=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))n.setAttribute(key,String(value));if(text!==undefined)n.textContent=text;svg.append(n);return n;};
    const byId=new Map(rows.map(b=>[b.id,b]));
    for(const c of list(connections)){const a=byId.get(c.from),b=byId.get(c.to);if(a&&b){add('line',{x1:a.x+90,y1:a.y+60,x2:b.x+90,y2:b.y,stroke:'#64748b','stroke-width':2});add('text',{x:(a.x+b.x)/2+95,y:(a.y+b.y)/2+24,'font-size':12,fill:'#475569'},c.fromPort==='yes'?'예':c.fromPort==='no'?'아니오':'↓');}}
    for(const b of rows){const fill={terminal:'#a855f7',io:'#16a34a',decision:'#f59e0b',process:'#3b82f6'}[b.shape]||'#64748b';let n;
      if(b.shape==='decision')n=add('polygon',{points:`${b.x+90},${b.y} ${b.x+180},${b.y+30} ${b.x+90},${b.y+60} ${b.x},${b.y+30}`,fill});
      else if(b.shape==='io')n=add('polygon',{points:`${b.x+20},${b.y} ${b.x+180},${b.y} ${b.x+160},${b.y+60} ${b.x},${b.y+60}`,fill});
      else n=add('rect',{x:b.x,y:b.y,width:180,height:60,rx:b.shape==='terminal'?30:3,fill});
      const title=document.createElementNS(ns,'title');title.textContent=String(b.text||'');n.append(title);add('text',{x:b.x+90,y:b.y+35,'text-anchor':'middle','font-size':13,fill:b.shape==='decision'?'#1e293b':'white'},String(b.text||'').slice(0,16));
    }parent.append(svg);
  }
  function card(record){
    const details=el('details',undefined,'learning-record record-card');details.dataset.unit=record.unitKey;
    const summary=el('summary'),head=el('span',undefined,'record-card-heading');
    const kind=record.schemaVersion===1?'퀴즈·실습':record.activityKind==='quiz'?'퀴즈':'실습';
    head.append(el('strong',`${names[record.unitKey]||'수업 기록'} · ${kind}`),el('span','저장 완료','record-saved'));
    const date=record.submittedAt?.toDate?.();summary.append(head,el('span',`${stages[record.practice?.stage]||''}${record.practice?.stage?' · ':''}${date?date.toLocaleString('ko-KR'):'저장 시각 확인 중'}`,'record-date'));details.append(summary);
    const body=el('div',undefined,'record-body');details.append(body);
    if(record.quiz){
      const answers=list(record.quiz.answers),questions=record.contentVersion===record.unitKey+'-v1'?UNIT_QUIZ_DATA[record.unitKey]?.questions:null;
      const answered=answers.filter(a=>a.choiceIndex!==null).length,correct=questions?answers.filter(a=>questions.find(q=>q.id===a.questionId)?.options[a.choiceIndex]?.correct).length:null;
      body.append(el('p',`${answered}/${answers.length}문항 응답${correct===null?'':` · 정답률 ${Math.round(correct/answers.length*100)}% (${correct}/${answers.length})`}`,'record-metrics'),el('p','정답률은 학습 참고용이에요. 틀린 답도 기록으로 남았어요.','learning-muted'));
      for(const a of answers){const q=questions?.find(q=>q.id===a.questionId);field(body,`${a.questionId}번${q?' · '+q.q:''}`,a.choiceIndex===null?'미응답':q?.options[a.choiceIndex]?.text||`${a.choiceIndex+1}번째 보기`);}
    }
    if(!record.practice)return details;
    let p;
    try{p=record.schemaVersion===1?record.practice:JSON.parse(record.practice.contentJson);if(!p||typeof p!=='object')throw Error();}
    catch{body.append(el('p','이 기록의 원본 형식을 읽지 못했어요. 선생님께 알려 주세요.'));return details;}
    if(record.unitKey==='abstraction'){
      field(body,'현재 상태',p.currentState);field(body,'목표 상태',p.goalState);field(body,'조건',list(p.conditions).join('\n'));if(p.conditionDraft)field(body,'작성 중인 조건',p.conditionDraft);
      if(p.keptInformation)field(body,'남긴 정보',list(p.keptInformation).join(' · '));field(body,'덜어낸 정보',list(p.discardedInformation).join(' · '));
    }else if(record.unitKey==='algorithm'){
      body.append(el('p',`입력한 명령 ${list(p.commands).length}개 · ${p.robotState?.completed?'로봇 완성 상태':'실행 중간 상태'}`,'record-metrics'));
      field(body,'저장 당시 로봇 상태',p.executionLabel);
      list(p.commands).forEach((command,i)=>{field(body,`${i+1}. 내가 입력한 명령`,command.text);field(body,'로봇의 해석',list(command.interpretedActions).join(' → ')||command.status);});
      if(p.draft)field(body,'아직 보내지 않은 명령',p.draft);
      const raw=el('details',undefined,'record-raw');raw.append(el('summary','로봇 상태 자세히 보기'),el('pre',JSON.stringify(p.robotState,null,2),'learning-original'));body.append(raw);
    }else if(record.unitKey==='flowchart'){
      if(p.slots){field(body,'활동',p.mission);body.append(el('p',`선택한 칸 ${list(p.slots).filter(s=>!s.fixed&&s.selectedId).length}개`,'record-metrics'));list(p.slots).forEach(slot=>field(body,`${slot.id}${slot.fixed?' · 기본 기호':''}`,slot.text||'아직 선택하지 않았어요.'));}
      else if(record.practice.stage==='step-4'){field(body,'예시에서 펼쳐 본 단계',String(p.revealedSteps));field(body,'기록 안내',p.note);}
      else{
        body.append(el('p',`자연어 카드 ${list(p.cards).length}개 · 기호 ${list(p.blocks).length}개 · 연결 ${list(p.connections).length}개`,'record-metrics'));
        body.append(el('p','기호와 연결 수는 작품의 구성 정보이며 점수가 아닙니다.','learning-muted'));graph(body,p.blocks,p.connections);
        list(p.cards).forEach((c,i)=>field(body,`생각 정리 ${i+1}`,c.text||[c.condition,c.yesAction&&'맞으면: '+c.yesAction,c.noAction&&'아니면: '+c.noAction,c.loopAction&&'반복 동작: '+c.loopAction,c.action].filter(Boolean).join('\n')));
        const original=el('details',undefined,'record-raw');original.append(el('summary','기호·연결 원본 보기'));list(p.blocks).forEach(b=>field(original,String(b.id),b.text));list(p.connections).forEach(c=>field(original,`${c.from} → ${c.to}`,`${c.fromPort||'출구'} → ${c.toPort||'입구'}`));body.append(original);
      }
    }return details;
  }
  root.learningRecordView={card(record){try{return card(record);}catch{return el('p','이 기록의 원본을 읽지 못했어요. 선생님께 알려 주세요.','learning-record');}},names};
})(window);
