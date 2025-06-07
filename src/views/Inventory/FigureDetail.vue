<template>
  <div class="figure-detail-container">
    <div v-if="figureData" class="figure-detail">
      <!-- 基本信息 -->
      <el-row :gutter="24">
        <!-- 左侧图片区域 -->
        <el-col :span="8">
          <div class="image-section">
            <div class="main-image">
              <el-image
                v-if="mainPhoto"
                :src="getImageUrl(mainPhoto.photo_path)"
                :preview-src-list="photoUrls"
                fit="cover"
                class="main-img"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon size="64" color="#c0c4cc"><Picture /></el-icon>
                    <p>图片加载失败</p>
                  </div>
                </template>
              </el-image>
              <div v-else class="no-image">
                <el-icon size="64" color="#c0c4cc"><Picture /></el-icon>
                <p>暂无图片</p>
              </div>
            </div>

            <!-- 缩略图列表 -->
            <div class="thumbnail-list" v-if="figureData.photos && figureData.photos.length > 1">
              <div
                class="thumbnail-item"
                v-for="photo in figureData.photos"
                :key="photo.id"
                @click="setMainPhoto(photo)"
                :class="{ active: photo.id === currentMainPhoto?.id || (!currentMainPhoto && photo.is_main) }"
              >
                <el-image
                  :src="getImageUrl(photo.photo_path)"
                  fit="cover"
                  class="thumbnail-img"
                >
                  <template #error>
                    <div class="thumbnail-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </div>
            </div>
          </div>
        </el-col>

        <!-- 右侧信息区域 -->
        <el-col :span="16">
          <div class="info-section">
            <!-- 标题和状态 -->
            <div class="header-section">
              <h2 class="figure-name">{{ figureData.name || '未命名手办' }}</h2>
              <div class="status-bar">
                <el-tag
                  :type="figureData.status === '在库' ? 'success' : 'warning'"
                  size="large"
                >
                  {{ figureData.status || '未知状态' }}
                </el-tag>
                <span class="transaction-count">
                  交易 {{ figureData.transaction_count || 0 }} 次
                </span>
              </div>
            </div>

            <el-divider />

            <!-- 基本信息网格 -->
            <div class="info-grid">
              <div class="info-row">
                <div class="info-item">
                  <span class="label">手办ID</span>
                  <span class="value">{{ figureData.id }}</span>
                </div>
                <div class="info-item">
                  <span class="label">UUID</span>
                  <span class="value uuid">{{ figureData.uuid }}</span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-item">
                  <span class="label">系列</span>
                  <span class="value">{{ figureData.series || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">角色</span>
                  <span class="value">{{ figureData.character || '-' }}</span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-item">
                  <span class="label">制造商</span>
                  <span class="value">{{ figureData.manufacturer || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">发售日期</span>
                  <span class="value">{{ formatDate(figureData.release_date) }}</span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-item">
                  <span class="label">条形码</span>
                  <span class="value">{{ figureData.barcode || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">特殊编码</span>
                  <span class="value">{{ figureData.special_code || '-' }}</span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-item">
                  <span class="label">当前价格</span>
                  <span class="value price">¥{{ formatPrice(figureData.current_buy_price) }}</span>
                </div>
                <div class="info-item" v-if="figureData.template?.reference_price">
                  <span class="label">参考价格</span>
                  <span class="value">¥{{ formatPrice(figureData.template.reference_price) }}</span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-item">
                  <span class="label">创建时间</span>
                  <span class="value">{{ formatDateTime(figureData.created_at) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">更新时间</span>
                  <span class="value">{{ formatDateTime(figureData.updated_at) }}</span>
                </div>
              </div>
            </div>

            <!-- 模板信息 -->
            <div class="template-section" v-if="figureData.template">
              <el-divider />
              <h3>模板信息</h3>
              <div class="template-info">
                <div class="template-item">
                  <span class="label">模板名称</span>
                  <span class="value">{{ figureData.template.name || '-' }}</span>
                </div>
                <div class="template-item" v-if="figureData.template.original_price">
                  <span class="label">原价</span>
                  <span class="value">¥{{ formatPrice(figureData.template.original_price) }}</span>
                </div>
                <div class="template-item" v-if="figureData.template.tags && figureData.template.tags.length > 0">
                  <span class="label">标签</span>
                  <span class="value">
                    <el-tag
                      v-for="tag in figureData.template.tags"
                      :key="tag.id"
                      size="small"
                      :color="tag.color"
                      style="margin-right: 4px;"
                    >
                      {{ tag.name }}
                    </el-tag>
                  </span>
                </div>
              </div>
            </div>

            <!-- 购买记录 -->
            <div class="buy-section" v-if="figureData.buy_detail">
              <el-divider />
              <h3>购买记录</h3>
              <div class="buy-info">
                <div class="buy-item">
                  <span class="label">购买时间</span>
                  <span class="value">{{ formatDateTime(figureData.buy_detail.buy_time) }}</span>
                </div>
                <div class="buy-item">
                  <span class="label">购买价格</span>
                  <span class="value price">¥{{ formatPrice(figureData.buy_detail.buy_price) }}</span>
                </div>
                <div class="buy-item">
                  <span class="label">卖家</span>
                  <span class="value">{{ figureData.buy_detail.seller_name || '-' }}</span>
                </div>
                <div class="buy-item" v-if="figureData.buy_detail.seller_phone">
                  <span class="label">联系方式</span>
                  <span class="value">{{ figureData.buy_detail.seller_phone }}</span>
                </div>
                <div class="buy-item" v-if="figureData.buy_detail.remark">
                  <span class="label">备注</span>
                  <span class="value">{{ figureData.buy_detail.remark }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 无数据提示 -->
    <div v-else class="no-data">
      <el-empty description="没有手办数据" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const props = defineProps({
  figureData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['edit', 'viewHistory'])

const currentMainPhoto = ref(null)

// 主图片
const mainPhoto = computed(() => {
  if (!props.figureData?.photos || props.figureData.photos.length === 0) return null
  if (currentMainPhoto.value) return currentMainPhoto.value
  return props.figureData.photos.find(p => p.is_main) || props.figureData.photos[0]
})

// 所有图片URL
const photoUrls = computed(() => {
  if (!props.figureData?.photos || props.figureData.photos.length === 0) return []
  return props.figureData.photos.map(p => getImageUrl(p.photo_path))
})

// 设置主图片
const setMainPhoto = (photo) => {
  currentMainPhoto.value = photo
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return dayjs(dateString).format('YYYY-MM-DD')
}

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 格式化价格
const formatPrice = (price) => {
  if (typeof price !== 'number' || isNaN(price)) return '0.00'
  return (price / 100).toFixed(2)
}

// 获取图片URL
const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const cleanPath = path.startsWith('/') ? path : '/' + path
  return cleanPath
}
</script>

<style scoped>
.figure-detail-container {
  padding: 0;
}

.figure-detail {
  max-height: 70vh;
  overflow-y: auto;
}

/* 图片区域 */
.image-section {
  text-align: center;
}

.main-image {
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fafafa;
}

.main-img {
  width: 100%;
  height: 300px;
  border-radius: 8px;
}

.no-image,
.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background-color: #fafafa;
  color: #c0c4cc;
  border-radius: 8px;
}

.thumbnail-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.thumbnail-item {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  transition: border-color 0.3s;
}

.thumbnail-item:hover {
  border-color: #409eff;
}

.thumbnail-item.active {
  border-color: #67c23a;
}

.thumbnail-img {
  width: 60px;
  height: 60px;
}

.thumbnail-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background-color: #f5f7fa;
  color: #c0c4cc;
}

/* 信息区域 */
.info-section {
  padding-left: 20px;
}

.header-section {
  margin-bottom: 20px;
}

.figure-name {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.transaction-count {
  color: #606266;
  font-size: 14px;
  background-color: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
}

/* 信息网格 */
.info-grid {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.label {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
  word-break: break-all;
}

.value.price {
  color: #e6a23c;
  font-size: 16px;
  font-weight: 600;
}

.value.uuid {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

/* 模板和购买信息 */
.template-section h3,
.buy-section h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.template-info,
.buy-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.template-item,
.buy-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border-left: 3px solid #67c23a;
}

.no-data {
  text-align: center;
  padding: 60px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-section {
    padding-left: 0;
    margin-top: 20px;
  }

  .figure-name {
    font-size: 24px;
  }

  .info-row {
    flex-direction: column;
    gap: 12px;
  }

  .template-info,
  .buy-info {
    grid-template-columns: 1fr;
  }
}

/* 滚动条样式 */
.figure-detail::-webkit-scrollbar {
  width: 6px;
}

.figure-detail::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.figure-detail::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.figure-detail::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

:deep(.el-divider) {
  margin: 20px 0;
}
</style>
