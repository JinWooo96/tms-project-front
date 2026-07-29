<script setup>
/**
 * Daum(카카오) 우편번호 서비스를 감싼 주소 검색 입력 컴포넌트.
 * 사용자가 직접 타이핑하지 못하게 readonly로 막고, "주소 검색" 버튼으로만 값을 채운다.
 * (자유 텍스트 입력을 막아야, 서버의 지오코딩 실패율이 크게 줄어든다 - GeocodingService 관련)
 *
 * 사용 예:
 *   <AddressSearchInput v-model="form.originAddress" placeholder="상차지 주소 검색" />
 */
import { ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '주소 검색 버튼을 클릭하세요',
  },
});

const emit = defineEmits(['update:modelValue']);

function openAddressSearch() {
  if (typeof daum === 'undefined' || !daum.Postcode) {
    // index.html에 스크립트가 아직 로딩되지 않았거나 실패한 경우에 대한 방어 코드
    ElMessage.error('주소 검색 서비스를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
    return;
  }

  new daum.Postcode({
    oncomplete: (data) => {
      // roadAddress(도로명주소)를 우선 사용하고, 없으면 jibunAddress(지번주소)로 대체한다.
      const address = data.roadAddress || data.jibunAddress;
      emit('update:modelValue', address);
    },
  }).open();
}
</script>

<template>
  <div class="address-search-input">
    <el-input :model-value="modelValue" :placeholder="placeholder" readonly @click="openAddressSearch" />
    <el-button @click="openAddressSearch">주소 검색</el-button>
  </div>
</template>

<style scoped>
.address-search-input {
  display: flex;
  gap: 8px;
}

.address-search-input :deep(.el-input) {
  cursor: pointer;
}
</style>