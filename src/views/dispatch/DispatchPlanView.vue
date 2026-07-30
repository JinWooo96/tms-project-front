<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useOrderStore } from '@/stores/orderStore';
import { useVehicleStore } from '@/stores/vehicleStore';
import { useDispatchStore } from '@/stores/dispatchStore';
import { DISPATCH_STATUS } from '@/constants/enums';
import StatusTag from '@/components/common/StatusTag.vue';

const orderStore = useOrderStore();
const vehicleStore = useVehicleStore();
const dispatchStore = useDispatchStore();

// ---- 0. 자동 배차 추천 ----
const selectedOrderIdsForRecommend = ref([]); // 체크박스로 선택한 주문 ID들 (선택 추천용)
const recommending = ref(false);
const lastRecommendOrderIds = ref(undefined); // 마지막 추천 호출 시 사용한 orderIds (실패 시 재조회용)

function handleRecommendSelectionChange(selectedRows) {
  selectedOrderIdsForRecommend.value = selectedRows.map((row) => row.id);
}

async function runRecommendation(orderIds) {
  recommending.value = true;
  lastRecommendOrderIds.value = orderIds;
  try {
    await dispatchStore.fetchRecommendations(orderIds);
    if (dispatchStore.recommendations.length === 0) {
      ElMessage.warning('추천 가능한 배정 조합이 없습니다.');
    }
  } catch (error) {
    ElMessage.error(error.message ?? '자동 배차 추천 계산에 실패했습니다.');
  } finally {
    recommending.value = false;
  }
}

function handleRecommendAll() {
  runRecommendation(undefined); // orderIds 없이 호출 -> 전체 추천
}

function handleRecommendSelected() {
  if (selectedOrderIdsForRecommend.value.length === 0) {
    ElMessage.warning('추천받을 주문을 먼저 선택해주세요.');
    return;
  }
  runRecommendation(selectedOrderIdsForRecommend.value); // 선택 추천
}

async function handleConfirmRecommendation(item) {
  try {
    await dispatchStore.confirmDispatch(item.orderId, item.vehicleId);
    ElMessage.success(`${item.orderNo} 배차가 확정되었습니다.`);

    // 확정된 항목은 추천 목록에서 제거
    dispatchStore.recommendations = dispatchStore.recommendations.filter(
        (r) => r.orderId !== item.orderId
    );
    await Promise.all([fetchReceivedOrders(), fetchDispatchList()]);
  } catch (error) {
    // 서버 재검증 실패 시 (다른 경로로 이미 배차되었거나, 용량 재초과 등)
    ElMessage.error(error.message ?? '배차 확정에 실패했습니다.');
    // 추천 목록 자체가 낡았을 수 있으니 같은 조건으로 다시 계산한다.
    await runRecommendation(lastRecommendOrderIds.value);
    await fetchReceivedOrders();
  }
}

// ---- 1. 배차 대상 주문 선택 (수동 배차용) ----
const selectedOrderId = ref(null);

async function fetchReceivedOrders() {
  // 아직 배차되지 않은(RECEIVED) 주문만 후보로 보여준다.
  await orderStore.fetchOrders({ status: 'RECEIVED', page: 0, size: 50 });
}

// ---- 2. 배차 가능 차량 조회 ----
const selectedVehicleId = ref(null);

watch(selectedOrderId, async (orderId) => {
  selectedVehicleId.value = null; // 주문을 바꾸면 이전에 선택했던 차량은 초기화
  if (!orderId) {
    vehicleStore.clearAvailableVehicles();
    return;
  }
  try {
    await vehicleStore.fetchAvailableVehicles(orderId);
  } catch (error) {
    ElMessage.error(error.message ?? '배차 가능 차량 조회에 실패했습니다.');
  }
});

function handleVehicleRowSelect(vehicle) {
  selectedVehicleId.value = vehicle?.id ?? null;
}

// ---- 3. 배차 확정 ----
const confirming = ref(false);

async function handleConfirmDispatch() {
  if (!selectedOrderId.value || !selectedVehicleId.value) {
    ElMessage.warning('주문과 차량을 모두 선택해주세요.');
    return;
  }

  confirming.value = true;
  try {
    await dispatchStore.confirmDispatch(selectedOrderId.value, selectedVehicleId.value);
    ElMessage.success('배차가 확정되었습니다.');

    // 배차 확정된 주문은 더 이상 후보가 아니므로, 선택을 초기화하고 목록들을 새로고침한다.
    selectedOrderId.value = null;
    selectedVehicleId.value = null;
    vehicleStore.clearAvailableVehicles();
    await Promise.all([fetchReceivedOrders(), fetchDispatchList()]);
  } catch (error) {
    // 서버 재검증(중량/부피 초과, 이미 배차됨 등)에 걸린 경우 여기로 온다.
    ElMessage.error(error.message ?? '배차 확정에 실패했습니다.');
    // 프론트가 보여준 정보가 이미 낡았을 수 있으니, 최신 상태로 다시 맞춘다.
    await Promise.all([fetchReceivedOrders(), fetchDispatchList()]);
  } finally {
    confirming.value = false;
  }
}

// ---- 4. 배차 현황 + 취소 ----
async function fetchDispatchList() {
  try {
    await dispatchStore.fetchDispatches({ status: 'CONFIRMED' });
  } catch (error) {
    ElMessage.error(error.message ?? '배차 현황 조회에 실패했습니다.');
  }
}

async function handleCancelDispatch(dispatch) {
  try {
    await ElMessageBox.confirm(
        `${dispatch.orderNo} 주문의 배차를 취소하시겠습니까?`,
        '배차 취소',
        { type: 'warning', confirmButtonText: '취소하기', cancelButtonText: '닫기' }
    );
  } catch {
    return; // 사용자가 "닫기"를 누른 경우
  }

  try {
    await dispatchStore.cancelDispatch(dispatch.id);
    ElMessage.success('배차가 취소되었습니다.');
    await Promise.all([fetchReceivedOrders(), fetchDispatchList()]);
  } catch (error) {
    ElMessage.error(error.message ?? '배차 취소에 실패했습니다.');
  }
}

function formatDateTime(value) {
  if (!value) return '-';
  return value.replace('T', ' ');
}

// ---- 여러 담당자가 동시에 배차 화면을 볼 수 있으므로, 배차 현황은 주기적으로 새로고침한다 ----
let pollingId = null;

onMounted(() => {
  fetchReceivedOrders();
  fetchDispatchList();
  pollingId = setInterval(fetchDispatchList, 8000); // 8초마다 배차 현황만 자동 갱신
});

onUnmounted(() => {
  if (pollingId) clearInterval(pollingId);
});
</script>

<template>
  <div class="dispatch-plan-view">
    <h2>운송계획 (배차)</h2>

    <el-card class="section-card">
      <template #header>0. 자동 배차 추천</template>

      <el-table
          :data="orderStore.orders"
          v-loading="recommending"
          border
          max-height="260"
          @selection-change="handleRecommendSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="orderNo" label="주문번호" width="200" />
        <el-table-column prop="originAddress" label="상차지" min-width="200" show-overflow-tooltip />
        <el-table-column prop="destAddress" label="도착지" min-width="200" show-overflow-tooltip />
      </el-table>

      <div class="recommend-button-bar">
        <el-button :loading="recommending" @click="handleRecommendAll">전체 자동배차 추천</el-button>
        <el-button
            type="primary"
            :disabled="selectedOrderIdsForRecommend.length === 0"
            :loading="recommending"
            @click="handleRecommendSelected"
        >
          선택 자동배차 추천 ({{ selectedOrderIdsForRecommend.length }}건)
        </el-button>
      </div>

      <el-alert
          v-if="dispatchStore.unassignedOrderIds.length > 0"
          type="warning"
          :closable="false"
          class="unassigned-alert"
      >
        {{ dispatchStore.unassignedOrderIds.length }}건의 주문은 이번 추천에서 배정되지 못했습니다.
        (적합한 차량이 없거나 차량 수 부족)
      </el-alert>

      <template v-if="dispatchStore.recommendations.length > 0">
        <el-divider content-position="left">추천 결과</el-divider>
        <el-table :data="dispatchStore.recommendations" border>
          <el-table-column prop="orderNo" label="주문번호" width="200" />
          <el-table-column prop="vehicleNo" label="추천 차량" width="140" />
          <el-table-column label="거리(km)" width="120">
            <template #default="{ row }">{{ row.distanceKm.toFixed(1) }}</template>
          </el-table-column>
          <el-table-column label="" width="100" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="handleConfirmRecommendation(row)">확정</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>

    <el-card class="section-card">
      <template #header>1. 배차 대상 주문 선택</template>
      <el-select
          v-model="selectedOrderId"
          placeholder="배차할 운송주문을 선택하세요"
          filterable
          class="order-select"
      >
        <el-option
            v-for="order in orderStore.orders"
            :key="order.id"
            :label="`${order.orderNo}  |  ${order.originAddress} → ${order.destAddress}`"
            :value="order.id"
        />
      </el-select>
      <span v-if="orderStore.orders.length === 0" class="empty-hint">
        배차 대기 중인 주문이 없습니다.
      </span>
    </el-card>

    <el-card class="section-card" v-if="selectedOrderId">
      <template #header>2. 배차 가능 차량 선택</template>
      <el-table
          :data="vehicleStore.availableVehicles"
          v-loading="vehicleStore.loading"
          highlight-current-row
          border
          @current-change="handleVehicleRowSelect"
      >
        <el-table-column prop="vehicleNo" label="차량번호" width="140" />
        <el-table-column prop="vehicleType" label="차량유형" width="120" />
        <el-table-column prop="maxWeightKg" label="최대적재중량(kg)" width="150" />
        <el-table-column label="적재함 규격(가로x세로x높이, cm)">
          <template #default="{ row }">
            {{ row.bedWidthCm }} x {{ row.bedLengthCm }} x {{ row.bedHeightCm }}
          </template>
        </el-table-column>
      </el-table>
      <span v-if="vehicleStore.availableVehicles.length === 0 && !vehicleStore.loading" class="empty-hint">
        이 주문을 감당할 수 있는 배차 가능 차량이 없습니다.
      </span>

      <div class="confirm-bar">
        <el-button
            type="primary"
            :disabled="!selectedVehicleId"
            :loading="confirming"
            @click="handleConfirmDispatch"
        >
          배차 확정
        </el-button>
      </div>
    </el-card>

    <el-card class="section-card">
      <template #header>배차 현황 (확정된 배차)</template>
      <el-table :data="dispatchStore.dispatches" v-loading="dispatchStore.loading" border>
        <el-table-column prop="orderNo" label="주문번호" width="200" />
        <el-table-column prop="vehicleNo" label="차량번호" width="140" />
        <el-table-column label="상태" width="110">
          <template #default="{ row }">
            <StatusTag :status="row.dispatchStatus" :status-map="DISPATCH_STATUS" />
          </template>
        </el-table-column>
        <el-table-column label="배차확정 일시" width="170">
          <template #default="{ row }">{{ formatDateTime(row.assignedAt) }}</template>
        </el-table-column>
        <el-table-column label="" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="danger" plain @click="handleCancelDispatch(row)">취소</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.dispatch-plan-view {
  max-width: 1200px;
}

.section-card {
  margin-top: 16px;
}

.order-select {
  width: 100%;
  max-width: 600px;
}

.empty-hint {
  display: block;
  margin-top: 8px;
  color: #909399;
  font-size: 13px;
}

.confirm-bar {
  margin-top: 16px;
  text-align: right;
}

.recommend-button-bar {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.unassigned-alert {
  margin-top: 12px;
}
</style>