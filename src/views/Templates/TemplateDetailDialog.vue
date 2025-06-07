<template>
  <el-dialog
    v-model="visible"
    title="手办模板详情"
    width="700px"
    :before-close="handleClose"
    top="5vh"
  >
    <div v-if="templateData" class="template-detail">
      <!-- 基本信息 -->
      <el-card class="info-card">
        <template #header>
          <span class="card-title">基本信息</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <span class="label">模板ID：</span>
              <span class="value">{{ templateData.id }}</span>
            </div>
            <div class="info-item">
              <span class="label">模板名称：</span>
              <span class="value name">{{ templateData.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">系列：</span>
              <span class="value">{{ templateData.series }}</span>
            </div>
            <div class="info-item">
              <span class="label">角色：</span>
              <span class="value">{{ templateData.character }}</span>
            </div>
            <div class="info-item">
              <span class="label">厂商：</span>
              <span class="value">{{ templateData.manufacturer }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <span class="label">条形码：</span>
              <span class="value barcode">{{ templateData.barcode }}</span>
            </div>
            <div class="info-item">
              <span class="label">特殊编码：</span>
              <span class="value">{{ templateData.special_code || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">发售日期：</span>
              <span class="value">{{ formatDate(templateData.release_date) }}</span>
            </div>
            <div class="info-item">
              <span class="label">原价：</span>
              <span class="value price">¥{{ (templateData.original_price / 100).toFixed(2) }}</span>
            </div>
            <div class="info-item">
              <span class="label">参考价格：</span>
              <span class="value price">¥{{ (templateData.reference_price / 100).toFixed(2) }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 标签信息 -->
      <el-card class="info-card" v-if="templateData.tags && templateData.tags.length > 0">
        <template #header>
          <span class="card-title">标签信息</span>
        </template>
        <div class="tags-container">
          <el-tag
            v-for="tag in templateData.tags"
            :key="tag.id"
            :color="tag.color"
            size="large"
            class="tag-item"
          >
            {{ tag.name }}
          </el-tag>
        </div>
      </el-card>

      <!-- 时间信息 -->
      <el-card class="info-card">
        <template #header>
          <span class="card-title">时间信息</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <span class="label">创建时间：</span>
              <span class="value">{{ formatDateTime(templateData.created_at) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <span class="label">更新时间：</span>
              <span class="value">{{ formatDateTime(templateData.updated_at) }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 统计信息 -->
      <el-card class="info-card" v-if="statsData">
        <template #header>
          <span class="card-title">统计信息</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-number">{{ statsData.total_figures || 0 }}</div>
              <div class="stat-label">基于此模板的手办数量</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-number">{{ statsData.in_stock || 0 }}</div>
              <div class="stat-label">在库数量</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-number">{{ statsData.sold || 0 }}</div>
              <div class="stat-label">已售数量</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="$emit('edit', templateData)">
          编辑模板
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  templateData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'edit'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const statsData = ref(null)

const handleClose = () => {
  visible.value = false
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return dayjs(dateString).format('YYYY-MM-DD')
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 获取模板统计信息（模拟数据，实际应该调用API）
const getTemplateStats = () => {
  // 这里可以调用API获取基于此模板的手办统计信息
  // 目前先使用模拟数据
  statsData.value = {
    total_figures: Math.floor(Math.random() * 50),
    in_stock: Math.floor(Math.random() * 30),
    sold: Math.floor(Math.random() * 20)
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal && props.templateData) {
    getTemplateStats()
  }
})
</script>

<style scoped>
.template-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.info-card {
  margin-bottom: 20px;
}

.info-card:last-child {
  margin-bottom: 0;
}

.card-title {
  font-weight: 600;
  color: #303133;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  min-height: 24px;
}

.label {
  flex-shrink: 0;
  width: 100px;
  color: #606266;
  font-weight: 500;
}

.value {
  color: #303133;
  word-break: break-all;
}

.name {
  font-weight: 600;
  font-size: 16px;
  color: #409eff;
}

.price {
  font-weight: 600;
  color: #f56c6c;
  font-size: 16px;
}

.barcode {
  font-family: 'Courier New', monospace;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin: 0;
  border: 1px solid;
  color: white;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 32px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fafafa;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>
