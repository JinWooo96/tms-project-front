<template>
  <div class="load-bar">
    <div v-if="label" class="load-bar__head">
      <span class="load-bar__label">{{ label }}</span>
      <b>{{ pct }}%</b>
    </div>
    <div class="load-bar__track" :style="{ height: height + 'px' }">
      <div
          class="load-bar__fill"
          :class="{ 'is-over': pct > 100 }"
          :style="{ width: Math.min(pct, 100) + '%', height: height + 'px' }"
      />
    </div>
  </div>
</template>

<script setup>
// 적재율 막대. 100%를 넘으면 빨간색으로 표시한다.
defineProps({
  pct: { type: Number, default: 0 },
  label: { type: String, default: '' },
  height: { type: Number, default: 8 },
});
</script>

<style scoped>
.load-bar__head { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12.5px; color: #475569; }
.load-bar__head b { color: #0f172a; }
.load-bar__track { background: #e2e8f0; border-radius: 4px; }
.load-bar__fill { background: #2563eb; border-radius: 4px; transition: width 0.2s; }
.load-bar__fill.is-over { background: #dc2626; }
</style>