<template>
  <div class="dispatch-plan-view">
    <div class="page-head">
      <div>
        <h2>운송계획 (배차)</h2>
        <p v-if="section === 'work'">배차 대기 주문을 선택하고, 자동 추천 또는 수동으로 차량을 배정합니다.</p>
        <p v-else>확정된 배차를 확인하고, 필요하면 취소할 수 있습니다.</p>
      </div>
      <el-radio-group v-model="section">
        <el-radio-button value="work">배차 작업</el-radio-button>
        <el-radio-button value="status">배차 현황 ({{ confirmedCount }})</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 배차 작업 -->
    <div v-show="section === 'work'" class="work-grid">
      <DispatchOrderList
          v-model="listModel"
          :orders="orderStore.orders"
          :loading="orderStore.loading"
          :single="workTab === 'manual'"
      />

      <section class="work-panel">
        <el-tabs v-model="workTab" class="work-tabs">
          <el-tab-pane label="자동 추천" name="auto" />
          <el-tab-pane label="수동 배정" name="manual" />
        </el-tabs>

        <!-- 자동 추천 탭 -->
        <AutoRecommendPanel
            v-if="workTab === 'auto'"
            :selected-count="selectedIds.length"
            :order-map="orderMap"
            :vehicle-map="vehicleMap"
            :recommendations="dispatchStore.recommendations"
            :unassigned-order-ids="dispatchStore.unassignedOrderIds"
            :has-run="hasRun"
            :recommending="recommending"
            :confirming="bulkConfirming"
            @recommend-all="handleRecommendAll"
            @recommend-selected="handleRecommendSelected"
            @confirm-one="handleConfirmOne"
            @confirm-all="handleConfirmAll"
            @go-manual="handleGoManual"
        />

        <!-- 수동 배정 탭 -->
        <ManualAssignPanel
            v-else
            :order="manualOrder"
            :vehicles="vehicleStore.availableVehicles"
            :loading="vehicleStore.loading"
            :confirming="manualConfirming"
            @confirm="handleManualConfirm"
        />
      </section>
    </div>

    <!-- 배차 현황 -->
    <DispatchStatusPanel
        v-show="section === 'status'"
        v-model:filter="statusFilter"
        :dispatches="dispatchStore.dispatches"
        :vehicle-by-no="vehicleByNo"
        :loading="dispatchStore.loading"
        :last-fetched-at="lastFetchedAt"
        @refresh="fetchDispatchList"
        @cancel="handleCancelDispatch"
    />
  </div>
</template>

<script setup>
defineOptions({ name: 'DispatchPlanView' });
import { computed, onActivated, onDeactivated, onUnmounted, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useOrderStore } from '@/stores/orderStore';
import { useVehicleStore } from '@/stores/vehicleStore';
import { useDispatchStore } from '@/stores/dispatchStore';
import DispatchOrderList from '@/components/dispatch/DispatchOrderList.vue';
import AutoRecommendPanel from '@/components/dispatch/AutoRecommendPanel.vue';
import ManualAssignPanel from '@/components/dispatch/ManualAssignPanel.vue';
import DispatchStatusPanel from '@/components/dispatch/DispatchStatusPanel.vue';

const orderStore = useOrderStore();
const vehicleStore = useVehicleStore();
const dispatchStore = useDispatchStore();

// ---- 화면 상태 ----
const section = ref('work');   // 'work'(배차 작업) | 'status'(배차 현황)
const workTab = ref('auto');   // 'auto'(자동 추천) | 'manual'(수동 배정)
const selectedIds = ref([]);   // 자동 추천용: 체크한 주문 ID들
const manualOrderId = ref(null); // 수동 배정용: 선택한 주문 ID 한 건

// ---- 공통 데이터 조회 ----
async function fetchWaitingOrders() {
  try {
    // 아직 배차되지 않은(RECEIVED) 주문만 대기 목록에 보여준다.
    await orderStore.fetchOrders({ status: 'RECEIVED', page: 0, size: 50 });
    // 목록에서 사라진 주문(다른 곳에서 배차됨 등)은 선택에서도 뺀다.
    const ids = new Set(orderStore.orders.map((o) => o.id));
    selectedIds.value = selectedIds.value.filter((id) => ids.has(id));
    if (manualOrderId.value && !ids.has(manualOrderId.value)) manualOrderId.value = null;
  } catch (error) {
    ElMessage.error(error.message ?? '배차 대기 주문 조회에 실패했습니다.');
  }
}

async function fetchAllVehicles() {
  try {
    await vehicleStore.fetchVehicles(); // 적재율 계산에 쓸 차량 제원(최대중량, 적재함 규격)
  } catch (error) {
    ElMessage.error(error.message ?? '차량 조회에 실패했습니다.');
  }
}

// 빠른 조회용 맵: 주문/차량 ID -> 객체
const orderMap = computed(() => Object.fromEntries(orderStore.orders.map((o) => [o.id, o])));
const vehicleMap = computed(() => Object.fromEntries(vehicleStore.vehicles.map((v) => [v.id, v])));
const vehicleByNo = computed(() => Object.fromEntries(vehicleStore.vehicles.map((v) => [v.vehicleNo, v])));

// 왼쪽 목록의 선택값: 탭에 따라 다중(자동) / 단일(수동)로 다르게 읽고 쓴다.
const listModel = computed({
  get: () => (workTab.value === 'manual' ? (manualOrderId.value ? [manualOrderId.value] : []) : selectedIds.value),
  set: (ids) => {
    if (workTab.value === 'manual') manualOrderId.value = ids[0] ?? null;
    else selectedIds.value = ids;
  },
});

// ---- 자동 추천 ----
const hasRun = ref(false);
const recommending = ref(false);
const bulkConfirming = ref(false);
let lastRecommendIds; // 마지막 추천 호출 조건 (실패 후 재계산용)

async function runRecommendation(orderIds) {
  recommending.value = true;
  lastRecommendIds = orderIds;
  try {
    await dispatchStore.fetchRecommendations(orderIds);
    hasRun.value = true;
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
  if (selectedIds.value.length === 0) {
    ElMessage.warning('추천받을 주문을 먼저 선택해주세요.');
    return;
  }
  runRecommendation([...selectedIds.value]);
}

// 추천 1건 확정
async function handleConfirmOne(item) {
  try {
    await dispatchStore.confirmDispatch(item.orderId, item.vehicleId);
    ElMessage.success(`${item.orderNo} 배차가 확정되었습니다.`);
    dispatchStore.removeRecommendations([item.orderId]);
    await Promise.all([fetchWaitingOrders(), fetchDispatchList()]);
  } catch (error) {
    // 서버 재검증 실패(이미 배차됨, 용량 초과 등) -> 추천이 낡았을 수 있으니 다시 계산한다.
    ElMessage.error(error.message ?? '배차 확정에 실패했습니다.');
    await runRecommendation(lastRecommendIds);
    await fetchWaitingOrders();
  }
}

// 추천 전체 일괄 확정: 건별로 순서대로 호출하고, 성공/실패를 모아서 알려준다.
async function handleConfirmAll() {
  const items = [...dispatchStore.recommendations];
  if (items.length === 0) return;

  try {
    await ElMessageBox.confirm(`추천된 ${items.length}건을 모두 확정하시겠습니까?`, '일괄 확정', {
      type: 'info',
      confirmButtonText: '확정하기',
      cancelButtonText: '닫기',
    });
  } catch {
    return; // 사용자가 닫기를 누른 경우
  }

  bulkConfirming.value = true;
  try {
    const { succeededIds, failures } = await dispatchStore.confirmBulk(items);

    if (failures.length === 0) {
      ElMessage.success(`${succeededIds.length}건의 배차가 확정되었습니다.`);
    } else {
      const failedList = failures.map((f) => `${f.orderNo}(${f.message ?? '오류'})`).join(', ');
      ElMessage({
        type: 'warning',
        showClose: true,
        duration: 8000,
        message: `${succeededIds.length}건 성공, ${failures.length}건 실패했습니다. 실패: ${failedList}`,
      });
    }

    await Promise.all([fetchWaitingOrders(), fetchDispatchList()]);
    // 실패 건이 있으면 남은 주문 기준으로 추천을 다시 계산한다.
    if (failures.length > 0) await runRecommendation(lastRecommendIds);
  } finally {
    bulkConfirming.value = false;
  }
}

// 미배정 주문에서 "수동 배정"을 누르면 수동 탭으로 넘어가 해당 주문을 선택한다.
function handleGoManual(orderId) {
  workTab.value = 'manual';
  manualOrderId.value = orderId;
}

// ---- 수동 배정 ----
const manualConfirming = ref(false);
const manualOrder = computed(() => (manualOrderId.value ? orderMap.value[manualOrderId.value] ?? null : null));
let vehicleRequestSeq = 0; // 주문을 빠르게 바꿨을 때 늦게 온 응답을 무시하기 위한 번호

// 선택한 주문이 바뀌면 배차 가능 차량을 다시 조회한다.
watch(manualOrderId, async (orderId) => {
  const seq = ++vehicleRequestSeq;
  if (!orderId) {
    vehicleStore.clearAvailableVehicles();
    return;
  }
  try {
    await vehicleStore.fetchAvailableVehicles(orderId);
    if (seq !== vehicleRequestSeq) return; // 그 사이 다른 주문을 골랐다면 무시
  } catch (error) {
    ElMessage.error(error.message ?? '배차 가능 차량 조회에 실패했습니다.');
  }
});

async function handleManualConfirm(vehicleId) {
  manualConfirming.value = true;
  try {
    await dispatchStore.confirmDispatch(manualOrderId.value, vehicleId);
    ElMessage.success('배차가 확정되었습니다.');
    manualOrderId.value = null; // 확정된 주문은 더 이상 대기 주문이 아니다.
    await Promise.all([fetchWaitingOrders(), fetchDispatchList()]);
  } catch (error) {
    // 서버 재검증(중량/부피 초과, 이미 배차됨 등)에 걸린 경우
    ElMessage.error(error.message ?? '배차 확정에 실패했습니다.');
    const currentId = manualOrderId.value;
    await fetchWaitingOrders();
    if (currentId && manualOrderId.value === currentId) {
      await vehicleStore.fetchAvailableVehicles(currentId).catch(() => {}); // 최신 차량 상태로 다시 맞춤
    }
  } finally {
    manualConfirming.value = false;
  }
}

// ---- 배차 현황 ----
const statusFilter = ref('CONFIRMED');
const lastFetchedAt = ref('');
const confirmedCount = computed(
    () => dispatchStore.dispatches.filter((d) => d.dispatchStatus === 'CONFIRMED').length,
);

async function fetchDispatchList() {
  try {
    const params = statusFilter.value === 'ALL' ? {} : { status: statusFilter.value };
    await dispatchStore.fetchDispatches(params);
    lastFetchedAt.value = new Date().toLocaleTimeString('ko-KR', { hour12: false });
  } catch (error) {
    ElMessage.error(error.message ?? '배차 현황 조회에 실패했습니다.');
  }
}

watch(statusFilter, fetchDispatchList);

async function handleCancelDispatch(dispatch) {
  try {
    await ElMessageBox.confirm(`${dispatch.orderNo} 주문의 배차를 취소하시겠습니까?`, '배차 취소', {
      type: 'warning',
      confirmButtonText: '취소하기',
      cancelButtonText: '닫기',
    });
  } catch {
    return; // 사용자가 닫기를 누른 경우
  }

  try {
    await dispatchStore.cancelDispatch(dispatch.id);
    ElMessage.success('배차가 취소되었습니다.');
    await Promise.all([fetchWaitingOrders(), fetchDispatchList()]);
  } catch (error) {
    ElMessage.error(error.message ?? '배차 취소에 실패했습니다.');
  }
}

// ---- 생명주기: 여러 담당자가 동시에 쓰므로 배차 현황은 30초마다 자동 갱신한다 ----
let pollingId = null;

function startPolling() {
  stopPolling();
  pollingId = setInterval(() => {
    if (section.value === 'status') fetchDispatchList(); // 현황 화면을 볼 때만 갱신
  }, 30000);
}

function stopPolling() {
  if (pollingId) clearInterval(pollingId);
  pollingId = null;
}

// 탭을 보여줄 때마다 실행된다. (처음 열 때 + 다른 탭에서 돌아올 때)
onActivated(() => {
  fetchWaitingOrders();
  fetchAllVehicles();
  fetchDispatchList();
  startPolling();
});

// 다른 탭으로 숨겨질 때 / 탭을 닫을 때 폴링을 멈춘다.
onDeactivated(stopPolling);
onUnmounted(stopPolling);
</script>

<style scoped>
.dispatch-plan-view { width: 100%; container-type: inline-size; }

.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.page-head h2 { margin: 0; font-size: 20px; color: #0f172a; }
.page-head p { margin: 4px 0 0; color: #64748b; font-size: 13.5px; }

.work-grid { display: grid; grid-template-columns: minmax(340px, 460px) minmax(0, 1fr); gap: 16px; align-items: start; }
.work-panel { container-type: inline-size; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
.work-tabs { padding: 0 16px; }
.work-tabs :deep(.el-tabs__header) { margin: 0; }
.work-tabs :deep(.el-tabs__nav-wrap::after) { height: 1px; }

/* 화면 폭이 좁으면 목록과 작업 영역을 위아래로 쌓는다. */
@container (max-width: 960px) {
  .work-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>