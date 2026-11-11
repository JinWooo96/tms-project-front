

<template>
  <div class="cargo-row" @focusin="emit('focus')">
    <div class="cargo-line">
      <span class="index">{{ index + 1 }}</span>

      <el-input-number
          v-model="cargo.widthCm"
          :min="1" :precision="0" :controls="false" placeholder="가로"
          :class="{ 'is-error': dimsError && !cargo.widthCm }"
          aria-label="가로(cm)"
      />
      <el-input-number
          v-model="cargo.lengthCm"
          :min="1" :precision="0" :controls="false" placeholder="세로"
          :class="{ 'is-error': dimsError && !cargo.lengthCm }"
          aria-label="세로(cm)"
      />
      <el-input-number
          v-model="cargo.heightCm"
          :min="1" :precision="0" :controls="false" placeholder="높이"
          :class="{ 'is-error': dimsError && !cargo.heightCm }"
          aria-label="높이(cm)"
      />
      <el-input-number
          v-model="cargo.weightKg"
          :min="0.01" :step="0.1" :controls="false" placeholder="중량"
          :class="{ 'is-error': weightError }"
          aria-label="중량(kg/개)"
      />
      <el-input-number
          v-model="cargo.quantity"
          :min="1" :precision="0" :controls="false" placeholder="개수"
          :class="{ 'is-error': qtyError }"
          aria-label="개수"
      />
      <el-select v-model="cargo.cargoType" aria-label="화물 유형">
        <el-option v-for="o in cargoTypeOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>

      <div class="actions">
        <el-tooltip content="행 복사" placement="top">
          <el-button :icon="CopyDocument" text aria-label="행 복사" @click="emit('copy')" />
        </el-tooltip>
        <el-tooltip content="행 삭제" placement="top">
          <el-button :icon="Close" text aria-label="행 삭제" :disabled="!removable" @click="emit('remove')" />
        </el-tooltip>
      </div>
    </div>

    <div v-if="message.text" class="message" :class="{ 'is-error': message.error }">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { CopyDocument, Close } from '@element-plus/icons-vue';
import { CARGO_TYPE } from '@/constants/enums';
import {
  cargoVolumeM3,
  cargoWeightKg,
  formatNumber,
  hasDimensions,
  hasQuantity,
  hasWeight,
} from '@/utils/orderCalc';

/**
 * 화물 한 줄 입력. 부모(OrderRegisterView)가 만든 cargo 객체의 필드를 직접 v-model로 수정한다.
 * 열 너비는 부모의 헤더 행과 같은 grid-template-columns(--cargo-columns)를 공유해야 정렬이 맞는다.
 */
const props = defineProps({
  cargo: { type: Object, required: true },
  index: { type: Number, required: true },
  removable: { type: Boolean, default: true },
  // 등록 시도 후에만 오류를 표시한다. (입력 중에 빨간색이 먼저 뜨면 사용자가 부담을 느낀다)
  showErrors: { type: Boolean, default: false },
});

const emit = defineEmits(['copy', 'remove', 'focus']);

const cargoTypeOptions = Object.entries(CARGO_TYPE).map(([value, { label }]) => ({ value, label }));

const dimsError = computed(() => props.showErrors && !hasDimensions(props.cargo));
const weightError = computed(() => props.showErrors && !hasWeight(props.cargo));
const qtyError = computed(() => props.showErrors && !hasQuantity(props.cargo));

// 입력칸 아래에 보여줄 한 줄 안내: 오류가 있으면 오류, 없으면 부피/총중량
const message = computed(() => {
  const errors = [];
  if (dimsError.value) errors.push('가로·세로·높이');
  if (weightError.value) errors.push('중량');
  if (qtyError.value) errors.push('개수');
  if (errors.length) return { error: true, text: `${errors.join(', ')}을(를) 입력해주세요.` };

  const parts = [];
  if (hasDimensions(props.cargo) && hasQuantity(props.cargo)) {
    parts.push(`부피 ${formatNumber(cargoVolumeM3(props.cargo))}㎥`);
  }
  if (hasWeight(props.cargo) && hasQuantity(props.cargo)) {
    parts.push(`총중량 ${formatNumber(cargoWeightKg(props.cargo))}kg`);
  }
  return { error: false, text: parts.join(' · ') };
});
</script>

<style scoped>
.cargo-row {
  padding: 6px 0;
}

.cargo-line {
  display: grid;
  grid-template-columns: var(--cargo-columns);
  gap: 10px;
  align-items: center;
}

.index {
  color: var(--tms-text-muted);
}

.cargo-line :deep(.el-input-number),
.cargo-line :deep(.el-select) {
  width: 100%;
}

.cargo-line :deep(.el-input-number .el-input__inner) {
  text-align: left;
}

/* 오류 상태: 해당 입력칸만 빨간 테두리 */
.cargo-line :deep(.el-input-number.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px #dc2626 inset, 0 0 0 3px rgba(220, 38, 38, 0.12);
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

/* 화물 카드(부모의 container) 폭이 좁으면 두 줄 배치: 1줄 규격 3칸 / 2줄 중량·개수·유형 / 3줄 버튼 */
@container (max-width: 700px) {
  .cargo-line {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .index {
    display: none;
  }

  /* 1줄: 가로·세로·높이 (index는 숨겨져 있어 영향 없음) */
  .cargo-line > :nth-child(-n + 4) {
    grid-column: span 2;
  }

  /* 2줄: 중량·개수·유형 */
  .cargo-line > :nth-child(n + 5):nth-child(-n + 7) {
    grid-column: span 2;
  }

  /* 3줄: 복사/삭제 버튼 */
  .actions {
    grid-column: 1 / -1;
  }

  .message {
    padding-left: 0;
  }
}

.message {
  margin-top: 4px;
  padding-left: 38px;
  font-size: 12.5px;
  color: var(--tms-text-muted);
}

.message.is-error {
  color: #dc2626;
}
</style>
