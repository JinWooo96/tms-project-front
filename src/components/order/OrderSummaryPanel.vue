<script setup>
import { computed } from 'vue';
import { formatNumber } from '@/utils/orderCalc';

/**
 * 주문 요약 패널: 필수 입력 진행률, 항목별 체크, 합계, 등록/취소 버튼.
 * 값 계산은 부모가 하고, 이 컴포넌트는 보여주기만 한다. (나중에 항목이 늘어도 checks 배열만 늘리면 된다)
 */
const props = defineProps({
  // [{ label: '상차지', ok: true }, ...]
  checks: { type: Array, required: true },
  // summarizeCargo() 결과
  summary: { type: Object, required: true },
  // 등록 시도 후에만 미완료 항목을 빨간색으로 표시한다.
  showErrors: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'cancel']);

const doneCount = computed(() => props.checks.filter((c) => c.ok).length);
const percent = computed(() => Math.round((doneCount.value / props.checks.length) * 100));
</script>

<template>
  <aside class="summary-panel">
    <h3>주문 요약</h3>

    <div>
      <div class="progress-label">
        <span>필수 입력</span>
        <b>{{ doneCount }} / {{ checks.length }}</b>
      </div>
      <el-progress :percentage="percent" :show-text="false" :stroke-width="6" />
    </div>

    <ul class="checks">
      <li v-for="c in checks" :key="c.label" :class="{ ok: c.ok, error: !c.ok && showErrors }">
        <span class="mark" aria-hidden="true">{{ c.ok ? '✓' : '○' }}</span>
        <span>{{ c.label }}</span>
      </li>
    </ul>

    <dl class="totals">
      <div>
        <dt>총 개수</dt>
        <dd>{{ formatNumber(summary.totalQuantity, 0) }}<small> 개</small></dd>
      </div>
      <div>
        <dt>총 중량</dt>
        <dd>{{ formatNumber(summary.totalWeightKg) }}<small> kg</small></dd>
      </div>
      <div class="wide">
        <dt>총 부피</dt>
        <dd>{{ formatNumber(summary.totalVolumeM3) }}<small> ㎥</small></dd>
      </div>
    </dl>
    <p v-if="summary.missingWeightCount > 0" class="note">중량이 비어 있는 화물은 총 중량에서 제외됩니다.</p>

    <div class="buttons">
      <el-button type="primary" size="large" :loading="submitting" @click="emit('submit')">주문 등록</el-button>
      <el-button size="large" @click="emit('cancel')">취소</el-button>
    </div>
  </aside>
</template>

<style scoped>
.summary-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border: 1px solid var(--tms-border);
  border-radius: 12px;
}

h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--tms-text-strong);
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12.5px;
  color: var(--tms-text-muted);
}

.progress-label b {
  color: var(--tms-text-strong);
}

.checks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13.5px;
  color: var(--tms-text-muted);
}

.checks li {
  display: flex;
  gap: 8px;
}

.checks .mark {
  font-weight: 700;
}

.checks li.ok {
  color: var(--tms-text);
}

.checks li.ok .mark {
  color: #0f766e;
}

.checks li.error {
  color: #dc2626;
}

.totals {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 0;
  padding-top: 14px;
  border-top: 1px solid var(--tms-border);
}

.totals .wide {
  grid-column: 1 / 3;
}

.totals dt {
  font-size: 12px;
  color: var(--tms-text-muted);
}

.totals dd {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--tms-text-strong);
}

.totals small {
  font-size: 13px;
  font-weight: 500;
}

.note {
  margin: -6px 0 0;
  font-size: 12px;
  color: var(--tms-text-muted);
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.buttons :deep(.el-button) {
  width: 100%;
  margin-left: 0;
}
</style>
