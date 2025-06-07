<template>
  <div class="member-transactions">
    <!-- 交易统计 -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ totalTransactions }}</div>
          <div class="stat-label">总交易数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number buy">{{ buyTransactions }}</div>
          <div class="stat-label">买入次数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number sell">{{ sellTransactions }}</div>
          <div class="stat-label">卖出次数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">¥{{ totalAmount.toFixed(0) }}</div>
          <div class="stat-label">总交易额</div>
        </div>
      </el-card>
    </div>

    <!-- 筛选器 -->
    <el-card shadow="never" style="margin-bottom: 20px;">
      <el-form :model="searchForm" inline>
        <el-form-item label="交易类型">
          <el-select
            v-model="searchForm.type"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="买入" value="买入" />
            <el-option label="卖出" value="卖出" />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
            @change="handleDateChange"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 交易记录表格 -->
    <el-card shadow="never">
      <el-table :data="transactionsList" v-loading="loading">
        <el-table-column prop="id" label="交易ID" width="80" />

        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === '买入' ? 'success' : 'warning'">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="手办信息" min-width="200">
          <template #default="{ row }">
            <div class="figure-info">
              <div class="figure-name">{{ row.figure?.name || '-' }}</div>
              <small class="figure-template">{{ row.figure?.template?.name || '-' }}</small>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="金额" width="100" align="right">
          <template #default="{ row }">
            <span :class="['amount-value', row.type === '买入' ? 'amount-buy' : 'amount-sell']">
              ¥{{ (row.price / 100).toFixed(2) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="积分变化" width="100" align="right">
          <template #default="{ row }">
            <span :class="['points-change', row.points_change >= 0 ? 'points-positive' : 'points-negative']">
              {{ row.points_change > 0 ? '+' : '' }}{{ row.points_change || 0 }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="operator.name" label="操作员" width="100" />

        <el-table-column prop="remark" label="备注" width="150" show-overflow-tooltip />

        <el-table-column label="交易时间" width="160">
          <template #default="{ row }">
            {{ dayjs(row.created_at).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewDetail(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container" v-if="pagination.total > 10">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 交易详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="交易详情"
      width="70%"
      max-width="800px"
    >
      <TransactionDetail v-if="currentTransaction" :transaction="currentTransaction" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getTransactionsApi } from '@/api/transactions'
import TransactionDetail from '../Transactions/components/TransactionDetail.vue'
import dayjs from 'dayjs'

const props = defineProps({
  memberId: {
    type: Number,
    required: true
  }
})

const loading = ref(false)
const transactionsList = ref([])
const dateRange = ref([])
const detailVisible = ref(false)
const currentTransaction = ref(null)

// 搜索表单
const searchForm = reactive({
  type: '',
  start_date: '',
  end_date: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 统计信息
const totalTransactions = computed(() => pagination.total)
const buyTransactions = computed(() => transactionsList.value.filter(item => item.type === '买入').length)
const sellTransactions = computed(() => transactionsList.value.filter(item => item.type === '卖出').length)
const totalAmount = computed(() => {
  return transactionsList.value.reduce((sum, item) => sum + (item.price || 0), 0) / 100
})

// 获取交易记录
const fetchTransactions = async () => {
  try {
    loading.value = true

    const params = {
      member_id: props.memberId,
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }

    // 移除空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    const response = await getTransactionsApi(params)

    if (response.code === 200) {
      transactionsList.value = response.data || []
      pagination.total = response.total || 0
    }
  } catch (error) {
    console.error('获取交易记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 日期范围变化
const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    searchForm.start_date = dayjs(dates[0]).format('YYYY-MM-DD')
    searchForm.end_date = dayjs(dates[1]).format('YYYY-MM-DD')
  } else {
    searchForm.start_date = ''
    searchForm.end_date = ''
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchTransactions()
}

// 重置搜索
const resetSearch = () => {
  searchForm.type = ''
  searchForm.start_date = ''
  searchForm.end_date = ''
  dateRange.value = []
  pagination.page = 1
  fetchTransactions()
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchTransactions()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchTransactions()
}

// 查看详情
const viewDetail = (transaction) => {
  currentTransaction.value = transaction
  detailVisible.value = true
}

onMounted(() => {
  fetchTransactions()
})
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 16px;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-number.buy {
  color: #67c23a;
}

.stat-number.sell {
  color: #e6a23c;
}

.stat-label {
  font-size: 12px;
  color: #8492a6;
}

.figure-info {
  line-height: 1.4;
}

.figure-name {
  font-weight: 500;
  color: #303133;
}

.figure-template {
  color: #909399;
  display: block;
  margin-top: 2px;
}

.amount-value {
  font-weight: 600;
}

.amount-buy {
  color: #67c23a;
}

.amount-sell {
  color: #e6a23c;
}

.points-change {
  font-weight: 500;
}

.points-positive {
  color: #67c23a;
}

.points-negative {
  color: #f56c6c;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-content {
    padding: 12px;
  }

  .stat-number {
    font-size: 16px;
  }

  .stat-label {
    font-size: 11px;
  }

  :deep(.el-form--inline .el-form-item) {
    display: block;
    margin-right: 0;
    margin-bottom: 12px;
  }

  :deep(.el-form--inline .el-form-item__content) {
    width: 100%;
  }
}
</style>
