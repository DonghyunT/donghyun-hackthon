const {customToken}=require('../server/guest-token.cjs');
const requests=new Map();
module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  const fail=(status,error)=>res.status(status).json({error});
  if(req.method!=='POST')return fail(405,'POST 요청만 사용할 수 있습니다.');
  const body=req.body;
  if(!body||typeof body!=='object'||Array.isArray(body)||!['student','teacher'].includes(body.role)||Object.keys(body).some(key=>key!=='role'))return fail(400,'학생 또는 교사 로그인을 선택해 주세요.');
  if(process.env.GUEST_LOGIN_ENABLED!=='true')return fail(503,'게스트 로그인을 준비 중입니다. 기존 계정으로 로그인해 주세요.');
  // Best-effort per-instance throttle; this public endpoint can only mint two fixed guest identities.
  const ip=String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown').slice(0,100),now=Date.now();
  for(const [key,value] of requests)if(now-value.start>=60000)requests.delete(key);
  const bucket=requests.get(ip)||{start:now,count:0};
  if(bucket.count>=20||requests.size>=1000&&!requests.has(ip))return fail(429,'로그인 요청이 많습니다. 잠시 후 다시 시도해 주세요.');
  bucket.count++;requests.set(ip,bucket);
  try{
    const credential=JSON.parse(process.env.FIREBASE_GUEST_SERVICE_ACCOUNT||'null');
    return res.status(200).json({customToken:customToken(body.role,credential)});
  }catch{return fail(503,'게스트 로그인 연결을 확인하고 있습니다. 잠시 후 다시 시도해 주세요.');}
};
