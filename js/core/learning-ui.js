(function(root){
  const $=id=>document.getElementById(id);
  const classes=()=>Array.from({length:11},(_,i)=>`<option value="2-${i+1}">2학년 ${i+1}반</option>`).join('');
  const ui={
    intent:null,generation:0,teacherGeneration:0,
    status(text,persistent=false){clearTimeout(this.statusTimer);$('learning-status').textContent=text;if(text&&!persistent)this.statusTimer=setTimeout(()=>{$('learning-status').textContent='';},4500);},
    openLogin(message='',intent=null){
      if(isAssessmentLocked())return;
      this.intent=intent;closeMegaMenu();
      let dialog=$('login-dialog');
      if(!dialog){
        dialog=document.createElement('dialog');dialog.id='login-dialog';dialog.className='learning-login-dialog';dialog.setAttribute('aria-labelledby','login-title');
        dialog.innerHTML=`<div class="login-heading"><h2 id="login-title">정보 놀이터 로그인</h2><button type="button" class="learning-secondary" id="login-close" aria-label="로그인 창 닫기">닫기</button></div><div class="login-tabs"><button type="button" id="login-tab-student" aria-pressed="true">학생</button><button type="button" id="login-tab-teacher" aria-pressed="false">교사</button></div><div id="login-student-panel"><form id="student-login-form" class="learning-form"><div class="learning-fields"><label>학급<select id="learning-class" name="classId">${classes()}</select></label><label>번호<input id="learning-num" name="studentNum" type="number" min="1" max="28" value="1" required></label></div><label>비밀번호<input id="learning-code" name="entryCode" type="password" autocomplete="off" required spellcheck="false" autocapitalize="none" maxlength="128" aria-describedby="student-password-help"></label><p id="student-password-help" class="learning-muted">선생님께 받은 소문자·숫자 6자리 비밀번호를 입력해 주세요.</p><button class="learning-primary" type="submit">학생으로 입장</button><p class="learning-muted">비밀번호를 잊었다면 선생님께 알려 주세요.</p></form></div><div id="login-teacher-panel" hidden><p class="learning-muted">교사로 등록된 계정으로 입장해 주세요.</p><div class="learning-actions"><button type="button" id="login-google" class="learning-primary">Google로 교사 로그인</button><button type="button" id="login-emergency" class="learning-secondary">교사 비상 로그인</button></div></div><p id="login-status" role="status"></p>`;
        document.body.append(dialog);
        $('login-close').onclick=()=>dialog.close();
        dialog.onclose=()=>{$('learning-code').value='';};
        $('student-login-form').onsubmit=event=>{event.preventDefault();this.login(event.currentTarget);};
        for(const role of ['student','teacher'])$('login-tab-'+role).onclick=()=>{for(const other of ['student','teacher']){$('login-'+other+'-panel').hidden=other!==role;$('login-tab-'+other).setAttribute('aria-pressed',String(other===role));}$('login-status').textContent='';};
        $('login-emergency').onclick=()=>{dialog.close();this.openTeacherLogin();};
        $('login-google').onclick=async()=>{
          const button=$('login-google');button.disabled=true;$('login-status').textContent='교사 계정을 확인하고 있습니다…';
          try{await root.authService.teacher();dialog.close();await root.classroomPortal.open();}
          catch(error){$('login-status').textContent=error.message;await root.classroomPortal.refreshHeader().catch(()=>{});}
          finally{button.disabled=false;}
        };
      }
      $('login-status').textContent=message;$('login-tab-student').click();$('login-status').textContent=message;
      if(!dialog.open)dialog.showModal();
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
          try{await root.learningAuth.signInTeacher($('teacher-emergency-password').value);dialog.close();await root.classroomPortal.open();}
          catch(error){$('teacher-login-status').textContent=error.message;}
          finally{$('teacher-emergency-password').value='';button.disabled=false;}
        };
      }
      $('teacher-login-status').textContent='';dialog.showModal();
    },
    async refreshIdentity(){
      try{
        const profile=await root.learningAuth.getCurrentStudent();
        await root.classroomPortal?.refreshHeader();
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
          content.innerHTML='<p>학생으로 로그인하면 내 기록을 볼 수 있어요.</p><button class="learning-primary" onclick="learningUI.openLogin()">로그인</button>';return;
        }
        content.innerHTML='<div class="records-intro"><p id="records-owner"></p><p class="learning-muted">각 단원의 퀴즈·실습에서 ‘내 기록에 저장’을 눌러 남긴 내용이에요.</p></div><div id="record-unit-filters" class="record-filters" aria-label="단원 필터"></div><div id="record-retry-area"></div><p class="learning-muted">최근 30개 기록 · 활동할 때마다 새로운 기록으로 남아요.</p><div id="record-list"></div>';
        $('records-owner').textContent='2학년 '+profile.classId.split('-')[1]+'반 '+profile.studentNum+'번';
        if(root.learningRecords.pending){const retry=document.createElement('button');retry.className='learning-secondary';retry.textContent='이전 저장 다시 시도';retry.onclick=()=>this.saveSnapshot(null);$('record-retry-area').append(retry);}
        const records=await root.learningRecords.list(profile);if(generation!==this.generation)return;
        const render=filter=>{
          $('record-unit-filters').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.unit===filter)));
          const list=$('record-list');list.replaceChildren();const shown=records.filter(r=>filter==='all'||r.unitKey===filter);
          if(!shown.length){const empty=document.createElement('div');empty.className='record-empty';empty.innerHTML='<h3>아직 남긴 기록이 없어요</h3><p>수업에서 퀴즈를 풀거나 직접 만들어 본 내용을 저장해 보세요.</p><button class="learning-secondary" onclick="switchUnit(\'roadmap\')">수업 둘러보기</button>';list.append(empty);}
          shown.forEach(record=>list.append(this.recordCard(record)));
        };
        for(const [key,name] of Object.entries({all:'전체',...root.learningRecordView.names})){const button=document.createElement('button');button.dataset.unit=key;button.textContent=name;button.onclick=()=>render(key);$('record-unit-filters').append(button);}
        render('all');
      }catch(error){if(generation!==this.generation)return;content.replaceChildren();const p=document.createElement('p');p.textContent=error.message;content.append(p);const retry=document.createElement('button');retry.textContent='다시 확인';retry.className='learning-secondary';retry.onclick=()=>this.renderRecords();content.append(retry);}
    },
    async login(form){
      const button=form.querySelector('button');button.disabled=true;button.textContent='입장 확인 중…';
      try{
        await root.learningAuth.signIn({classId:$('learning-class').value,studentNum:$('learning-num').value,entryCode:$('learning-code').value});
        $('learning-code').value='';$('login-dialog').close();await this.refreshIdentity();this.status('');
        const intent=this.intent;this.intent=null;
        if(intent==='eval'){switchUnit('eval');return;}
        if(intent?.type==='save'){await this.saveSnapshot(intent.snapshot);return;}
        await root.classroomPortal.open();
      }catch(error){$('login-status').textContent=error.message;}
      finally{if($('learning-code'))$('learning-code').value='';button.disabled=false;button.textContent='학생으로 입장';}
    },
    async submit(unitKey=null,kind=null){
      if(this.saving||root.learningRecords.busy)return;
      try{
        unitKey=unitKey||({unit1:'abstraction',unit2:'algorithm',unit3:'flowchart'})[currentActiveUnit];
        kind=kind||(currentUnitSubStep[currentActiveUnit]==='quiz'?'quiz':'practice');
        const snapshot=root.learningCapture.capture(unitKey,kind);
        await this.saveSnapshot(snapshot);
      }catch(error){this.status(error.message,true);}
    },
    async saveSnapshot(snapshot){
      if(this.saving||root.learningRecords.busy)return;
      this.saving=true;
      try{
        const profile=await root.learningAuth.getCurrentStudent();
        if(!profile){this.openLogin('기록을 저장하려면 학생으로 로그인해 주세요.',{type:'save',snapshot});return;}
        this.status('저장 중… 창을 닫지 마세요.',true);
        document.querySelectorAll('[data-record-save]').forEach(b=>b.disabled=true);
        await root.learningRecords.submit(snapshot);
        this.status('내 기록에 저장했어요. 클래스룸에서 확인할 수 있어요.');
        if(currentActiveUnit==='records')await this.renderRecords();
      }catch(error){this.status('저장하지 못했어요. '+error.message+' 나의 기록에서 다시 시도할 수 있어요.',true);}
      finally{this.saving=false;document.querySelectorAll('[data-record-save]').forEach(b=>b.disabled=false);}
    },
    recordCard(record){return root.learningRecordView.card(record);},
    async renderTeacher(){
      const generation=++this.teacherGeneration,container=$('classroom-table-container'),classId=getClassIdFromSelected();
      container.innerHTML=`<div class="learning-teacher"><details class="learning-record"><summary>추가 계정 발급</summary><p class="learning-muted">기존 308명은 발급되어 있습니다. 등록되지 않은 번호에만 새 계정을 만들 수 있습니다. 기존 학생의 비밀번호는 배부 자료에서 확인하세요.</p><form id="student-provision-form" class="learning-form"><div class="learning-fields"><label>번호<input name="studentNum" type="number" min="1" max="28" required></label><label>이름 (선택)<input name="name" maxlength="40" autocomplete="off"></label></div><button class="learning-primary" type="submit">비밀번호 발급</button><button id="provision-retry" class="learning-secondary" type="button" hidden>명부 저장 재시도</button></form><p id="provision-result" role="status" class="learning-code-result"></p></details><h3>학생별 학습 기록</h3><p id="teacher-record-status" role="status">불러오는 중…</p><div id="teacher-learning-list"></div></div>`;
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
        output.textContent=`${result.classId} · ${result.studentNum}번 ${result.name} / 비밀번호: ${result.entryCode} — 지금 학생에게 전달해 주세요. 학급을 바꾸거나 창을 닫으면 이 비밀번호는 다시 표시되지 않습니다.`;
        $('teacher-record-status').textContent='발급 완료. 학생 목록을 갱신하려면 학급을 다시 선택해 주세요.';
      }catch(error){output.textContent=error.message;}
      finally{button.disabled=false;if($('provision-retry'))$('provision-retry').hidden=!root.learningAuth.pendingProvision;}
    }
  };
  root.learningUI=ui;
  root.addEventListener('DOMContentLoaded',()=>{ui.refreshIdentity();});
})(window);
