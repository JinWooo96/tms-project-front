import { defineStore } from 'pinia';

/**
 * 로그인한 사용자 정보.
 * 아직 로그인 기능이 없으므로 화면 틀을 보여주기 위한 임시값이다.
 * 로그인(인증)을 붙일 때 이 스토어에 login()/logout() 액션을 추가하고,
 * 백엔드 응답으로 user를 채우면 헤더의 사용자 팝오버는 수정 없이 그대로 동작한다.
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    user: {
      name: '홍길동',
      role: '배차 담당자',
      email: 'hong@example.com',
    },
  }),

  getters: {
    // 아바타 원 안에 보여줄 이름 첫 글자
    initial: (state) => state.user?.name?.charAt(0) ?? '',
  },
});
