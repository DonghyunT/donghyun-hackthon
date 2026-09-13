(function(root){
  const service={
    pending:null,busy:false,
    async submit(snapshotInput=null){
      if(this.busy)throw Error('제출 중이에요. 잠시 기다려 주세요.');
      if(root.learningAuth.isLocked())throw Error('평가 중에는 수업 기록을 제출할 수 없어요.');
      this.busy=true;
      try{
        const profile=await root.learningAuth.requireStudent();
        if(root.authService.isDemo())throw Error('로컬 시연에서는 서버에 제출하지 않습니다.');
        if(!this.pending || this.pending.uid!==profile.uid){
          const snapshot=snapshotInput||root.learningSnapshot.captureAbstraction();
          if(!snapshot)throw Error('지금은 제출할 수 없어요.');
          if(JSON.stringify(snapshot).length>220000)throw Error('기록이 너무 커요. 작성 내용을 줄인 뒤 다시 저장해 주세요.');
          this.pending={uid:profile.uid,id:root.crypto.randomUUID(),data:{...JSON.parse(JSON.stringify(snapshot)),ownerUid:profile.uid,classId:profile.classId,studentNum:profile.studentNum}};
        }
        if(snapshotInput && (snapshotInput.unitKey!==this.pending.data.unitKey || snapshotInput.activityId!==this.pending.data.activityId || snapshotInput.practice?.stage!==this.pending.data.practice?.stage))throw Error('이전에 저장하지 못한 활동이 있어요. 나의 기록에서 이전 저장을 먼저 재시도해 주세요.');
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
