<script setup>
import { onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useOrderStore } from '@/stores/orderStore';
import { ORDER_STATUS } from '@/constants/enums';
import StatusTag from '@/components/common/StatusTag.vue';

const orderStore = useOrderStore();

// 상태 필터 select box 옵션 (전체 + 각 상태값)
const statusOptions = [
  { value: null, label: '전체' },
  ...Object.entries(ORDER_STATUS).map(([value, { label }]) => ({ value, label })),
];

const statusFilter = ref(null);
const currentPage = ref(1); // el-pagination은 1부터 시작
const pageSize = ref(10);

async function fetchList() {
  try {
    await orderStore.fetchOrders({
      status: statusFilter.value ?? undefined,
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

onMounted(fetchList);

// ---- 상세보기 모달 ----
const detailVisible = ref(false);
const detailOrder = ref(null);
const detailLoading = ref(false);

async function openDetail(orderId) {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    detailOrder.value = await orderStore.getOrder(orderId);
  } catch (error) {
    ElMessage.error(error.message ?? '주문 상세 조회에 실패했습니다.');
    detailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}

function formatDateTime(value) {
  if (!value) return '-';
  return value.replace('T', ' ');
}
</script>

<template>
  <div class="order-list-view">
    <h2>운송요청 관리</h2>

    <div class="filter-bar">
      <el-select v-model="statusFilter" placeholder="상태 선택" class="status-select">
        <el-option
            v-for="option in statusOptions"
            :key="option.value ?? 'ALL'"
            :label="option.label"
            :value="option.value"
        />
      </el-select>
    </div>

    <el-table :data="orderStore.orders" v-loading="orderStore.loading" stripe border>
      <el-table-column prop="orderNo" label="주문번호" width="200" />
      <el-table-column prop="originAddress" label="상차지" min-width="220" show-overflow-tooltip />
      <el-table-column prop="destAddress" label="도착지" min-width="220" show-overflow-tooltip />
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
      <el-table-column label="" width="100" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row.id)">상세보기</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
        class="pagination"
        layout="prev, pager, next, total"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="orderStore.totalElements"
        @current-change="handlePageChange"
    />

    <!-- 상세보기 모달 -->
    <el-dialog v-model="detailVisible" title="운송주문 상세" width="600px">
      <div v-loading="detailLoading">
        <template v-if="detailOrder">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="주문번호">{{ detailOrder.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="상태">
              <StatusTag :status="detailOrder.status" :status-map="ORDER_STATUS" />
            </el-descriptions-item>
            <el-descriptions-item label="상차지" :span="2">{{ detailOrder.originAddress }}</el-descriptions-item>
            <el-descriptions-item label="도착지" :span="2">{{ detailOrder.destAddress }}</el-descriptions-item>
            <el-descriptions-item label="상차 희망일시">
              {{ formatDateTime(detailOrder.requestedPickupAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="도착 희망일시">
              {{ formatDateTime(detailOrder.requestedDeliveryAt) }}
            </el-descriptions-item>
          </el-descriptions>

          <h4 class="cargo-list-title">화물 목록</h4>
          <el-table :data="detailOrder.cargoList" size="small" border>
            <el-table-column prop="widthCm" label="가로(cm)" />
            <el-table-column prop="lengthCm" label="세로(cm)" />
            <el-table-column prop="heightCm" label="높이(cm)" />
            <el-table-column prop="weightKg" label="중량(kg)" />
            <el-table-column prop="quantity" label="개수" />
            <el-table-column prop="cargoType" label="유형" />
          </el-table>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.order-list-view {
  max-width: 1200px;
}

.filter-bar {
  margin: 16px 0;
}

.status-select {
  width: 160px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.cargo-list-title {
  margin: 20px 0 8px;
}
</style>