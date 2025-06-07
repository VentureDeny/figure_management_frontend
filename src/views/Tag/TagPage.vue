<template>
  <div class="tags-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>标签管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新建标签
      </el-button>
    </div>

    <!-- 标签列表 -->
    <el-card class="tags-card">
      <div v-loading="loading" class="tags-container">
        <div v-if="tags.length === 0" class="empty-state">
          <el-empty description="暂无标签" />
        </div>

        <div v-else class="tags-grid">
          <div
            v-for="tag in tags"
            :key="tag.id"
            class="tag-item"
          >
            <div class="tag-content">
              <div class="tag-preview">
                <el-tag
                  :color="tag.color"
                  size="large"
                  class="preview-tag"
                >
                  {{ tag.name }}
                </el-tag>
              </div>
              <div class="tag-info">
                <div class="tag-name">{{ tag.name }}</div>
                <div class="tag-color">{{ tag.color }}</div>
                <div class="tag-date">
                  {{ formatDateTime(tag.created_at) }}
                </div>
              </div>
              <div class="tag-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="editTag(tag)"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="deleteTag(tag)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 创建/编辑标签弹窗 -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEdit ? '编辑标签' : '新建标签'"
      width="400px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入标签名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="标签颜色" prop="color">
          <div class="color-input-container">
            <el-color-picker
              v-model="formData.color"
              :predefine="predefineColors"
              @change="handleColorChange"
            />
            <el-input
              v-model="formData.color"
              placeholder="请选择或输入颜色值"
              style="margin-left: 12px"
              @input="validateColor"
            />
          </div>
        </el-form-item>
        <el-form-item label="预览效果">
          <el-tag
            v-if="formData.name && formData.color"
            :color="formData.color"
            size="large"
          >
            {{ formData.name }}
          </el-tag>
          <span v-else class="preview-placeholder">请输入标签名称和颜色</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getTagsApi,
  createTagApi,
  updateTagApi,
  deleteTagApi
} from '@/api/tags'
import dayjs from 'dayjs'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const tags = ref([])
const showFormDialog = ref(false)
const isEdit = ref(false)
const formRef = ref()

// 表单数据
const formData = reactive({
  id: null,
  name: '',
  color: '#409eff'
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '标签名称长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请选择标签颜色', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        // 自定义验证器，更灵活地处理颜色格式
        if (!value) {
          callback(new Error('请选择标签颜色'))
          return
        }

        // 处理可能的数组格式
        let colorValue = value
        if (Array.isArray(value)) {
          colorValue = value[0] || ''
        }

        // 转换为字符串
        colorValue = String(colorValue)

        // 验证 hex 格式
        const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{3})$/
        if (hexPattern.test(colorValue)) {
          callback()
        } else {
          callback(new Error('请输入有效的颜色值(如: #ff0000)'))
        }
      },
      trigger: 'blur'
    }
  ]
}

// 预定义颜色
const predefineColors = [
  '#ff4500',
  '#ff8c00',
  '#ffd700',
  '#90ee90',
  '#00ced1',
  '#1e90ff',
  '#c71585',
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#96ceb4',
  '#ffeaa7',
  '#dda0dd',
  '#98d8c8'
]

// 获取标签列表
const getTags = async () => {
  loading.value = true
  try {
    const response = await getTagsApi()
    tags.value = response.data
  } catch (error) {
    console.error('获取标签列表失败:', error)
    ElMessage.error('获取标签列表失败')
  } finally {
    loading.value = false
  }
}

// 打开创建弹窗
const openCreateDialog = () => {
  resetForm()
  isEdit.value = false
  showFormDialog.value = true
}

// 编辑标签
const editTag = (tag) => {
  formData.id = tag.id
  formData.name = tag.name
  formData.color = tag.color
  isEdit.value = true
  showFormDialog.value = true
}

// 删除标签
const deleteTag = async (tag) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除标签"${tag.name}"吗？删除后无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteTagApi(tag.id)
    ElMessage.success('标签删除成功')
    getTags()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除标签失败:', error)
      ElMessage.error('删除标签失败')
    }
  }
}

// 处理颜色选择器变化
const handleColorChange = (value) => {
  console.log('颜色选择器值:', value, typeof value) // 调试日志
  if (value) {
    // 如果是数组，取第一个值
    if (Array.isArray(value)) {
      formData.color = String(value[0] || '#409eff')
    } else {
      formData.color = String(value)
    }

    // 移除可能的 rgba 格式，转换为 hex 格式
    if (formData.color.startsWith('rgba')) {
      // 如果是 rgba 格式，转换为 hex（这里简化处理，实际可能需要更复杂的转换）
      formData.color = '#409eff' // 默认颜色
    }

    // 确保颜色值符合 hex 格式
    if (!formData.color.startsWith('#')) {
      formData.color = '#' + formData.color.replace('#', '')
    }

    // 触发验证
    nextTick(() => {
      formRef.value?.validateField('color')
    })
  }
}

// 验证颜色格式
const validateColor = (value) => {
  if (value && !value.startsWith('#')) {
    formData.color = '#' + value.replace('#', '')
  }
  // 触发验证
  nextTick(() => {
    formRef.value?.validateField('color')
  })
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 确保 color 是字符串格式
    let colorValue = formData.color
    if (Array.isArray(colorValue)) {
      colorValue = colorValue[0] || '#409eff'
    }
    colorValue = String(colorValue)

    // 确保是有效的 hex 格式
    if (!colorValue.startsWith('#')) {
      colorValue = '#' + colorValue.replace('#', '')
    }

    // 验证最终的颜色格式
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{3})$/
    if (!hexPattern.test(colorValue)) {
      ElMessage.error('颜色格式不正确，请重新选择')
      return
    }

    const submitData = {
      name: formData.name.trim(),
      color: colorValue
    }

    console.log('最终提交数据:', submitData) // 调试日志

    if (isEdit.value) {
      await updateTagApi(formData.id, submitData)
      ElMessage.success('标签更新成功')
    } else {
      await createTagApi(submitData)
      ElMessage.success('标签创建成功')
    }

    showFormDialog.value = false
    getTags()
  } catch (error) {
    if (error !== false) { // 不是表单验证失败
      console.error('提交标签失败:', error)
      const errorMsg = error?.response?.data?.message || error?.message || '操作失败'
      ElMessage.error(`${isEdit.value ? '标签更新失败' : '标签创建失败'}: ${errorMsg}`)
    }
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  formData.id = null
  formData.name = ''
  formData.color = '#409eff'
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 关闭弹窗
const handleDialogClose = () => {
  showFormDialog.value = false
  resetForm()
}

// 格式化时间
const formatDateTime = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 组件挂载
onMounted(() => {
  getTags()
})
</script>

<style scoped>
.tags-page {
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

.tags-card {
  min-height: 400px;
}

.tags-container {
  min-height: 300px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.tag-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s;
}

.tag-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.tag-content {
  padding: 20px;
}

.tag-preview {
  text-align: center;
  margin-bottom: 16px;
}

.preview-tag {
  font-size: 16px;
  padding: 8px 16px;
  border: 1px solid;
  color: white;
}

.tag-info {
  margin-bottom: 16px;
}

.tag-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.tag-color {
  font-size: 14px;
  color: #606266;
  font-family: 'Courier New', monospace;
  margin-bottom: 4px;
}

.tag-date {
  font-size: 12px;
  color: #909399;
}

.tag-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.color-input-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.preview-placeholder {
  color: #c0c4cc;
  font-style: italic;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-tag) {
  border: 1px solid;
  color: white;
}

:deep(.el-color-picker) {
  flex-shrink: 0;
}
</style>
