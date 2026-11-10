<template>
  <section class="order-list">
    <div class="order-list__head">
      <el-checkbox
          v-if="!single"
          :model-value="allChecked"
          :indeterminate="indeterminate"
          :disabled="orders.length === 0"
          @change="toggleAll"
      />
      <b class="order-list__title">배차 대기 주문 <span class="count">{{ orders.length }}</span></b>
      <span v-if="single" class="order-list__hint">수동 배정은 한 건씩 진행합니다</span>
    </div>

    <div v-loading="loading" class="order-list__body">
      <div v-if="orders.length === 0 && !loading" class="order-list__empty">배차 대기 중인 주문이 없습니다.</div>

      <div
          v-for="order in orders"
          :key="order.id"
          class="order-item"
          :class="{ 'is-selected': isSelected(order.id) }"
          @click="toggle(order.id)"
      >
        <span v-if="single" class="radio" :class="{ 'is-on': isSelected(order.id) }"><i /></span>
        <el-checkbox v-else :model-value="isSelected(order.id)" @click.stop @change="toggle(order.id)" />

        <div class="order-item__main">
          <div class="order-item__top">
            <b>{{ order.orderNo }}</b>
            <span class="pickup">상차 {{ shortDateTime(order.requestedPickupAt) }}</span>
          </div>
          <div class="order-item__route">{{ order.originAddress }} → {{ order.destAddress }}</div>
          <div class="order-item__chips">
            <span>{{ formatNumber(order.totalWeightKg ?? 0) }} kg</span>
            <span>{{ formatNumber(order.totalVolumeM3 ?? 0) }} ㎥</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!single" class="order-list__foot">
      <b>{{ modelValue.length }}건 선택됨</b>
      <template v-if="modelValue.length">
        · 총 {{ formatNumber(selectedSummary.weight) }} kg · {{ formatNumber(selectedSummary.volume) }} ㎥
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { formatNumber } from '@/utils/orderCalc';

// 배차 대기 주문 목록. single=false: 체크박스 다중 선택(자동 추천) / single=true: 라디오 단일 선택(수동 배정)
const props = defineProps({
  orders: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] }, // 선택된 주문 ID 배열
  single: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const allChecked = computed(() => props.orders.length > 0 && props.modelValue.length === props.orders.length);
const indeterminate = computed(() => props.modelValue.length > 0 && !allChecked.value);

// 선택된 주문들의 중량/부피 합계 (하단 요약용)
const selectedSummary = computed(() => {
  const picked = props.orders.filter((o) => props.modelValue.includes(o.id));
  return {
    weight: picked.reduce((s, o) => s + Number(o.totalWeightKg ?? 0), 0),
    volume: picked.reduce((s, o) => s + Number(o.totalVolumeM3 ?? 0), 0),
  };
});

function isSelected(id) {
  return props.modelValue.includes(id);
}

function toggle(id) {
  if (props.single) {
    emit('update:modelValue', [id]);
    return;
  }
  emit(
      'update:modelValue',
      isSelected(id) ? props.modelValue.filter((v) => v !== id) : [...props.modelValue, id],
  );
}

function toggleAll(checked) {
  emit('update:modelValue', checked ? props.orders.map((o) => o.id) : []);
}

// "2026-11-11T09:00:00" -> "11-11 09:00"
function shortDateTime(value) {
  return value ? value.slice(5, 16).replace('T', ' ') : '-';
}
</script>

<style scoped>
.order-list { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
.order-list__head { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid #e2e8f0; }
.order-list__title { flex: 1; font-size: 15px; color: #0f172a; }
.count { color: #2563eb; }
.order-list__hint { font-size: 12.5px; color: #64748b; }
.order-list__body { flex: 1; min-height: 160px; max-height: calc(100vh - 330px); overflow-y: auto; }
.order-list__empty { padding: 40px 16px; text-align: center; color: #94a3b8; }
.order-item { display: flex; gap: 12px; padding: 13px 16px; border-bottom: 1px solid #eef2f7; border-left: 3px solid transparent; cursor: pointer; }
.order-item:hover { background: #f8fafc; }
.order-item.is-selected { background: #eef4ff; border-left-color: #2563eb; }
.order-item__main { flex: 1; min-width: 0; }
.order-item__top { display: flex; align-items: center; gap: 8px; color: #0f172a; }
.order-item__top b { font-variant-numeric: tabular-nums; }
.pickup { margin-left: auto; font-size: 12.5px; color: #64748b; }
.order-item__route { margin-top: 4px; font-size: 13px; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.order-item__chips { display: flex; gap: 6px; margin-top: 6px; }
.order-item__chips span { padding: 2px 8px; border-radius: 6px; background: #f1f5f9; font-size: 12px; color: #475569; }
.order-list__foot { padding: 12px 16px; border-top: 1px solid #e2e8f0; background: #f8fafc; font-size: 13px; color: #475569; }
.order-list__foot b { color: #0f172a; }

/* 단일 선택용 라디오 */
.radio { flex: none; width: 18px; height: 18px; margin-top: 2px; border-radius: 50%; border: 2px solid #94a3b8; box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
.radio i { width: 8px; height: 8px; border-radius: 50%; background: transparent; }
.radio.is-on { border-color: #2563eb; }
.radio.is-on i { background: #2563eb; }
</style>