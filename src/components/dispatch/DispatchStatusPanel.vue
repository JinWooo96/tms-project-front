<template>
  <section class="status-panel">
    <div class="status-panel__toolbar">
      <el-radio-group :model-value="filter" @update:model-value="emit('update:filter', $event)">
        <el-radio-button value="CONFIRMED">배차 확정</el-radio-button>
        <el-radio-button value="CANCELLED">배차 취소</el-radio-button>
        <el-radio-button value="ALL">전체</el-radio-button>
      </el-radio-group>
      <span class="spacer" />
      <span v-if="lastFetchedAt" class="fetched">마지막 갱신 {{ lastFetchedAt }} · 30초마다 자동 갱신</span>
      <el-button :loading="loading" @click="emit('refresh')">새로고침</el-button>
    </div>

    <el-table :data="dispatches" v-loading="loading" row-key="id" empty-text="조회된 배차가 없습니다.">
      <el-table-column label="주문번호" min-width="200">
        <template #default="{ row }"><b class="order-no">{{ row.orderNo }}</b></template>
      </el-table-column>
      <el-table-column label="차량" width="180">
        <template #default="{ row }">
          <b>{{ row.vehicleNo }}</b>
          <div v-if="vehicleByNo[row.vehicleNo]" class="sub">{{ vehicleByNo[row.vehicleNo].vehicleType }}</div>
        </template>
      </el-table-column>
      <el-table-column label="상태" width="120">
        <template #default="{ row }"><StatusTag :status="row.dispatchStatus" :status-map="DISPATCH_STATUS" /></template>
      </el-table-column>
      <el-table-column label="배차확정 일시" width="160">
        <template #default="{ row }">{{ shortDateTime(row.assignedAt) }}</template>
      </el-table-column>
      <el-table-column label="" width="100" align="right">
        <template #default="{ row }">
          <el-button v-if="row.dispatchStatus === 'CONFIRMED'" size="small" type="danger" plain @click="emit('cancel', row)">
            취소
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="status-panel__foot">총 {{ dispatches.length }}건</div>
  </section>
</template>

<script setup>
import { DISPATCH_STATUS } from '@/constants/enums';
import StatusTag from '@/components/common/StatusTag.vue';

// 배차 현황 화면: 상태 필터 + 갱신 정보 + 배차 목록 + 취소 버튼
defineProps({
  filter: { type: String, default: 'CONFIRMED' }, // CONFIRMED | CANCELLED | ALL
  dispatches: { type: Array, default: () => [] },
  vehicleByNo: { type: Object, default: () => ({}) }, // { [차량번호]: 차량 } - 톤수 표시용
  loading: { type: Boolean, default: false },
  lastFetchedAt: { type: String, default: '' },
});
const emit = defineEmits(['update:filter', 'refresh', 'cancel']);

// "2026-11-10T13:58:12" -> "11-10 13:58"
function shortDateTime(value) {
  return value ? value.slice(5, 16).replace('T', ' ') : '-';
}
</script>

<style scoped>
.status-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
.status-panel__toolbar { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid #e2e8f0; }
.spacer { flex: 1; }
.fetched { font-size: 12.5px; color: #64748b; }
.order-no { color: #2563eb; font-variant-numeric: tabular-nums; }
.sub { font-size: 12.5px; color: #64748b; }
.status-panel__foot { padding: 12px 20px; border-top: 1px solid #e2e8f0; color: #64748b; }
</style>