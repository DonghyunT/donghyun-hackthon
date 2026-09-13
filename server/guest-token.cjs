const {sign}=require('node:crypto');
const PROJECT='donghyun-hackthon';
const CLASS_ID='2-12';
const SIGNER=`hackathon-guest-login@${PROJECT}.iam.gserviceaccount.com`;
const ACCOUNTS=Object.freeze({
  student:{uid:'hackathon-guest-student',email:`s-${CLASS_ID}-1@students.${PROJECT}.invalid`,name:'게스트 학생'},
  teacher:{uid:'hackathon-guest-teacher',email:`guest-teacher@teachers.${PROJECT}.invalid`,name:'게스트 교사'}
});
function customToken(role,credential,now=Math.floor(Date.now()/1000)){
  if(!Object.hasOwn(ACCOUNTS,role))throw Error('invalid-role');
  if(credential?.project_id!==PROJECT||credential?.client_email!==SIGNER||typeof credential.private_key!=='string')throw Error('invalid-guest-signer');
  const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
  const payload={iss:SIGNER,sub:SIGNER,aud:'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',iat:now,exp:now+300,uid:ACCOUNTS[role].uid,claims:{guest:true,classroom:CLASS_ID}};
  const data=encode({alg:'RS256',typ:'JWT'})+'.'+encode(payload);
  return data+'.'+sign('RSA-SHA256',Buffer.from(data),credential.private_key).toString('base64url');
}
module.exports={PROJECT,CLASS_ID,SIGNER,ACCOUNTS,customToken};
