const test = require('node:test');
const assert = require('node:assert/strict');
const { teacherCanAccessClass: access } = require('../server/teacher-access.cjs');

test('regular teachers retain all twelve class scopes while disabled and invalid roles fail closed', () => {
  for (let n=1;n<=12;n++) assert.equal(access({enabled:true},'2-'+n),true);
  for (const role of [null,{}, {enabled:false},{enabled:true,guest:'true'},{enabled:true,classIds:'2-12'}]) {
    assert.equal(access(role,'2-12'),false);
  }
  for(const classId of ['2-0','2-13','../2-1','2-12/students/01',null]) assert.equal(access({enabled:true},classId),false);
});

test('guest role allowlist can only narrow the fixed demo scope', () => {
  const role={enabled:true,guest:true,classIds:['2-12','2-1']};
  assert.equal(access(role,'2-12'),true);
  for (let n=1;n<=11;n++) assert.equal(access(role,'2-'+n),false);
  for (const classIds of [[],null,'2-12']) assert.equal(access({enabled:true,guest:true,classIds},'2-12'),false);
  assert.equal(access({enabled:true,guest:true},'2-12'),false);
  assert.equal(access({enabled:true,classIds:['2-2']},'2-1'),false);
  assert.equal(access({enabled:true,classIds:['2-2']},'2-2'),true);
});

test('signed guest claims and guest identities cannot widen through an ordinary role', () => {
  for (const claims of [
    {guest:true,classroom:'2-12'},
    {email:'guest-teacher@teachers.donghyun-hackthon.invalid'},
    {email:'s-2-12-1@students.donghyun-hackthon.invalid'}
  ]) {
    assert.equal(access({enabled:true},'2-1',claims),false);
    assert.equal(access({enabled:true},'2-12',claims),true);
  }
  for(const classroom of [undefined,'2-1','2-13']) assert.equal(access({enabled:true},'2-12',{guest:true,classroom}),false);
});
