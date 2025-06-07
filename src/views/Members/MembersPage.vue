<template>
  <div class="members-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>会员管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addMember">
          <el-icon><Plus /></el-icon>
          添加会员
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="姓名、手机号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
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
          <div class="stat-label">总会员数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number active">{{ activeCount }}</div>
          <div class="stat-label">活跃会员</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ totalPoints }}</div>
          <div class="stat-label">总积分</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ avgPoints }}</div>
          <div class="stat-label">平均积分</div>
        </div>
      </el-card>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="membersList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <div class="member-avatar">
              <img
                v-if="row.photos && row.photos.length > 0"
                :src="getImageUrl(row.photos.find(p => p.is_main)?.photo_path || row.photos[0]?.photo_path)"
                :alt="row.name"
                class="avatar-img"
                @error="handleImageError"
              />
              <el-avatar v-else :size="50">
                <el-icon><User /></el-icon>
              </el-avatar>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="姓名" width="100" />

        <el-table-column prop="phone" label="手机号" width="130" />

        <el-table-column label="生日" width="120">
          <template #default="{ row }">
            {{ row.birthday ? dayjs(row.birthday).format('YYYY-MM-DD') : '-' }}
          </template>
        </el-table-column>

        <el-table-column label="年龄" width="80" align="center">
          <template #default="{ row }">
            {{ row.birthday ? calculateAge(row.birthday) : '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="points" label="积分" width="100" align="right">
          <template #default="{ row }">
            <span class="points-value">{{ row.points || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="交易次数" width="100" align="center">
          <template #default="{ row }">
            <el-link type="primary" @click="viewTransactions(row)">
              {{ row.transaction_count || 0 }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column label="注册时间" width="160">
          <template #default="{ row }">
            {{ dayjs(row.created_at).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>

        <el-table-column label="最后更新" width="160">
          <template #default="{ row }">
            {{ dayjs(row.updated_at).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="editMember(row)"
            >
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button type="info" size="small">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="points">积分管理</el-dropdown-item>
                  <el-dropdown-item command="photos">管理照片</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除会员</el-dropdown-item>
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

    <!-- 会员详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="会员详情"
      width="80%"
      max-width="1000px"
    >
      <MemberDetail v-if="currentMember" :member="currentMember" />
    </el-dialog>

    <!-- 添加/编辑会员弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="isEdit ? '编辑会员' : '添加会员'"
      width="60%"
      max-width="600px"
    >
      <MemberForm
        v-if="formVisible"
        :member="currentMember"
        :is-edit="isEdit"
        @success="handleFormSuccess"
        @cancel="formVisible = false"
      />
    </el-dialog>

    <!-- 积分管理弹窗 -->
    <el-dialog
      v-model="pointsVisible"
      title="积分管理"
      width="50%"
      max-width="500px"
    >
      <PointsManager
        v-if="currentMember"
        :member="currentMember"
        @updated="refreshData"
      />
    </el-dialog>

    <!-- 照片管理弹窗 -->
    <el-dialog
      v-model="photosVisible"
      title="照片管理"
      width="60%"
      max-width="600px"
    >
      <MemberPhotoManager
        v-if="currentMember"
        :member="currentMember"
        @updated="refreshData"
      />
    </el-dialog>

    <!-- 交易记录弹窗 -->
    <el-dialog
      v-model="transactionsVisible"
      title="交易记录"
      width="80%"
      max-width="1000px"
    >
      <MemberTransactions
        v-if="currentMember"
        :member-id="currentMember.id"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

import { ElMessage, ElMessageBox } from 'element-plus'
import { getMembersApi, deleteMemberApi } from '@/api/members'
import MemberDetail from './MemberDetail.vue'
import MemberForm from './MemberForm.vue'
import PointsManager from './PointsManager.vue'
import MemberPhotoManager from './MemberPhotoManager.vue'
import MemberTransactions from './MemberTransactions.vue'
import dayjs from 'dayjs'


// 响应式数据
const loading = ref(false)
const membersList = ref([])
const selectedMembers = ref([])

// 弹窗状态
const detailVisible = ref(false)
const formVisible = ref(false)
const pointsVisible = ref(false)
const photosVisible = ref(false)
const transactionsVisible = ref(false)
const currentMember = ref(null)
const isEdit = ref(false)

// 搜索表单
const searchForm = reactive({
  keyword: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 统计信息
const totalCount = computed(() => pagination.total)
const activeCount = computed(() => {
  // 有交易记录的会员算作活跃会员
  return membersList.value.filter(member => (member.transaction_count || 0) > 0).length
})
const totalPoints = computed(() => {
  return membersList.value.reduce((sum, member) => sum + (member.points || 0), 0)
})
const avgPoints = computed(() => {
  return totalCount.value > 0 ? Math.round(totalPoints.value / totalCount.value) : 0
})

// 获取图片URL
const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path

  // 确保使用后端服务器的地址
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return `${baseURL}${path.startsWith('/') ? path : '/' + path}`
}

// 图片加载错误处理
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// 计算年龄
const calculateAge = (birthday) => {
  if (!birthday) return '-'
  return dayjs().diff(dayjs(birthday), 'year')
}

// 获取会员列表
const fetchMembers = async () => {
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

    const response = await getMembersApi(params)

    if (response.code === 200) {
      membersList.value = response.data || []
      pagination.total = response.total || 0
    }
  } catch (error) {
    console.error('获取会员列表失败:', error)
    ElMessage.error('获取会员列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchMembers()
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  pagination.page = 1
  fetchMembers()
}

// 刷新数据
const refreshData = () => {
  fetchMembers()
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchMembers()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchMembers()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedMembers.value = selection
}

// 添加会员
const addMember = () => {
  currentMember.value = null
  isEdit.value = false
  formVisible.value = true
}

// 查看详情
const viewDetail = (member) => {
  currentMember.value = member
  detailVisible.value = true
}

// 编辑会员
const editMember = (member) => {
  currentMember.value = member
  isEdit.value = true
  formVisible.value = true
}

// 查看交易记录
const viewTransactions = (member) => {
  currentMember.value = member
  transactionsVisible.value = true
}

// 表单成功回调
const handleFormSuccess = () => {
  formVisible.value = false
  refreshData()
}

// 下拉菜单命令处理
const handleCommand = async (command, member) => {
  currentMember.value = member

  switch (command) {
    case 'points':
      pointsVisible.value = true
      break
    case 'photos':
      photosVisible.value = true
      break
    case 'delete':
      await handleDelete(member)
      break
  }
}

// 删除会员
const handleDelete = async (member) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除会员 "${member.name}" 吗？此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const response = await deleteMemberApi(member.id)

    if (response.code === 200) {
      ElMessage.success('删除成功')
      refreshData()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error === 'cancel') {
      return
    }
    console.error('删除会员失败:', error)
    ElMessage.error('删除失败')
  }
}

// 页面挂载时获取数据
onMounted(() => {
  fetchMembers()
})
</script>

<style scoped>
.members-container {
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

.stat-number.active {
  color: #67c23a;
}

.stat-label {
  font-size: 14px;
  color: #8492a6;
}

.table-card {
  margin-bottom: 20px;
}

.member-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
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

.points-value {
  color: #e6a23c;
  font-weight: 500;
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

  .header-actions {
    justify-content: center;
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

  .member-avatar {
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
