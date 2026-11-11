import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * Vite가 하는 일
 *
 * 개발할 때
 * 1. 5173포트에 개발 서버를 띄운다.
 * 2. 파일을 저장하면 브라우저에 즉시 반영된다.(HMR). 전체 새로고침 없이 바뀐 부분만 갱신
 * 3. 브라우저가 import한 파일을 그때그때 변환해주므로 시작이 빠르다.
 *
 * 배포할 때
 * 1. 모든 코드를 합치고 압축해서 dist/에 정적 파일로 만든다.
 * 2. 이 dist/만 웹 서버에 올리면 된다.
 */

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()], // .vue 파일을 처리한다.
  resolve: {
    alias: {
      // '@/api/...' 처럼 src 디렉토리를 '@'로 참조할 수 있게 설정
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
});
