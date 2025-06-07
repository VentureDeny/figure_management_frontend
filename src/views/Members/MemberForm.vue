<template>
  <div class="member-form">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      size="large"
    >
      <el-form-item label="姓名" prop="name">
        <el-input v-model="form.name" placeholder="请输入姓名" />
      </el-form-item>

      <el-form-item label="手机号" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入手机号">
          <template #append>
            <el-select v-model="phoneCountry" style="width: 100px">
              <el-option label="🇯🇵 日本" value="jp" />
              <el-option label="🇨🇳 中国" value="cn" />
            </el-select>
          </template>
        </el-input>
        <div class="phone-hint">
          <span v-if="phoneCountry === 'jp'">
            日本格式：070/080/090开头的11位数字 或 固定电话10位数字
          </span>
          <span v-else>
            中国格式：1开头的11位数字
          </span>
        </div>
      </el-form-item>

      <el-form-item label="生日" prop="birthday">
        <el-date-picker
          v-model="form.birthday"
          type="date"
          placeholder="请选择生日"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="照片">
        <el-upload
          v-model:file-list="fileList"
          action="#"
          list-type="picture-card"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          accept="image/*"
          :limit="5"
        >
          <el-icon><Plus /></el-icon>
          <template #tip>
            <div class="el-upload__tip">
              支持 JPG/PNG 格式，最多上传5张照片
            </div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>

    <div class="form-actions">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ isEdit ? '更新' : '创建' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createMemberApi, updateMemberApi } from '@/api/members'
import { uploadImageApi } from '@/api/upload'

const props = defineProps({
  member: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['success', 'cancel'])

const formRef = ref()
const loading = ref(false)
const fileList = ref([])
const phoneCountry = ref('jp') // 默认日本

// 表单数据
const form = reactive({
  name: '',
  phone: '',
  birthday: null
})

// 手机号验证函数
const validatePhone = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入手机号'))
    return
  }

  // 移除所有空格和特殊字符，只保留数字
  const cleanPhone = value.replace(/[\s\-\(\)]/g, '')

  if (phoneCountry.value === 'jp') {
    // 日本手机号验证
    // 移动电话：070/080/090开头的11位数字
    // 固定电话：0开头的10位数字（如03-1234-5678）
    const mobilePattern = /^(070|080|090)\d{8}$/
    const landlinePattern = /^0\d{9}$/

    if (mobilePattern.test(cleanPhone) || landlinePattern.test(cleanPhone)) {
      callback()
    } else {
      callback(new Error('请输入正确的日本手机号格式'))
    }
  } else {
    // 中国手机号验证：1开头的11位数字
    const pattern = /^1[3-9]\d{9}$/
    if (pattern.test(cleanPhone)) {
      callback()
    } else {
      callback(new Error('请输入正确的中国手机号格式'))
    }
  }
}

// 验证规则
const rules = computed(() => ({
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { validator: validatePhone, trigger: 'blur' }
  ]
}))

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

// 智能检测手机号国家
const detectPhoneCountry = (phone) => {
  if (!phone) return 'jp'

  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

  // 中国手机号：1开头11位
  if (/^1[3-9]\d{9}$/.test(cleanPhone)) {
    return 'cn'
  }

  // 日本手机号：070/080/090开头11位 或 0开头10位
  if (/^(070|080|090)\d{8}$/.test(cleanPhone) || /^0\d{9}$/.test(cleanPhone)) {
    return 'jp'
  }

  // 默认日本
  return 'jp'
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()

    loading.value = true

    // 上传图片
    const uploadedPhotos = []
    for (const file of fileList.value) {
      if (file.raw) {
        const formData = new FormData()
        formData.append('file', file.raw)
        formData.append('type', 'member')

        const uploadResponse = await uploadImageApi(formData)
        if (uploadResponse.code === 200) {
          uploadedPhotos.push({
            photo_path: uploadResponse.data.file_path,
            photo_type: uploadedPhotos.length === 0 ? '身份证正面' : '其他',
            is_main: uploadedPhotos.length === 0
          })
        }
      }
    }

    // 准备提交数据
    const submitData = {
      name: form.name,
      phone: form.phone,
      birthday: form.birthday ? form.birthday.toISOString() : null,
      photos: uploadedPhotos
    }

    let response
    if (props.isEdit) {
      response = await updateMemberApi(props.member.id, submitData)
    } else {
      response = await createMemberApi(submitData)
    }

    if (response.code === 200 || response.code === 201) {
      ElMessage.success(props.isEdit ? '更新成功' : '创建成功')
      emit('success')
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('操作失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

// 初始化表单数据
const initForm = () => {
  if (props.isEdit && props.member) {
    form.name = props.member.name || ''
    form.phone = props.member.phone || ''
    form.birthday = props.member.birthday ? new Date(props.member.birthday) : null

    // 智能检测手机号国家
    phoneCountry.value = detectPhoneCountry(form.phone)

    // 加载现有照片
    if (props.member.photos && props.member.photos.length > 0) {
      fileList.value = props.member.photos.map(photo => ({
        uid: photo.id,
        name: photo.photo_type,
        url: `${import.meta.env.VITE_BASE_URL || ''}${photo.photo_path}`,
        status: 'success'
      }))
    }
  }
}

onMounted(() => {
  initForm()
})
</script>

<style scoped>
.member-form {
  padding: 20px 0;
}

.phone-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.form-actions {
  text-align: right;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

.form-actions .el-button {
  margin-left: 12px;
}

:deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 100px;
  height: 100px;
}

:deep(.el-input-group__append .el-select) {
  margin: -1px;
}

:deep(.el-input-group__append .el-select .el-input__inner) {
  border-left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
</style>
