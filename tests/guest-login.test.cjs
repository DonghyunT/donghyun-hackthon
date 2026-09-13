const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {customToken,PROJECT,SIGNER,ACCOUNTS}=require('../server/guest-token.cjs');
const pair=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const credential={project_id:PROJECT,client_email:SIGNER,private_key:pair.privateKey.export({format:'pem',type:'pkcs8'})};
test('guest token is signed, short-lived and restricted to fixed guest identities',()=>{
  for(const role of ['student','teacher']){
    const token=customToken(role,credential,1000),parts=token.split('.'),claims=JSON.parse(Buffer.from(parts[1],'base64url'));
    assert.equal(claims.uid,ACCOUNTS[role].uid);assert.deepEqual(claims.claims,{guest:true,classroom:'2-12'});
    assert.equal(claims.exp-claims.iat,300);assert.equal(claims.iss,SIGNER);
    assert.equal(crypto.verify('RSA-SHA256',Buffer.from(parts.slice(0,2).join('.')),pair.publicKey,Buffer.from(parts[2],'base64url')),true);
  }
  for(const role of ['admin','__proto__','constructor',''])assert.throws(()=>customToken(role,credential));
  assert.throws(()=>customToken('teacher',{...credential,project_id:'original-project'}));
  assert.throws(()=>customToken('teacher',{...credential,client_email:'other@example.com'}));
});
test('guest endpoint fails closed without setup, rejects identity overrides and never exposes key material',async()=>{
  const handler=require('../api/guest-login.js'),saved={...process.env};
  const request=async(body,method='POST',ip='test')=>{const result={headers:{}};const res={setHeader(k,v){result.headers[k]=v;},status(code){result.status=code;return this;},json(body){result.body=body;return this;}};await handler({method,body,headers:{},socket:{remoteAddress:ip}},res);return result;};
  try{
    delete process.env.GUEST_LOGIN_ENABLED;
    assert.equal((await request({role:'student'})).status,503);
    process.env.GUEST_LOGIN_ENABLED='true';delete process.env.FIREBASE_GUEST_SERVICE_ACCOUNT;
    assert.equal((await request({role:'teacher'})).status,503);
    process.env.FIREBASE_GUEST_SERVICE_ACCOUNT=JSON.stringify(credential);
    for(const body of [{role:'admin'},{role:'teacher',uid:'real-teacher'},{role:'teacher',classId:'2-1'},null])assert.equal((await request(body)).status,400);
    assert.equal((await request({role:'teacher'},'GET')).status,405);
    const success=await request({role:'teacher'});assert.equal(success.status,200);assert.equal(success.headers['Cache-Control'],'no-store');
    assert.deepEqual(Object.keys(success.body),['customToken']);assert.ok(!JSON.stringify(success).includes('PRIVATE KEY'));
    for(let i=0;i<20;i++)assert.equal((await request({role:'student'},'POST','limited')).status,200);
    assert.equal((await request({role:'student'},'POST','limited')).status,429);
  }finally{for(const key of ['GUEST_LOGIN_ENABLED','FIREBASE_GUEST_SERVICE_ACCOUNT'])if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}
});
