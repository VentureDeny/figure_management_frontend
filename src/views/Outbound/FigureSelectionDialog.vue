<!-- components/FigureSelectionDialog.vue -->
<template>
  <el-dialog
    v-model="visible"
    title="选择要出库的手办"
    width="85%"
    max-width="1200px"
    :close-on-click-modal="false"
    :before-close="handleClose"
    class="figure-selection-dialog"
  >
    <div class="selection-header">
      <el-alert
        :title="`扫描条码 ${scanCode} 找到 ${figures.length} 个在库手办`"
        type="info"
        show-icon
        :closable="false"
      />

      <div class="filter-bar">
        <el-radio-group v-model="sortBy" @change="sortFigures">
          <el-radio-button value="time">按购买时间</el-radio-button>
          <el-radio-button value="price">按购买价格</el-radio-button>
          <el-radio-button value="name">按名称</el-radio-button>
        </el-radio-group>

        <el-switch
          v-model="sortDesc"
          @change="sortFigures"
          active-text="降序"
          inactive-text="升序"
        />
      </div>
    </div>

    <div class="figures-grid">
      <div
        v-for="(figure, index) in sortedFigures"
        :key="figure.id"
        class="figure-card"
        :class="{ 'selected': selectedIndex === index }"
        @click="selectFigure(index)"
      >
        <!-- 选择指示器 -->
        <div class="selection-badge" v-if="selectedIndex === index">
          <el-icon><Check /></el-icon>
        </div>

        <!-- 手办图片 -->
        <div class="figure-image-container">
          <el-image
            v-if="figure.photos && figure.photos.length > 0"
            :src="getImageUrl(figure.photos[0].photo_path)"
            :preview-src-list="figure.photos.map(p => getImageUrl(p.photo_path))"
            class="figure-image"
            fit="cover"
          >
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div v-else class="image-slot">
            <el-icon><Picture /></el-icon>
          </div>

          <!-- 图片数量徽章 -->
          <el-badge
            v-if="figure.photos && figure.photos.length > 1"
            :value="figure.photos.length"
            class="photo-count-badge"
          />
        </div>

        <!-- 手办基本信息 -->
        <div class="figure-info">
          <h4 class="figure-name" :title="figure.name">{{ figure.name }}</h4>
          <div class="figure-uuid">
            <el-tag size="small" type="info">{{ figure.uuid }}</el-tag>
          </div>
        </div>

        <!-- 购买详情 -->
        <div class="buy-details" v-if="figure.buy_detail">
          <div class="detail-row highlight">
            <span class="label">购买价格:</span>
            <span class="value price">¥{{ formatPrice(figure.buy_detail.buy_price) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">购买时间:</span>
            <span class="value">{{ formatDateTime(figure.buy_detail.buy_time, 'date') }}</span>
          </div>
          <div class="detail-row">
            <span class="label">卖家:</span>
            <span class="value">{{ figure.buy_detail.seller_name }}</span>
          </div>
          <div class="detail-row">
            <span class="label">电话:</span>
            <span class="value">{{ figure.buy_detail.seller_phone }}</span>
          </div>
          <div v-if="figure.buy_detail.remark" class="detail-row">
            <span class="label">备注:</span>
            <span class="value remark" :title="figure.buy_detail.remark">
              {{ figure.buy_detail.remark }}
            </span>
          </div>
        </div>

        <!-- 推荐售价预览 -->
        <div class="price-preview">
          <div class="current-price">
            <span class="label">当前买入:</span>
            <span class="value">¥{{ formatPrice(figure.current_buy_price) }}</span>
          </div>
          <div class="reference-price" v-if="figure.template?.reference_price">
            <span class="label">参考价:</span>
            <span class="value">¥{{ formatPrice(figure.template.reference_price) }}</span>
          </div>
          <div class="profit-estimate">
            <span class="label">预估利润:</span>
            <span class="value" :class="getProfitClass(figure)">
              {{ getProfitText(figure) }}
            </span>
          </div>
        </div>

        <!-- 详细信息展开按钮 -->
        <div class="card-actions">
          <el-button size="small" text @click.stop="showDetails(figure)">
            <el-icon><InfoFilled /></el-icon>
            详情
          </el-button>
        </div>
      </div>
    </div>

    <!-- 底部统计信息 -->
    <div class="selection-footer">
      <div class="stats">
        <span>总计 {{ figures.length }} 个手办</span>
        <span v-if="selectedIndex !== -1">
          已选择: {{ sortedFigures[selectedIndex]?.name }}
        </span>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="confirmSelection"
          :disabled="selectedIndex === -1"
        >
          确认选择
          <span v-if="selectedIndex !== -1">
            ({{ sortedFigures[selectedIndex]?.name }})
          </span>
        </el-button>
      </div>
    </template>

    <!-- 手办详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="手办详情"
      width="600px"
      append-to-body
    >
      <div v-if="detailFigure" class="figure-detail-content">
        <!-- 详情内容 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="名称">{{ detailFigure.name }}</el-descriptions-item>
          <el-descriptions-item label="UUID">{{ detailFigure.uuid }}</el-descriptions-item>
          <el-descriptions-item label="系列">{{ detailFigure.series }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ detailFigure.character }}</el-descriptions-item>
          <el-descriptions-item label="制造商">{{ detailFigure.manufacturer }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="detailFigure.status === '在库' ? 'success' : 'warning'">
              {{ detailFigure.status }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="detailFigure.buy_detail" class="buy-detail-section">
          <h4>购买记录</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="购买时间">
              {{ formatDateTime(detailFigure.buy_detail.buy_time) }}
            </el-descriptions-item>
            <el-descriptions-item label="购买价格">
              ¥{{ formatPrice(detailFigure.buy_detail.buy_price) }}
            </el-descriptions-item>
            <el-descriptions-item label="卖家">
              {{ detailFigure.buy_detail.seller_name }} ({{ detailFigure.buy_detail.seller_phone }})
            </el-descriptions-item>
            <el-descriptions-item v-if="detailFigure.buy_detail.remark" label="备注">
              {{ detailFigure.buy_detail.remark }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  figures: {
    type: Array,
    default: () => []
  },
  scanCode: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

// 响应式数据
const visible = ref(false)
const selectedIndex = ref(-1)
const sortBy = ref('time')
const sortDesc = ref(true)
const showDetailDialog = ref(false)
const detailFigure = ref(null)

// 工具函数
const formatDateTime = (dateTime, format = 'datetime') => {
  if (!dateTime) return ''

  const date = new Date(dateTime)
  if (isNaN(date.getTime())) return ''

  const options = {
    datetime: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    },
    date: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  }

  return date.toLocaleString('zh-CN', options[format])
}

const formatPrice = (price, decimals = 2) => {
  if (typeof price !== 'number' || isNaN(price)) return '0.00'
  return (price / 100).toFixed(decimals)
}

const getImageUrl = (path) => {
  if (!path) return '/placeholder.png'
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_BASE_URL || ''}${path}`
}

// 计算属性
const sortedFigures = computed(() => {
  const figures = [...props.figures]

  figures.sort((a, b) => {
    let compareResult = 0

    switch (sortBy.value) {
      case 'time':
        const timeA = a.buy_detail?.buy_time ? new Date(a.buy_detail.buy_time) : new Date(0)
        const timeB = b.buy_detail?.buy_time ? new Date(b.buy_detail.buy_time) : new Date(0)
        compareResult = timeA - timeB
        break
      case 'price':
        const priceA = a.buy_detail?.buy_price || 0
        const priceB = b.buy_detail?.buy_price || 0
        compareResult = priceA - priceB
        break
      case 'name':
        compareResult = a.name.localeCompare(b.name)
        break
    }

    return sortDesc.value ? -compareResult : compareResult
  })

  return figures
})

// 监听器
watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    reset()
  }
})

// 方法
const selectFigure = (index) => {
  selectedIndex.value = index
}

const sortFigures = () => {
  // 排序后重置选择
  selectedIndex.value = -1
}

const getProfitClass = (figure) => {
  const buyPrice = figure.current_buy_price || 0
  const refPrice = figure.template?.reference_price || buyPrice * 1.2
  const profit = refPrice - buyPrice

  if (profit > 0) return 'profit-positive'
  if (profit < 0) return 'profit-negative'
  return 'profit-zero'
}

const getProfitText = (figure) => {
  const buyPrice = figure.current_buy_price || 0
  const refPrice = figure.template?.reference_price || buyPrice * 1.2
  const profit = (refPrice - buyPrice) / 100

  return profit >= 0 ? `+¥${profit.toFixed(2)}` : `-¥${Math.abs(profit).toFixed(2)}`
}

const showDetails = (figure) => {
  detailFigure.value = figure
  showDetailDialog.value = true
}

const confirmSelection = () => {
  if (selectedIndex.value !== -1) {
    const selectedFigure = sortedFigures.value[selectedIndex.value]
    emit('confirm', selectedFigure)
    visible.value = false
  }
}

const handleClose = () => {
  emit('cancel')
  visible.value = false
}

const reset = () => {
  selectedIndex.value = -1
  sortBy.value = 'time'
  sortDesc.value = true
  showDetailDialog.value = false
  detailFigure.value = null
}
</script>

<style scoped>
.figure-selection-dialog {
  --el-dialog-padding-primary: 20px;
}

.selection-header {
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.figures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.figure-card {
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: white;
}

.figure-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.figure-card.selected {
  border-color: #67c23a;
  background-color: #f0f9ff;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.15);
}

.selection-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: #67c23a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.figure-image-container {
  position: relative;
  margin-bottom: 12px;
}

.figure-image {
  width: 100%;
  height: 120px;
  border-radius: 8px;
}

.image-slot {
  width: 100%;
  height: 120px;
  background-color: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 24px;
}

.photo-count-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

.figure-info {
  margin-bottom: 12px;
}

.figure-name {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.figure-uuid {
  margin-bottom: 8px;
}

.buy-details {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 12px;
  font-size: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row.highlight {
  font-weight: 600;
}

.detail-row .label {
  color: #606266;
  flex: 0 0 auto;
}

.detail-row .value {
  color: #2c3e50;
  text-align: right;
  flex: 1;
  margin-left: 8px;
}

.detail-row .value.price {
  color: #e6a23c;
  font-weight: 600;
}

.detail-row .value.remark {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.price-preview {
  background-color: #fff9e6;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
  font-size: 12px;
}

.current-price,
.reference-price,
.profit-estimate {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.profit-estimate:last-child {
  margin-bottom: 0;
}

.profit-positive {
  color: #67c23a;
  font-weight: 600;
}

.profit-negative {
  color: #f56c6c;
  font-weight: 600;
}

.profit-zero {
  color: #909399;
}

.card-actions {
  text-align: center;
}

.selection-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

.stats {
  display: flex;
  justify-content: space-between;
  color: #606266;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.buy-detail-section {
  margin-top: 20px;
}

.buy-detail-section h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .figures-grid {
    grid-template-columns: 1fr;
    max-height: 50vh;
  }

  .filter-bar {
    flex-direction: column;
    gap: 12px;
  }

  .stats {
    flex-direction: column;
    gap: 8px;
  }
}

/* 滚动条美化 */
.figures-grid::-webkit-scrollbar {
  width: 6px;
}

.figures-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.figures-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.figures-grid::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
