<template>
  <div class="transaction-history">
    <!-- 手办基本信息 -->
    <el-card class="figure-info-card" v-if="figureInfo">
      <div class="figure-summary">

        <div class="figure-details">
          <h3>{{ figureInfo.name }}</h3>
          <p class="figure-meta">
            <span>{{ figureInfo.series }}</span> •
            <span>{{ figureInfo.character }}</span> •
            <span>{{ figureInfo.manufacturer }}</span>
          </p>
          <div class="figure-stats">
            <el-tag :type="figureInfo.status === '在库' ? 'success' : 'info'">
              {{ figureInfo.status }}
            </el-tag>
            <span class="stat-item">交易次数：{{ transactions.length }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 交易记录 -->
    <el-card class="transaction-list-card">
      <template #header>
        <div class="card-header">
          <span>交易记录</span>
          <el-button type="primary" size="small" @click="refreshHistory">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <div v-loading="loading" class="transaction-list">
        <div v-if="transactions.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无交易记录" />
        </div>

        <div v-else class="timeline-container">
          <el-timeline>
            <el-timeline-item
              v-for="transaction in transactions"
              :key="transaction.id"
              :timestamp="formatDateTime(transaction.created_at)"
              placement="top"
              :type="transaction.type === '买入' ? 'success' : 'warning'"
              :icon="transaction.type === '买入' ? 'Plus' : 'Minus'"
              size="large"
            >
              <el-card class="transaction-item" shadow="hover">
                <div class="transaction-header">
                  <div class="transaction-type">
                    <el-tag
                      :type="transaction.type === '买入' ? 'success' : 'warning'"
                      size="large"
                    >
                      {{ transaction.type }}
                    </el-tag>
                    <span class="transaction-price">
                      ¥{{ (transaction.price / 100).toFixed(2) }}
                    </span>
                  </div>
                  <div class="transaction-actions">

                  </div>
                </div>

                <div class="transaction-content">
                  <el-row :gutter="16">
                    <el-col :span="12">
                      <div class="info-item">
                        <span class="label">会员：</span>
                        <span class="value">{{ transaction.member?.name || '-' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">联系方式：</span>
                        <span class="value">{{ transaction.member?.phone || '-' }}</span>
                      </div>
                    </el-col>
                    <el-col :span="12">
                      <div class="info-item">
                        <span class="label">操作员：</span>
                        <span class="value">{{ transaction.operator?.name || '-' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">积分变化：</span>
                        <span
                          class="value points"
                          :class="transaction.points_change > 0 ? 'positive' : 'negative'"
                        >
                          {{ transaction.points_change > 0 ? '+' : '' }}{{ transaction.points_change || 0 }}
                        </span>
                      </div>
                    </el-col>
                  </el-row>

                  <div v-if="transaction.remark" class="transaction-remark">
                    <span class="label">备注：</span>
                    <span class="value">{{ transaction.remark }}</span>
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-card>

    <!-- 统计信息 -->
    <el-card class="stats-card" v-if="transactions.length > 0">
      <template #header>
        <span>统计信息</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item-card">
            <div class="stat-number">{{ buyTransactions.length }}</div>
            <div class="stat-label">买入次数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item-card">
            <div class="stat-number">{{ sellTransactions.length }}</div>
            <div class="stat-label">卖出次数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item-card">
            <div class="stat-number">¥{{ totalBuyAmount.toFixed(2) }}</div>
            <div class="stat-label">总买入金额</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item-card">
            <div class="stat-number">¥{{ totalSellAmount.toFixed(2) }}</div>
            <div class="stat-label">总卖出金额</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { getFigureHistoryApi } from '@/api/figures'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

// 定义 props
const props = defineProps({
  figureId: {
    type: [Number, String],
    required: true
  },
  figureData: {
    type: Object,
    default: null
  }
})

// 定义 emits
const emit = defineEmits(['transaction-detail'])

// 响应式数据
const loading = ref(false)
const transactions = ref([])
const figureInfo = ref(null)

// 计算属性
const mainPhoto = computed(() => {
  if (!figureInfo.value?.photos) return null
  return figureInfo.value.photos.find(p => p.is_main) || figureInfo.value.photos[0]
})

const buyTransactions = computed(() => {
  return transactions.value.filter(t => t.type === '买入')
})

const sellTransactions = computed(() => {
  return transactions.value.filter(t => t.type === '卖出')
})

const totalBuyAmount = computed(() => {
  return buyTransactions.value.reduce((sum, t) => sum + (t.price || 0), 0) / 100
})

const totalSellAmount = computed(() => {
  return sellTransactions.value.reduce((sum, t) => sum + (t.price || 0), 0) / 100
})

// 方法
const loadHistory = async () => {
  if (!props.figureId) {
    console.warn('figureId is required')
    return
  }

  loading.value = true
  try {
    console.log('Loading history for figure:', props.figureId)
    const response = await getFigureHistoryApi(props.figureId)

    if (response && response.code === 200) {
      transactions.value = response.data.transactions || []
      figureInfo.value = response.data.figure || props.figureData
      console.log('交易历史加载成功:', {
        transactions: transactions.value.length,
        figure: figureInfo.value?.name
      })
    } else {
      console.error('API response error:', response)
      ElMessage.error(response?.message || '获取交易历史失败')
    }
  } catch (error) {
    console.error('获取交易历史失败:', error)
    ElMessage.error('获取交易历史失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const refreshHistory = () => {
  loadHistory()
}

const viewTransactionDetail = (transaction) => {
  emit('transaction-detail', transaction)
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return import.meta.env.VITE_API_BASE_URL + '/' + path
}

// 监听器
watch(() => props.figureId, (newId) => {
  if (newId) {
    loadHistory()
  }
}, { immediate: true })

// 如果有初始数据，也设置一下
watch(() => props.figureData, (newData) => {
  if (newData && !figureInfo.value) {
    figureInfo.value = newData
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  if (props.figureId) {
    loadHistory()
  }
})
</script>

<style scoped>
.transaction-history {
  max-height: 70vh;
  overflow-y: auto;
}

.figure-info-card {
  margin-bottom: 20px;
}

.figure-summary {
  display: flex;
  align-items: center;
  gap: 16px;
}

.figure-image {
  flex-shrink: 0;
}

.figure-details h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
}

.figure-meta {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
}

.figure-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-item {
  color: #606266;
  font-size: 14px;
}

.transaction-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-container {
  margin-top: 20px;
}

.transaction-item {
  margin-bottom: 16px;
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.transaction-type {
  display: flex;
  align-items: center;
  gap: 12px;
}

.transaction-price {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.transaction-content {
  margin-top: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.label {
  flex-shrink: 0;
  width: 80px;
  color: #606266;
  font-size: 14px;
}

.value {
  color: #303133;
}

.points.positive {
  color: #67c23a;
  font-weight: 600;
}

.points.negative {
  color: #f56c6c;
  font-weight: 600;
}

.transaction-remark {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: flex-start;
}

.transaction-remark .label {
  width: 60px;
}

.stats-card {
  margin-top: 20px;
}

.stat-item-card {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

:deep(.el-timeline-item__timestamp) {
  color: #606266;
  font-size: 12px;
}

:deep(.el-card__body) {
  padding: 16px;
}
</style>
