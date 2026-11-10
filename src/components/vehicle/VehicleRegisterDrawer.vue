<template>
  <el-drawer
      :model-value="modelValue"
      title="차량 등록"
      direction="rtl"
      size="460px"
      :close-on-click-modal="false"
      @update:model-value="emit('update:modelValue', $event)"
      @closed="resetForm"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="vehicle-form">
      <el-form-item label="차량번호" prop="vehicleNo">
        <el-input v-model="form.vehicleNo" placeholder="예) 12가 3456" maxlength="20" />
      </el-form-item>

      <el-form-item label="차량유형" prop="vehicleType">
        <div class="type-field">
          <div class="type-chips">
            <button
                v-for="type in VEHICLE_TYPES"
                :key="type.value"
                type="button"
                class="chip"
                :class="{ 'is-active': !customType && form.vehicleType === type.value }"
                @click="selectType(type.value)"
            >
              {{ type.label }}
            </button>
            <button type="button" class="chip" :class="{ 'is-active': customType }" @click="selectCustomType">
              직접 입력
            </button>
          </div>
          <el-input v-if="customType" v-model="form.vehicleType" placeholder="예) 8TON" maxlength="20" class="custom-type" />
        </div>
      </el-form-item>

      <el-form-item label="최대 적재중량" prop="maxWeightKg" class="weight-item">
        <el-input-number v-model="form.maxWeightKg" :min="1" :controls="false" class="full-width" />
        <span class="unit">kg</span>
      </el-form-item>

      <el-form-item label="적재함 규격 (가로 × 세로 × 높이)" required>
        <div class="bed-inputs">
          <el-form-item prop="bedWidthCm" class="bed-item">
            <el-input-number v-model="form.bedWidthCm" :min="1" :controls="false" placeholder="가로" />
          </el-form-item>
          <el-form-item prop="bedLengthCm" class="bed-item">
            <el-input-number v-model="form.bedLengthCm" :min="1" :controls="false" placeholder="세로" />
          </el-form-item>
          <el-form-item prop="bedHeightCm" class="bed-item">
            <el-input-number v-model="form.bedHeightCm" :min="1" :controls="false" placeholder="높이" />
          </el-form-item>
        </div>
        <div v-if="bedPreview" class="bed-preview">
          적재함 부피 <b>{{ formatNumber(bedPreview.volumeM3) }} ㎥</b> · 표준 파레트 약
          <b>{{ bedPreview.palletCount }}개</b> 적재 가능
        </div>
      </el-form-item>

      <el-form-item label="차고지 주소" prop="baseAddress">
        <AddressSearchInput v-model="form.baseAddress" placeholder="차고지 주소를 검색하세요" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">취소</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">등록</el-button>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import AddressSearchInput from '@/components/common/AddressSearchInput.vue';
import { VEHICLE_TYPES } from '@/constants/vehicleTypes';
import { CARGO_PRESETS } from '@/constants/cargoPresets';
import { formatNumber } from '@/utils/orderCalc';

// 차량 등록 폼(드로어). 서버 호출은 하지 않고, 검증을 통과한 값을 submit 이벤트로 부모에 넘긴다.
defineProps({
  modelValue: { type: Boolean, default: false }, // 드로어 열림 여부 (v-model)
  submitting: { type: Boolean, default: false }, // 부모가 등록 요청 중일 때 버튼에 로딩 표시
});
const emit = defineEmits(['update:modelValue', 'submit']);

function createEmptyForm() {
  return {
    vehicleNo: '',
    vehicleType: '',
    maxWeightKg: null,
    bedWidthCm: null,
    bedLengthCm: null,
    bedHeightCm: null,
    baseAddress: '',
  };
}

const form = reactive(createEmptyForm());
const formRef = ref(null);
const customType = ref(false); // "직접 입력" 칩 선택 여부

const rules = {
  vehicleNo: [{ required: true, message: '차량번호는 필수입니다.', trigger: 'blur' }],
  vehicleType: [{ required: true, message: '차량유형을 선택해주세요.', trigger: 'change' }],
  maxWeightKg: [{ required: true, message: '최대 적재중량은 필수입니다.', trigger: 'blur' }],
  bedWidthCm: [{ required: true, message: '가로를 입력해주세요.', trigger: 'blur' }],
  bedLengthCm: [{ required: true, message: '세로를 입력해주세요.', trigger: 'blur' }],
  bedHeightCm: [{ required: true, message: '높이를 입력해주세요.', trigger: 'blur' }],
  baseAddress: [{ required: true, message: '차고지 주소는 필수입니다.', trigger: 'change' }],
};

// 프리셋 칩 선택 (직접 입력 모드 해제)
function selectType(value) {
  customType.value = false;
  form.vehicleType = value;
  formRef.value?.clearValidate('vehicleType');
}

// "직접 입력" 칩 선택: 기존 값을 비우고 입력칸을 연다.
function selectCustomType() {
  customType.value = true;
  form.vehicleType = '';
}

// 적재함 부피(㎥)와 표준 파레트 적재 가능 개수(부피 기준 추정치). 세 값이 모두 있을 때만 보여준다.
const bedPreview = computed(() => {
  const { bedWidthCm, bedLengthCm, bedHeightCm } = form;
  if (!bedWidthCm || !bedLengthCm || !bedHeightCm) return null;
  const volumeCm3 = bedWidthCm * bedLengthCm * bedHeightCm;
  const pallet = CARGO_PRESETS.find((p) => p.key === 'PALLET');
  const palletCm3 = pallet.widthCm * pallet.lengthCm * pallet.heightCm;
  return { volumeM3: volumeCm3 / 1_000_000, palletCount: Math.floor(volumeCm3 / palletCm3) };
});

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  emit('submit', { ...form, vehicleNo: form.vehicleNo.trim(), vehicleType: form.vehicleType.trim() });
}

// 드로어가 닫힌 뒤 폼을 초기화한다.
function resetForm() {
  Object.assign(form, createEmptyForm());
  customType.value = false;
  formRef.value?.clearValidate();
}
</script>

<style scoped>
.type-field { width: 100%; }
.type-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { padding: 7px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; color: #475569; font-size: 14px; cursor: pointer; }
.chip:hover { border-color: #93b4f5; }
.chip.is-active { border-color: #2563eb; background: #eef4ff; color: #1e4fbc; font-weight: 700; }
.custom-type { margin-top: 8px; }

.full-width { flex: 1; }
.full-width :deep(.el-input__wrapper) { width: 100%; }
.unit { margin-left: 8px; color: #64748b; }
.weight-item :deep(.el-form-item__content) { flex-wrap: nowrap; }

/* 주소 검색 입력칸이 폼 폭을 꽉 채우도록 한다. */
.vehicle-form :deep(.address-search-input) { width: 100%; }
.vehicle-form :deep(.address-search-input .el-input) { flex: 1; min-width: 0; }

.bed-inputs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; width: 100%; }
.bed-item { margin-bottom: 0; }
.bed-item :deep(.el-input-number) { width: 100%; }
.bed-preview { width: 100%; margin-top: 8px; padding: 10px 14px; border-radius: 8px; background: #eef4ff; color: #1e4fbc; font-size: 13.5px; line-height: 1.5; }
</style>