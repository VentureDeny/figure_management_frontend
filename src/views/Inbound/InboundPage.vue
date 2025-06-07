<template>
  <div class="inbound-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>手办入库</h2>
      <p>扫描手办条码或手动输入信息进行入库操作</p>
    </div>

    <!-- 扫码区域 -->
    <el-card class="scan-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>扫码入库</h3>
          <el-button type="primary" @click="startScan" :disabled="scanning">
            <el-icon><Camera /></el-icon>
            {{ scanning ? '扫描中...' : '开始扫描' }}
          </el-button>
        </div>
      </template>

      <div class="scan-content">
        <div class="scan-input-group">
          <el-input
            v-model="scanCode"
            placeholder="请扫描条码或手动输入"
            size="large"
            clearable
            @keyup.enter="handleScanCode"
            @input="handleCodeInput"
          >
            <template #prepend>
              <el-icon><Aim /></el-icon>
            </template>
            <template #append>
              <el-button @click="handleScanCode" :loading="scanLoading">
                查询
              </el-button>
            </template>
          </el-input>
        </div>

        <div v-if="scanResult" class="scan-result">
          <el-alert
            :title="scanResult.message"
            :type="scanResult.type"
            show-icon
            :closable="false"
          />
        </div>
      </div>
    </el-card>

    <!-- 入库表单 -->
    <el-card v-if="showForm" class="form-card" shadow="hover">
      <template #header>
        <h3>{{ isNewTemplate ? '新建模板信息' : '确认模板信息' }}</h3>
      </template>

      <el-form
        ref="inboundFormRef"
        :model="inboundForm"
        :rules="inboundRules"
        label-width="100px"
        size="large"
      >
        <!-- UUID字段 -->
        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="手办UUID" prop="uuid">
              <el-input
                v-model="inboundForm.uuid"
                placeholder="留空系统自动生成，格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label=" ">
              <el-button @click="generateNewUUID" type="info" plain>
                <el-icon><Refresh /></el-icon>
                生成UUID
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="条码" prop="code">
              <el-input v-model="inboundForm.code" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="特殊编码">
              <el-input v-model="inboundForm.special_code" placeholder="可选" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 名称生成选项 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="名称设置">
              <el-radio-group v-model="nameGenerationType" @change="handleNameTypeChange">
                <el-radio :label="'auto'">自动生成（如：初音未来 2024版 #003）</el-radio>
                <el-radio :label="'manual'">手动输入</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="nameGenerationType === 'manual'">
          <el-col :span="12">
            <el-form-item label="手办名称" prop="name">
              <el-input v-model="inboundForm.name" placeholder="请输入手办名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="figure_template.name">
              <el-input v-model="inboundForm.figure_template.name" placeholder="手办模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="系列" prop="figure_template.series">
              <el-select
                v-model="inboundForm.figure_template.series"
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
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色名称" prop="figure_template.character">
              <el-input v-model="inboundForm.figure_template.character" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="制造商" prop="figure_template.manufacturer">
              <el-select
                v-model="inboundForm.figure_template.manufacturer"
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
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="发售日期" prop="figure_template.release_date">
              <el-date-picker
                v-model="inboundForm.figure_template.release_date"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="原价(元)" prop="figure_template.original_price">
              <el-input-number
                v-model="originalPriceYuan"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="参考价(元)" prop="figure_template.reference_price">
              <el-input-number
                v-model="referencePriceYuan"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="标签">
          <el-select
            v-model="inboundForm.figure_template.tags"
            multiple
            filterable
            allow-create
            placeholder="选择或创建标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag.id || tag.name"
              :label="tag.name"
              :value="tag.name"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 交易信息 -->
    <el-card v-if="showForm" class="transaction-card" shadow="hover">
      <template #header>
        <h3>交易信息</h3>
      </template>

      <el-form
        ref="transactionFormRef"
        :model="transactionForm"
        :rules="transactionRules"
        label-width="100px"
        size="large"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="会员" prop="member_id">
              <el-select
                v-model="transactionForm.member_id"
                placeholder="选择会员"
                filterable
                remote
                :remote-method="searchMembers"
                :loading="membersLoading"
                style="width: 100%"
              >
                <el-option
                  v-for="member in membersList"
                  :key="member.id"
                  :label="`${member.name} (${member.phone})`"
                  :value="member.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="买入价格(元)" prop="price">
              <el-input-number
                v-model="buyPriceYuan"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="积分变化">
              <el-input-number
                v-model="transactionForm.points_change"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input
                v-model="transactionForm.remark"
                placeholder="可选备注信息"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 图片上传 -->
    <el-card v-if="showForm" class="upload-card" shadow="hover">
      <template #header>
        <h3>手办图片</h3>
      </template>

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
            支持 JPG/PNG/GIF 格式，最多上传5张图片
          </div>
        </template>
      </el-upload>
    </el-card>

    <!-- 操作按钮 -->
    <div class="form-actions" v-if="showForm">
      <el-button size="large" @click="resetForm">重置</el-button>
      <el-button
        type="primary"
        size="large"
        :loading="submitLoading"
        @click="handleSubmit"
      >
        确认入库
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { scanFigureApi, scanTemplateApi } from '@/api/scan'
import { buyTransactionApi } from '@/api/transactions'
import { searchMembersApi } from '@/api/members'
import { getTagsApi } from '@/api/tags'
import { uploadImageApi } from '@/api/upload'
import { getSeriesListApi, getManufacturersListApi } from '@/api/figureTemplates'

// 响应式数据
const scanCode = ref('')
const scanning = ref(false)
const scanLoading = ref(false)
const scanResult = ref(null)
const showForm = ref(false)
const submitLoading = ref(false)
const membersLoading = ref(false)
const isNewTemplate = ref(false) // 是否为新建模板
const foundTemplate = ref(null) // 找到的模板信息
const nameGenerationType = ref('auto') // 名称生成方式：auto/manual

// 表单引用
const inboundFormRef = ref()
const transactionFormRef = ref()

// 选项数据
const membersList = ref([])
const availableTags = ref([])
const seriesOptions = ref([])
const manufacturerOptions = ref([])

// 文件列表
const fileList = ref([])

// 入库表单数据
const inboundForm = reactive({
  uuid: '', // 新增UUID字段
  code: '',
  special_code: '',
  name: '', // 手办实例名称
  figure_template: {
    name: '',
    series: '',
    character: '',
    manufacturer: '',
    release_date: '',
    original_price: 0,
    reference_price: 0,
    tags: []
  }
})

// 交易表单数据
const transactionForm = reactive({
  member_id: null,
  price: 0,
  points_change: 0,
  remark: ''
})

// UUID生成函数
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 生成新UUID
const generateNewUUID = () => {
  inboundForm.uuid = generateUUID()
  ElMessage.success('UUID已生成')
}

// UUID验证函数
const validateUUID = (uuid) => {
  if (!uuid) return true // 允许为空
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return regex.test(uuid)
}

// 价格计算（分转元）
const originalPriceYuan = computed({
  get: () => (inboundForm.figure_template.original_price || 0) / 100,
  set: (value) => {
    inboundForm.figure_template.original_price = Math.round((value || 0) * 100)
  }
})

const referencePriceYuan = computed({
  get: () => (inboundForm.figure_template.reference_price || 0) / 100,
  set: (value) => {
    inboundForm.figure_template.reference_price = Math.round((value || 0) * 100)
  }
})

const buyPriceYuan = computed({
  get: () => (transactionForm.price || 0) / 100,
  set: (value) => {
    transactionForm.price = Math.round((value || 0) * 100)
    // 自动计算积分（1元=1积分）
    transactionForm.points_change = Math.round(value || 0)
  }
})

// 名称生成方式变化处理
const handleNameTypeChange = (value) => {
  if (value === 'auto') {
    inboundForm.name = ''
  }
}

// 表单验证规则
const inboundRules = computed(() => {
  const baseRules = {
    code: [
      { required: true, message: '请输入或扫描条码', trigger: 'blur' }
    ],
    uuid: [
      {
        validator: (rule, value, callback) => {
          if (value && !validateUUID(value)) {
            callback(new Error('UUID格式无效'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ],
    'figure_template.name': [
      { required: true, message: '请输入模板名称', trigger: 'blur' },
      { min: 1, max: 200, message: '模板名称长度在 1 到 200 个字符', trigger: 'blur' }
    ],
    'figure_template.series': [
      { required: true, message: '请输入系列名称', trigger: 'blur' }
    ],
    'figure_template.character': [
      { required: true, message: '请输入角色名称', trigger: 'blur' }
    ],
    'figure_template.manufacturer': [
      { required: true, message: '请输入制造商', trigger: 'blur' }
    ],
    'figure_template.release_date': [
      { required: true, message: '请选择发售日期', trigger: 'blur' }
    ],
    'figure_template.original_price': [
      { required: true, message: '请输入原价', trigger: 'blur' },
      { type: 'number', min: 0, message: '原价不能小于0', trigger: 'blur' }
    ],
    'figure_template.reference_price': [
      { required: true, message: '请输入参考价格', trigger: 'blur' },
      { type: 'number', min: 0, message: '参考价格不能小于0', trigger: 'blur' }
    ]
  }

  // 如果是手动输入名称，添加名称验证
  if (nameGenerationType.value === 'manual') {
    baseRules.name = [
      { required: true, message: '请输入手办名称', trigger: 'blur' },
      { min: 1, max: 200, message: '手办名称长度在 1 到 200 个字符', trigger: 'blur' }
    ]
  }

  return baseRules
})

const transactionRules = {
  member_id: [
    { required: true, message: '请选择会员', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入买入价格', trigger: 'blur' }
  ]
}

// 开始扫描
const startScan = () => {
  scanning.value = true
  // 这里可以集成实际的扫码功能
  ElMessage.info('扫码功能需要集成摄像头，请手动输入条码')
  setTimeout(() => {
    scanning.value = false
  }, 1000)
}

// 处理条码输入
const handleCodeInput = () => {
  if (scanResult.value) {
    scanResult.value = null
  }
}

// 处理扫码结果
const handleScanCode = async () => {
  if (!scanCode.value.trim()) {
    ElMessage.warning('请输入条码')
    return
  }

  try {
    scanLoading.value = true
    scanResult.value = null
    foundTemplate.value = null
    isNewTemplate.value = false

    // 先查找是否已存在该手办
    const figureResponse = await scanFigureApi({ code: scanCode.value })

    if (figureResponse.code === 200 && figureResponse.data) {
      // 手办已存在，显示同条码的所有手办实例
      if (Array.isArray(figureResponse.data)) {
        const inStockFigures = figureResponse.data.filter(f => f.status === '在库')
        const soldFigures = figureResponse.data.filter(f => f.status === '已售出')

        scanResult.value = {
          type: 'warning',
          message: `该条码已有 ${figureResponse.data.length} 个手办：${inStockFigures.length} 个在库，${soldFigures.length} 个已售出。可以继续入库同款手办。`
        }
      } else {
        scanResult.value = {
          type: 'warning',
          message: `该手办已入库：${figureResponse.data.name}，状态：${figureResponse.data.status}。可以继续入库同款手办。`
        }
      }

      // 继续查找模板以便入库
      await findTemplate()
      return
    }

    // 没有找到手办实例，查找模板
    await findTemplate()
  } catch (error) {
    console.error('扫码查询失败:', error)
    scanResult.value = {
      type: 'error',
      message: '查询失败，请重试'
    }
  } finally {
    scanLoading.value = false
  }
}

// 查找模板
const findTemplate = async () => {
  try {
    const templateResponse = await scanTemplateApi({ code: scanCode.value })

    if (templateResponse.code === 200 && templateResponse.data) {
      // 找到模板，填充表单
      const template = templateResponse.data
      foundTemplate.value = template
      isNewTemplate.value = false

      inboundForm.code = scanCode.value
      inboundForm.figure_template = {
        name: template.name || '',
        series: template.series || '',
        character: template.character || '',
        manufacturer: template.manufacturer || '',
        release_date: template.release_date ? template.release_date.split('T')[0] : '',
        original_price: template.original_price || 0,
        reference_price: template.reference_price || 0,
        tags: template.tags?.map(tag => tag.name) || []
      }

      scanResult.value = {
        type: 'success',
        message: '找到手办模板信息，请确认入库信息'
      }
      showForm.value = true
    } else {
      // 未找到模板，需要手动填写
      handleNewTemplate()
    }
  } catch (error) {
    // 查找模板失败，可能是未找到
    handleNewTemplate()
  }
}

// 处理新模板创建
const handleNewTemplate = () => {
  inboundForm.code = scanCode.value
  isNewTemplate.value = true
  foundTemplate.value = null
  resetFormData()

  scanResult.value = {
    type: 'info',
    message: '未找到该条码的手办模板，请填写新模板信息'
  }
  showForm.value = true
}

// 搜索会员
const searchMembers = async (query) => {
  if (!query) {
    membersList.value = []
    return
  }

  try {
    membersLoading.value = true
    const response = await searchMembersApi({ keyword: query })

    if (response.code === 200) {
      membersList.value = response.data || []
    }
  } catch (error) {
    console.error('搜索会员失败:', error)
  } finally {
    membersLoading.value = false
  }
}

// 文件变化处理
const handleFileChange = (file, fileList) => {
  // 检查文件类型
  const isImage = file.raw && file.raw.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    // 移除非图片文件
    const index = fileList.findIndex(item => item.uid === file.uid)
    if (index > -1) {
      fileList.splice(index, 1)
    }
    return false
  }

  // 检查文件大小（限制为10MB）
  const isLt10M = file.raw.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过10MB!')
    // 移除超大文件
    const index = fileList.findIndex(item => item.uid === file.uid)
    if (index > -1) {
      fileList.splice(index, 1)
    }
    return false
  }

  // 检查文件数量限制
  if (fileList.length > 5) {
    ElMessage.error('最多只能上传5张图片!')
    // 移除多余文件
    fileList.splice(5)
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

// 重置表单
const resetForm = () => {
  scanCode.value = ''
  scanResult.value = null
  showForm.value = false
  isNewTemplate.value = false
  foundTemplate.value = null
  nameGenerationType.value = 'auto'
  resetFormData()
  fileList.value = []

  if (inboundFormRef.value) {
    inboundFormRef.value.resetFields()
  }
  if (transactionFormRef.value) {
    transactionFormRef.value.resetFields()
  }
}

// 重置表单数据
const resetFormData = () => {
  inboundForm.uuid = ''
  inboundForm.code = ''
  inboundForm.special_code = ''
  inboundForm.name = ''

  Object.assign(inboundForm.figure_template, {
    name: '',
    series: '',
    character: '',
    manufacturer: '',
    release_date: '',
    original_price: 0,
    reference_price: 0,
    tags: []
  })

  Object.assign(transactionForm, {
    member_id: null,
    price: 0,
    points_change: 0,
    remark: ''
  })
}

// 提交入库
const handleSubmit = async () => {
  try {
    // 验证表单
    await Promise.all([
      inboundFormRef.value.validate(),
      transactionFormRef.value.validate()
    ])

    submitLoading.value = true

    // 上传图片
    const uploadedPhotos = []
    for (const file of fileList.value) {
      if (file.raw) {
        const formData = new FormData()
        formData.append('file', file.raw)
        formData.append('type', 'figure')

        const uploadResponse = await uploadImageApi(formData)
        if (uploadResponse.code === 200) {
          uploadedPhotos.push({
            photo_path: uploadResponse.data.file_path,
            photo_type: '包装',
            is_main: uploadedPhotos.length === 0
          })
        }
      }
    }

    // 准备提交数据 - 根据新的API格式
    const submitData = {
      code: inboundForm.code,
      member_id: transactionForm.member_id,
      price: transactionForm.price, // 已经是分为单位
      points_change: transactionForm.points_change,
      remark: transactionForm.remark,
      figure_template: {
        name: inboundForm.figure_template.name.trim(),
        series: inboundForm.figure_template.series.trim(),
        character: inboundForm.figure_template.character.trim(),
        manufacturer: inboundForm.figure_template.manufacturer.trim(),
        release_date: inboundForm.figure_template.release_date + 'T00:00:00Z',
        original_price: inboundForm.figure_template.original_price, // 已经是分为单位
        reference_price: inboundForm.figure_template.reference_price, // 已经是分为单位
        tags: inboundForm.figure_template.tags.filter(tag => tag && tag.trim())
      },
      figure_photos: uploadedPhotos
    }

    // 添加UUID（如果有）
    if (inboundForm.uuid && inboundForm.uuid.trim()) {
      submitData.uuid = inboundForm.uuid.trim()
    }

    // 添加自定义名称（如果是手动输入）
    if (nameGenerationType.value === 'manual' && inboundForm.name && inboundForm.name.trim()) {
      submitData.name = inboundForm.name.trim()
      submitData.auto_generate_name = false
    } else {
      submitData.auto_generate_name = true
    }

    // 如果找到了现有模板，添加条形码信息
    if (foundTemplate.value) {
      submitData.figure_template.barcode = foundTemplate.value.barcode
      submitData.figure_template.special_code = foundTemplate.value.special_code || ''
    } else {
      // 新模板，使用扫描的条码
      submitData.figure_template.barcode = inboundForm.code
      submitData.figure_template.special_code = inboundForm.special_code || ''
    }

    console.log('提交入库数据:', submitData)

    const response = await buyTransactionApi(submitData)

    if (response.code === 200 || response.code === 201) {
      const figureInfo = response.data?.figure || response.data
      const successMsg = figureInfo?.uuid
        ? `入库成功！手办UUID: ${figureInfo.uuid}`
        : '入库成功！'

      ElMessage.success(successMsg)
      resetForm()
    } else {
      ElMessage.error(response.message || '入库失败')
    }
  } catch (error) {
    console.error('入库失败:', error)
    const errorMsg = error?.response?.data?.message || error?.message || '入库失败，请重试'
    ElMessage.error(errorMsg)
  } finally {
    submitLoading.value = false
  }
}

// 获取选项数据
const fetchOptions = async () => {
  try {
    const [tagsResponse, seriesResponse, manufacturersResponse] = await Promise.all([
      getTagsApi(),
      getSeriesListApi(),
      getManufacturersListApi()
    ])

    if (tagsResponse.code === 200) {
      availableTags.value = tagsResponse.data || []
    }

    if (seriesResponse.code === 200) {
      seriesOptions.value = seriesResponse.data || []
    }

    if (manufacturersResponse.code === 200) {
      manufacturerOptions.value = manufacturersResponse.data || []
    }
  } catch (error) {
    console.error('获取选项数据失败:', error)
  }
}

// 页面挂载时获取数据
onMounted(() => {
  fetchOptions()
})
</script>

<style scoped>
.inbound-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  text-align: center;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: #8492a6;
  font-size: 14px;
}

.scan-card,
.form-card,
.transaction-card,
.upload-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #2c3e50;
}

.scan-content {
  padding: 20px 0;
}

.scan-input-group {
  margin-bottom: 16px;
}

.scan-result {
  margin-top: 16px;
}

.form-actions {
  text-align: center;
  padding: 24px 0;
}

.form-actions .el-button {
  margin: 0 8px;
  min-width: 120px;
}

/* UUID字段样式 */
.uuid-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.uuid-input-group .el-input {
  flex: 1;
}

.uuid-help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 名称生成选项样式 */
.name-type-radio {
  margin-bottom: 16px;
}

.name-type-radio .el-radio {
  margin-right: 24px;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .inbound-container {
    margin: 0;
  }

  .page-header h2 {
    font-size: 20px;
  }

  .scan-content {
    padding: 16px 0;
  }

  .form-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 16px;
    border-top: 1px solid #e8e8e8;
    z-index: 100;
  }

  .form-actions .el-button {
    width: 45%;
    margin: 0 2.5%;
  }

  .inbound-container {
    padding-bottom: 80px;
  }

  /* 移动端UUID输入优化 */
  .uuid-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .uuid-input-group .el-button {
    margin-top: 8px;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .inbound-container {
    max-width: 100%;
    padding: 0 16px;
  }
}

:deep(.el-upload--picture-card) {
  width: 120px;
  height: 120px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 120px;
  height: 120px;
}

/* 表单样式优化 */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #2c3e50;
}

:deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

:deep(.el-radio) {
  margin-right: 0 !important;
}

/* UUID输入框样式 */
:deep(.uuid-input .el-input__inner) {
  font-family: monospace;
  font-size: 13px;
}

/* 成功消息样式 */
.success-message {
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #e1f5fe;
  border-radius: 8px;
  margin-top: 16px;
}

.success-message .uuid-display {
  font-family: monospace;
  font-size: 14px;
  font-weight: 600;
  color: #1976d2;
  background: white;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 8px;
  word-break: break-all;
}

/* 扫码结果样式优化 */
:deep(.el-alert--warning) {
  background-color: #fff7e6;
  border-color: #ffd591;
}

:deep(.el-alert--info) {
  background-color: #e6f7ff;
  border-color: #91d5ff;
}

:deep(.el-alert--success) {
  background-color: #f6ffed;
  border-color: #b7eb8f;
}

/* 表单卡片hover效果 */
.form-card:hover,
.transaction-card:hover,
.upload-card:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease-in-out;
}
</style>
