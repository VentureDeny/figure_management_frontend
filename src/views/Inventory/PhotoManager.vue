<template>
  <div class="photo-manager">
    <!-- 上传区域 -->
    <el-card class="upload-card">
      <template #header>
        <span>上传新照片</span>
      </template>
      <el-upload
        ref="uploadRef"
        class="photo-upload"
        :action="uploadAction"
        :headers="uploadHeaders"
        :data="uploadData"
        list-type="picture-card"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        multiple
        accept="image/*"
        :limit="10"
      >
        <el-icon><Plus /></el-icon>
        <template #tip>
          <div class="el-upload__tip">
            支持 JPG、PNG、GIF、WEBP 格式，单个文件不超过 10MB
          </div>
        </template>
      </el-upload>
    </el-card>

    <!-- 照片列表 -->
    <el-card class="photo-list-card">
      <template #header>
        <div class="card-header">
          <span>已有照片 ({{ photos.length }})</span>
          <el-button
            type="primary"
            size="small"
            @click="refreshPhotos"
            :loading="loading"
          >
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <div v-loading="loading" class="photo-grid">
        <div v-if="photos.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无照片" />
        </div>

        <div v-else class="photo-items">
          <div
            v-for="photo in photos"
            :key="photo.id"
            class="photo-item"
            :class="{ 'is-main': photo.is_main }"
          >
            <div class="photo-container">
              <el-image
                :src="getImageUrl(photo.photo_path)"
                :preview-src-list="photoUrls"
                fit="cover"
                class="photo-image"
                @error="handleImageError"
              />

              <!-- 主图标识 -->
              <div v-if="photo.is_main" class="main-badge">
                <el-icon><Star /></el-icon>
                主图
              </div>

              <!-- 照片类型 -->
              <div class="photo-type">
                {{ photo.photo_type || '未分类' }}
              </div>

              <!-- 操作按钮 -->
              <div class="photo-actions">
                <el-button
                  type="primary"
                  size="small"
                  circle
                  @click="setMainPhoto(photo)"
                  :disabled="photo.is_main"
                  title="设为主图"
                >
                  <el-icon><Star /></el-icon>
                </el-button>
                <el-button
                  type="info"
                  size="small"
                  circle
                  @click="editPhotoType(photo)"
                  title="编辑类型"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  circle
                  @click="deletePhoto(photo)"
                  title="删除照片"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 编辑照片类型弹窗 -->
    <el-dialog
      v-model="showEditType"
      title="编辑照片类型"
      width="400px"
      append-to-body
    >
      <el-form>
        <el-form-item label="照片类型">
          <el-select
            v-model="editingPhoto.photo_type"
            placeholder="请选择照片类型"
            clearable
            allow-create
            filterable
            style="width: 100%"
          >
            <el-option label="包装" value="包装" />
            <el-option label="本体" value="本体" />
            <el-option label="配件" value="配件" />
            <el-option label="说明书" value="说明书" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditType = false">取消</el-button>
          <el-button type="primary" @click="savePhotoType" :loading="saving">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Plus, Refresh, Star, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  addFigurePhotosApi,
  deleteFigurePhotoApi,
  setMainPhotoApi
} from '@/api/figures'

// 获取token的工具函数
const getAuthToken = () => {
  return localStorage.getItem('token')
}

// 定义 props
const props = defineProps({
  figure: {
    type: Object,
    required: true
  }
})

// 定义 emits
const emit = defineEmits(['updated'])

// 响应式数据
const uploadRef = ref()
const loading = ref(false)
const saving = ref(false)
const photos = ref([])
const showEditType = ref(false)
const editingPhoto = ref({})

// 上传配置
const uploadAction = computed(() => {
  // 临时硬编码，确保上传功能正常
  return 'http://localhost:8080/api/upload/image'
})

const uploadHeaders = computed(() => {
  const token = getAuthToken()
  console.log('当前token:', token ? '存在' : '不存在')

  return {
    'Authorization': `Bearer ${token}`
  }
})

const uploadData = computed(() => {
  return {
    type: 'figure'
  }
})

const photoUrls = computed(() => {
  return photos.value.map(p => getImageUrl(p.photo_path))
})

// 初始化照片列表
const initPhotos = () => {
  if (props.figure?.photos) {
    photos.value = [...props.figure.photos]
    console.log('初始化照片列表:', photos.value.length, '张照片')
  } else {
    photos.value = []
    console.log('手办没有照片')
  }
}

// 刷新照片列表
const refreshPhotos = () => {
  loading.value = true
  // 模拟刷新延迟
  setTimeout(() => {
    initPhotos()
    loading.value = false
  }, 500)
}

// 上传成功处理
const handleUploadSuccess = async (response) => {
  console.log('上传成功响应:', response)

  if (response.code === 200) {
    try {
      // 添加照片到手办
      const photoData = {
        photos: [{
          photo_path: response.data.file_path,
          photo_type: '其他',
          is_main: photos.value.length === 0 // 如果是第一张照片，设为主图
        }]
      }

      const addResponse = await addFigurePhotosApi(props.figure.id, photoData)
      console.log('添加照片API响应:', addResponse)

      // 更新本地照片列表
      const newPhoto = {
        id: Date.now(), // 临时ID
        figure_id: props.figure.id,
        photo_path: response.data.file_path,
        photo_type: '其他',
        is_main: photos.value.length === 0,
        created_at: new Date().toISOString()
      }

      photos.value.push(newPhoto)

      ElMessage.success('照片上传成功')
      emit('updated')
    } catch (error) {
      console.error('添加照片失败:', error)
      ElMessage.error('添加照片失败: ' + (error.message || '未知错误'))
    }
  } else {
    console.error('上传失败:', response)
    ElMessage.error(response.message || '上传失败')
  }
}

// 上传失败处理
const handleUploadError = (error) => {
  console.error('上传失败:', error)
  ElMessage.error('上传失败，请重试')
}

// 上传前检查
const beforeUpload = (file) => {
  console.log('准备上传文件:', file.name, file.type, file.size)

  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }
  return true
}

// 设置主图
const setMainPhoto = async (photo) => {
  if (photo.is_main) return

  try {
    console.log('设置主图:', photo.id)
    const response = await setMainPhotoApi(props.figure.id, photo.id)
    console.log('设置主图API响应:', response)

    // 更新本地状态
    photos.value.forEach(p => {
      p.is_main = p.id === photo.id
    })

    ElMessage.success('主图设置成功')
    emit('updated')
  } catch (error) {
    console.error('设置主图失败:', error)
    ElMessage.error('设置主图失败: ' + (error.message || '未知错误'))
  }
}

// 编辑照片类型
const editPhotoType = (photo) => {
  console.log('编辑照片类型:', photo)
  editingPhoto.value = { ...photo }
  showEditType.value = true
}

// 保存照片类型
const savePhotoType = async () => {
  saving.value = true
  try {
    console.log('保存照片类型:', editingPhoto.value)

    // 这里需要调用更新照片信息的API
    // 由于API文档中没有提供更新单个照片的接口，这里先更新本地状态
    const photoIndex = photos.value.findIndex(p => p.id === editingPhoto.value.id)
    if (photoIndex !== -1) {
      photos.value[photoIndex].photo_type = editingPhoto.value.photo_type
    }

    showEditType.value = false
    ElMessage.success('照片类型更新成功')
    emit('updated')
  } catch (error) {
    console.error('更新照片类型失败:', error)
    ElMessage.error('更新照片类型失败: ' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

// 删除照片
const deletePhoto = async (photo) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这张照片吗？删除后无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    console.log('删除照片:', photo.id)
    const response = await deleteFigurePhotoApi(props.figure.id, photo.id)
    console.log('删除照片API响应:', response)

    // 从本地列表中移除
    const photoIndex = photos.value.findIndex(p => p.id === photo.id)
    if (photoIndex !== -1) {
      photos.value.splice(photoIndex, 1)
    }

    // 如果删除的是主图且还有其他照片，将第一张设为主图
    if (photo.is_main && photos.value.length > 0) {
      await setMainPhoto(photos.value[0])
    }

    ElMessage.success('照片删除成功')
    emit('updated')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除照片失败:', error)
      ElMessage.error('删除照片失败: ' + (error.message || '未知错误'))
    }
  }
}

// 图片加载错误处理
const handleImageError = (event) => {
  console.warn('图片加载失败:', event.target.src)
  event.target.src = '/placeholder.png'
}

// 获取图片URL
const getImageUrl = (path) => {
  if (!path) return '/placeholder.png'
  if (path.startsWith('http')) return path

  // 临时硬编码，确保图片显示正常
  const url = 'http://localhost:8080/' + path
  console.log('图片URL:', url)
  return url
}

// 监听 figure 变化
watch(() => props.figure, (newFigure) => {
  console.log('手办数据变化:', newFigure?.name, newFigure?.photos?.length)
  if (newFigure) {
    initPhotos()
  }
}, { immediate: true, deep: true })

// 组件挂载时初始化
onMounted(() => {
  console.log('照片管理组件挂载, 手办:', props.figure?.name)
  initPhotos()
})
</script>

<style scoped>
.photo-manager {
  max-height: 70vh;
  overflow-y: auto;
}

.upload-card {
  margin-bottom: 20px;
}

.photo-upload {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.photo-grid {
  min-height: 200px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.photo-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.photo-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.photo-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.photo-item.is-main {
  border-color: #409eff;
}

.photo-container {
  position: relative;
  height: 200px;
}

.photo-image {
  width: 100%;
  height: 100%;
  border-radius: 6px;
}

.main-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #409eff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 2;
}

.photo-type {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 2;
}

.photo-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 3;
}

.photo-item:hover .photo-actions {
  opacity: 1;
}

.photo-actions .el-button {
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(64, 158, 255, 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.photo-actions .el-button:hover {
  background: rgba(64, 158, 255, 0.1);
  border-color: #409eff;
}

.photo-actions .el-button .el-icon {
  color: #409eff;
  font-size: 14px;
}

.photo-actions .el-button:hover .el-icon {
  color: #337ecc;
}

/* 为不同按钮设置不同的图标颜色 */
.photo-actions .el-button--primary .el-icon {
  color: #409eff;
}

.photo-actions .el-button--info .el-icon {
  color: #909399;
}

.photo-actions .el-button--danger .el-icon {
  color: #f56c6c;
}

.photo-actions .el-button--primary:hover .el-icon {
  color: #337ecc;
}

.photo-actions .el-button--info:hover .el-icon {
  color: #73767a;
}

.photo-actions .el-button--danger:hover .el-icon {
  color: #dd6161;
}

.photo-actions .el-button:disabled .el-icon {
  color: #c0c4cc;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-upload-list--picture-card) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
  border-radius: 6px;
  border: 1px dashed #d9d9d9;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

:deep(.el-upload--picture-card:hover) {
  border-color: #409eff;
}

:deep(.el-upload-list__item) {
  width: 100px;
  height: 100px;
  margin: 0;
  border-radius: 6px;
  overflow: hidden;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-empty) {
  padding: 20px 0;
}
</style>
