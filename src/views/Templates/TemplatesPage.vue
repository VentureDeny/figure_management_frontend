<template>
  <div class="templates-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>手办模板管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新建模板
        </el-button>
        <el-button @click="getTemplateStats">
          <el-icon><DataAnalysis /></el-icon>
          统计信息
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索名称、系列、角色"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="系列">
          <el-select
            v-model="searchForm.series"
            placeholder="选择系列"
            clearable
            filterable
            style="width: 160px"
          >
            <el-option
              v-for="series in seriesOptions"
              :key="series"
              :label="series"
              :value="series"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="厂商">
          <el-select
            v-model="searchForm.manufacturer"
            placeholder="选择厂商"
            clearable
            filterable
            style="width: 180px"
          >
            <el-option
              v-for="manufacturer in manufacturerOptions"
              :key="manufacturer"
              :label="manufacturer"
              :value="manufacturer"
            />
          </el-select>
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

    <!-- 模板列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="templates"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="名称" min-width="200">
          <template #default="{ row }">
            <div class="template-name">
              {{ row.name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="series" label="系列" width="120" />
        <el-table-column prop="character" label="角色" width="120" />
        <el-table-column prop="manufacturer" label="厂商" width="150" />
        <el-table-column label="发售日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.release_date) }}
          </template>
        </el-table-column>
        <el-table-column label="原价" width="100" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ (row.original_price / 100).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="参考价" width="100" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ (row.reference_price / 100).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="150">
          <template #default="{ row }">
            <div class="tags-container">
              <el-tag
                v-for="tag in row.tags"
                :key="tag.id"
                :color="tag.color"
                size="small"
                class="tag-item"
              >
                {{ tag.name }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="条形码" width="140">
          <template #default="{ row }">
            <span class="barcode">{{ row.barcode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">
              查看详情
            </el-button>
            <el-button type="info" link @click="editTemplate(row)">
              编辑
            </el-button>
            <el-button type="danger" link @click="deleteTemplate(row)">
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

    <!-- 创建/编辑模板弹窗 -->
    <template-form-dialog
      v-model="showFormDialog"
      :template-data="selectedTemplate"
      :is-edit="isEdit"
      @success="handleTemplateSuccess"
    />

    <!-- 模板详情弹窗 -->
    <template-detail-dialog
      v-model="showDetailDialog"
      :template-data="selectedTemplate"
      @edit="editTemplate"
    />

    <!-- 统计信息弹窗 -->
    <template-stats-dialog
      v-model="showStatsDialog"
      :stats-data="statsData"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, DataAnalysis } from '@element-plus/icons-vue'
import {
  getFigureTemplatesApi,
  deleteFigureTemplateApi,
  getTemplateStatsApi,
  getSeriesListApi,
  getManufacturersListApi
} from '@/api/figureTemplates'
import TemplateFormDialog from './TemplateFormDialog.vue'
import TemplateDetailDialog from './TemplateDetailDialog.vue'
import TemplateStatsDialog from './TemplateStatsDialog.vue'
import dayjs from 'dayjs'

// 响应式数据
const loading = ref(false)
const templates = ref([])
const seriesOptions = ref([])
const manufacturerOptions = ref([])
const statsData = ref(null)

// 弹窗状态
const showFormDialog = ref(false)
const showDetailDialog = ref(false)
const showStatsDialog = ref(false)
const selectedTemplate = ref(null)
const isEdit = ref(false)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  series: '',
  manufacturer: ''
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

  // 移除空值
  Object.keys(params).forEach(key => {
    if (params[key] === '' || params[key] == null) {
      delete params[key]
    }
  })

  return params
})

// 获取模板列表
const getTemplates = async () => {
  loading.value = true
  try {
    const response = await getFigureTemplatesApi(searchParams.value)
    templates.value = response.data
    pagination.total = response.total
  } catch (error) {
    console.error('获取模板列表失败:', error)
    ElMessage.error('获取模板列表失败')
  } finally {
    loading.value = false
  }
}

// 获取系列和厂商选项
const getOptions = async () => {
  try {
    const [seriesResponse, manufacturersResponse] = await Promise.all([
      getSeriesListApi(),
      getManufacturersListApi()
    ])
    seriesOptions.value = seriesResponse.data
    manufacturerOptions.value = manufacturersResponse.data
  } catch (error) {
    console.error('获取选项失败:', error)
  }
}

// 获取统计信息
const getTemplateStats = async () => {
  try {
    const response = await getTemplateStatsApi()
    statsData.value = response.data
    showStatsDialog.value = true
  } catch (error) {
    console.error('获取统计信息失败:', error)
    ElMessage.error('获取统计信息失败')
  }
}

// 事件处理
const handleSearch = () => {
  pagination.page = 1
  getTemplates()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.page = 1
  getTemplates()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  getTemplates()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  getTemplates()
}

const openCreateDialog = () => {
  selectedTemplate.value = null
  isEdit.value = false
  showFormDialog.value = true
}

const viewDetail = (template) => {
  selectedTemplate.value = template
  showDetailDialog.value = true
}

const editTemplate = (template) => {
  selectedTemplate.value = template
  isEdit.value = true
  showFormDialog.value = true
  showDetailDialog.value = false
}

const deleteTemplate = async (template) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模板"${template.name}"吗？删除后无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteFigureTemplateApi(template.id)
    ElMessage.success('模板删除成功')
    getTemplates()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除模板失败:', error)
      ElMessage.error('删除模板失败')
    }
  }
}

const handleTemplateSuccess = () => {
  getTemplates()
  getOptions() // 刷新选项，可能有新的系列或厂商
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return dayjs(dateString).format('YYYY-MM-DD')
}

const formatDateTime = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 监听搜索参数变化
watch(() => searchParams.value, () => {
  if (pagination.page === 1) {
    getTemplates()
  } else {
    pagination.page = 1
  }
}, { deep: true })

// 组件挂载
onMounted(() => {
  getTemplates()
  getOptions()
})
</script>

<style scoped>
.templates-page {
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

.template-name {
  font-weight: 500;
  color: #303133;
}

.price {
  font-weight: 600;
  color: #409eff;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-item {
  margin: 0;
}

.barcode {
  font-family: 'Courier New', monospace;
  font-size: 12px;
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

:deep(.el-tag) {
  border: 1px solid;
  color: white;
}
</style>
