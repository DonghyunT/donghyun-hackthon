/* One SESSION identity for student lessons and assessments. Teacher provisioning uses a separate in-memory app. */
(function (root) {
  function identity(classId, studentNum) {
    if (!/^2-(?:[1-9]|10|11|12)$/.test(classId) || !/^(?:[1-9]|1[0-9]|2[0-8])$/.test(String(studentNum))) throw Error('학급과 번호를 확인해 주세요.');
    return { classId, studentNum: Number(studentNum), email: `s-${classId}-${Number(studentNum)}@students.donghyun-hackthon.invalid` };
  }
  function matches(user, profile) {
    if (!user || user.isAnonymous || !profile || profile.enabled !== true) return false;
    if(profile.uid!==user.uid)return false;
    try { return user.email === identity(profile.classId, profile.studentNum).email; } catch { return false; }
  }
  function message(error) {
    const code=error?.code || '';
    if (/invalid-credential|wrong-password|user-not-found|invalid-login-credentials/.test(code)) return '학급·번호·비밀번호를 확인해 주세요.';
    if (/too-many-requests/.test(code)) return '로그인 요청이 많아요. 잠시 후 다시 시도해 주세요.';
    if (/network|unavailable/.test(code)) return '연결이 끊겼어요. 인터넷 연결을 확인하고 다시 시도해 주세요.';
    if (/operation-not-allowed/.test(code)) return '학생 로그인이 아직 설정되지 않았어요. 선생님께 알려 주세요.';
    if (/email-already-in-use/.test(code)) return '이미 발급된 번호입니다. 기존 비밀번호를 사용해 주세요. 발급 중 오류가 났다면 관리자에게 확인해 주세요.';
    if (/permission-denied/.test(code)) return '등록 정보 또는 접근 권한을 확인할 수 없어요. 선생님께 알려 주세요.';
    return error?.message || '처리하지 못했어요. 다시 시도해 주세요.';
  }
  const service = {
    busy: false,
    profileRef(profile) { return root.firebaseDb.collection('learning_classes').doc(profile.classId).collection('students').doc(String(profile.studentNum).padStart(2,'0')); },
    isLocked() { return !!((typeof isAssessmentLocked==='function' && isAssessmentLocked()) || root.assessmentWorkspace?.active || (root.studentEvalApp?.joined && !root.studentEvalApp.isSubmitted)); },
    async getCurrentStudent() {
      if (root.authService.isDemo()) return this.demoProfile || null;
      const auth=await root.authService.ready(), user=auth.currentUser;
      if (!user || user.isAnonymous) return null;
      const login=/^s-(2-(?:[1-9]|10|11|12))-([1-9]|1[0-9]|2[0-8])@students\.donghyun-hackthon\.invalid$/.exec(user.email||'');
      if(!login)return null;
      const doc=await this.profileRef({classId:login[1],studentNum:Number(login[2])}).get({source:'server'});
      if (auth.currentUser?.uid!==user.uid) throw Error('로그인이 바뀌었어요. 다시 확인해 주세요.');
      if (!doc.exists || !matches(user,doc.data())) throw Error('사용할 수 없는 학생 계정입니다. 선생님께 확인해 주세요.');
      return {...doc.data(),uid:user.uid};
    },
    async signIn(input) {
      if(this.busy) throw Error('로그인을 확인하고 있어요. 잠시 기다려 주세요.');
      if(this.isLocked()) throw Error('평가에 참여 중에는 계정을 바꿀 수 없어요.');
      const id=identity(input.classId,input.studentNum);
      if(typeof input.entryCode!=='string'||!input.entryCode)throw Error('비밀번호를 입력해 주세요.');
      if(root.authService.isDemo())throw Error('로컬 시연에서는 실제 학생 로그인 대신 검사 전용 계정을 사용합니다.');
      this.busy=true;
      let auth, signedIn=false;
      try {
        auth=await root.authService.ready();
        if(auth.currentUser && !auth.currentUser.isAnonymous)throw Error('다른 계정으로 입장하려면 먼저 로그아웃 · 사용 종료를 눌러 주세요.');
        await auth.signInWithEmailAndPassword(id.email,input.entryCode); signedIn=true;
        const profile=await this.getCurrentStudent();
        if(!profile || profile.classId!==id.classId || profile.studentNum!==id.studentNum)throw Error('등록 정보가 일치하지 않습니다. 선생님께 확인해 주세요.');
        return profile;
      } catch(error) {
        if(signedIn)await auth.signOut();
        throw Error(message(error));
      } finally { this.busy=false; }
    },
    async requireStudent() {
      const profile=await this.getCurrentStudent();
      if(!profile)throw Error('먼저 학생 로그인을 해 주세요.');
      return profile;
    },
    async signInGuest(role) {
      if(!['student','teacher'].includes(role))throw Error('학생 또는 교사 게스트를 선택해 주세요.');
      if(this.busy)throw Error('로그인을 확인하고 있어요. 잠시 기다려 주세요.');
      if(this.isLocked())throw Error('평가에 참여 중에는 계정을 바꿀 수 없어요.');
      if(root.authService.isDemo())throw Error('실제 게스트 로그인은 서버가 연결된 환경에서 사용할 수 있습니다.');
      this.busy=true;let auth,signedIn=false;
      const controller=new root.AbortController(),timeout=root.setTimeout(()=>controller.abort(),20000);
      try {
        auth=await root.authService.ready();
        if(auth.currentUser&&!auth.currentUser.isAnonymous)throw Error('먼저 로그아웃 · 사용 종료를 눌러 주세요. 현재 계정은 유지됩니다.');
        const response=await root.fetch('/api/guest-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role}),signal:controller.signal,credentials:'same-origin',cache:'no-store'});
        const body=await response.json().catch(()=>({}));
        if(!response.ok)throw Error(response.status===503?'게스트 로그인 서버가 아직 준비되지 않았습니다. 준비가 끝난 뒤 다시 이용해 주세요.':response.status===429?'로그인 요청이 많습니다. 잠시 후 다시 시도해 주세요.':'게스트 로그인 정보를 받을 수 없습니다. 다시 시도해 주세요.');
        if(typeof body.customToken!=='string'||!body.customToken||body.customToken.length>10000)throw Error('게스트 로그인 응답을 확인할 수 없습니다.');
        if(this.isLocked() || (auth.currentUser&&!auth.currentUser.isAnonymous))throw Error('로그인 상태가 바뀌었습니다. 진행 중인 작업을 마친 뒤 다시 시도해 주세요.');
        await auth.signInWithCustomToken(body.customToken);signedIn=true;
        if(role==='student') {
          const profile=await this.getCurrentStudent();
          if(!profile||profile.uid!=='hackathon-guest-student'||profile.classId!=='2-12'||profile.studentNum!==1)throw Error('발표용 학생 등록 정보를 확인할 수 없습니다.');
          return profile;
        }
        const user=await root.authService.teacher();
        if(user.uid!=='hackathon-guest-teacher'||user.email!=='guest-teacher@teachers.donghyun-hackthon.invalid'||root.authService.teacherProfile?.classIds?.length!==1||root.authService.teacherProfile.classIds[0]!=='2-12')throw Error('발표용 교사 권한을 확인할 수 없습니다.');
        return user;
      } catch(error) {
        if(signedIn){await auth.signOut();root.authService.teacherProfile=null;}
        if(error?.name==='AbortError')throw Error('로그인 연결이 지연되고 있습니다. 다시 시도해 주세요.');
        throw Error(message(error));
      } finally {root.clearTimeout(timeout);this.busy=false;}
    },
    async signInTeacher(password) {
      if(this.busy||this.isLocked())throw Error('진행 중인 작업을 마친 뒤 로그인해 주세요.');
      if(!password)throw Error('교사 비상계정 비밀번호를 입력해 주세요.');
      this.busy=true;let auth,signedIn=false;
      try{
        auth=await root.authService.ready();
        if(auth.currentUser&&!auth.currentUser.isAnonymous)throw Error('먼저 로그아웃 · 사용 종료를 눌러 주세요.');
        await auth.signInWithEmailAndPassword('teacher@teachers.donghyun-hackthon.invalid',password);signedIn=true;
        await root.authService.teacher();
      }catch(error){if(signedIn)await auth.signOut();throw Error(message(error));}
      finally{this.busy=false;}
    },
    async provision({classId,studentNum,name}) {
      if(this.pendingProvision)throw Error('이전 발급의 명부 저장 재시도를 먼저 완료해 주세요.');
      if(this.busy)throw Error('발급 중입니다. 잠시 기다려 주세요.');
      const id=identity(classId,studentNum), cleanName=String(name||'').trim() || `${id.studentNum}번 학생`;
      if(cleanName.length>40)throw Error('이름은 40자 이내로 입력해 주세요.');
      this.busy=true; let app;
      try {
        if(root.authService.isDemo())throw Error('로컬 시연에서는 실제 계정을 발급하지 않습니다.');
        await root.authService.teacher();
        if(root.authService.teacherProfile?.classIds)throw Error('발표용 교사 계정에서는 학생 계정을 발급할 수 없습니다.');
        // Random per-student password. Never persist it in Firestore, browser storage, or logs.
        const entryCode=root.studentPassword.generate();
        app=root.firebase.initializeApp(root.FIREBASE_CONFIG,'provision-'+root.crypto.randomUUID());
        const auth=app.auth(); await auth.setPersistence(root.firebase.auth.Auth.Persistence.NONE);
        const {user}=await auth.createUserWithEmailAndPassword(id.email,entryCode);
        const profile={uid:user.uid,classId:id.classId,studentNum:id.studentNum,name:cleanName,enabled:true};
        try {
          await this.profileRef(profile).set(profile);
        } catch(error) {
          // The newly created account has no access without its roster. Keep identity available for a safe retry in this tab.
          this.pendingProvision={uid:user.uid,profile,entryCode};
          throw Error('계정은 생성되었지만 명부 저장에 실패했습니다. 이 창을 닫지 말고 명부 저장 재시도를 눌러 주세요.');
        }
        return {...profile,entryCode};
      } catch(error) { throw Error(message(error)); }
      finally { this.busy=false; if(app){try{await app.auth().signOut();}finally{await app.delete();}} }
    },
    async retryProvision() {
      if(this.busy)throw Error('발급 중입니다. 잠시 기다려 주세요.');
      if(!this.pendingProvision)throw Error('재시도할 발급이 없습니다.');
      this.busy=true;
      try {
        await root.authService.teacher();
        if(root.authService.teacherProfile?.classIds)throw Error('발표용 교사 계정에서는 학생 계정을 발급할 수 없습니다.');
        const p=this.pendingProvision;
        await this.profileRef(p.profile).set(p.profile);
        this.pendingProvision=null; return {...p.profile,entryCode:p.entryCode};
      } finally { this.busy=false; }
    }
  };
  if(typeof module!=='undefined' && module.exports)module.exports={identity,matches,message};
  if(root)root.learningAuth=service;
})(typeof window==='undefined'?null:window);
