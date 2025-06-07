<template>
  <div class="inventory-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>手办管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="手办名称、系列、角色"
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
            style="width: 150px"
          >
            <el-option
              v-for="series in seriesList"
              :key="series"
              :label="series"
              :value="series"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="制造商">
          <el-select
            v-model="searchForm.manufacturer"
            placeholder="选择制造商"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="manufacturer in manufacturersList"
              :key="manufacturer"
              :label="manufacturer"
              :value="manufacturer"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="在库" value="在库" />
            <el-option label="已售出" value="已售出" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计信息 -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ totalCount }}</div>
          <div class="stat-label">总数量</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number in-stock">{{ inStockCount }}</div>
          <div class="stat-label">在库</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number sold">{{ soldCount }}</div>
          <div class="stat-label">已售出</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">¥{{ totalValue.toFixed(0) }}</div>
          <div class="stat-label">库存价值</div>
        </div>
      </el-card>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="figuresList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <div class="figure-avatar">
              <img
                v-if="row.photos && row.photos.length > 0"
                :src="getImageUrl(row.photos.find(p => p.is_main)?.photo_path || row.photos[0]?.photo_path)"
                :alt="row.name"
                class="avatar-img"
                @error="handleImageError"
              />
              <div v-else class="avatar-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="手办名称" min-width="200" show-overflow-tooltip />

        <el-table-column prop="barcode" label="条码" width="140" />

        <el-table-column prop="series" label="系列" width="120" show-overflow-tooltip />

        <el-table-column prop="character" label="角色" width="120" show-overflow-tooltip />

        <el-table-column prop="manufacturer" label="制造商" width="140" show-overflow-tooltip />

        <el-table-column label="当前价格" width="100" align="right">
          <template #default="{ row }">
            ¥{{ (row.current_buy_price / 100).toFixed(2) }}
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === '在库' ? 'success' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="交易次数" width="80" align="center">
          <template #default="{ row }">
            {{ row.transaction_count || 0 }}
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              type="success"
              size="small"
              v-if="row.status === '在库'"
              @click="quickSell(row)"
            >
              出库
            </el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button type="info" size="small">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="history">交易历史</el-dropdown-item>
                  <el-dropdown-item command="edit">编辑信息</el-dropdown-item>
                  <el-dropdown-item command="photos">管理图片</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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

    <!-- 手办详情弹窗 -->
<el-dialog
  v-model="detailVisible"
  title="手办详情"
  width="80%"
  max-width="1000px"
>
  <FigureDetail
    v-if="currentFigure"
    :figure-data="currentFigure"
    @edit="handleEditFigure"
    @viewHistory="handleViewHistory"
  />
</el-dialog>

    <!-- 交易历史弹窗 -->
    <el-dialog
      v-model="historyVisible"
      title="交易历史"
      width="70%"
      max-width="800px"
    >
      <TransactionHistory v-if="currentFigure" :figure-id="currentFigure.id" />
    </el-dialog>

    <!-- 图片管理弹窗 -->
    <el-dialog
      v-model="photosVisible"
      title="图片管理"
      width="60%"
      max-width="600px"
    >
      <PhotoManager v-if="currentFigure" :figure="currentFigure" @updated="refreshData" />
    </el-dialog>
  </div>
  <!-- 在手办管理页面的模板中，添加这个简化的测试版本 -->

</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getFiguresApi, getSeriesListApi, getManufacturersListApi } from '@/api/figures'
import FigureDetail from './FigureDetail.vue'
import TransactionHistory from './TransactionHistory.vue'
import PhotoManager from './PhotoManager.vue'
import dayjs from 'dayjs'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const figuresList = ref([])
const selectedFigures = ref([])
const seriesList = ref([])
const manufacturersList = ref([])

// 弹窗状态
const detailVisible = ref(false)
const historyVisible = ref(false)
const photosVisible = ref(false)
const currentFigure = ref(null)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  series: '',
  manufacturer: '',
  status: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 统计信息
const totalCount = computed(() => figuresList.value.length)
const inStockCount = computed(() => figuresList.value.filter(item => item.status === '在库').length)
const soldCount = computed(() => figuresList.value.filter(item => item.status === '已售出').length)
const totalValue = computed(() => {
  return figuresList.value
    .filter(item => item.status === '在库')
    .reduce((sum, item) => sum + (item.current_buy_price || 0), 0) / 100
})

// 获取图片URL
const getImageUrl = (path) => {
  if (!path) return '/placeholder.png'
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_BASE_URL || ''}${path}`
}

// 图片加载错误处理
const handleImageError = (event) => {
  event.target.src = '/placeholder.png'
}

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 获取手办列表
const fetchFigures = async () => {
  try {
    loading.value = true

    const params = {
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

    const response = await getFiguresApi(params)

    if (response.code === 200) {
      figuresList.value = response.data || []
      pagination.total = response.total || 0
    }
  } catch (error) {
    console.error('获取手办列表失败:', error)
    ElMessage.error('获取手办列表失败')
  } finally {
    loading.value = false
  }
}

// 获取筛选选项
const fetchFilterOptions = async () => {
  try {
    const [seriesResponse, manufacturersResponse] = await Promise.all([
      getSeriesListApi(),
      getManufacturersListApi()
    ])

    if (seriesResponse.code === 200) {
      seriesList.value = seriesResponse.data || []
    }

    if (manufacturersResponse.code === 200) {
      manufacturersList.value = manufacturersResponse.data || []
    }
  } catch (error) {
    console.error('获取筛选选项失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchFigures()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    keyword: '',
    series: '',
    manufacturer: '',
    status: ''
  })
  pagination.page = 1
  fetchFigures()
}

// 刷新数据
const refreshData = () => {
  fetchFigures()
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchFigures()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchFigures()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedFigures.value = selection
}

// 查看详情
const viewDetail = (figure) => {
  currentFigure.value = figure
  detailVisible.value = true
}

// 快速出库
const quickSell = (figure) => {
  router.push({
    name: 'Outbound',
    query: { code: figure.barcode }
  })
}

// 下拉菜单命令处理
const handleCommand = (command, figure) => {
  currentFigure.value = figure

  switch (command) {
    case 'history':
      historyVisible.value = true
      break
    case 'edit':
      router.push(`/inventory/edit/${figure.id}`)
      break
    case 'photos':
      photosVisible.value = true
      break
  }
}
// 处理编辑手办
const handleEditFigure = (figure) => {
  // 可以跳转到编辑页面或打开编辑弹窗
  router.push(`/inventory/edit/${figure.id}`)
}

// 处理查看历史
const handleViewHistory = (figure) => {
  currentFigure.value = figure
  historyVisible.value = true
}
// 页面挂载时获取数据
onMounted(() => {
  fetchFigures()
  fetchFilterOptions()
})
</script>

<style scoped>
.inventory-container {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-card {
  margin-bottom: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-number.in-stock {
  color: #67c23a;
}

.stat-number.sold {
  color: #e6a23c;
}

.stat-label {
  font-size: 14px;
  color: #8492a6;
}

.table-card {
  margin-bottom: 20px;
}

.figure-avatar {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .page-header h2 {
    text-align: center;
    font-size: 20px;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-content {
    padding: 12px;
  }

  .stat-number {
    font-size: 20px;
  }

  :deep(.el-form--inline .el-form-item) {
    display: block;
    margin-right: 0;
    margin-bottom: 16px;
  }

  :deep(.el-form--inline .el-form-item__content) {
    width: 100%;
  }

  :deep(.el-table) {
    font-size: 12px;
  }

  .figure-avatar {
    width: 40px;
    height: 40px;
  }
}

/* 平板适配 */
@media (min-width: 768px) and (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  :deep(.el-form--inline .el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
