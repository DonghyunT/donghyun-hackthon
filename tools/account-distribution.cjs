const fs=require('node:fs'),path=require('node:path');
const folder=path.resolve(__dirname,'../scratch/private-access');
function read(){
 const saved={students:[],teacher:null};
 for(let c=1;c<=11;c++){const file=path.join(folder,'classes',`2-${c}`,'credentials.json');if(fs.existsSync(file))saved.students.push(...JSON.parse(fs.readFileSync(file,'utf8')));}
 const teacher=path.join(folder,'teacher','credentials.json');if(fs.existsSync(teacher))saved.teacher=JSON.parse(fs.readFileSync(teacher,'utf8'));
 return saved;
}
function save(saved){
 for(let c=1;c<=11;c++){
  const entries=saved.students.filter(s=>s.classId===`2-${c}`),dir=path.join(folder,'classes',`2-${c}`);fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'credentials.json'),JSON.stringify(entries,null,2));
 }
 if(saved.teacher){const dir=path.join(folder,'teacher');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'credentials.json'),JSON.stringify(saved.teacher,null,2));}
}
function publish(saved){
 save(saved);
 const index=['정보 놀이터 — 학급별 계정 관리 (교사용 비공개)','학생에게는 본인의 메모만 전달하세요.','주소: https://donghyun-hackthon.vercel.app/','','학급별 배부표 / 개별 학생 메모'];
 for(let c=1;c<=11;c++){
  const entries=saved.students.filter(s=>s.classId===`2-${c}`).sort((a,b)=>a.studentNum-b.studentNum),dir=path.join(folder,'classes',`2-${c}`),students=path.join(dir,'students');fs.mkdirSync(students,{recursive:true});
  const lines=[`2학년 ${c}반 — 학생 계정 배부표 (교사용)`,`학생 로그인 → 학급 2-${c} 선택 → 번호 → 개인 비밀번호`,''];
  for(const s of entries){
   if(!Number.isInteger(s.studentNum)||s.studentNum<1||s.studentNum>28)throw Error('Invalid student number.');
   const num=String(s.studentNum).padStart(2,'0'),password=s.password||'기존 비밀번호 유지';
   lines.push(`${num}번\t${password}`);
   fs.writeFileSync(path.join(students,num+'.txt'),`\ufeff정보 놀이터\r\nhttps://donghyun-hackthon.vercel.app/\r\n학급: 2학년 ${c}반\r\n번호: ${s.studentNum}번\r\n비밀번호: ${password}\r\n다른 친구에게 비밀번호를 알려주지 마세요. 사용 후 로그아웃 · 사용 종료를 눌러 주세요.\r\n`);
  }
  fs.writeFileSync(path.join(dir,'student-accounts.txt'),'\ufeff'+lines.join('\r\n'));
  index.push(`2학년 ${c}반: classes/2-${c}/student-accounts.txt`, `  개별 학생: classes/2-${c}/students/01.txt ~ 28.txt`);
 }
 if(saved.teacher)fs.writeFileSync(path.join(folder,'teacher','emergency-login.txt'),'\ufeff정보 놀이터 교사 비상계정\r\n우측 상단 로그인 → 교사 → 교사 비상 로그인\r\n비밀번호: '+saved.teacher.password+'\r\n교사만 보관하세요.\r\n');
 index.push('','교사 비상계정: teacher/emergency-login.txt');
 fs.writeFileSync(path.join(folder,'README.txt'),'\ufeff'+index.join('\r\n'));
}
module.exports={folder,read,save,publish};
