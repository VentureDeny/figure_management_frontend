<template>
  <div class="member-detail">
    <el-row :gutter="24">
      <!-- 基本信息 -->
      <el-col :span="16">
        <el-card title="基本信息" shadow="never">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="姓名">{{ member.name }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ member.phone }}</el-descriptions-item>
            <el-descriptions-item label="生日">
              {{ member.birthday ? dayjs(member.birthday).format('YYYY-MM-DD') : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="年龄">
              {{ member.birthday ? calculateAge(member.birthday) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="积分">
              <span class="points-value">{{ member.points || 0 }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="交易次数">{{ member.transaction_count || 0 }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ dayjs(member.created_at).format('YYYY-MM-DD HH:mm') }}
            </el-descriptions-item>
            <el-descriptions-item label="最后更新">
              {{ dayjs(member.updated_at).format('YYYY-MM-DD HH:mm') }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 积分记录 -->
        <el-card title="积分记录" shadow="never" style="margin-top: 20px;">
          <el-table :data="pointsHistory" v-loading="pointsLoading">
            <el-table-column label="积分变化" width="100" align="right">
              <template #default="{ row }">
                <span :class="['points-change', row.points_change >= 0 ? 'points-positive' : 'points-negative']">
                  {{ row.points_change > 0 ? '+' : '' }}{{ row.points_change }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" />
            <el-table-column label="操作员" width="100">
              <template #default="{ row }">
                {{ row.operator?.name || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="时间" width="160">
              <template #default="{ row }">
                {{ dayjs(row.created_at).format('MM-DD HH:mm') }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 照片信息 -->
      <el-col :span="8">
        <el-card title="会员照片" shadow="never">
          <div v-if="member.photos && member.photos.length > 0" class="photos-grid">
            <div
              v-for="photo in member.photos"
              :key="photo.id"
              class="photo-item"
              :class="{ 'main-photo': photo.is_main }"
            >
              <img :src="getImageUrl(photo.photo_path)" :alt="photo.photo_type" />
              <div class="photo-overlay">
                <span class="photo-type">{{ photo.photo_type }}</span>
                <el-tag v-if="photo.is_main" type="success" size="small">主照片</el-tag>
              </div>
            </div>
          </div>
          <div v-else class="no-photos">
            <el-icon size="48"><Picture /></el-icon>
            <p>暂无照片</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMemberPointsApi } from '@/api/points'
import dayjs from 'dayjs'

const props = defineProps({
  member: {
    type: Object,
    required: true
  }
})

const pointsHistory = ref([])
const pointsLoading = ref(false)

// 计算年龄
const calculateAge = (birthday) => {
  return dayjs().diff(dayjs(birthday), 'year')
}

// 获取图片URL
const getImageUrl = (path) => {
  if (!path) return '/placeholder.png'
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_BASE_URL || ''}${path}`
}

// 获取积分记录
const fetchPointsHistory = async () => {
  try {
    pointsLoading.value = true
    const response = await getMemberPointsApi(props.member.id, { size: 10 })
    if (response.code === 200) {
      pointsHistory.value = response.data.adjustments || []
    }
  } catch (error) {
    console.error('获取积分记录失败:', error)
  } finally {
    pointsLoading.value = false
  }
}

onMounted(() => {
  fetchPointsHistory()
})
</script>

<style scoped>
.points-value {
  color: #e6a23c;
  font-weight: 600;
  font-size: 16px;
}

.points-change {
  font-weight: 600;
}

.points-positive {
  color: #67c23a;
}

.points-negative {
  color: #f56c6c;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
}

.photo-item.main-photo {
  border-color: #409eff;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: end;
}

.photo-type {
  color: white;
  font-size: 12px;
}

.no-photos {
  text-align: center;
  padding: 40px 20px;
  color: #c0c4cc;
}

.no-photos p {
  margin: 8px 0 0 0;
}
</style>
