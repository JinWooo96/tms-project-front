<script setup>
/**
 * 백엔드 상태값(status)을 뱃지(el-tag)로 표시하는 공통 컴포넌트.
 * constants/enums.js에 정의된 { label, type } 구조를 그대로 사용한다.
 *
 * 사용 예:
 *   <StatusTag :status="row.status" :status-map="ORDER_STATUS" />
 */
defineProps({
  status: {
    type: String,
    required: true,
  },
  statusMap: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <el-tag :type="statusMap[status]?.type ?? 'info'">
    {{ statusMap[status]?.label ?? status }}
  </el-tag>
</template>