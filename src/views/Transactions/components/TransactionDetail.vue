<template>
  <el-dialog
    v-model="visible"
    title="交易详情"
    width="800px"
    :before-close="handleClose"
  >
    <div v-if="transactionData" class="transaction-detail">
      <!-- 基本信息 -->
      <el-card class="mb-4">
        <template #header>
          <span class="card-title">基本信息</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <span class="label">交易ID：</span>
              <span class="value">{{ transactionData.id }}</span>
            </div>
            <div class="info-item">
              <span class="label">交易类型：</span>
              <el-tag :type="transactionData.type === '买入' ? 'success' : 'warning'">
                {{ transactionData.type }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">交易价格：</span>
              <span class="value price">¥{{ (transactionData.price / 100).toFixed(2) }}</span>
            </div>
            <div class="info-item">
              <span class="label">积分变化：</span>
              <span class="value" :class="transactionData.points_change > 0 ? 'positive' : 'negative'">
                {{ transactionData.points_change > 0 ? '+' : '' }}{{ transactionData.points_change }}
              </span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <span class="label">交易时间：</span>
              <span class="value">{{ formatDate(transactionData.created_at) }}</span>
            </div>
            <div class="info-item">
              <span class="label">操作员：</span>
              <span class="value">{{ transactionData.operator?.name }}</span>
            </div>
            <div class="info-item" v-if="transactionData.remark">
              <span class="label">备注：</span>
              <span class="value">{{ transactionData.remark }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 手办信息 -->
      <el-card class="mb-4" v-if="transactionData.figure">
        <template #header>
          <span class="card-title">手办信息</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="8" v-if="transactionData.figure.photos && transactionData.figure.photos.length > 0">
            <div class="figure-image">
              <el-image
                :src="getImageUrl(transactionData.figure.photos.find(p => p.is_main)?.photo_path || transactionData.figure.photos[0]?.photo_path)"
                :preview-src-list="transactionData.figure.photos.map(p => getImageUrl(p.photo_path))"
                fit="cover"
                style="width: 100%; height: 200px;"
              />
            </div>
          </el-col>
          <el-col :span="transactionData.figure.photos && transactionData.figure.photos.length > 0 ? 16 : 24">
            <div class="figure-info">
              <div class="info-item">
                <span class="label">手办名称：</span>
                <span class="value">{{ transactionData.figure.name }}</span>
              </div>
              <div class="info-item" v-if="transactionData.figure.template">
                <span class="label">模板名称：</span>
                <span class="value">{{ transactionData.figure.template.name }}</span>
              </div>
              <div class="info-item" v-if="transactionData.figure.series">
                <span class="label">系列：</span>
                <span class="value">{{ transactionData.figure.series }}</span>
              </div>
              <div class="info-item" v-if="transactionData.figure.character">
                <span class="label">角色：</span>
                <span class="value">{{ transactionData.figure.character }}</span>
              </div>
              <div class="info-item" v-if="transactionData.figure.manufacturer">
                <span class="label">厂商：</span>
                <span class="value">{{ transactionData.figure.manufacturer }}</span>
              </div>
              <div class="info-item" v-if="transactionData.figure.barcode">
                <span class="label">条形码：</span>
                <span class="value">{{ transactionData.figure.barcode }}</span>
              </div>
              <div class="info-item" v-if="transactionData.figure.special_code">
                <span class="label">特殊编码：</span>
                <span class="value">{{ transactionData.figure.special_code }}</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 会员信息 -->
      <el-card class="mb-4" v-if="transactionData.member">
        <template #header>
          <span class="card-title">会员信息</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <span class="label">会员姓名：</span>
              <span class="value">{{ transactionData.member.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">联系电话：</span>
              <span class="value">{{ transactionData.member.phone }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item" v-if="transactionData.member.points !== undefined">
              <span class="label">当前积分：</span>
              <span class="value">{{ transactionData.member.points }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  transactionData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleClose = () => {
  visible.value = false
}

const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

const getImageUrl = (path) => {
  if (!path) return ''
  return import.meta.env.VITE_API_BASE_URL + '/' + path
}
</script>

<style scoped>
.transaction-detail {
  max-height: 70vh;
  overflow-y: auto;
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

.price {
  font-weight: 600;
  color: #409eff;
  font-size: 16px;
}

.positive {
  color: #67c23a;
  font-weight: 600;
}

.negative {
  color: #f56c6c;
  font-weight: 600;
}

.figure-image {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ebeef5;
}

.figure-info {
  padding-left: 20px;
}

.mb-4 {
  margin-bottom: 16px;
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

:deep(.el-image) {
  border-radius: 4px;
}
</style>
