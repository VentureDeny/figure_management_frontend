<template>
  <div class="home-container">
    <!-- 统计卡片区域 -->
    <div class="stats-grid">
      <el-card class="stats-card" shadow="hover">
        <div class="stats-content">
          <div class="stats-icon stats-icon-blue">
            <el-icon size="32"><Box /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ overviewData.total_figures || 0 }}</div>
            <div class="stats-label">手办总数</div>
          </div>
        </div>
      </el-card>

      <el-card class="stats-card" shadow="hover">
        <div class="stats-content">
          <div class="stats-icon stats-icon-green">
            <el-icon size="32"><Download /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ overviewData.in_stock_figures || 0 }}</div>
            <div class="stats-label">在库数量</div>
          </div>
        </div>
      </el-card>

      <el-card class="stats-card" shadow="hover">
        <div class="stats-content">
          <div class="stats-icon stats-icon-orange">
            <el-icon size="32"><Upload /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ overviewData.sold_figures || 0 }}</div>
            <div class="stats-label">已售出</div>
          </div>
        </div>
      </el-card>

      <el-card class="stats-card" shadow="hover">
        <div class="stats-content">
          <div class="stats-icon stats-icon-purple">
            <el-icon size="32"><User /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ overviewData.total_members || 0 }}</div>
            <div class="stats-label">会员总数</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- 收支统计 -->
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>收支统计</h3>
            <el-select v-model="financeTimeRange" size="small" @change="updateFinanceChart">
              <el-option label="近7天" value="7days" />
              <el-option label="近30天" value="30days" />
              <el-option label="近3个月" value="3months" />
            </el-select>
          </div>
        </template>
        <div class="chart-container">
          <v-chart
            class="chart"
            :option="financeChartOption"
            :loading="chartsLoading"
          />
        </div>
      </el-card>

      <!-- 库存分布 -->
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <h3>库存分布</h3>
        </template>
        <div class="chart-container">
          <v-chart
            class="chart"
            :option="inventoryChartOption"
            :loading="chartsLoading"
          />
        </div>
      </el-card>
    </div>

    <!-- 快捷操作区域 -->
    <div class="quick-actions">
      <el-card shadow="hover">
        <template #header>
          <h3>快捷操作</h3>
        </template>
        <div class="actions-grid">
          <div class="action-item" @click="$router.push('/inbound')">
            <div class="action-icon action-icon-blue">
              <el-icon size="24"><Download /></el-icon>
            </div>
            <div class="action-text">手办入库</div>
          </div>
          <div class="action-item" @click="$router.push('/outbound')">
            <div class="action-icon action-icon-green">
              <el-icon size="24"><Upload /></el-icon>
            </div>
            <div class="action-text">手办出库</div>
          </div>
          <div class="action-item" @click="$router.push('/members')">
            <div class="action-icon action-icon-orange">
              <el-icon size="24"><User /></el-icon>
            </div>
            <div class="action-text">会员管理</div>
          </div>
          <div class="action-item" @click="$router.push('/transactions')">
            <div class="action-icon action-icon-purple">
              <el-icon size="24"><Tickets /></el-icon>
            </div>
            <div class="action-text">交易记录</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 今日交易 -->
    <div class="today-transactions">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>今日交易</h3>
            <el-button type="primary" size="small" @click="$router.push('/transactions')">
              查看全部
            </el-button>
          </div>
        </template>
        <el-table
          :data="todayTransactions"
          style="width: 100%"
          v-loading="transactionsLoading"
        >
          <el-table-column prop="id" label="交易ID" width="80" />
          <el-table-column prop="type" label="类型" width="80">
            <template #default="{ row }">
              <el-tag :type="row.type === '买入' ? 'success' : 'warning'">
                {{ row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="figure.name" label="手办名称" show-overflow-tooltip />
          <el-table-column prop="member.name" label="会员" width="100" />
          <el-table-column prop="price" label="金额" width="100">
            <template #default="{ row }">
              ¥{{ (row.price / 100).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, } from 'vue'
//import { useRouter } from 'vue-router'
import { getOverviewStatsApi, getFinancialStatsApi, getInventoryStatsApi, getTodayTransactionsApi } from '@/api/statistics'
import dayjs from 'dayjs'

//const router = useRouter()

// 响应式数据
const overviewData = ref({})
const chartsLoading = ref(false)
const transactionsLoading = ref(false)
const todayTransactions = ref([])
const financeTimeRange = ref('7days')

// 收支图表配置
const financeChartOption = ref({
  title: {
    text: '收支趋势',
    left: 'center',
    textStyle: { fontSize: 14 }
  },
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      let result = params[0].name + '<br/>'
      params.forEach(item => {
        result += item.marker + item.seriesName + ': ¥' + (item.value / 100).toFixed(2) + '<br/>'
      })
      return result
    }
  },
  legend: {
    data: ['买入', '卖出', '利润'],
    top: 30
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: (value) => '¥' + (value / 100).toFixed(0)
    }
  },
  series: [
    {
      name: '买入',
      type: 'line',
      data: [],
      itemStyle: { color: '#67C23A' }
    },
    {
      name: '卖出',
      type: 'line',
      data: [],
      itemStyle: { color: '#409EFF' }
    },
    {
      name: '利润',
      type: 'bar',
      data: [],
      itemStyle: { color: '#E6A23C' }
    }
  ],
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  }
})

// 库存分布图表配置
const inventoryChartOption = ref({
  title: {
    text: '库存分布',
    left: 'center',
    textStyle: { fontSize: 14 }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    top: 'middle'
  },
  series: [
    {
      name: '库存分布',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      data: [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  ]
})

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm')
}

// 获取总体统计数据
const fetchOverviewData = async () => {
  try {
    const response = await getOverviewStatsApi()
    if (response.code === 200) {
      overviewData.value = response.data
    }
  } catch (error) {
    console.error('获取总体统计失败:', error)
  }
}

// 获取收支统计数据
const fetchFinanceData = async () => {
  try {
    chartsLoading.value = true
    const response = await getFinancialStatsApi({ range: financeTimeRange.value })
    if (response.code === 200) {
      const { daily_stats } = response.data
      if (daily_stats && daily_stats.length > 0) {
        const dates = daily_stats.map(item => dayjs(item.date).format('MM-DD'))
        const buyAmounts = daily_stats.map(item => item.buy_amount || 0)
        const sellAmounts = daily_stats.map(item => item.sell_amount || 0)
        const profits = daily_stats.map(item => item.profit || 0)

        financeChartOption.value.xAxis.data = dates
        financeChartOption.value.series[0].data = buyAmounts
        financeChartOption.value.series[1].data = sellAmounts
        financeChartOption.value.series[2].data = profits
      }
    }
  } catch (error) {
    console.error('获取收支统计失败:', error)
  } finally {
    chartsLoading.value = false
  }
}

// 获取库存分布数据
const fetchInventoryData = async () => {
  try {
    const response = await getInventoryStatsApi()
    if (response.code === 200) {
      const { category_stats } = response.data
      if (category_stats && category_stats.length > 0) {
        const pieData = category_stats.map(item => ({
          name: item.series || '未分类',
          value: item.count || 0
        }))
        inventoryChartOption.value.series[0].data = pieData
      }
    }
  } catch (error) {
    console.error('获取库存统计失败:', error)
  }
}

// 获取今日交易数据
const fetchTodayTransactions = async () => {
  try {
    transactionsLoading.value = true
    const today = dayjs().format('YYYY-MM-DD')
    const response = await getTodayTransactionsApi({
      start_date: today,
      end_date: today,
      size: 10
    })
    if (response.code === 200) {
      todayTransactions.value = response.data || []
    }
  } catch (error) {
    console.error('获取今日交易失败:', error)
  } finally {
    transactionsLoading.value = false
  }
}

// 更新收支图表
const updateFinanceChart = () => {
  fetchFinanceData()
}

// 页面挂载时获取数据
onMounted(() => {
  fetchOverviewData()
  fetchFinanceData()
  fetchInventoryData()
  fetchTodayTransactions()
})
</script>

<style scoped>
.home-container {
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stats-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.stats-content {
  display: flex;
  align-items: center;
  padding: 16px 0;
}

.stats-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: white;
}

.stats-icon-blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stats-icon-green { background: linear-gradient(135deg, #42e695 0%, #3bb2b8 100%); }
.stats-icon-orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stats-icon-purple { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }

.stats-info {
  flex: 1;
}

.stats-value {
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #8492a6;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
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

.chart-container {
  height: 300px;
}

.chart {
  height: 100%;
  width: 100%;
}

.quick-actions {
  margin-bottom: 24px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.action-item:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: white;
}

.action-icon-blue { background: #409EFF; }
.action-icon-green { background: #67C23A; }
.action-icon-orange { background: #E6A23C; }
.action-icon-purple { background: #9254DE; }

.action-text {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
}

.today-transactions {
  margin-bottom: 24px;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stats-content {
    flex-direction: column;
    text-align: center;
    padding: 12px 0;
  }

  .stats-icon {
    margin-right: 0;
    margin-bottom: 8px;
    width: 48px;
    height: 48px;
  }

  .stats-value {
    font-size: 20px;
  }

  .charts-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .chart-container {
    height: 250px;
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .action-item {
    padding: 16px 8px;
  }

  .action-icon {
    width: 40px;
    height: 40px;
  }
}

/* 平板适配 */
@media (min-width: 768px) and (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
