<template>
  <div class="auto-panel">
    <div class="toolbar">
      <el-button :loading="recommending" @click="emit('recommend-all')">전체 자동배차 추천</el-button>
      <el-button
          type="primary"
          :disabled="selectedCount === 0"
          :loading="recommending"
          @click="emit('recommend-selected')"
      >
        선택 {{ selectedCount }}건 자동배차 추천
      </el-button>
    </div>

    <div v-if="!hasRun" class="placeholder">
      왼쪽에서 주문을 선택한 뒤 자동배차 추천을 실행해주세요.
    </div>

    <template v-else>
      <div class="tiles">
        <div class="tile"><span>배정 추천</span><b>{{ recommendations.length }}<small>건</small></b></div>
        <div class="tile" :class="{ warn: unassignedOrders.length }">
          <span>미배정</span><b>{{ unassignedOrders.length }}<small>건</small></b>
        </div>
        <div class="tile"><span>총 이동거리</span><b>{{ formatNumber(totalDistanceKm, 1) }}<small>km</small></b></div>
      </div>

      <el-table :data="rows" row-key="orderId" empty-text="추천 가능한 배정 조합이 없습니다.">
        <el-table-column label="주문" min-width="220">
          <template #default="{ row }">
            <b class="order-no">{{ row.orderNo }}</b>
            <div v-if="row.order" class="sub">{{ row.order.originAddress }} → {{ row.order.destAddress }}</div>
          </template>
        </el-table-column>
        <el-table-column label="추천 차량" width="150">
          <template #default="{ row }">
            <b>{{ row.vehicleNo }}</b>
            <div v-if="row.vehicle" class="sub">{{ row.vehicle.vehicleType }}</div>
          </template>
        </el-table-column>
        <el-table-column label="적재율(중량)" width="170">
          <template #default="{ row }">
            <LoadBar v-if="row.rate" :pct="row.rate.weightPct" label="" :height="6" />
            <span v-if="row.rate" class="pct">{{ row.rate.weightPct }}%</span>
            <span v-else class="sub">-</span>
          </template>
        </el-table-column>
        <el-table-column label="거리" width="100" align="right">
          <template #default="{ row }">{{ formatNumber(row.distanceKm, 1) }} km</template>
        </el-table-column>
        <el-table-column label="" width="90" align="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain :disabled="confirming" @click="emit('confirm-one', row)">확정</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="unassignedOrders.length" class="unassigned">
        <b>배정되지 못한 주문 {{ unassignedOrders.length }}건</b>
        <span class="sub"> (적합한 차량이 없거나 차량 수가 부족합니다)</span>
        <div class="unassigned__list">
          <span v-for="o in unassignedOrders" :key="o.id" class="unassigned__item">
            {{ o.orderNo }}
            <el-link type="primary" underline="never" @click="emit('go-manual', o.id)">수동 배정</el-link>
          </span>
        </div>
      </div>

      <div class="foot">
        <el-button
            type="primary"
            size="large"
            :disabled="recommendations.length === 0"
            :loading="confirming"
            @click="emit('confirm-all')"
        >
          추천 {{ recommendations.length }}건 모두 확정
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { calcLoadRate } from '@/utils/loadRate';
import { formatNumber } from '@/utils/orderCalc';
import LoadBar from './LoadBar.vue';

// 자동 추천 탭: 추천 실행 버튼 + 요약 + 추천 결과 표 + 일괄 확정
const props = defineProps({
  selectedCount: { type: Number, default: 0 },
  orderMap: { type: Object, default: () => ({}) },   // { [orderId]: 주문 }
  vehicleMap: { type: Object, default: () => ({}) }, // { [vehicleId]: 차량 }
  recommendations: { type: Array, default: () => [] },
  unassignedOrderIds: { type: Array, default: () => [] },
  hasRun: { type: Boolean, default: false },         // 추천을 한 번이라도 실행했는지
  recommending: { type: Boolean, default: false },
  confirming: { type: Boolean, default: false },
});
const emit = defineEmits(['recommend-all', 'recommend-selected', 'confirm-one', 'confirm-all', 'go-manual']);

// 추천 한 줄 + 주문/차량 정보 + 적재율(프론트 계산)
const rows = computed(() =>
    props.recommendations.map((rec) => {
      const order = props.orderMap[rec.orderId];
      const vehicle = props.vehicleMap[rec.vehicleId];
      return { ...rec, order, vehicle, rate: order && vehicle ? calcLoadRate(order, vehicle) : null };
    }),
);

const totalDistanceKm = computed(() =>
    props.recommendations.reduce((sum, r) => sum + Number(r.distanceKm ?? 0), 0),
);

const unassignedOrders = computed(() =>
    props.unassignedOrderIds.map((id) => ({ id, orderNo: props.orderMap[id]?.orderNo ?? `주문 #${id}` })),
);
</script>

<style scoped>
.auto-panel { padding: 16px 20px 20px; }
.toolbar { display: flex; gap: 8px; margin-bottom: 16px; }
.placeholder { padding: 60px 0; text-align: center; color: #94a3b8; }
.tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.tile { padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; }
.tile span { display: block; font-size: 12.5px; color: #64748b; }
.tile b { font-size: 22px; color: #0f172a; }
.tile small { margin-left: 3px; font-size: 13px; font-weight: 500; }
.tile.warn { background: #fffbeb; border-color: #fde68a; }
.tile.warn b { color: #b45309; }
.order-no { color: #2563eb; font-variant-numeric: tabular-nums; }
.sub { font-size: 12.5px; color: #64748b; }
.pct { font-size: 12.5px; font-weight: 600; color: #0f172a; }
.unassigned { margin-top: 16px; padding: 12px 16px; border: 1px solid #fde68a; background: #fffbeb; border-radius: 10px; color: #92400e; }
.unassigned__list { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 8px; }
.unassigned__item { display: inline-flex; gap: 8px; align-items: center; font-variant-numeric: tabular-nums; }
.foot { margin-top: 16px; text-align: right; }
</style>