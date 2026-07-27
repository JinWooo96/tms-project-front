import axios from 'axios';

/**
 * 백엔드 API 전용 Axios 인스턴스.
 * baseURL은 .env.development의 VITE_API_BASE_URL 값을 사용한다.
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
});

/**
 * 응답 인터셉터.
 * 백엔드는 항상 { success, data, error } 형태로 응답한다. (API 명세서 "공통 응답 포맷" 참고)
 * 매 API 호출마다 response.data.data를 꺼내는 반복을 없애기 위해, 여기서 한 번에 처리한다.
 *
 * 성공 시: response.data.data만 꺼내서 그대로 반환한다.
 *   -> 호출부에서는 const orders = await orderApi.getOrders() 처럼 바로 데이터를 받을 수 있다.
 *
 * 실패 시: response.data.error(ErrorResponse: {code, message})를 reject 하여
 *   호출부의 catch(error)에서 error.code, error.message로 바로 접근할 수 있게 한다.
 */
client.interceptors.response.use(
  (response) => response.data.data,
  (error) => {
    const errorResponse = error.response?.data?.error;
    if (errorResponse) {
      return Promise.reject(errorResponse);
    }
    // 네트워크 오류 등, 백엔드가 아예 응답하지 못한 경우
    return Promise.reject({
      code: 'NETWORK_ERROR',
      message: '서버와 통신할 수 없습니다. 네트워크 상태를 확인해주세요.',
    });
  }
);

export default client;
