<template>
  <div class="transactions-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>交易管理</h2>
      <div class="header-actions">
        <el-button type="success" @click="openBuyDialog">
          <el-icon><Plus /></el-icon>
          买入交易
        </el-button>
        <el-button type="warning" @click="openSellDialog">
          <el-icon><Minus /></el-icon>
          卖出交易
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="交易类型">
          <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 120px">
            <el-option label="买入" value="买入" />
            <el-option label="卖出" value="卖出" />
          </el-select>
        </el-form-item>
        <el-form-item label="会员">
          <el-select
            v-model="searchForm.member_id"
            placeholder="选择会员"
            clearable
            filterable
            remote
            :remote-method="searchMembers"
            :loading="memberSearchLoading"
            style="width: 200px"
          >
            <el-option
              v-for="member in memberOptions"
              :key="member.id"
              :label="`${member.name} (${member.phone})`"
              :value="member.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作员">
          <el-select v-model="searchForm.operator_id" placeholder="选择操作员" clearable style="width: 150px">
            <el-option
              v-for="operator in operatorOptions"
              :key="operator.id"
              :label="operator.name"
              :value="operator.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 交易列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="transactions"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="交易ID" width="80" />
        <el-table-column label="交易类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === '买入' ? 'success' : 'warning'">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="手办信息" min-width="200">
          <template #default="{ row }">
            <div class="figure-info">
              <div class="figure-name">{{ row.figure?.name }}</div>
              <div class="figure-template">{{ row.figure?.template?.name }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="会员信息" width="150">
          <template #default="{ row }">
            <div class="member-info">
              <div>{{ row.member?.name }}</div>
              <div class="phone">{{ row.member?.phone }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="交易价格" width="120" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ (row.price / 100).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="积分变化" width="100" align="center">
          <template #default="{ row }">
            <span :class="row.points_change > 0 ? 'positive' : 'negative'">
              {{ row.points_change > 0 ? '+' : '' }}{{ row.points_change }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作员" width="100">
          <template #default="{ row }">
            {{ row.operator?.name }}
          </template>
        </el-table-column>
        <el-table-column label="交易时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">
              查看详情
            </el-button>
            <el-button type="info" link @click="editTransaction(row)">
              编辑
            </el-button>
            <el-button type="danger" link @click="deleteTransaction(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 买入交易弹窗 -->
    <buy-transaction-dialog
      v-model="showBuyDialog"
      @success="handleTransactionSuccess"
    />

    <!-- 卖出交易弹窗 -->
    <sell-transaction-dialog
      v-model="showSellDialog"
      @success="handleTransactionSuccess"
    />

    <!-- 交易详情弹窗 -->
    <transaction-detail
      v-model="showDetailDialog"
      :transaction-data="selectedTransaction"
    />

    <!-- 编辑交易弹窗 -->
    <edit-transaction-dialog
      v-model="showEditDialog"
      :transaction-data="selectedTransaction"
      @success="handleTransactionSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Minus, Search, Refresh } from '@element-plus/icons-vue'
import {
  getTransactionsApi,
  deleteTransactionApi
} from '@/api/transactions'
import { getMembersApi } from '@/api/members'
import { getOperatorsApi } from '@/api/operators'
import BuyTransactionDialog from './components/BuyTransactionDialog.vue'
import SellTransactionDialog from './components/SellTransactionDialog.vue'
import TransactionDetail from './components/TransactionDetail.vue'
import EditTransactionDialog from './components/EditTransactionDialog.vue'
import dayjs from 'dayjs'

// 响应式数据
const loading = ref(false)
const memberSearchLoading = ref(false)
const transactions = ref([])
const memberOptions = ref([])
const operatorOptions = ref([])
const dateRange = ref([])

// 弹窗状态
const showBuyDialog = ref(false)
const showSellDialog = ref(false)
const showDetailDialog = ref(false)
const showEditDialog = ref(false)
const selectedTransaction = ref(null)

// 搜索表单
const searchForm = reactive({
  type: '',
  member_id: '',
  operator_id: '',
  start_date: '',
  end_date: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 计算属性
const searchParams = computed(() => {
  const params = {
    page: pagination.page,
    size: pagination.size,
    ...searchForm
  }

  if (dateRange.value && dateRange.value.length === 2) {
    params.start_date = dateRange.value[0]
    params.end_date = dateRange.value[1]
  }

  // 移除空值
  Object.keys(params).forEach(key => {
    if (params[key] === '' || params[key] == null) {
      delete params[key]
    }
  })

  return params
})

// 获取交易列表
const getTransactions = async () => {
  loading.value = true
  try {
    const response = await getTransactionsApi(searchParams.value)
    transactions.value = response.data
    pagination.total = response.total
  } catch (error) {
    console.error('获取交易列表失败:', error)
    ElMessage.error('获取交易列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索会员
const searchMembers = async (query) => {
  if (!query) {
    memberOptions.value = []
    return
  }

  memberSearchLoading.value = true
  try {
    const response = await getMembersApi({ keyword: query, size: 20 })
    memberOptions.value = response.data
  } catch (error) {
    console.error('搜索会员失败:', error)
  } finally {
    memberSearchLoading.value = false
  }
}

// 获取操作员列表
const getOperators = async () => {
  try {
    const response = await getOperatorsApi({ size: 100 })
    operatorOptions.value = response.data
  } catch (error) {
    console.error('获取操作员列表失败:', error)
  }
}

// 事件处理
const handleSearch = () => {
  pagination.page = 1
  getTransactions()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  dateRange.value = []
  pagination.page = 1
  getTransactions()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  getTransactions()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  getTransactions()
}

const openBuyDialog = () => {
  showBuyDialog.value = true
}

const openSellDialog = () => {
  showSellDialog.value = true
}

const viewDetail = (transaction) => {
  selectedTransaction.value = transaction
  showDetailDialog.value = true
}

const editTransaction = (transaction) => {
  selectedTransaction.value = transaction
  showEditDialog.value = true
}

const deleteTransaction = async (transaction) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这笔${transaction.type}交易吗？删除后无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteTransactionApi(transaction.id)
    ElMessage.success('交易删除成功')
    getTransactions()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除交易失败:', error)
      ElMessage.error('删除交易失败')
    }
  }
}

const handleTransactionSuccess = () => {
  getTransactions()
}

const formatDateTime = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 监听搜索参数变化
watch(() => searchParams.value, () => {
  if (pagination.page === 1) {
    getTransactions()
  } else {
    pagination.page = 1
  }
}, { deep: true })

// 组件挂载
onMounted(() => {
  getTransactions()
  getOperators()
})
</script>

<style scoped>
.transactions-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.figure-info {
  line-height: 1.4;
}

.figure-name {
  font-weight: 500;
  color: #303133;
}

.figure-template {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.member-info {
  line-height: 1.4;
}

.phone {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.price {
  font-weight: 600;
  color: #409eff;
}

.positive {
  color: #67c23a;
  font-weight: 600;
}

.negative {
  color: #f56c6c;
  font-weight: 600;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 16px;
}
</style>
