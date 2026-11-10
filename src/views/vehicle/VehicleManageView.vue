<template>
  <div class="vehicle-manage-view">
    <div class="page-head">
      <div>
        <h2>차량 관리</h2>
        <p>배차에 사용할 차량을 등록하고 상태를 확인합니다.</p>
      </div>
      <el-button type="primary" size="large" @click="drawerVisible = true">+ 차량 등록</el-button>
    </div>

    <section class="list-card">
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="차량번호 검색" clearable class="search-input">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-radio-group v-model="statusFilter">
          <el-radio-button value="ALL">전체 {{ vehicleStore.vehicles.length }}</el-radio-button>
          <el-radio-button v-for="s in STATUS_FILTERS" :key="s.value" :value="s.value">
            {{ s.label }} {{ statusCounts[s.value] ?? 0 }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <el-table :data="filteredVehicles" v-loading="vehicleStore.loading" row-key="id" empty-text="조회된 차량이 없습니다.">
        <el-table-column label="차량번호" width="150">
          <template #default="{ row }"><b>{{ row.vehicleNo }}</b></template>
        </el-table-column>
        <el-table-column label="차량유형" width="110">
          <template #default="{ row }"><span class="type-pill">{{ formatVehicleType(row.vehicleType) }}</span></template>
        </el-table-column>
        <el-table-column label="최대적재중량" width="140">
          <template #default="{ row }">{{ formatNumber(row.maxWeightKg) }} kg</template>
        </el-table-column>
        <el-table-column label="적재함 규격 (부피)" min-width="180">
          <template #default="{ row }">
            {{ row.bedWidthCm }}×{{ row.bedLengthCm }}×{{ row.bedHeightCm }} cm
            <div class="sub">{{ formatNumber(bedVolumeM3(row)) }} ㎥</div>
          </template>
        </el-table-column>
        <el-table-column prop="baseAddress" label="차고지" min-width="220" show-overflow-tooltip />
        <el-table-column label="상태" width="110">
          <template #default="{ row }"><StatusTag :status="row.status" :status-map="VEHICLE_STATUS" /></template>
        </el-table-column>
        <el-table-column label="" width="90" align="right">
          <template #default="{ row }">
            <el-tooltip :disabled="row.status !== 'ASSIGNED'" content="배차 중인 차량은 삭제할 수 없습니다." placement="left">
              <span>
                <el-button size="small" type="danger" plain :disabled="row.status === 'ASSIGNED'" @click="handleDelete(row)">
                  삭제
                </el-button>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <div class="list-foot">총 {{ filteredVehicles.length }}대</div>
    </section>

    <VehicleRegisterDrawer v-model="drawerVisible" :submitting="submitting" @submit="handleRegister" />
  </div>
</template>

<script setup>
defineOptions({ name: 'VehicleManageView' });
import { computed, onActivated, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { useVehicleStore } from '@/stores/vehicleStore';
import { VEHICLE_STATUS } from '@/constants/enums';
import { formatVehicleType } from '@/constants/vehicleTypes';
import { bedVolumeM3 } from '@/utils/loadRate';
import { formatNumber } from '@/utils/orderCalc';
import StatusTag from '@/components/common/StatusTag.vue';
import VehicleRegisterDrawer from '@/components/vehicle/VehicleRegisterDrawer.vue';

const vehicleStore = useVehicleStore();

// 상태 필터 칩 (전체는 별도로 처리)
const STATUS_FILTERS = [
  { value: 'AVAILABLE', label: '운행가능' },
  { value: 'ASSIGNED', label: '배차중' },
  { value: 'MAINTENANCE', label: '정비중' },
];

const drawerVisible = ref(false);
const submitting = ref(false);
const keyword = ref('');
const statusFilter = ref('ALL');

// 상태별 대수 (칩에 표시)
const statusCounts = computed(() =>
    vehicleStore.vehicles.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] ?? 0) + 1;
      return acc;
    }, {}),
);

// 상태 필터 + 차량번호 검색(공백 무시)을 적용한 목록
const filteredVehicles = computed(() => {
  const key = keyword.value.replace(/\s/g, '');
  return vehicleStore.vehicles.filter(
      (v) =>
          (statusFilter.value === 'ALL' || v.status === statusFilter.value) &&
          v.vehicleNo.replace(/\s/g, '').includes(key),
  );
});

async function fetchVehicles() {
  try {
    await vehicleStore.fetchVehicles();
  } catch (error) {
    ElMessage.error(error.message ?? '차량 목록 조회에 실패했습니다.');
  }
}

// 드로어에서 넘어온 값으로 차량을 등록한다.
async function handleRegister(payload) {
  submitting.value = true;
  try {
    await vehicleStore.createVehicle(payload);
    ElMessage.success('차량이 등록되었습니다.');
    drawerVisible.value = false;
    await fetchVehicles();
  } catch (error) {
    // 차량번호 중복(DUPLICATE_VEHICLE_NO), 주소 지오코딩 실패 등: 드로어를 닫지 않고 수정할 수 있게 둔다.
    ElMessage.error(error.message ?? '차량 등록에 실패했습니다.');
  } finally {
    submitting.value = false;
  }
}

// 차량 삭제: 확인 후 호출한다. 배차 이력이 있는 차량 등은 서버가 거부하고 사유를 내려준다.
async function handleDelete(vehicle) {
  try {
    await ElMessageBox.confirm(
        `${vehicle.vehicleNo} 차량을 삭제하시겠습니까? 삭제한 차량은 복구할 수 없습니다.`,
        '차량 삭제',
        { type: 'warning', confirmButtonText: '삭제하기', cancelButtonText: '닫기' },
    );
  } catch {
    return; // 사용자가 닫기를 누른 경우
  }

  try {
    await vehicleStore.deleteVehicle(vehicle.id);
    ElMessage.success('차량이 삭제되었습니다.');
    await fetchVehicles();
  } catch (error) {
    ElMessage.error(error.message ?? '차량 삭제에 실패했습니다.');
    await fetchVehicles(); // 다른 곳에서 상태가 바뀌었을 수 있으니 최신 목록으로 맞춘다.
  }
}

// 탭 복귀 시마다 최신 차량 목록을 불러온다.
onActivated(fetchVehicles);
</script>

<style scoped>
.vehicle-manage-view { width: 100%; }

.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.page-head h2 { margin: 0; font-size: 20px; color: #0f172a; }
.page-head p { margin: 4px 0 0; color: #64748b; font-size: 13.5px; }

.list-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
.toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 14px 20px; border-bottom: 1px solid #e2e8f0; }
.search-input { width: 260px; }

.type-pill { padding: 2px 10px; border-radius: 999px; background: #f1f5f9; color: #475569; font-size: 12.5px; font-weight: 600; }
.sub { font-size: 12.5px; color: #64748b; }
.list-foot { padding: 12px 20px; border-top: 1px solid #e2e8f0; color: #64748b; }
</style>