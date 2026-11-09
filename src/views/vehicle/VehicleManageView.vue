<script setup>
defineOptions({ name: 'VehicleManageView' });
import { onActivated, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useVehicleStore } from '@/stores/vehicleStore';
import { VEHICLE_STATUS } from '@/constants/enums';
import StatusTag from '@/components/common/StatusTag.vue';
import AddressSearchInput from '@/components/common/AddressSearchInput.vue';

const vehicleStore = useVehicleStore();

// 자주 쓰이는 톤수를 select 옵션으로 미리 제공하되, 직접 입력(allow-create)도 허용한다.
// (백엔드 vehicleType은 Enum이 아니라 자유 문자열이라, 새 톤수 종류가 생겨도 코드 배포 없이 대응 가능)
const vehicleTypeOptions = ['1TON', '2_5TON', '3_5TON', '5TON', '11TON'];

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
const submitting = ref(false);

const rules = {
  vehicleNo: [{ required: true, message: '차량번호는 필수입니다.', trigger: 'blur' }],
  vehicleType: [{ required: true, message: '차량유형은 필수입니다.', trigger: 'change' }],
  maxWeightKg: [{ required: true, message: '최대 적재중량은 필수입니다.', trigger: 'blur' }],
  bedWidthCm: [{ required: true, message: '적재함 가로 길이는 필수입니다.', trigger: 'blur' }],
  bedLengthCm: [{ required: true, message: '적재함 세로 길이는 필수입니다.', trigger: 'blur' }],
  bedHeightCm: [{ required: true, message: '적재함 높이는 필수입니다.', trigger: 'blur' }],
  baseAddress: [{ required: true, message: '차고지 주소는 필수입니다.', trigger: 'blur' }],
};

async function fetchVehicles() {
  try {
    await vehicleStore.fetchVehicles();
  } catch (error) {
    ElMessage.error(error.message ?? '차량 목록 조회에 실패했습니다.');
  }
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    await vehicleStore.createVehicle(form);
    ElMessage.success('차량이 등록되었습니다.');
    Object.assign(form, createEmptyForm());
    formRef.value.clearValidate();
    await fetchVehicles();
  } catch (error) {
    // 차량번호 중복(DUPLICATE_VEHICLE_NO) 등 서버 검증 실패 시 여기로 온다.
    ElMessage.error(error.message ?? '차량 등록에 실패했습니다.');
  } finally {
    submitting.value = false;
  }
}

// 탭 복귀 시마다 최신 차량 목록을 불러온다.
onActivated(fetchVehicles);
</script>

<template>
  <div class="vehicle-manage-view">
    <h2>차량 관리</h2>

    <el-card class="section-card">
      <template #header>차량 등록</template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px" class="vehicle-form">
        <el-form-item label="차량번호" prop="vehicleNo">
          <el-input v-model="form.vehicleNo" placeholder="예) 12가3456" class="field-input" />
        </el-form-item>

        <el-form-item label="차량유형" prop="vehicleType">
          <el-select v-model="form.vehicleType" filterable allow-create placeholder="톤수 선택 또는 직접 입력" class="field-input">
            <el-option v-for="type in vehicleTypeOptions" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>

        <el-form-item label="최대 적재중량(kg)" prop="maxWeightKg">
          <el-input-number v-model="form.maxWeightKg" :min="1" :step="100" controls-position="right" class="field-input" />
        </el-form-item>

        <el-form-item label="적재함 가로(cm)" prop="bedWidthCm">
          <el-input-number v-model="form.bedWidthCm" :min="1" controls-position="right" class="field-input" />
        </el-form-item>

        <el-form-item label="적재함 세로(cm)" prop="bedLengthCm">
          <el-input-number v-model="form.bedLengthCm" :min="1" controls-position="right" class="field-input" />
        </el-form-item>

        <el-form-item label="적재함 높이(cm)" prop="bedHeightCm">
          <el-input-number v-model="form.bedHeightCm" :min="1" controls-position="right" class="field-input" />
        </el-form-item>

        <el-form-item label="차고지 주소" prop="baseAddress">
          <AddressSearchInput v-model="form.baseAddress" placeholder="차고지 주소를 검색하세요" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">등록</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="section-card">
      <template #header>차량 목록</template>
      <el-table :data="vehicleStore.vehicles" v-loading="vehicleStore.loading" border stripe>
        <el-table-column prop="vehicleNo" label="차량번호" width="140" />
        <el-table-column prop="vehicleType" label="차량유형" width="120" />
        <el-table-column prop="maxWeightKg" label="최대적재중량(kg)" width="150" />
        <el-table-column label="적재함 규격(가로x세로x높이, cm)">
          <template #default="{ row }">
            {{ row.bedWidthCm }} x {{ row.bedLengthCm }} x {{ row.bedHeightCm }}
          </template>
        </el-table-column>
        <el-table-column prop="baseAddress" label="차고지" min-width="200" show-overflow-tooltip />
        <el-table-column label="상태" width="110">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="VEHICLE_STATUS" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.vehicle-manage-view {
  max-width: 900px;
}

.section-card {
  margin-top: 16px;
}

.field-input {
  width: 280px;
}

.field-input-wide {
  width: 420px;
}
</style>