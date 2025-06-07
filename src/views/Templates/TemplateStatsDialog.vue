<template>
  <el-dialog
    v-model="visible"
    title="模板统计信息"
    width="900px"
    :before-close="handleClose"
    top="5vh"
  >
    <div v-if="statsData" class="stats-content">
      <!-- 总体统计 -->
      <el-card class="stats-card">
        <template #header>
          <span class="card-title">总体统计</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-icon total-icon">
                <el-icon><Box /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ statsData.total_count || 0 }}</div>
                <div class="stat-label">模板总数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-icon series-icon">
                <el-icon><Collection /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ statsData.series_stats?.length || 0 }}</div>
                <div class="stat-label">系列数量</div>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-icon manufacturer-icon">
                <el-icon><Shop /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ statsData.manufacturer_stats?.length || 0 }}</div>
                <div class="stat-label">厂商数量</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 系列统计 -->
      <el-card class="stats-card" v-if="statsData.series_stats && statsData.series_stats.length > 0">
        <template #header>
          <span class="card-title">系列分布 TOP10</span>
        </template>
        <div class="chart-container">
          <div ref="seriesChartRef" class="chart"></div>
        </div>
      </el-card>

      <!-- 厂商统计 -->
      <el-card class="stats-card" v-if="statsData.manufacturer_stats && statsData.manufacturer_stats.length > 0">
        <template #header>
          <span class="card-title">厂商分布 TOP10</span>
        </template>
        <div class="chart-container">
          <div ref="manufacturerChartRef" class="chart"></div>
        </div>
      </el-card>

      <!-- 最近添加的模板 -->
      <el-card class="stats-card" v-if="statsData.recent_templates && statsData.recent_templates.length > 0">
        <template #header>
          <span class="card-title">最近添加的模板</span>
        </template>
        <el-table
          :data="statsData.recent_templates"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="name" label="模板名称" min-width="200" />
          <el-table-column prop="series" label="系列" width="120" />
          <el-table-column prop="manufacturer" label="厂商" width="150" />
          <el-table-column label="原价" width="100" align="right">
            <template #default="{ row }">
              ¥{{ (row.original_price / 100).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 详细列表 -->
      <el-row :gutter="20" class="detail-lists">
        <!-- 系列详细列表 -->
        <el-col :span="12">
          <el-card class="list-card">
            <template #header>
              <span class="card-title">系列详情</span>
            </template>
            <div class="list-container">
              <div
                v-for="(item, index) in statsData.series_stats"
                :key="item.series"
                class="list-item"
              >
                <div class="rank">{{ index + 1 }}</div>
                <div class="item-info">
                  <div class="item-name">{{ item.series }}</div>
                  <div class="item-count">{{ item.count }} 个模板</div>
                </div>
                <div class="item-progress">
                  <el-progress
                    :percentage="(item.count / statsData.total_count * 100).toFixed(1)"
                    :width="80"
                    type="circle"
                    :show-text="false"
                  />
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { Box, Collection, Shop } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  statsData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const seriesChartRef = ref()
const manufacturerChartRef = ref()

let seriesChart = null
let manufacturerChart = null

const handleClose = () => {
  visible.value = false
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 渲染系列分布图
const renderSeriesChart = () => {
  if (!seriesChartRef.value || !props.statsData?.series_stats) return

  if (!seriesChart) {
    seriesChart = echarts.init(seriesChartRef.value)
  }

  const data = props.statsData.series_stats.slice(0, 10) // 只显示前10个

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.series),
      axisLabel: {
        interval: 0,
        formatter: function(value) {
          if (value.length > 10) {
            return value.substring(0, 10) + '...'
          }
          return value
        }
      }
    },
    series: [
      {
        name: '模板数量',
        type: 'bar',
        data: data.map(item => item.count),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ])
        }
      }
    ]
  }

  seriesChart.setOption(option)
}

// 渲染厂商分布图
const renderManufacturerChart = () => {
  if (!manufacturerChartRef.value || !props.statsData?.manufacturer_stats) return

  if (!manufacturerChart) {
    manufacturerChart = echarts.init(manufacturerChartRef.value)
  }

  const data = props.statsData.manufacturer_stats.slice(0, 10) // 只显示前10个

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      formatter: function(name) {
        if (name.length > 12) {
          return name.substring(0, 12) + '...'
        }
        return name
      }
    },
    series: [
      {
        name: '厂商分布',
        type: 'pie',
        radius: '50%',
        data: data.map(item => ({
          value: item.count,
          name: item.manufacturer
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  manufacturerChart.setOption(option)
}

// 窗口大小变化时重新渲染图表
const handleResize = () => {
  seriesChart?.resize()
  manufacturerChart?.resize()
}

// 监听弹窗打开和数据变化
watch([() => props.modelValue, () => props.statsData], async ([newVisible, newStatsData]) => {
  if (newVisible && newStatsData) {
    await nextTick()
    renderSeriesChart()
    renderManufacturerChart()

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
  } else if (!newVisible) {
    window.removeEventListener('resize', handleResize)
  }
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  seriesChart?.dispose()
  manufacturerChart?.dispose()
})
</script>

<style scoped>
.stats-content {
  max-height: 80vh;
  overflow-y: auto;
}

.stats-card {
  margin-bottom: 20px;
}

.stats-card:last-child {
  margin-bottom: 0;
}

.card-title {
  font-weight: 600;
  color: #303133;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  height: 100px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.total-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.series-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.manufacturer-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.chart-container {
  height: 300px;
  padding: 20px 0;
}

.chart {
  width: 100%;
  height: 100%;
}

.detail-lists {
  margin-top: 20px;
}

.list-card {
  height: 400px;
}

.list-container {
  height: 320px;
  overflow-y: auto;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.list-item:last-child {
  border-bottom: none;
}

.rank {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-right: 16px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-count {
  font-size: 12px;
  color: #909399;
}

.item-progress {
  margin-left: 16px;
  flex-shrink: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fafafa;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-progress-circle) {
  width: 80px !important;
  height: 80px !important;
}
</style>
