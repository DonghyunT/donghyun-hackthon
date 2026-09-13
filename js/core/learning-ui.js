(function(root){
  const $=id=>document.getElementById(id);
  const classes=()=>Array.from({length:11},(_,i)=>`<option value="2-${i+1}">2학년 ${i+1}반</option>`).join('');
  const ui={
    intent:null,generation:0,teacherGeneration:0,
    status(text){$('learning-status').textContent=text;if(text)$('learning-status').scrollIntoView({block:'nearest',behavior:'smooth'});},
    openLogin(message='',intent=null){
      if(isAssessmentLocked())return;
      this.intent=intent;switchUnit('records');this.status(message);
    },
    openTeacherLogin(){
      if(root.learningAuth.isLocked())return;
      let dialog=$('teacher-login-dialog');
      if(!dialog){
        dialog=document.createElement('dialog');dialog.id='teacher-login-dialog';dialog.className='learning-login-dialog';
        dialog.innerHTML='<form class="learning-form" id="teacher-emergency-form"><h2>교사 비상 로그인</h2><p class="learning-muted">Google 로그인이 어려울 때 교사 전용 비밀번호로 입장합니다.</p><label>비상계정 비밀번호<input id="teacher-emergency-password" type="password" autocomplete="off" required></label><p id="teacher-login-status" role="status"></p><div class="learning-actions"><button type="submit" class="learning-primary">교사로 입장</button><button type="button" id="teacher-login-cancel" class="learning-secondary">닫기</button></div></form>';
        document.body.append(dialog);$('teacher-login-cancel').onclick=()=>dialog.close();dialog.onclose=()=>{$('teacher-emergency-password').value='';};
        $('teacher-emergency-form').onsubmit=async event=>{
          event.preventDefault();const button=event.currentTarget.querySelector('button');button.disabled=true;
          try{await root.learningAuth.signInTeacher($('teacher-emergency-password').value);dialog.close();await promptTeacherPin();}
          catch(error){$('teacher-login-status').textContent=error.message;}
          finally{$('teacher-emergency-password').value='';button.disabled=false;}
        };
      }
      $('teacher-login-status').textContent='';dialog.showModal();
    },
    async refreshIdentity(){
      try{
        const profile=await root.learningAuth.getCurrentStudent();
        $('student-login-button').textContent=profile?`${profile.classId} · ${profile.studentNum}번`:'학생 로그인';
        if(profile){
          $('eval-st-class').value=profile.classId;$('eval-st-num').value=profile.studentNum;$('eval-st-name').value=profile.name;
        }
        if(!root.authService.isDemo())for(const id of ['eval-st-class','eval-st-num','eval-st-name'])$(id).disabled=true;
        return profile;
      }catch(error){this.status(root.learningAuth.message?.(error)||error.message);return null;}
    },
    async renderRecords(){
      const generation=++this.generation,content=$('learning-records-content');
      content.replaceChildren();const loading=document.createElement('p');loading.textContent='로그인과 기록을 확인하고 있어요…';content.append(loading);
      try{
        const profile=await root.learningAuth.getCurrentStudent();if(generation!==this.generation)return;
        content.replaceChildren();
        if(!profile){
          content.innerHTML=`<form id="student-login-form" class="learning-form"><p>선생님께 받은 개인 입장코드로 들어오세요. 다른 PC에서도 내 기록을 볼 수 있어요.</p><div class="learning-fields"><label>학급<select id="learning-class" name="classId">${classes()}</select></label><label>번호<input id="learning-num" name="studentNum" type="number" min="1" max="28" value="1" required></label></div><label>개인 입장코드<input id="learning-code" name="entryCode" type="password" autocomplete="off" required spellcheck="false"></label><button class="learning-primary" type="submit">학생으로 입장</button><p class="learning-muted">코드를 잊었다면 선생님께 알려 주세요. 공용 PC에서는 끝난 뒤 사용 종료를 눌러 주세요.</p></form>`;
          $('student-login-form').addEventListener('submit',event=>{event.preventDefault();this.login(event.currentTarget);});return;
        }
        const title=document.createElement('p');title.textContent=`${profile.classId} · ${profile.studentNum}번 ${profile.name}의 제출 기록`;content.append(title);
        const action=document.createElement('button');action.className='learning-primary';action.textContent=root.learningRecords.pending?'이전 제출 다시 시도':'문제 추상화 퀴즈·실습 제출';action.onclick=()=>this.submit();content.append(action);
        const hint=document.createElement('p');hint.className='learning-muted';hint.textContent='틀린 답이나 작성 중인 내용도 제출할 수 있어요. 제출 시점마다 기록을 남겨요.';content.append(hint);
        const records=await root.learningRecords.list(profile);if(generation!==this.generation)return;
        if(!records.length){const empty=document.createElement('p');empty.textContent='아직 제출한 기록이 없어요. 수업 활동 후 첫 기록을 남겨 보세요.';content.append(empty);}
        records.forEach(record=>content.append(this.recordCard(record)));
      }catch(error){if(generation!==this.generation)return;content.replaceChildren();const p=document.createElement('p');p.textContent=error.message;content.append(p);const retry=document.createElement('button');retry.textContent='다시 확인';retry.className='learning-secondary';retry.onclick=()=>this.renderRecords();content.append(retry);}
    },
    async login(form){
      const button=form.querySelector('button');button.disabled=true;button.textContent='입장 확인 중…';
      try{
        await root.learningAuth.signIn({classId:$('learning-class').value,studentNum:$('learning-num').value,entryCode:$('learning-code').value});
        $('learning-code').value='';await this.refreshIdentity();this.status('학생 로그인이 완료됐어요.');
        const intent=this.intent;this.intent=null;
        if(intent==='eval'){switchUnit('eval');return;}
        if(intent==='submit')await this.submit();
        await this.renderRecords();
      }catch(error){this.status(error.message);}
      finally{if($('learning-code'))$('learning-code').value='';button.disabled=false;button.textContent='학생으로 입장';}
    },
    async submit(){
      if(root.learningRecords.busy)return;
      try{
        const profile=await root.learningAuth.getCurrentStudent();
        if(!profile){this.openLogin('제출하려면 먼저 학생으로 입장해 주세요.','submit');return;}
        this.status('제출 중… 창을 닫지 마세요.');
        await root.learningRecords.submit();this.status('수업에 제출했어요. 나의 기록에서 확인할 수 있어요.');
        if(currentActiveUnit==='records')await this.renderRecords();
      }catch(error){this.status('제출하지 못했어요. '+error.message+' 제출 버튼을 눌러 다시 시도할 수 있어요.');}
    },
    recordCard(record){
      const details=document.createElement('details');details.className='learning-record';
      const summary=document.createElement('summary'), date=record.submittedAt?.toDate?.();
      const answers=record.quiz?.answers||[],answered=answers.filter(a=>a.choiceIndex!==null).length;
      const correct=record.contentVersion==='abstraction-v1'?answers.filter(a=>UNIT_QUIZ_DATA.abstraction.questions.find(q=>q.id===a.questionId)?.options[a.choiceIndex]?.correct===true).length:null;
      summary.textContent=`문제 추상화 · ${date?date.toLocaleString('ko-KR'):'저장 시각 확인 중'} · 퀴즈 ${answered}/4 응답${correct===null?'':` · ${correct}개 정답`}`;details.append(summary);
      const p=record.practice||{};
      const body=document.createElement('pre');body.className='learning-original';body.textContent=[
        '퀴즈 답안',...answers.map(a=>`${a.questionId}번: ${a.choiceIndex===null?'미응답':String(a.choiceIndex+1)+'번째 보기'}`),
        '',`현재 상태: ${p.currentState||'(미작성)'}`,`목표 상태: ${p.goalState||'(미작성)'}`,
        `조건: ${(p.conditions||[]).join(' / ')||'(미작성)'}`,`작성 중인 조건: ${p.conditionDraft||'(없음)'}`,
        `남긴 정보: ${(p.keptInformation||[]).join(' / ')||'(없음)'}`,`버린 정보: ${(p.discardedInformation||[]).join(' / ')||'(없음)'}`
      ].join('\n');details.append(body);return details;
    },
    async renderTeacher(){
      const generation=++this.teacherGeneration,container=$('classroom-table-container'),classId=getClassIdFromSelected();
      container.innerHTML=`<div class="learning-teacher"><h3>학생 입장코드 발급</h3><p class="learning-muted">학생별로 한 번 발급합니다. 코드는 발급 직후에만 보여요. 학생에게 따로 전달해 주세요.</p><form id="student-provision-form" class="learning-form"><div class="learning-fields"><label>번호<input name="studentNum" type="number" min="1" max="28" required></label><label>이름 (선택)<input name="name" maxlength="40" autocomplete="off"></label></div><button class="learning-primary" type="submit">개인 입장코드 발급</button><button id="provision-retry" class="learning-secondary" type="button" hidden>명부 저장 재시도</button></form><p id="provision-result" role="status" class="learning-code-result"></p><h3>학생별 학습 기록</h3><p id="teacher-record-status" role="status">불러오는 중…</p><div id="teacher-learning-list"></div></div>`;
      $('provision-retry').hidden=!root.learningAuth.pendingProvision;
      $('student-provision-form').onsubmit=event=>{event.preventDefault();const data=new FormData(event.currentTarget);this.provision({classId,studentNum:data.get('studentNum'),name:data.get('name')});};
      $('provision-retry').onclick=()=>this.provision(null);
      try{
        await root.authService.teacher();
        if(root.authService.isDemo()){$('teacher-record-status').textContent='로컬 시연입니다. 계정 발급과 서버 기록은 운영 연결에서 확인하세요.';return;}
        const profiles=await root.firebaseDb.collection('learning_classes').doc(classId).collection('students').get({source:'server'});
        if(generation!==this.teacherGeneration)return;
        const docs=profiles.docs.sort((a,b)=>a.data().studentNum-b.data().studentNum);
        $('teacher-record-status').textContent=`등록 학생 ${docs.length}명 · 학생을 열어 최근 제출 원본을 확인하세요.`;
        const list=$('teacher-learning-list');
        for(const doc of docs){
          const profile=doc.data(),details=document.createElement('details'),summary=document.createElement('summary');details.className='learning-record';
          summary.textContent=`${profile.studentNum}번 ${profile.name}${profile.enabled?'':' · 비활성'}`;details.append(summary);
          const body=document.createElement('div');details.append(body);let loaded=false,loading=false;
          details.ontoggle=async()=>{if(!details.open||loaded||loading)return;loading=true;body.textContent='기록 확인 중…';try{const records=await root.learningRecords.list(profile);body.replaceChildren();if(!records.length)body.textContent='제출 기록 없음';records.forEach(r=>body.append(this.recordCard(r)));loaded=true;}catch(error){body.textContent='불러오기 실패: '+error.message+' 접었다가 다시 열어 주세요.';}finally{loading=false;}};
          list.append(details);
        }
      }catch(error){if(generation===this.teacherGeneration)$('teacher-record-status').textContent=error.message;}
    },
    async provision(input){
      const button=$('student-provision-form').querySelector('button');button.disabled=true;
      const output=$('provision-result');output.textContent='발급 중…';
      try{
        const result=input?await root.learningAuth.provision(input):await root.learningAuth.retryProvision();
        output.textContent=`${result.classId} · ${result.studentNum}번 ${result.name} / 개인 입장코드: ${result.entryCode} — 지금 학생에게 전달해 주세요. 학급을 바꾸거나 창을 닫으면 이 코드는 다시 표시되지 않습니다.`;
        $('teacher-record-status').textContent='발급 완료. 학생 목록을 갱신하려면 학급을 다시 선택해 주세요.';
      }catch(error){output.textContent=error.message;}
      finally{button.disabled=false;if($('provision-retry'))$('provision-retry').hidden=!root.learningAuth.pendingProvision;}
    }
  };
  root.learningUI=ui;
  root.addEventListener('DOMContentLoaded',()=>{ui.refreshIdentity();});
})(window);
