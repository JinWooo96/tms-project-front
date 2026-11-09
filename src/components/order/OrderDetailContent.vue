<script setup>
import { computed } from 'vue';
import { CARGO_TYPE } from '@/constants/enums';
import { formatNumber, summarizeCargo } from '@/utils/orderCalc';

/**
 * 운송주문 상세 내용(경로·일정, 화물 목록, 합계, 등록/수정일시).
 * 모달, 드로어, 상세 탭 어디에 넣어도 쓸 수 있도록 "내용"만 담당한다. (껍데기는 부모가 정한다)
 */
const props = defineProps({
  // OrderResponse (GET /api/orders/{id} 응답)
  order: { type: Object, required: true },
});

const summary = computed(() => summarizeCargo(props.order.cargoList ?? []));

function formatDateTime(value) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 16); // 'YYYY-MM-DD HH:mm'까지만 표시
}

function cargoTypeLabel(type) {
  return CARGO_TYPE[type]?.label ?? type;
}
</script>

<template>
  <div class="order-detail">
    <!-- 상차 -> 도착 -->
    <div class="route">
      <div class="stop stop-pickup">
        <div class="stop-label">상차</div>
        <div class="stop-address">{{ order.originAddress }}</div>
        <div class="stop-time">희망 {{ formatDateTime(order.requestedPickupAt) }}</div>
      </div>
      <div class="arrow" aria-hidden="true">→</div>
      <div class="stop stop-dest">
        <div class="stop-label">도착</div>
        <div class="stop-address">{{ order.destAddress }}</div>
        <div class="stop-time">희망 {{ formatDateTime(order.requestedDeliveryAt) }}</div>
      </div>
    </div>

    <!-- 화물 목록 -->
    <div class="cargo">
      <div class="cargo-head">
        <h3>화물 목록</h3>
        <span class="totals">
          총 {{ formatNumber(summary.totalQuantity, 0) }}개 · {{ formatNumber(summary.totalWeightKg) }}kg ·
          {{ formatNumber(summary.totalVolumeM3) }}㎥
        </span>
      </div>

      <el-table :data="order.cargoList" size="small" class="cargo-table">
        <el-table-column label="규격 (가×세×높, cm)" min-width="170">
          <template #default="{ row }">{{ row.widthCm }} × {{ row.lengthCm }} × {{ row.heightCm }}</template>
        </el-table-column>
        <el-table-column label="중량/개" width="100">
          <template #default="{ row }">{{ formatNumber(row.weightKg) }} kg</template>
        </el-table-column>
        <el-table-column prop="quantity" label="개수" width="70" />
        <el-table-column label="유형" width="80">
          <template #default="{ row }">{{ cargoTypeLabel(row.cargoType) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 등록/수정 일시 -->
    <div class="meta">
      <span>등록 <b>{{ formatDateTime(order.createdAt) }}</b></span>
      <span>최종 수정 <b>{{ formatDateTime(order.updatedAt) }}</b></span>
    </div>
  </div>
</template>

<style scoped>
.order-detail {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.route {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 36px minmax(0, 1fr);
  align-items: stretch;
}

.stop {
  padding: 12px 16px;
  border: 1px solid var(--tms-border);
  border-radius: 10px;
}

.stop-pickup {
  border-top: 4px solid var(--el-color-primary);
}

.stop-dest {
  border-top: 4px solid #0f766e;
}

.stop-label {
  font-size: 12.5px;
  font-weight: 700;
}

.stop-pickup .stop-label {
  color: var(--el-color-primary);
}

.stop-dest .stop-label {
  color: #0f766e;
}

.stop-address {
  margin-top: 6px;
  font-weight: 600;
  color: var(--tms-text-strong);
  word-break: keep-all;
}

.stop-time {
  margin-top: 4px;
  font-size: 13px;
  color: var(--tms-text-muted);
}

.arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 20px;
}

.cargo-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.cargo-head h3 {
  margin: 0;
  font-size: 14px;
  color: var(--tms-text-strong);
}

.totals {
  font-size: 13px;
  color: var(--tms-text-muted);
}

/* 표 헤더를 목록 화면과 같은 톤으로 맞춘다. */
.cargo-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: var(--tms-text-muted);
  border: 1px solid var(--tms-border);
  border-radius: 10px;
}

.meta {
  display: flex;
  gap: 32px;
  font-size: 13px;
  color: var(--tms-text-muted);
}

.meta b {
  font-weight: 500;
  color: var(--tms-text);
}

/* 화면이 좁으면 상차/도착 카드를 세로로 쌓는다. */
@media (max-width: 600px) {
  .route {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }

  .arrow {
    transform: rotate(90deg);
  }
}
</style>