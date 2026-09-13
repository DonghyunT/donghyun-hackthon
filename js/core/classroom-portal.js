(function(root){
  const $=id=>document.getElementById(id);
  const label=p=>p.classId==='2-12'?'발표용 학급 · 게스트 학생':`2학년 ${Number(p.classId.split('-')[1])}반 ${p.studentNum}번`;
  const ui={
    generation:0,unsubs:[],timer:null,
    stop(){this.generation++;this.unsubs.forEach(fn=>fn());this.unsubs=[];clearInterval(this.timer);},
    async identity(){
      const profile=await root.learningAuth.getCurrentStudent();
      if(profile)return {role:'student',profile};
      if(root.authService.isDemo())return {role:isTeacherAuthenticated?'teacher':'guest'};
      const auth=await root.authService.ready(),user=auth.currentUser;
      if(!user||user.isAnonymous)return {role:'guest'};
      const doc=await root.firebaseDb.collection('teachers').doc(user.uid).get({source:'server'});
      if(auth.currentUser?.uid!==user.uid)throw Error('로그인이 바뀌었습니다. 다시 확인해 주세요.');
      return {role:doc.exists&&doc.data().enabled===true?'teacher':'unregistered',profile:doc.exists?doc.data():null};
    },
    async refreshHeader(){
      try{
        const identity=await this.identity();this.current=identity;
        const signed=identity.role!=='guest';
        $('header-login-button').hidden=signed;$('account-menu').hidden=!signed;
        $('account-label').textContent=identity.role==='student'?label(identity.profile):identity.role==='teacher'?(identity.profile?.classIds?.includes('2-12')?'발표용 교사':'교사 계정'):'권한 확인 필요';
        $('nav-btn-classroom').textContent=identity.role==='teacher'?'우리 반 클래스룸':'내 클래스룸';
        return identity;
      }catch(error){$('header-login-button').hidden=false;$('account-menu').hidden=true;throw error;}
    },
    async open(){
      if(isAssessmentLocked()||teacherSessionPending)return;
      this.stop();stopLiveEvalDashboard();closeMegaMenu();root.learningUI.generation++;root.learningUI.teacherGeneration++;
      hideMainViews();if(typeof disableStudioMode==='function')disableStudioMode();
      document.body.classList.remove('reading-mode');currentActiveUnit='portal';updateActiveNavigation('classroom');
      $('view-portal').classList.remove('hidden');$('account-menu').open=false;
      const generation=this.generation,content=$('portal-content');content.textContent='클래스룸을 확인하고 있어요…';
      window.scrollTo({top:0});
      try{
        const identity=await this.refreshHeader();if(generation!==this.generation)return;
        if(identity.role==='student')await this.student(identity.profile,generation);
        else if(identity.role==='teacher')await this.teacher(generation);
        else{
          content.innerHTML='<h1>내 클래스룸</h1><p>로그인하면 내 수업 기록과 수행평가를 확인할 수 있어요.</p><button class="learning-primary" id="portal-login">로그인</button><p class="learning-muted">수업은 로그인 없이도 둘러볼 수 있어요.</p>';
          if(identity.role==='unregistered')content.querySelector('p').textContent='교사 권한이 등록되지 않은 계정입니다. 계정 메뉴에서 로그아웃한 뒤 등록된 계정으로 입장해 주세요.';
          $('portal-login').onclick=()=>root.learningUI.openLogin();
        }
      }catch(error){if(generation!==this.generation)return;content.replaceChildren();const p=document.createElement('p');p.textContent='클래스룸을 불러오지 못했어요. '+error.message;content.append(p);const retry=document.createElement('button');retry.className='learning-secondary';retry.textContent='다시 확인';retry.onclick=()=>this.open();content.append(retry);}
    },
    async student(profile,generation){
      const content=$('portal-content');
      content.innerHTML='<p class="portal-eyebrow">내 클래스룸</p><h1 id="portal-student-title"></h1><p class="learning-muted">오늘 할 일을 확인하고, 생각하고 만든 기록을 모아 보세요.</p><div id="student-classroom-sections"><section id="portal-learning"><h2>수업과 내 기록</h2><p>틀린 답이나 작성 중인 내용도 기록으로 남길 수 있어요.</p><div class="learning-actions"><button class="learning-primary" onclick="switchUnit(\'roadmap\')">수업 둘러보기</button><button class="learning-secondary" onclick="switchUnit(\'records\')">내 기록 전체 보기</button></div><h3>최근 제출 기록</h3><div id="portal-recent">기록을 불러오는 중…</div></section><section id="portal-assessment"><p class="portal-eyebrow">현재 수행평가</p><h2 id="portal-assessment-title">평가 상태를 확인하고 있어요</h2><p id="portal-assessment-status" role="status"></p><button id="portal-assessment-enter" class="learning-primary" disabled>상태 확인 중</button><p class="learning-muted">이곳에서는 제출 여부를 확인할 수 있어요.</p></section></div>';
      $('portal-student-title').textContent=label(profile);
      if(profile.classId==='2-12')content.querySelector('.learning-muted').textContent='공동으로 사용하는 발표용 계정입니다. 실제로 저장되므로 이름 등 개인정보는 입력하지 마세요.';
      $('portal-assessment-enter').onclick=()=>root.studentEvalApp.openLobby();
      let session=null,own=null,ownReady=false,sessionReady=false,failed=false;
      const render=()=>{
        if(generation!==this.generation)return;
        const title=$('portal-assessment-title'),status=$('portal-assessment-status'),button=$('portal-assessment-enter');
        if(failed){title.textContent='평가 상태를 확인하지 못했어요';status.textContent='연결을 확인한 뒤 클래스룸을 다시 열어 주세요.';button.disabled=true;return;}
        if(!sessionReady||!ownReady)return;
        const submitted=own?.attemptId===session?.attemptId&&own?.status==='submitted';
        const active=!!session?.attemptId&&(session.status==='waiting'||(session.status==='in_progress'&&Date.now()<session.deadlineMs));
        const joined=!!root.studentEvalApp?.joined&&!root.studentEvalApp.isSubmitted;
        title.textContent=submitted?'제출 완료':active?'지금 참여할 수행평가가 있어요':session?.attemptId?'현재 평가가 종료됐어요':'아직 열린 수행평가가 없어요';
        status.textContent=submitted?'답안이 서버에 저장됐어요. 선생님께서 제출 내용을 확인합니다.':active?(session.status==='waiting'?'선생님이 평가를 준비했어요. 대기실로 들어오세요.':'평가가 진행 중이에요. 남은 시간 안에 참여하세요.'):'선생님의 안내를 기다려 주세요.';
        button.disabled=submitted||(!active&&!joined);button.textContent=submitted?'제출 완료':joined?'진행하던 평가로':active?'수행평가 입장':'평가 대기';
        $('portal-assessment').classList.toggle('portal-priority',active&&!submitted);
        const sections=$('student-classroom-sections');sections.prepend(active&&!submitted?$('portal-assessment'):$('portal-learning'));
      };
      const fail=()=>{failed=true;render();};
      this.unsubs.push(root.evalService.listenSession(profile.classId,(value,metadata)=>{if(metadata?.hasPendingWrites)return;session=value;sessionReady=!metadata?.fromCache;render();},fail));
      const ref=root.firebaseDb.collection('classrooms').doc(profile.classId).collection('students').doc(String(profile.studentNum).padStart(2,'0'));
      this.unsubs.push(ref.onSnapshot({includeMetadataChanges:true},doc=>{if(doc.metadata.hasPendingWrites)return;own=doc.exists?doc.data():null;ownReady=!doc.metadata.fromCache;render();},fail));
      this.timer=setInterval(render,1000);
      try{
        const records=await root.learningRecords.list(profile);if(generation!==this.generation)return;
        const recent=$('portal-recent');recent.replaceChildren();
        if(!records.length)recent.textContent='아직 제출한 기록이 없어요. 수업 활동 후 첫 기록을 남겨 보세요.';
        records.slice(0,3).forEach(record=>recent.append(root.learningUI.recordCard(record)));
      }catch(error){if(generation===this.generation)$('portal-recent').textContent='기록을 불러오지 못했어요. '+error.message;}
    },
    async teacher(generation){
      await root.authService.teacher();
      isTeacherAuthenticated=true;
      const scope=root.authService.teacherProfile?.classIds;
      const snapshot=Array.isArray(scope)?{docs:(await Promise.all(scope.map(id=>root.firebaseDb.collection('learning_classes').doc(id).get({source:'server'})))).filter(doc=>doc.exists)}:await root.firebaseDb.collection('learning_classes').get({source:'server'});
      if(generation!==this.generation)return;
      const content=$('portal-content');content.innerHTML='<p class="portal-eyebrow">교사 클래스룸</p><h1>우리 반</h1><p class="learning-muted">반을 선택하면 학생 기록과 수행평가 운영 화면으로 이동합니다.</p><div id="portal-classes" class="portal-class-grid"></div>';
      if(Array.isArray(scope))content.querySelector('.learning-muted').textContent='발표용 학급에서 실제 기록과 평가 기능을 사용합니다. 공동 사용 데이터이므로 개인정보는 입력하지 마세요.';
      const docs=snapshot.docs.sort((a,b)=>Number(a.id.split('-')[1])-Number(b.id.split('-')[1]));
      if(!docs.length)$('portal-classes').textContent='등록된 학급이 없습니다.';
      for(const doc of docs){
        if(!/^2-([1-9]|10|11|12)$/.test(doc.id))continue;
        const button=document.createElement('button');button.className='portal-class';button.dataset.classId=doc.id;
        const title=document.createElement('strong');title.textContent=doc.data().label||`2학년 ${doc.id.split('-')[1]}반`;
        const hint=document.createElement('span');hint.textContent='학생 기록 · 수행평가';button.append(title,hint);
        button.onclick=()=>this.enterClass(doc.id);$('portal-classes').append(button);
      }
    },
    async enterClass(classId){
      if(teacherSessionPending||isAssessmentLocked()||!/^2-([1-9]|10|11|12)$/.test(classId))return;
      try{await root.authService.teacher();if(!root.authService.teacherCanAccess(classId))throw Error('접근할 수 없는 학급입니다.');if(currentActiveUnit!=='portal')return;this.stop();currentSelectedClass=`2학년 ${Number(classId.split('-')[1])}반`;currentClassroomTab='assignments';showClassroomView();}
      catch(error){root.learningUI.status(error.message);}
    }
  };
  root.classroomPortal=ui;
})(window);
