/**
 * ==============================================================================
 * 🔥 [Firebase 클라우드 데이터베이스 설정 및 초기화 모듈]
 * ==============================================================================
 * - 프로젝트 ID: donghyun-hackthon
 * - 목적: 2학년 1~11반(각 28명, 총 308명) + 발표용 2-12반 실시간 수업 기록 및 수행평가 연동
 * - 특징:
 *   1. Firebase Web SDK Compat (CDN) 기반 웹 앱
 *   2. 명시적인 localhost ?demo=1에서만 BroadcastChannel 시연 사용
 *   3. 인간이 한눈에 보고 쉽게 이해할 수 있는 직관적인 구성
 */

// 1. Firebase 프로젝트 설정 객체
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD32l3cguaTbSvk4XtKnqxDZ4toc2fy-Kw",
  authDomain: "donghyun-hackthon.firebaseapp.com",
  projectId: "donghyun-hackthon",
  storageBucket: "donghyun-hackthon.firebasestorage.app",
  messagingSenderId: "341599350414",
  appId: "1:341599350414:web:98d5a128da488645cda3df"
};

// 전역 상태 보관용
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.firebaseDb = null;
window.isFirebaseReady = false;

/**
 * 2. Firebase 및 Firestore 인스턴스 초기화
 * @returns {object|null} Firestore DB 인스턴스
 */
function initFirebaseApp() {
  if (window.authService?.isDemo()) return null;
  // 이미 초기화된 경우 기존 인스턴스 반환
  if (window.firebaseDb) {
    return window.firebaseDb;
  }

  try {
    // Firebase CDN 스크립트 로드 여부 확인
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      window.firebaseDb = firebase.firestore();
      window.isFirebaseReady = true;
      console.info("Firebase SDK 초기화 완료. 서버 접근 권한은 요청 시 확인합니다.");
      return window.firebaseDb;
    } else {
      console.warn("Firebase SDK를 불러오지 못했습니다. 서버 기능을 사용할 수 없습니다.");
      return null;
    }
  } catch (err) {
    console.error("❌ [Firebase] 초기화 중 오류 발생:", err);
    window.isFirebaseReady = false;
    return null;
  }
}

// 스크립트 로드 시 즉시 초기화 시도
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initFirebaseApp();
  });
}
