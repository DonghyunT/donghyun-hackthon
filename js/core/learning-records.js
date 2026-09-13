(function(root){
  const service={
    pending:null,busy:false,
    async submit(){
      if(this.busy)throw Error('제출 중이에요. 잠시 기다려 주세요.');
      if(root.learningAuth.isLocked())throw Error('평가 중에는 수업 기록을 제출할 수 없어요.');
      this.busy=true;
      try{
        const profile=await root.learningAuth.requireStudent();
        if(root.authService.isDemo())throw Error('로컬 시연에서는 서버에 제출하지 않습니다.');
        if(!this.pending || this.pending.uid!==profile.uid){
          const snapshot=root.learningSnapshot.captureAbstraction();
          if(!snapshot)throw Error('지금은 제출할 수 없어요.');
          if(JSON.stringify(snapshot).length>40000)throw Error('내용이 너무 길어요. 현재·목표 상태와 조건을 짧게 정리해 주세요.');
          this.pending={uid:profile.uid,id:root.crypto.randomUUID(),data:{...snapshot,ownerUid:profile.uid,classId:profile.classId,studentNum:profile.studentNum}};
        }
        const pending=this.pending,ref=root.learningAuth.profileRef(profile).collection('submissions').doc(pending.id);
        await root.firebaseDb.runTransaction(async tx=>{
          const saved=await tx.get(ref);
          if(!saved.exists)tx.set(ref,{...pending.data,submittedAt:root.firebase.firestore.FieldValue.serverTimestamp()});
        });
        this.pending=null;return pending.id;
      } finally {this.busy=false;}
    },
    async list(profile){
      if(root.authService.isDemo())return [];
      const result=await root.learningAuth.profileRef(profile).collection('submissions').orderBy('submittedAt','desc').limit(30).get({source:'server'});
      return result.docs.map(doc=>({...doc.data(),id:doc.id}));
    }
  };
  root.learningRecords=service;
})(window);
