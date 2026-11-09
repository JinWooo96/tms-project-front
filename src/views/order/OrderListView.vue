<template>
  <div class="order-list-view">
    <div class="page-head">
      <div>
        <h2>운송요청 관리</h2>
        <p>접수된 운송주문을 확인하고 상세 내용을 조회합니다.</p>
      </div>
      <el-button type="primary" size="large" @click="router.push('/orders/new')">+ 운송주문 등록</el-button>
    </div>

    <!-- 상태 필터: 한 번 클릭으로 전환하는 버튼 묶음 -->
    <div class="filter-bar">
      <el-radio-group v-model="statusFilter" aria-label="상태 필터">
        <el-radio-button v-for="option in statusOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <div class="table-card">
      <!-- 운송주문 목록 테이블 -->
      <el-table
          :data="orderStore.orders"
          v-loading="orderStore.loading"
          class="order-table"
          row-class-name="clickable-row"
          empty-text="조회된 운송주문이 없습니다."
          @row-click="(row) => openDetail(row.id)"
      >
        <el-table-column label="주문번호" width="200">
          <template #default="{ row }">
            <!-- 키보드로도 열 수 있도록 주문번호는 버튼으로 둔다. (행 클릭과 같은 동작) -->
            <button type="button" class="order-no" @click.stop="openDetail(row.id)">{{ row.orderNo }}</button>
          </template>
        </el-table-column>
        <el-table-column label="상차지 → 도착지" min-width="320" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.originAddress }} <span class="route-arrow">→</span> {{ row.destAddress }}
          </template>
        </el-table-column>
        <el-table-column label="상태" width="110">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="ORDER_STATUS" />
          </template>
        </el-table-column>
        <el-table-column label="상차 희망일시" width="170">
          <template #default="{ row }">{{ formatDateTime(row.requestedPickupAt) }}</template>
        </el-table-column>
        <el-table-column label="등록일시" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total">총 <b>{{ orderStore.totalElements }}</b>건</span>
        <el-pagination
            layout="prev, pager, next"
            :current-page="currentPage"
            :page-size="pageSize"
            :total="orderStore.totalElements"
            @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 상세보기 모달 -->
    <el-dialog v-model="detailVisible" width="720px" class="order-detail-dialog" align-center>
      <template #header>
        <div class="dialog-title">
          <b>{{ detailOrder?.orderNo ?? '운송주문 상세' }}</b>
          <StatusTag v-if="detailOrder" :status="detailOrder.status" :status-map="ORDER_STATUS" />
        </div>
      </template>

      <div v-loading="detailLoading" class="dialog-body">
        <!-- 모달 안의 내용은 별도 컴포넌트가 담당한다. -->
        <OrderDetailContent v-if="detailOrder" :order="detailOrder" />
      </div>

      <template #footer>
        <el-button type="primary" @click="detailVisible = false">닫기</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
// KeepAlive의 include가 이 이름으로 캐시 대상을 찾는다. (router/pages.js의 componentName과 같아야 함)
defineOptions({ name: 'OrderListView' });
import { onActivated, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useOrderStore } from '@/stores/orderStore';
import { ORDER_STATUS } from '@/constants/enums';
import StatusTag from '@/components/common/StatusTag.vue';
import OrderDetailContent from '@/components/order/OrderDetailContent.vue';

const router = useRouter();
const orderStore = useOrderStore();

// 상태 필터 버튼 옵션 (전체 + 각 상태값). 전체는 서버에 상태 조건을 보내지 않는다.
const ALL = 'ALL';
const statusOptions = [
  { value: ALL, label: '전체' },
  ...Object.entries(ORDER_STATUS).map(([value, { label }]) => ({ value, label })),
];

const statusFilter = ref(ALL);
const currentPage = ref(1); // el-pagination은 1부터 시작
const pageSize = ref(10);

async function fetchList() {
  try {
    await orderStore.fetchOrders({
      status: statusFilter.value === ALL ? undefined : statusFilter.value,
      page: currentPage.value - 1, // 백엔드 Pageable은 0부터 시작하므로 -1 보정
      size: pageSize.value,
    });
  } catch (error) {
    ElMessage.error(error.message ?? '운송주문 목록 조회에 실패했습니다.');
  }
}

// 필터가 바뀌면 1페이지로 되돌아가서 다시 조회한다.
watch(statusFilter, () => {
  currentPage.value = 1;
  fetchList();
});

function handlePageChange(page) {
  currentPage.value = page;
  fetchList();
}

// keep-alive 환경: 탭을 처음 열 때와 다른 탭에서 돌아올 때마다 목록을 새로 불러온다. (필터/페이지는 유지됨)
onActivated(fetchList);

// ---- 상세보기 모달 ----
const detailVisible = ref(false);
const detailOrder = ref(null);
const detailLoading = ref(false);

// 빠르게 다른 행을 연달아 눌렀을 때, 늦게 도착한 이전 응답이 화면을 덮어쓰지 않도록 요청 번호로 구분한다.
let detailRequestSeq = 0;

async function openDetail(orderId) {
  const seq = ++detailRequestSeq;
  detailVisible.value = true;
  detailLoading.value = true;
  detailOrder.value = null; // 이전 주문 내용이 잠깐 보이는 것을 막는다.
  try {
    const order = await orderStore.getOrder(orderId);
    if (seq === detailRequestSeq) detailOrder.value = order;
  } catch (error) {
    if (seq !== detailRequestSeq) return;
    ElMessage.error(error.message ?? '주문 상세 조회에 실패했습니다.');
    detailVisible.value = false;
  } finally {
    if (seq === detailRequestSeq) detailLoading.value = false;
  }
}

function formatDateTime(value) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 16); // 'YYYY-MM-DD HH:mm'까지만 표시
}
</script>

<style scoped>
.order-list-view {
  max-width: 1400px;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-head p {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: var(--tms-text-muted);
}

.filter-bar {
  margin-bottom: 12px;
}

/* 표 + 하단(총 건수/페이지)을 하나의 카드로 묶는다. */
.table-card {
  background: #fff;
  border: 1px solid var(--tms-border);
  border-radius: 12px;
  overflow: hidden;
}

.order-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: var(--tms-text-muted);
  --el-table-row-hover-bg-color: var(--el-color-primary-light-9);
}

.order-table :deep(.clickable-row) {
  cursor: pointer;
}

.order-no {
  padding: 0;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  font-weight: 600;
  color: var(--tms-text-strong);
  cursor: pointer;
}

.order-no:hover {
  color: var(--el-color-primary);
}

.order-no:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.route-arrow {
  margin: 0 4px;
  color: #94a3b8;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  font-size: 13px;
  color: var(--tms-text-muted);
}

.table-footer .total b {
  color: var(--tms-text-strong);
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  color: var(--tms-text-strong);
}

/* 로딩 중에도 모달 높이가 갑자기 줄지 않게 최소 높이를 준다. */
.dialog-body {
  min-height: 160px;
}
</style>