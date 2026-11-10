<template>
  <div class="manual-panel">
    <div v-if="!order" class="placeholder">왼쪽에서 배차할 주문을 선택해주세요.</div>

    <template v-else>
      <div class="summary">
        <div class="summary__main">
          <div class="label">선택한 주문</div>
          <b class="no">{{ order.orderNo }}</b>
          <span class="route">{{ order.originAddress }} → {{ order.destAddress }}</span>
        </div>
        <div class="stat"><div class="label">총 중량</div><b>{{ formatNumber(order.totalWeightKg ?? 0) }}<small> kg</small></b></div>
        <div class="stat"><div class="label">총 부피</div><b>{{ formatNumber(order.totalVolumeM3 ?? 0) }}<small> ㎥</small></b></div>
      </div>

      <div class="list-head">
        <b>배차 가능 차량 <span class="count">{{ cards.length }}</span></b>
        <span class="hint">적재율이 높은 순으로 보여줍니다.</span>
      </div>

      <div v-loading="loading" class="cards">
        <div v-if="!loading && cards.length === 0" class="placeholder wide">
          이 주문을 감당할 수 있는 배차 가능 차량이 없습니다.
        </div>

        <div
            v-for="{ vehicle, rate } in cards"
            :key="vehicle.id"
            class="vehicle-card"
            :class="{ 'is-selected': vehicle.id === selectedVehicleId }"
            @click="selectedVehicleId = vehicle.id"
        >
          <div class="vehicle-card__head">
            <b>{{ vehicle.vehicleNo }}</b>
            <span class="type">{{ vehicle.vehicleType }}</span>
            <el-tag class="fit" size="small" :type="rate.fit.type" effect="light">{{ rate.fit.label }}</el-tag>
          </div>
          <div class="spec">
            적재함 {{ vehicle.bedWidthCm }}×{{ vehicle.bedLengthCm }}×{{ vehicle.bedHeightCm }} cm ·
            최대 {{ formatNumber(vehicle.maxWeightKg) }} kg
          </div>
          <LoadBar :pct="rate.weightPct" label="중량" />
          <LoadBar :pct="rate.volumePct" label="부피" class="second" />
        </div>
      </div>

      <div class="confirm-bar">
        <div class="confirm-bar__text">
          <template v-if="selected">
            <b>{{ selected.vehicle.vehicleNo }}</b> ({{ selected.vehicle.vehicleType }}) 선택됨 ·
            중량 {{ selected.rate.weightPct }}% · 부피 {{ selected.rate.volumePct }}%
          </template>
          <template v-else>차량을 선택해주세요.</template>
        </div>
        <el-button type="primary" size="large" :disabled="!selected" :loading="confirming" @click="handleConfirm">
          배차 확정
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { calcLoadRate } from '@/utils/loadRate';
import { formatNumber } from '@/utils/orderCalc';
import LoadBar from './LoadBar.vue';

// 수동 배정 탭: 선택한 주문 요약 + 배차 가능 차량 카드(적재율) + 확정 바
const props = defineProps({
  order: { type: Object, default: null },            // 왼쪽 목록에서 선택한 주문
  vehicles: { type: Array, default: () => [] },      // 배차 가능 차량
  loading: { type: Boolean, default: false },
  confirming: { type: Boolean, default: false },
});
const emit = defineEmits(['confirm']);

const selectedVehicleId = ref(null);

// 주문이 바뀌면 이전에 고른 차량은 초기화한다.
watch(() => props.order?.id, () => { selectedVehicleId.value = null; });

// 차량 카드 목록: 적재율이 높은(= 효율적인) 순으로 정렬한다.
const cards = computed(() => {
  if (!props.order) return [];
  return props.vehicles
      .map((vehicle) => ({ vehicle, rate: calcLoadRate(props.order, vehicle) }))
      .sort((a, b) => b.rate.maxPct - a.rate.maxPct);
});

const selected = computed(() => cards.value.find((c) => c.vehicle.id === selectedVehicleId.value) ?? null);

function handleConfirm() {
  if (selected.value) emit('confirm', selected.value.vehicle.id);
}
</script>

<style scoped>
.placeholder { padding: 60px 0; text-align: center; color: #94a3b8; }
.placeholder.wide { grid-column: 1 / -1; padding: 40px 0; }
.summary { display: flex; align-items: center; gap: 24px; padding: 16px 20px; border-bottom: 1px solid #eef2f7; }
.summary__main { flex: 1; min-width: 0; }
.label { font-size: 12.5px; color: #64748b; }
.no { font-size: 17px; color: #0f172a; margin-right: 10px; }
.route { color: #475569; }
.stat b { font-size: 18px; color: #0f172a; }
.stat small { font-size: 13px; font-weight: 500; }
.list-head { display: flex; align-items: center; padding: 14px 20px 0; }
.list-head b { flex: 1; font-size: 14px; color: #0f172a; }
.count { color: #2563eb; }
.hint { font-size: 12.5px; color: #64748b; }
.cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding: 12px 20px 16px; align-content: start; min-height: 120px; }
.vehicle-card { padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; cursor: pointer; }
.vehicle-card:hover { border-color: #93b4f5; }
.vehicle-card.is-selected { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12); }
.vehicle-card__head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.vehicle-card__head b { font-size: 15.5px; color: #0f172a; }
.type { padding: 2px 9px; border-radius: 999px; background: #f1f5f9; color: #475569; font-size: 12px; font-weight: 600; }
.fit { margin-left: auto; }
.spec { margin-bottom: 12px; font-size: 12.5px; color: #64748b; }
.second { margin-top: 8px; }
.confirm-bar { display: flex; align-items: center; gap: 16px; padding: 14px 20px; border-top: 1px solid #e2e8f0; background: #f8fafc; }
.confirm-bar__text { flex: 1; color: #475569; }
.confirm-bar__text b { color: #0f172a; }

@container (max-width: 640px) {
  .cards { grid-template-columns: minmax(0, 1fr); }
  .summary { flex-wrap: wrap; }
}
</style>