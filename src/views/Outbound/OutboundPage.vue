<template>
  <div class="outbound-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>手办出库</h2>
      <p>扫描手办条码进行出库操作</p>
    </div>

    <!-- 扫码区域 -->
    <el-card class="scan-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>扫码出库</h3>
          <el-button type="primary" @click="startScan" :disabled="scanning">
            <el-icon><Camera /></el-icon>
            {{ scanning ? '扫描中...' : '开始扫描' }}
          </el-button>
        </div>
      </template>

      <div class="scan-content">
        <div class="scan-input-group">
          <el-input
            v-model="scanCode"
            placeholder="请扫描条码或手动输入"
            size="large"
            clearable
            @keyup.enter="handleScanCode"
            @input="handleCodeInput"
          >
            <template #prepend>
              <el-icon><Aim /></el-icon>
            </template>
            <template #append>
              <el-button @click="handleScanCode" :loading="scanLoading">
                查询
              </el-button>
            </template>
          </el-input>
        </div>

        <div v-if="scanResult" class="scan-result">
          <el-alert
            :title="scanResult.message"
            :type="scanResult.type"
            show-icon
            :closable="false"
          />
        </div>
      </div>
    </el-card>

    <!-- 手办选择组件 -->
    <FigureSelectionDialog
      v-model="showFigureSelection"
      :figures="figureList"
      :scan-code="scanCode"
      @confirm="handleFigureSelectionConfirm"
      @cancel="handleFigureSelectionCancel"
    />

    <!-- 手办信息展示 -->
    <el-card v-if="figureInfo" class="figure-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>选中的手办信息</h3>
          <el-tag type="primary">{{ figureInfo.uuid }}</el-tag>
        </div>
      </template>

      <div class="figure-content">
        <div class="figure-images" v-if="figureInfo.photos && figureInfo.photos.length > 0">
          <el-carousel height="200px" indicator-position="outside">
            <el-carousel-item v-for="photo in figureInfo.photos" :key="photo.id">
              <img :src="getImageUrl(photo.photo_path)" :alt="figureInfo.name" class="figure-image" />
            </el-carousel-item>
          </el-carousel>
        </div>

        <div class="figure-details">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="手办名称">{{ figureInfo.name }}</el-descriptions-item>
            <el-descriptions-item label="条码">{{ figureInfo.barcode || figureInfo.special_code }}</el-descriptions-item>
            <el-descriptions-item label="系列">{{ figureInfo.series }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ figureInfo.character }}</el-descriptions-item>
            <el-descriptions-item label="制造商">{{ figureInfo.manufacturer }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="figureInfo.status === '在库' ? 'success' : 'warning'">
                {{ figureInfo.status }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前买入价">
              ¥{{ (figureInfo.current_buy_price / 100).toFixed(2) }}
            </el-descriptions-item>
            <el-descriptions-item label="参考价">
              ¥{{ ((figureInfo.template?.reference_price || 0) / 100).toFixed(2) }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 购买详情 -->
          <div v-if="figureInfo.buy_detail" class="buy-history">
            <h4>购买记录</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="购买时间">
                {{ formatDateTime(figureInfo.buy_detail.buy_time) }}
              </el-descriptions-item>
              <el-descriptions-item label="购买价格">
                ¥{{ (figureInfo.buy_detail.buy_price / 100).toFixed(2) }}
              </el-descriptions-item>
              <el-descriptions-item label="卖家">
                {{ figureInfo.buy_detail.seller_name }} ({{ figureInfo.buy_detail.seller_phone }})
              </el-descriptions-item>
              <el-descriptions-item v-if="figureInfo.buy_detail.remark" label="备注">
                {{ figureInfo.buy_detail.remark }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 出库表单 -->
    <el-card v-if="showForm" class="form-card" shadow="hover">
      <template #header>
        <h3>出库信息</h3>
      </template>

      <el-form
        ref="outboundFormRef"
        :model="outboundForm"
        :rules="outboundRules"
        label-width="100px"
        size="large"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="购买会员" prop="member_id">
              <el-select
                v-model="outboundForm.member_id"
                placeholder="选择购买会员"
                filterable
                remote
                :remote-method="searchMembers"
                :loading="membersLoading"
                style="width: 100%"
              >
                <el-option
                  v-for="member in membersList"
                  :key="member.id"
                  :label="`${member.name} (${member.phone})`"
                  :value="member.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="售出价格(元)" prop="price">
              <el-input-number
                v-model="sellPriceYuan"
                :min="0"
                :precision="2"
                style="width: 100%"
                @change="updateSellPrice"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="积分变化">
              <el-input-number
                v-model="outboundForm.points_change"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input
                v-model="outboundForm.remark"
                placeholder="可选备注信息"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 利润显示 -->
        <el-row v-if="figureInfo">
          <el-col :span="24">
            <el-form-item label="利润预估">
              <div class="profit-info">
                <span class="profit-label">买入价格: ¥{{ (figureInfo.current_buy_price / 100).toFixed(2) }}</span>
                <span class="profit-label">售出价格: ¥{{ sellPriceYuan.toFixed(2) }}</span>
                <span class="profit-value" :class="profitClass">
                  利润: ¥{{ profitAmount.toFixed(2) }}
                </span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <div class="form-actions" v-if="showForm">
      <el-button size="large" @click="resetForm">重置</el-button>
      <el-button
        type="primary"
        size="large"
        :loading="submitLoading"
        @click="handleSubmit"
      >
        确认出库
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { scanFigureApi } from '@/api/scan'
import { sellTransactionV2Api } from '@/api/transactions' // 使用新的API
import { searchMembersApi } from '@/api/members'
import FigureSelectionDialog from './FigureSelectionDialog.vue'

// 响应式数据
const scanCode = ref('')
const scanning = ref(false)
const scanLoading = ref(false)
const scanResult = ref(null)
const figureInfo = ref(null)
const showForm = ref(false)
const submitLoading = ref(false)
const membersLoading = ref(false)

// 多手办选择相关
const showFigureSelection = ref(false)
const figureList = ref([])

// 表单引用
const outboundFormRef = ref()

// 会员列表
const membersList = ref([])

// 出库表单数据
const outboundForm = reactive({
  figure_id: null,
  figure_uuid: null,
  member_id: null,
  price: 0,
  points_change: 0,
  remark: ''
})

// 价格计算（分转元）
const sellPriceYuan = computed({
  get: () => (outboundForm.price || 0) / 100,
  set: (value) => {
    outboundForm.price = Math.round((value || 0) * 100)
    // 自动计算积分（1元=1积分）
    outboundForm.points_change = Math.round(value || 0)
  }
})

// 利润计算
const profitAmount = computed(() => {
  if (!figureInfo.value) return 0
  const buyPrice = (figureInfo.value.current_buy_price || 0) / 100
  const sellPrice = sellPriceYuan.value
  return sellPrice - buyPrice
})

// 利润样式类
const profitClass = computed(() => {
  const profit = profitAmount.value
  if (profit > 0) return 'profit-positive'
  if (profit < 0) return 'profit-negative'
  return 'profit-zero'
})

// 表单验证规则
const outboundRules = {
  member_id: [
    { required: true, message: '请选择购买会员', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入售出价格', trigger: 'blur' }
  ]
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN')
}

// 更新售出价格
const updateSellPrice = (value) => {
  outboundForm.price = Math.round((value || 0) * 100)
  outboundForm.points_change = Math.round(value || 0)
}

// 获取图片URL
const getImageUrl = (path) => {
  if (!path) return '/placeholder.png'
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_BASE_URL || ''}${path}`
}

// 开始扫描
const startScan = () => {
  scanning.value = true
  // 这里可以集成实际的扫码功能
  ElMessage.info('扫码功能需要集成摄像头，请手动输入条码')
  setTimeout(() => {
    scanning.value = false
  }, 1000)
}

// 处理条码输入
const handleCodeInput = () => {
  if (scanResult.value) {
    scanResult.value = null
  }
  if (figureInfo.value) {
    figureInfo.value = null
    showForm.value = false
  }
  if (showFigureSelection.value) {
    showFigureSelection.value = false
    figureList.value = []
  }
}

// 处理扫码结果
const handleScanCode = async () => {
  if (!scanCode.value.trim()) {
    ElMessage.warning('请输入条码')
    return
  }

  try {
    scanLoading.value = true
    scanResult.value = null
    figureInfo.value = null
    showForm.value = false
    showFigureSelection.value = false
    figureList.value = []

    // 查找手办信息
    const response = await scanFigureApi({ code: scanCode.value })

    if (response.code === 200) {
      const scanData = response.data

      if (!scanData.found) {
        scanResult.value = {
          type: 'warning',
          message: '未找到对应的在库手办'
        }
        return
      }

      if (scanData.multiple) {
        // 多个手办，显示选择界面
        figureList.value = scanData.figures
        showFigureSelection.value = true
        scanResult.value = {
          type: 'info',
          message: `找到 ${scanData.count} 个同码在库手办，请选择要出库的手办`
        }
      } else {
        // 单个手办，直接显示
        const figure = scanData.figures[0]
        setupSingleFigure(figure)
      }
    } else {
      scanResult.value = {
        type: 'error',
        message: response.message || '查询失败'
      }
    }
  } catch (error) {
    console.error('扫码查询失败:', error)
    scanResult.value = {
      type: 'error',
      message: '查询失败，请重试'
    }
  } finally {
    scanLoading.value = false
  }
}

// 处理手办选择确认
const handleFigureSelectionConfirm = (selectedFigure) => {
  setupSingleFigure(selectedFigure)
}

// 处理手办选择取消
const handleFigureSelectionCancel = () => {
  showFigureSelection.value = false
  figureList.value = []
  scanResult.value = {
    type: 'info',
    message: '已取消选择，可重新扫码'
  }
}

// 设置单个手办信息
const setupSingleFigure = (figure) => {
  // 检查手办状态
  if (figure.status !== '在库') {
    scanResult.value = {
      type: 'warning',
      message: `该手办状态为：${figure.status}，无法出库`
    }
    return
  }

  // 显示手办信息
  figureInfo.value = figure
  outboundForm.figure_id = figure.id
  outboundForm.figure_uuid = figure.uuid

  // 设置推荐售价（可以基于参考价或买入价+利润）
  const recommendPrice = figure.template?.reference_price || figure.current_buy_price * 1.2
  sellPriceYuan.value = recommendPrice / 100

  scanResult.value = {
    type: 'success',
    message: '已选择手办，请确认出库信息'
  }
  showForm.value = true
}

// 搜索会员
const searchMembers = async (query) => {
  if (!query) {
    membersList.value = []
    return
  }

  try {
    membersLoading.value = true
    const response = await searchMembersApi({ keyword: query })

    if (response.code === 200) {
      membersList.value = response.data || []
    }
  } catch (error) {
    console.error('搜索会员失败:', error)
  } finally {
    membersLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  scanCode.value = ''
  scanResult.value = null
  figureInfo.value = null
  showForm.value = false
  showFigureSelection.value = false
  figureList.value = []

  Object.assign(outboundForm, {
    figure_id: null,
    figure_uuid: null,
    member_id: null,
    price: 0,
    points_change: 0,
    remark: ''
  })

  if (outboundFormRef.value) {
    outboundFormRef.value.resetFields()
  }
}

// 提交出库
const handleSubmit = async () => {
  try {
    // 验证表单
    await outboundFormRef.value.validate()

    const selectedMember = membersList.value.find(m => m.id === outboundForm.member_id)

    // 确认出库
    await ElMessageBox.confirm(
      `确认将手办 "${figureInfo.value.name}" (UUID: ${figureInfo.value.uuid}) 出库给会员 "${selectedMember?.name}"？`,
      '确认出库',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    submitLoading.value = true

    // 提交出库交易（使用新的API）
    const submitData = {
      figure_id: outboundForm.figure_id,
      figure_uuid: outboundForm.figure_uuid,
      member_id: outboundForm.member_id,
      price: outboundForm.price,
      points_change: outboundForm.points_change,
      remark: outboundForm.remark
    }

    const response = await sellTransactionV2Api(submitData)

    if (response.code === 200 || response.code === 201) {
      ElMessage.success('出库成功！')
      resetForm()
    } else {
      ElMessage.error(response.message || '出库失败')
    }
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消操作
      return
    }

    console.error('出库失败:', error)
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('出库失败，请重试')
    }
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.outbound-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  text-align: center;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: #8492a6;
  font-size: 14px;
}

.scan-card,
.figure-card,
.form-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #2c3e50;
}

.scan-content {
  padding: 20px 0;
}

.scan-input-group {
  margin-bottom: 16px;
}

.scan-result {
  margin-top: 16px;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .outbound-container {
    margin: 0;
  }

  .page-header h2 {
    font-size: 20px;
  }

  .scan-content {
    padding: 16px 0;
  }

  .figure-content {
    flex-direction: column;
    gap: 16px;
  }

  .figure-images {
    flex: none;
  }

  .profit-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .form-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 16px;
    border-top: 1px solid #e8e8e8;
    z-index: 100;
  }

  .form-actions .el-button {
    width: 45%;
    margin: 0 2.5%;
  }

  /* 为固定底部按钮预留空间 */
  .outbound-container {
    padding-bottom: 80px;
  }
};


.buy-detail-row .value.price {
  font-weight: 600;
  color: #e6a23c;
}

.figure-item-details {
  margin-bottom: 8px;
}

.selection-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  background: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 原有样式保持不变 */
.figure-content {
  display: flex;
  gap: 24px;
}

.figure-images {
  flex: 0 0 300px;
}

.figure-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}

.figure-details {
  flex: 1;
}

.buy-history {
  margin-top: 20px;
}

.buy-history h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
}

.profit-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.profit-label {
  font-size: 14px;
  color: #606266;
}

.profit-value {
  font-size: 16px;
  font-weight: 600;
}

.profit-positive {
  color: #67c23a;
}

.profit-negative {
  color: #f56c6c;
}

.profit-zero {
  color: #909399;
}

.form-actions {
  text-align: center;
  padding: 24px 0;
}

.form-actions .el-button {
  margin: 0 8px;
  min-width: 120px;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .outbound-container {
    margin: 0;
  }

  .page-header h2 {
    font-size: 20px;
  }

  .scan-content {
    padding: 16px 0;
  }

  .figure-content {
    flex-direction: column;
    gap: 16px;
  }

  .figure-images {
    flex: none;
  }

  .figure-selection-item {
    padding: 12px;
  }

  .figure-item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .buy-detail-row {
    flex-direction: column;
    gap: 4px;
  }

  .buy-detail-row .label {
    flex: none;
    font-weight: 600;
  }

  .profit-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .form-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 16px;
    border-top: 1px solid #e8e8e8;
    z-index: 100;
  }

  .form-actions .el-button {
    width: 45%;
    margin: 0 2.5%;
  }

  /* 为固定底部按钮预留空间 */
  .outbound-container {
    padding-bottom: 80px;
  }
}

/* 平板适配 */
@media (min-width: 768px) and (max-width: 1024px) {
  .outbound-container {
    max-width: 100%;
    padding: 0 16px;
  }

  .figure-content {
    flex-direction: column;
  }

  .figure-images {
    flex: none;
  }
}

:deep(.el-carousel__item) {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
}

:deep(.el-descriptions__body .el-descriptions__table) {
  table-layout: auto;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}
</style>
