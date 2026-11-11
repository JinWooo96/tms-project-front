<template>
  <div class="quick-chips" role="group" :aria-label="ariaLabel">
    <button
        v-for="option in options"
        :key="option.label"
        type="button"
        class="chip"
        :class="{ 'is-active': activeValue !== null && option.value === activeValue }"
        :disabled="option.disabled"
        @click="emit('select', option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
/**
 * 입력칸 아래에 붙는 "빠른 선택" 칩 목록. (날짜 빠른 선택, 화물 규격 프리셋 등에 공통 사용)
 * options: [{ label, value, disabled? }]  /  activeValue와 같은 value의 칩은 선택 상태로 표시한다.
 */
defineProps({
  options: { type: Array, required: true },
  activeValue: { type: [String, Number, null], default: null },
  ariaLabel: { type: String, default: '빠른 선택' },
});

const emit = defineEmits(['select']);
</script>

<style scoped>
.quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 4px 10px;
  border: 0;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
}

.chip:hover:not(:disabled) {
  background: var(--el-color-primary-light-8);
}

.chip.is-active {
  background: var(--el-color-primary);
  color: #fff;
}

.chip:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

.chip:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}
</style>
