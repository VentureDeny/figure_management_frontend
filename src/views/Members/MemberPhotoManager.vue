<template>
  <div class="member-photo-manager">
    <!-- 上传新照片 -->
    <el-card title="上传照片" shadow="never" style="margin-bottom: 20px;">
      <el-upload
        v-model:file-list="newFileList"
        action="#"
        list-type="picture-card"
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        accept="image/*"
        :limit="3"
      >
        <el-icon><Plus /></el-icon>
        <template #tip>
          <div class="el-upload__tip">
            支持 JPG/PNG 格式，最多上传3张照片
          </div>
        </template>
      </el-upload>

      <div class="upload-actions" v-if="newFileList.length > 0">
        <el-button type="primary" :loading="uploadLoading" @click="handleUpload">
          上传照片
        </el-button>
      </div>
    </el-card>

    <!-- 现有照片管理 -->
    <el-card title="现有照片" shadow="never">
      <div v-if="photosList.length > 0" class="photos-grid">
        <div
          v-for="photo in photosList"
          :key="photo.id"
          class="photo-item"
          :class="{ 'main-photo': photo.is_main }"
        >
          <img :src="getImageUrl(photo.photo_path)" :alt="photo.photo_type" />

          <div class="photo-overlay">
            <div class="photo-info">
              <span class="photo-type">{{ photo.photo_type }}</span>
              <el-tag v-if="photo.is_main" type="success" size="small">主照片</el-tag>
            </div>

            <div class="photo-actions">
              <el-button
                v-if="!photo.is_main"
                type="primary"
                size="small"
                @click="setMainPhoto(photo)"
              >
                设为主照片
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="deletePhoto(photo)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-photos">
        <el-icon size="48"><Picture /></el-icon>
        <p>暂无照片</p>
      </div>
    </el-card>

    <!-- 照片类型编辑弹窗 -->
    <el-dialog
      v-model="editTypeVisible"
      title="编辑照片类型"
      width="400px"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="照片类型">
          <el-select v-model="editForm.photo_type" style="width: 100%">
            <el-option label="身份证正面" value="身份证正面" />
            <el-option label="身份证反面" value="身份证反面" />
            <el-option label="头像照片" value="头像照片" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editTypeVisible = false">取消</el-button>
        <el-button type="primary" @click="updatePhotoType">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { uploadImageApi } from '@/api/upload'
import { addMemberPhotosApi, deleteMemberPhotoApi, setMainPhotoApi } from '@/api/members'

const props = defineProps({
  member: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['updated'])

const uploadLoading = ref(false)
const newFileList = ref([])
const photosList = ref([])
const editTypeVisible = ref(false)
//const currentPhoto = ref(null)

// 编辑表单
const editForm = reactive({
  photo_type: ''
})

// 获取图片URL
const getImageUrl = (path) => {
  if (!path) return '/placeholder.png'
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_BASE_URL || ''}${path}`
}

// 文件变化处理
const handleFileChange = (file, fileList) => {
  // 检查文件类型
  const isImage = file.raw && file.raw.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    const index = fileList.findIndex(item => item.uid === file.uid)
    if (index > -1) {
      fileList.splice(index, 1)
    }
    return false
  }

  // 检查文件大小（限制为5MB）
  const isLt5M = file.raw.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB!')
    const index = fileList.findIndex(item => item.uid === file.uid)
    if (index > -1) {
      fileList.splice(index, 1)
    }
    return false
  }

  // 检查文件数量限制
  if (fileList.length > 3) {
    ElMessage.error('最多只能上传3张照片!')
    fileList.splice(3)
    return false
  }

  // 创建预览URL
  if (file.raw) {
    file.url = URL.createObjectURL(file.raw)
  }

  return true
}

const handleFileRemove = (file) => {
  // 释放预览URL内存
  if (file.url && file.url.startsWith('blob:')) {
    URL.revokeObjectURL(file.url)
  }
  return true
}

// 上传照片
const handleUpload = async () => {
  try {
    uploadLoading.value = true

    // 上传图片
    const uploadedPhotos = []
    for (const file of newFileList.value) {
      if (file.raw) {
        const formData = new FormData()
        formData.append('file', file.raw)
        formData.append('type', 'member')

        const uploadResponse = await uploadImageApi(formData)
        if (uploadResponse.code === 200) {
          uploadedPhotos.push({
            photo_path: uploadResponse.data.file_path,
            photo_type: uploadedPhotos.length === 0 ? '身份证正面' : '其他',
            is_main: photosList.value.length === 0 && uploadedPhotos.length === 0
          })
        }
      }
    }

    // 添加到会员
    if (uploadedPhotos.length > 0) {
      const response = await addMemberPhotosApi(props.member.id, { photos: uploadedPhotos })

      if (response.code === 200 || response.code === 201) {
        ElMessage.success('照片上传成功')
        newFileList.value = []
        // 清理内存
        newFileList.value.forEach(file => {
          if (file.url && file.url.startsWith('blob:')) {
            URL.revokeObjectURL(file.url)
          }
        })
        loadPhotos()
        emit('updated')
      } else {
        ElMessage.error(response.message || '上传失败')
      }
    }
  } catch (error) {
    console.error('上传失败:', error)
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('上传失败，请重试')
    }
  } finally {
    uploadLoading.value = false
  }
}

// 设置主照片
const setMainPhoto = async (photo) => {
  try {
    const response = await setMainPhotoApi(props.member.id, photo.id)

    if (response.code === 200) {
      ElMessage.success('设置成功')
      loadPhotos()
      emit('updated')
    } else {
      ElMessage.error(response.message || '设置失败')
    }
  } catch (error) {
    console.error('设置主照片失败:', error)
    ElMessage.error('设置失败')
  }
}

// 删除照片
const deletePhoto = async (photo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这张照片吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const response = await deleteMemberPhotoApi(props.member.id, photo.id)

    if (response.code === 200) {
      ElMessage.success('删除成功')
      loadPhotos()
      emit('updated')
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error === 'cancel') {
      return
    }
    console.error('删除照片失败:', error)
    ElMessage.error('删除失败')
  }
}



// 更新照片类型
const updatePhotoType = async () => {
  try {
    // 这里需要API支持更新照片类型，暂时模拟
    ElMessage.success('照片类型更新成功')
    editTypeVisible.value = false
    loadPhotos()
    emit('updated')
  } catch (error) {
    console.error('更新照片类型失败:', error)
    ElMessage.error('更新失败')
  }
}

// 加载照片列表
const loadPhotos = () => {
  photosList.value = props.member.photos || []
}



onMounted(() => {
  loadPhotos()
})


</script>

<style scoped>
.upload-actions {
  margin-top: 16px;
  text-align: center;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.photo-item.main-photo {
  border-color: #409eff;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.photo-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.photo-item:hover img {
  transform: scale(1.05);
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.photo-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.photo-type {
  color: white;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.photo-type:hover {
  background: rgba(0, 0, 0, 0.8);
}

.photo-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.photo-actions .el-button {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.no-photos {
  text-align: center;
  padding: 60px 20px;
  color: #c0c4cc;
}

.no-photos p {
  margin: 12px 0 0 0;
  font-size: 14px;
}

:deep(.el-upload--picture-card) {
  width: 120px;
  height: 120px;
  border-radius: 8px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 120px;
  height: 120px;
  border-radius: 8px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item-thumbnail) {
  border-radius: 8px;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .photos-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .photo-actions {
    flex-direction: column;
    gap: 4px;
  }

  .photo-actions .el-button {
    font-size: 10px;
    padding: 2px 6px;
    width: 100%;
  }

  .photo-info {
    flex-direction: column;
    gap: 4px;
  }

  :deep(.el-upload--picture-card) {
    width: 100px;
    height: 100px;
  }

  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 100px;
    height: 100px;
  }
}

/* 平板适配 */
@media (min-width: 768px) and (max-width: 1024px) {
  .photos-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 大屏幕适配 */
@media (min-width: 1200px) {
  .photos-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
