<script setup>
defineOptions({ name: 'OrderRegisterView' });
import { reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useOrderStore } from '@/stores/orderStore';
import { CARGO_TYPE } from '@/constants/enums';
import AddressSearchInput from '@/components/common/AddressSearchInput.vue';
import { useTabs } from '@/composables/useTabs';

const route = useRoute();
const { closeTabAndGo } = useTabs();
const orderStore = useOrderStore();

// 화물 유형 select box에 쓸 옵션 목록. enums.js의 CARGO_TYPE을 기반으로 만든다.
const cargoTypeOptions = Object.entries(CARGO_TYPE).map(([value, { label }]) => ({
  value,
  label,
}));

// CreateOrderRequest DTO와 필드명을 동일하게 맞춘 폼 데이터.
// 이렇게 필드명을 백엔드와 맞춰두면, 별도 변환 없이 그대로 API에 보낼 수 있다.
const form = reactive({
  originAddress: '',
  destAddress: '',
  requestedPickupAt: null,
  requestedDeliveryAt: null,
  cargoList: [createEmptyCargo()],
});

function createEmptyCargo() {
  return {
    widthCm: null,
    lengthCm: null,
    heightCm: null,
    weightKg: null,
    quantity: 1,
    cargoType: 'GENERAL',
  };
}

function addCargoRow() {
  form.cargoList.push(createEmptyCargo());
}

function removeCargoRow(index) {
  // 최소 1개는 남겨둔다 (백엔드도 cargoList가 비어있으면 검증 실패하도록 되어 있음)
  if (form.cargoList.length <= 1) {
    ElMessage.warning('화물은 최소 1개 이상 있어야 합니다.');
    return;
  }
  form.cargoList.splice(index, 1);
}

// el-form 검증 규칙. 백엔드 CreateOrderRequest의 @NotBlank, @NotNull, @Positive 규칙과 맞춘다.
const rules = {
  originAddress: [{ required: true, message: '상차지 주소는 필수입니다.', trigger: 'blur' }],
  destAddress: [{ required: true, message: '도착지 주소는 필수입니다.', trigger: 'blur' }],
};

const formRef = ref(null);
const submitting = ref(false);

async function handleSubmit() {
  // 1. 기본 필드(상/하차지 주소) 검증
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  // 2. 화물 목록 검증 (el-form 규칙만으로 표현하기 번거로운 부분은 직접 체크)
  const invalidCargo = form.cargoList.some(
      (cargo) =>
          !cargo.widthCm ||
          !cargo.lengthCm ||
          !cargo.heightCm ||
          !cargo.weightKg ||
          !cargo.quantity ||
          cargo.widthCm <= 0 ||
          cargo.lengthCm <= 0 ||
          cargo.heightCm <= 0 ||
          cargo.weightKg <= 0 ||
          cargo.quantity <= 0
  );
  if (invalidCargo) {
    ElMessage.error('모든 화물의 규격/중량/개수를 올바르게 입력해주세요.');
    return;
  }

  submitting.value = true;
  try {
    await orderStore.createOrder(form);
    ElMessage.success('운송주문이 등록되었습니다.');
    closeTabAndGo(route.path, '/orders'); // 등록 탭을 닫고 목록 화면으로 이동
  } catch (error) {
    // client.js 인터셉터가 던진 { code, message } 형태의 에러
    ElMessage.error(error.message ?? '운송주문 등록에 실패했습니다.');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="order-register-view">
    <h2>운송주문 등록</h2>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="order-form">
      <el-divider content-position="left">상차/도착 정보</el-divider>

      <el-form-item label="상차지 주소" prop="originAddress">
        <AddressSearchInput v-model="form.originAddress" placeholder="상차지 주소를 검색하세요" />
      </el-form-item>

      <el-form-item label="도착지 주소" prop="destAddress">
        <AddressSearchInput v-model="form.destAddress" placeholder="도착지 주소를 검색하세요" />
      </el-form-item>

      <el-form-item label="상차 희망일시">
        <el-date-picker
            v-model="form.requestedPickupAt"
            type="datetime"
            placeholder="상차 희망일시 선택"
            value-format="YYYY-MM-DDTHH:mm:ss"
        />
      </el-form-item>

      <el-form-item label="도착 희망일시">
        <el-date-picker
            v-model="form.requestedDeliveryAt"
            type="datetime"
            placeholder="도착 희망일시 선택"
            value-format="YYYY-MM-DDTHH:mm:ss"
        />
      </el-form-item>

      <el-divider content-position="left">화물 정보</el-divider>

      <div class="cargo-header">
        <span class="cargo-field cargo-field--dim cargo-header-label">가로(cm)</span>
        <span class="cargo-field cargo-field--dim cargo-header-label">세로(cm)</span>
        <span class="cargo-field cargo-field--dim cargo-header-label">높이(cm)</span>
        <span class="cargo-field cargo-field--weight cargo-header-label">중량(kg)</span>
        <span class="cargo-field cargo-field--qty cargo-header-label">개수</span>
        <span class="cargo-field cargo-field--type cargo-header-label">화물 유형</span>
      </div>

      <div v-for="(cargo, index) in form.cargoList" :key="index" class="cargo-row">
        <el-input-number
            v-model="cargo.widthCm"
            :min="1"
            class="cargo-field cargo-field--dim"
            controls-position="right"
        />
        <el-input-number
            v-model="cargo.lengthCm"
            :min="1"
            class="cargo-field cargo-field--dim"
            controls-position="right"
        />
        <el-input-number
            v-model="cargo.heightCm"
            :min="1"
            class="cargo-field cargo-field--dim"
            controls-position="right"
        />
        <el-input-number
            v-model="cargo.weightKg"
            :min="0.1"
            :step="0.1"
            class="cargo-field cargo-field--weight"
            controls-position="right"
        />
        <el-input-number
            v-model="cargo.quantity"
            :min="1"
            class="cargo-field cargo-field--qty"
            controls-position="right"
        />
        <el-select v-model="cargo.cargoType" placeholder="화물 유형" class="cargo-field cargo-field--type">
          <el-option
              v-for="option in cargoTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
          />
        </el-select>
        <el-button type="danger" plain @click="removeCargoRow(index)">삭제</el-button>
      </div>

      <el-button class="add-cargo-btn" @click="addCargoRow">+ 화물 추가</el-button>

      <el-divider />

      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">등록</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.order-register-view {
  max-width: 1100px;
}

.order-form {
  margin-top: 16px;
}

.cargo-header {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  padding-left: 2px;
}

.cargo-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

/* el-input-number, el-select 공통 폭 지정.
   그리드(el-col) 대신 고정 px 너비를 줘서, 증감 버튼이 옆 필드와 겹치지 않게 한다. */
.cargo-field {
  flex-shrink: 0;
}

.cargo-field--dim {
  width: 130px;
}

.cargo-field--weight {
  width: 150px;
}

.cargo-field--qty {
  width: 120px;
}

.cargo-field--type {
  width: 160px;
}

.cargo-header-label {
  font-size: 13px;
  color: #909399;
}

.add-cargo-btn {
  margin-bottom: 16px;
}
</style>