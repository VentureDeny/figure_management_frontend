<template>
  <div class="points-manager">
    <!-- 当前积分 -->
    <el-card shadow="never" style="margin-bottom: 20px;">
      <div class="current-points">
        <div class="points-display">
          <span class="points-label">当前积分</span>
          <span class="points-value">{{ member.points || 0 }}</span>
        </div>
        <div class="member-info">
          <span>{{ member.name }}</span>
          <span>{{ member.phone }}</span>
        </div>
      </div>
    </el-card>

    <!-- 积分调整 -->
    <el-card title="积分调整" shadow="never" style="margin-bottom: 20px;">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="调整类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio value="add">增加积分</el-radio>
            <el-radio value="reduce">减少积分</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="积分数量" prop="points">
          <el-input-number
            v-model="form.points"
            :min="1"
            :max="form.type === 'reduce' ? member.points : 99999"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="调整原因" prop="reason">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入调整原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            确认调整
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 积分记录 -->
    <el-card title="积分记录" shadow="never">
      <el-table :data="pointsHistory" v-loading="historyLoading">
        <el-table-column label="积分变化" width="100" align="right">
          <template #default="{ row }">
            <span :class="['points-change', row.points_change >= 0 ? 'points-positive' : 'points-negative']">
              {{ row.points_change > 0 ? '+' : '' }}{{ row.points_change }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="reason" label="原因" />

        <el-table-column label="关联交易" width="100">
          <template #default="{ row }">
            <el-link v-if="row.transaction_id" type="primary" @click="viewTransaction(row.transaction_id)">
              #{{ row.transaction_id }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="操作员" width="100">
          <template #default="{ row }">
            {{ row.operator?.name || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="时间" width="160">
          <template #default="{ row }">
            {{ dayjs(row.created_at).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container" v-if="historyTotal > 10">
        <el-pagination
          v-model:current-page="historyPage"
          :page-size="10"
          :total="historyTotal"
          layout="prev, pager, next"
          @current-change="handleHistoryPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adjustMemberPointsApi, getMemberPointsApi } from '@/api/points'
import dayjs from 'dayjs'

const props = defineProps({
  member: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['updated'])

const formRef = ref()
const loading = ref(false)
const historyLoading = ref(false)
const pointsHistory = ref([])
const historyPage = ref(1)
const historyTotal = ref(0)

// 表单数据
const form = reactive({
  type: 'add',
  points: 1,
  reason: ''
})

// 验证规则
const rules = {
  type: [
    { required: true, message: '请选择调整类型', trigger: 'change' }
  ],
  points: [
    { required: true, message: '请输入积分数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '积分数量必须大于0', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请输入调整原因', trigger: 'blur' },
    { min: 2, max: 200, message: '原因长度在 2 到 200 个字符', trigger: 'blur' }
  ]
}

// 获取积分记录
const fetchPointsHistory = async () => {
  try {
    historyLoading.value = true
    const response = await getMemberPointsApi(props.member.id, {
      page: historyPage.value,
      size: 10
    })

    if (response.code === 200) {
      pointsHistory.value = response.data.adjustments || []
      historyTotal.value = response.data.pagination?.total || 0
    }
  } catch (error) {
    console.error('获取积分记录失败:', error)
  } finally {
    historyLoading.value = false
  }
}

// 处理积分调整
const handleSubmit = async () => {
  try {
    await formRef.value.validate()

    loading.value = true

    const adjustPoints = form.type === 'add' ? form.points : -form.points

    const response = await adjustMemberPointsApi({
      member_id: props.member.id,
      points_change: adjustPoints,
      reason: form.reason
    })

    if (response.code === 200 || response.code === 201) {
      ElMessage.success('积分调整成功')

      // 重置表单
      form.points = 1
      form.reason = ''

      // 刷新数据
      fetchPointsHistory()
      emit('updated')
    } else {
      ElMessage.error(response.message || '调整失败')
    }
  } catch (error) {
    console.error('积分调整失败:', error)
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('调整失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

// 查看交易详情
const viewTransaction = (transactionId) => {
  // 这里可以打开交易详情弹窗或跳转到交易页面
  ElMessage.info(`查看交易 #${transactionId}`)
}

// 分页变化
const handleHistoryPageChange = (page) => {
  historyPage.value = page
  fetchPointsHistory()
}

onMounted(() => {
  fetchPointsHistory()
})
</script>

<style scoped>
.current-points {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.points-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.points-label {
  font-size: 14px;
  color: #8492a6;
  margin-bottom: 4px;
}

.points-value {
  font-size: 32px;
  font-weight: 600;
  color: #e6a23c;
}

.member-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: #606266;
}

.member-info span:first-child {
  font-weight: 500;
  margin-bottom: 4px;
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

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .current-points {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .member-info {
    align-items: center;
  }
}
</style>
