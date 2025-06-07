<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑手办模板' : '新建手办模板'"
    width="800px"
    :before-close="handleClose"
    top="5vh"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="模板名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入模板名称"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="条形码" prop="barcode">
            <el-input
              v-model="formData.barcode"
              placeholder="请输入条形码"
              maxlength="20"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="系列" prop="series">
            <el-select
              v-model="formData.series"
              placeholder="选择或输入系列"
              filterable
              allow-create
              default-first-option
              style="width: 100%"
            >
              <el-option
                v-for="series in seriesOptions"
                :key="series"
                :label="series"
                :value="series"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="角色" prop="character">
            <el-input
              v-model="formData.character"
              placeholder="请输入角色名称"
              maxlength="50"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="厂商" prop="manufacturer">
            <el-select
              v-model="formData.manufacturer"
              placeholder="选择或输入厂商"
              filterable
              allow-create
              default-first-option
              style="width: 100%"
            >
              <el-option
                v-for="manufacturer in manufacturerOptions"
                :key="manufacturer"
                :label="manufacturer"
                :value="manufacturer"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发售日期" prop="release_date">
            <el-date-picker
              v-model="formData.release_date"
              type="date"
              placeholder="选择发售日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="原价" prop="original_price">
            <el-input-number
              v-model="formData.original_price"
              :min="0"
              :max="999999"
              :precision="2"
              :step="100"
              placeholder="请输入原价"
              style="width: 100%"
            />
            <span class="input-suffix">元</span>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="参考价格" prop="reference_price">
            <el-input-number
              v-model="formData.reference_price"
              :min="0"
              :max="999999"
              :precision="2"
              :step="100"
              placeholder="请输入参考价格"
              style="width: 100%"
            />
            <span class="input-suffix">元</span>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="特殊编码">
        <el-input
          v-model="formData.special_code"
          placeholder="请输入特殊编码（可选）"
          maxlength="50"
        />
      </el-form-item>

      <el-form-item label="标签" prop="tags">
        <el-select
          v-model="formData.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="选择或创建标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in tagOptions"
            :key="tag.id"
            :label="tag.name"
            :value="tag.name"
          >
            <span style="float: left">{{ tag.name }}</span>
            <span
              style="float: right; color: var(--el-text-color-secondary); font-size: 13px"
            >
              <el-tag :color="tag.color" size="small">示例</el-tag>
            </span>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createFigureTemplateApi,
  updateFigureTemplateApi,
  getSeriesListApi,
  getManufacturersListApi
} from '@/api/figureTemplates'
import { getTagsApi } from '@/api/tags'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  templateData: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref()
const submitting = ref(false)
const seriesOptions = ref([])
const manufacturerOptions = ref([])
const tagOptions = ref([])

// 表单数据
const formData = reactive({
  name: '',
  barcode: '',
  special_code: '',
  series: '',
  character: '',
  manufacturer: '',
  release_date: '',
  original_price: null,
  reference_price: null,
  tags: []
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 1, max: 100, message: '模板名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  barcode: [
    { required: true, message: '请输入条形码', trigger: 'blur' }
  ],
  series: [
    { required: true, message: '请选择或输入系列', trigger: 'blur' }
  ],
  character: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  manufacturer: [
    { required: true, message: '请选择或输入厂商', trigger: 'blur' }
  ],
  release_date: [
    { required: true, message: '请选择发售日期', trigger: 'blur' }
  ],
  original_price: [
    { required: true, message: '请输入原价', trigger: 'blur' },
    { type: 'number', min: 0, message: '原价不能小于0', trigger: 'blur' }
  ],
  reference_price: [
    { required: true, message: '请输入参考价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '参考价格不能小于0', trigger: 'blur' }
  ]
}

// 获取选项数据
const getOptions = async () => {
  try {
    const [seriesResponse, manufacturersResponse, tagsResponse] = await Promise.all([
      getSeriesListApi(),
      getManufacturersListApi(),
      getTagsApi()
    ])
    seriesOptions.value = seriesResponse.data
    manufacturerOptions.value = manufacturersResponse.data
    tagOptions.value = tagsResponse.data
  } catch (error) {
    console.error('获取选项数据失败:', error)
  }
}

// 重置表单
const resetForm = () => {
  Object.keys(formData).forEach(key => {
    if (key === 'tags') {
      formData[key] = []
    } else if (key === 'original_price' || key === 'reference_price') {
      formData[key] = null
    } else {
      formData[key] = ''
    }
  })
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 填充表单数据
const fillFormData = () => {
  if (props.templateData && props.isEdit) {
    Object.keys(formData).forEach(key => {
      if (key === 'original_price' || key === 'reference_price') {
        // 价格从分转换为元
        formData[key] = props.templateData[key] ? props.templateData[key] / 100 : null
      } else if (key === 'tags') {
        // 标签数据处理
        formData[key] = props.templateData.tags ? props.templateData.tags.map(tag => tag.name) : []
      } else if (key === 'release_date') {
        // 日期格式处理
        formData[key] = props.templateData[key] ? props.templateData[key].split('T')[0] : ''
      } else {
        formData[key] = props.templateData[key] || ''
      }
    })
  }
}

// 提交表单
// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 确保所有必填字段都有值
    if (!formData.name || !formData.barcode || !formData.series ||
        !formData.character || !formData.manufacturer || !formData.release_date ||
        formData.original_price === null || formData.reference_price === null) {
      ElMessage.error('请填写所有必填字段')
      return
    }

    const submitData = {
      name: formData.name.trim(),
      barcode: formData.barcode.trim(),
      special_code: formData.special_code?.trim() || '',
      series: formData.series.trim(),
      character: formData.character.trim(),
      manufacturer: formData.manufacturer.trim(),
      release_date: formData.release_date + 'T00:00:00Z', // 转换为ISO 8601格式
      original_price: Math.round(Number(formData.original_price) * 100), // 元转换为分
      reference_price: Math.round(Number(formData.reference_price) * 100), // 元转换为分
      tags: formData.tags.filter(tag => tag && tag.trim()) // 过滤空标签
    }

    console.log('提交数据:', submitData) // 调试日志

    if (props.isEdit) {
      await updateFigureTemplateApi(props.templateData.id, submitData)
      ElMessage.success('模板更新成功')
    } else {
      await createFigureTemplateApi(submitData)
      ElMessage.success('模板创建成功')
    }

    visible.value = false
    emit('success')
  } catch (error) {
    if (error !== false) {
      console.error('提交模板失败:', error)
      console.error('错误详情:', error.response?.data) // 添加详细错误信息
      const errorMsg = error?.response?.data?.message || error?.message || '操作失败'
      ElMessage.error(`${props.isEdit ? '模板更新失败' : '模板创建失败'}: ${errorMsg}`)
    }
  } finally {
    submitting.value = false
  }
}

// 关闭弹窗
const handleClose = () => {
  visible.value = false
  resetForm()
}

// 监听弹窗打开
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    getOptions()
    if (props.isEdit) {
      fillFormData()
    } else {
      resetForm()
    }
  }
})

// 组件挂载
onMounted(() => {
  getOptions()
})
</script>

<style scoped>
.input-suffix {
  margin-left: 8px;
  color: #606266;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input-number) {
  width: calc(100% - 30px);
}

:deep(.el-select .el-input) {
  width: 100%;
}
</style>
