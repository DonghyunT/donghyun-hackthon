'use strict';

const GUEST_CLASS_ID = '2-12';
const CLASS_ID_PATTERN = /^2-(?:[1-9]|10|11|12)$/;

// Guest identities remain isolated even if a role document is misconfigured.
function guestIdentity(claims = {}) {
  return claims.guest === true || claims.email === 'guest-teacher@teachers.donghyun-hackthon.invalid' ||
    /^s-2-12-(?:[1-9]|1[0-9]|2[0-8])@students\.donghyun-hackthon\.invalid$/.test(claims.email || '');
}

function teacherCanAccessClass(role, classId, claims = {}) {
  if (!CLASS_ID_PATTERN.test(classId) || !role || role.enabled !== true) return false;
  if (guestIdentity(claims) && classId !== GUEST_CLASS_ID) return false;
  if (claims.guest === true && claims.classroom !== GUEST_CLASS_ID) return false;
  if ('guest' in role && typeof role.guest !== 'boolean') return false;
  if (role.guest === true && classId !== GUEST_CLASS_ID) return false;
  if (role.guest === true || 'classIds' in role) {
    return Array.isArray(role.classIds) && role.classIds.includes(classId);
  }
  return true;
}

module.exports = { GUEST_CLASS_ID, CLASS_ID_PATTERN, guestIdentity, teacherCanAccessClass };
