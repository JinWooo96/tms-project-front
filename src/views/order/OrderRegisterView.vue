<template>
  <div class="order-register">
    <div class="page-head">
      <h2>운송주문 등록</h2>
      <p>상차지·도착지·화물 정보를 입력하면 배차 대기 상태로 접수됩니다.</p>
    </div>

    <div class="layout-grid">
      <div class="main-col">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
          <!-- 1. 경로 · 일정 -->
          <section class="card route-card">
            <h3>1. 경로 · 일정</h3>

            <div class="stage">
              <div class="rail"><span class="dot dot-pickup">상</span><span class="line"></span></div>
              <div class="stage-body">
                <el-form-item label="상차지 주소" prop="originAddress">
                  <AddressSearchInput v-model="form.originAddress" placeholder="상차지 주소를 검색하세요" />
                </el-form-item>
                <el-form-item label="상차 희망일시">
                  <el-date-picker
                      v-model="form.requestedPickupAt"
                      type="datetime"
                      placeholder="상차 희망일시 선택"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                      format="YYYY-MM-DD HH:mm"
                  />
                  <QuickChips
                      class="chips"
                      :options="pickupChips"
                      :active-value="form.requestedPickupAt"
                      aria-label="상차 일시 빠른 선택"
                      @select="pickPickup"
                  />
                </el-form-item>
              </div>
            </div>

            <div class="stage">
              <div class="rail"><span class="dot dot-dest">하</span></div>
              <div class="stage-body">
                <el-form-item label="도착지 주소" prop="destAddress">
                  <AddressSearchInput v-model="form.destAddress" placeholder="도착지 주소를 검색하세요" />
                </el-form-item>
                <el-form-item label="도착 희망일시" prop="requestedDeliveryAt">
                  <el-date-picker
                      v-model="form.requestedDeliveryAt"
                      type="datetime"
                      placeholder="상차 희망일시 이후로 선택"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                      format="YYYY-MM-DD HH:mm"
                      :disabled-date="isDeliveryDateDisabled"
                  />
                  <QuickChips
                      class="chips"
                      :options="deliveryChips"
                      :active-value="form.requestedDeliveryAt"
                      aria-label="도착 일시 빠른 선택"
                      @select="pickDelivery"
                  />
                </el-form-item>
              </div>
            </div>
          </section>
        </el-form>

        <!-- 2. 화물 정보 -->
        <section class="card cargo-card">
          <div class="card-head">
            <h3>2. 화물 정보</h3>
            <el-button @click="addCargoRow">+ 화물 추가</el-button>
          </div>

          <div class="preset-bar">
            <span>규격 빠른 입력</span>
            <QuickChips
                :options="presetOptions"
                aria-label="화물 규격 빠른 입력"
                @select="(o) => applyPreset(o.preset)"
            />
          </div>

          <div class="cargo-header">
            <span>#</span><span>가로(cm)</span><span>세로(cm)</span><span>높이(cm)</span>
            <span>중량(kg/개)</span><span>개수</span><span>유형</span><span></span>
          </div>

          <CargoRow
              v-for="(cargo, index) in form.cargoList"
              :key="cargo._key"
              :cargo="cargo"
              :index="index"
              :removable="form.cargoList.length > 1"
              :show-errors="submitAttempted"
              @focus="activeRowKey = cargo._key"
              @copy="copyCargoRow(index)"
              @remove="removeCargoRow(index)"
          />
        </section>
      </div>

      <OrderSummaryPanel
          class="summary"
          :checks="checks"
          :summary="summary"
          :show-errors="submitAttempted"
          :submitting="submitting"
          @submit="handleSubmit"
          @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'OrderRegisterView' });
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useOrderStore } from '@/stores/orderStore';
import { useTabs } from '@/composables/useTabs';
import { CARGO_PRESETS } from '@/constants/cargoPresets';
import { deliveryQuickOptions, fromLocalIso, pickupQuickOptions } from '@/utils/quickDates';
import { hasDimensions, hasWeight, isCargoValid, summarizeCargo } from '@/utils/orderCalc';
import AddressSearchInput from '@/components/common/AddressSearchInput.vue';
import QuickChips from '@/components/common/QuickChips.vue';
import CargoRow from '@/components/order/CargoRow.vue';
import OrderSummaryPanel from '@/components/order/OrderSummaryPanel.vue';

const route = useRoute();
const { closeTabAndGo } = useTabs();
const orderStore = useOrderStore();

// ---------------- 폼 상태 ----------------
// CreateOrderRequest DTO와 필드명을 맞춘 폼 데이터. (cargo의 _key는 v-for 식별용이라 전송하지 않는다)
let keySeq = 0;
function createEmptyCargo(overrides = {}) {
  return {
    _key: ++keySeq,
    widthCm: null,
    lengthCm: null,
    heightCm: null,
    weightKg: null,
    quantity: 1,
    cargoType: 'GENERAL',
    ...overrides,
  };
}

// 운송주문 정보 form
const form = reactive({
  originAddress: '',
  destAddress: '',
  requestedPickupAt: null,
  requestedDeliveryAt: null,
  cargoList: [createEmptyCargo()],
});

const formRef = ref(null);
const submitting = ref(false);
// 등록 버튼을 한 번이라도 눌렀는지. true가 된 뒤부터 화물 행/요약 패널이 오류를 표시한다.
const submitAttempted = ref(false);

// ---------------- 검증 규칙 ----------------
// 도착 희망일시는 상차 희망일시보다 늦어야 한다. (둘 다 입력된 경우에만 검사)
function validateDeliveryAfterPickup(_rule, value, callback) {
  if (value && form.requestedPickupAt && fromLocalIso(value) <= fromLocalIso(form.requestedPickupAt)) {
    callback(new Error('도착 희망일시는 상차 희망일시 이후여야 합니다.'));
    return;
  }
  callback();
}

const rules = {
  originAddress: [{ required: true, message: '상차지 주소는 필수입니다.', trigger: 'change' }],
  destAddress: [{ required: true, message: '도착지 주소는 필수입니다.', trigger: 'change' }],
  requestedDeliveryAt: [{ validator: validateDeliveryAfterPickup, trigger: 'change' }],
};

// 상차 일시를 바꾸면, 이미 입력된 도착 일시를 다시 검사한다.
watch(
    () => form.requestedPickupAt,
    async () => {
      if (!form.requestedDeliveryAt) return;
      await nextTick();
      formRef.value?.validateField('requestedDeliveryAt').catch(() => {});
    },
);

// ---------------- 일시 빠른 선택 ----------------
const pickupChips = computed(() => pickupQuickOptions());
const deliveryChips = computed(() => deliveryQuickOptions(form.requestedPickupAt));

function pickPickup(option) {
  form.requestedPickupAt = option.value;
}

function pickDelivery(option) {
  form.requestedDeliveryAt = option.value;
}

// 도착 일시 선택 시, 상차 일시보다 이전 날짜는 고를 수 없게 한다.
function isDeliveryDateDisabled(date) {
  if (!form.requestedPickupAt) return false;
  const pickupDay = fromLocalIso(form.requestedPickupAt);
  pickupDay.setHours(0, 0, 0, 0);
  return date.getTime() < pickupDay.getTime();
}

// ---------------- 화물 행 ----------------
// 마지막으로 포커스된 화물 행. 규격 빠른 입력은 이 행에 적용한다.
const activeRowKey = ref(null);

function addCargoRow() {
  form.cargoList.push(createEmptyCargo());
}

// 행 복사: 같은 값의 행을 바로 아래에 끼워 넣는다.
function copyCargoRow(index) {
  const { _key, ...values } = form.cargoList[index];
  form.cargoList.splice(index + 1, 0, createEmptyCargo(values));
}

function removeCargoRow(index) {
  // 최소 1개는 남겨둔다 (백엔드도 cargoList가 비어있으면 검증 실패하도록 되어 있음)
  if (form.cargoList.length <= 1) {
    ElMessage.warning('화물은 최소 1개 이상 있어야 합니다.');
    return;
  }
  form.cargoList.splice(index, 1);
}

// 규격 빠른 입력: 가로/세로/높이만 채운다. (중량/개수/유형은 건드리지 않는다)
// 대상 행: 마지막으로 포커스한 행 -> 규격이 비어 있는 첫 행 -> (없으면) 새 행 추가
function applyPreset(preset) {
  let target =
      form.cargoList.find((c) => c._key === activeRowKey.value) ??
      form.cargoList.find((c) => !hasDimensions(c));
  if (!target) {
    target = createEmptyCargo();
    form.cargoList.push(target);
  }
  target.widthCm = preset.widthCm;
  target.lengthCm = preset.lengthCm;
  target.heightCm = preset.heightCm;
  activeRowKey.value = target._key;
}

const presetOptions = CARGO_PRESETS.map((p) => ({
  label: `${p.label} ${p.widthCm}×${p.lengthCm}×${p.heightCm}`,
  value: p.key,
  preset: p,
}));

// ---------------- 요약 패널 ----------------
const summary = computed(() => summarizeCargo(form.cargoList));

const checks = computed(() => {
  const total = form.cargoList.length;
  const specOk = form.cargoList.filter((c) => hasDimensions(c) && c.quantity > 0).length;
  const weightMissing = form.cargoList.filter((c) => !hasWeight(c)).length;
  return [
    { label: '상차지', ok: !!form.originAddress },
    { label: '도착지', ok: !!form.destAddress },
    { label: `화물 규격·개수 (${specOk}/${total}건)`, ok: specOk === total },
    { label: weightMissing ? `화물 중량 (${weightMissing}건 미입력)` : '화물 중량', ok: weightMissing === 0 },
  ];
});

// ---------------- 등록 ----------------
async function handleSubmit() {
  submitAttempted.value = true;

  // 1. 주소/일시 검증
  const valid = await formRef.value.validate().catch(() => false);
  // 2. 화물 검증 (오류 표시는 각 행이 submitAttempted를 보고 처리한다)
  const cargoValid = form.cargoList.every(isCargoValid);
  if (!valid || !cargoValid) {
    ElMessage.error('입력 내용을 확인해주세요.');
    return;
  }

  // 화면용 필드(_key)를 빼고 DTO 형태로 변환. 중량은 서버 scale(2)에 맞춰 반올림한다.
  const payload = {
    originAddress: form.originAddress,
    destAddress: form.destAddress,
    requestedPickupAt: form.requestedPickupAt,
    requestedDeliveryAt: form.requestedDeliveryAt,
    cargoList: form.cargoList.map(({ _key, weightKg, ...rest }) => ({
      ...rest,
      weightKg: Math.round(weightKg * 100) / 100,
    })),
  };

  submitting.value = true;
  try {
    await orderStore.createOrder(payload);
    ElMessage.success('운송주문이 등록되었습니다.');
    closeTabAndGo(route.path, '/orders'); // 등록 탭을 닫고 목록 화면으로 이동
  } catch (error) {
    // client.js 인터셉터가 던진 { code, message } 형태의 에러
    ElMessage.error(error.message ?? '운송주문 등록에 실패했습니다.');
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  closeTabAndGo(route.path, '/orders');
}
</script>

<style scoped>
/* 이 영역의 "자기 폭"을 기준으로 반응형을 판단한다. (뷰포트 기준이면 사이드바 폭 때문에 어긋난다)
   max-width를 두지 않아, 화면이 넓어지면(화면 배율을 줄이면) 카드도 화면 폭을 끝까지 채운다. */
.order-register {
  container-type: inline-size;
}

.page-head {
  margin-bottom: 18px;
}

.page-head p {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: var(--tms-text-muted);
}

.layout-grid {
  display: grid;
  /* 요약 패널은 전체 폭의 22%, 단 320~480px 사이로 제한한다. */
  grid-template-columns: minmax(0, 1fr) clamp(320px, 22%, 480px);
  gap: 20px;
  align-items: start;
}

.main-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary {
  position: sticky;
  top: 0;
}

.card {
  padding: 20px 24px;
  background: #fff;
  border: 1px solid var(--tms-border);
  border-radius: 12px;
}

.card h3 {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 700;
  color: var(--tms-text-strong);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-head h3 {
  margin: 0;
}

/* 상차 -> 도착 타임라인 */
.stage {
  display: flex;
  gap: 16px;
}

.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  flex: none;
}

.dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.dot-pickup {
  background: var(--el-color-primary);
}

.dot-dest {
  background: #0f766e;
}

.line {
  flex: 1;
  width: 2px;
  margin: 4px 0;
  background: var(--tms-border-strong);
}

.stage-body {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 0 16px;
  padding-bottom: 6px;
}

.chips {
  margin-top: 8px;
}

/* 주소 검색 입력이 칸 전체 폭을 쓰도록 한다. (el-form-item 안에서는 flex 자식이라 폭이 내용만큼만 잡힌다) */
.stage-body :deep(.address-search-input) {
  width: 100%;
}

.stage-body :deep(.address-search-input .el-input) {
  flex: 1;
  min-width: 0;
}

.stage-body :deep(.el-date-editor) {
  width: 100%;
}

.stage-body :deep(.el-form-item) {
  margin-bottom: 14px;
}

.preset-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 12.5px;
  color: var(--tms-text-muted);
}

/* 화물 카드/경로 카드도 각자 폭을 기준으로 배치를 바꾼다. */
.route-card,
.cargo-card {
  container-type: inline-size;
}

.cargo-card {
  --cargo-columns: 28px repeat(3, minmax(0, 1fr)) 104px 84px 104px 76px;
}

.cargo-header {
  display: grid;
  grid-template-columns: var(--cargo-columns);
  gap: 10px;
  padding-bottom: 4px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--tms-text-muted);
}

/* 전체 폭이 1100px 미만이면 요약 패널을 본문 아래로 내린다. */
@container (max-width: 1100px) {
  .layout-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .summary {
    position: static;
  }
}

/* 경로 카드 폭이 좁으면 주소/일시를 세로로 쌓는다. */
@container (max-width: 640px) {
  .stage-body {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* 화물 카드 폭이 좁으면 헤더를 숨기고 행을 두 줄로 쌓는다. (CargoRow도 같은 기준을 쓴다) */
@container (max-width: 700px) {
  .cargo-header {
    display: none;
  }
}
</style>
