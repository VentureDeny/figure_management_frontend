<template>
  <div class="header-container">
    <!-- 左侧 -->
    <div class="header-left">
      <!-- 折叠按钮 -->
      <el-button
        type="text"
        @click="$emit('toggle-sidebar')"
        class="collapse-btn"
        :size="isMobile ? 'small' : 'default'"
      >
        <el-icon :size="isMobile ? 18 : 20">
          <Menu />
        </el-icon>
      </el-button>

      <!-- 面包屑导航 - 桌面端显示 -->
      <el-breadcrumb
        v-if="!isMobile"
        separator="/"
        class="breadcrumb"
      >
        <el-breadcrumb-item
          v-for="item in breadcrumbList"
          :key="item.path"
          :to="item.path"
        >
          {{ item.meta.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>

      <!-- 页面标题 - 移动端显示 -->
      <div v-else class="page-title">
        {{ currentPageTitle }}
      </div>
    </div>

    <!-- 右侧 -->
    <div class="header-right">
      <!-- 系统时间 - 桌面端显示 -->
      <div v-if="!isMobile" class="system-time">
        <el-icon><Clock /></el-icon>
        <span>{{ currentTime }}</span>
      </div>

      <!-- 用户信息 -->
      <el-dropdown @command="handleCommand" class="user-dropdown">
        <div class="user-info">
          <el-avatar :size="isMobile ? 28 : 32" src="/avatar.png">
            <el-icon><User /></el-icon>
          </el-avatar>
          <span v-if="!isMobile" class="username">{{ userInfo.name }}</span>
          <el-icon v-if="!isMobile"><ArrowDown /></el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人信息
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <el-icon><Lock /></el-icon>
              修改密码
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

// Props - 接收父组件传递的 props
const props = defineProps({
  collapse: {
    type: Boolean,
    default: false
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})

// Emits
defineEmits(['toggle-sidebar'])

const route = useRoute()
const router = useRouter()

// 响应式移动端检测
const isMobile = ref(false)

// 检测是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 当前时间
const currentTime = ref('')
let timeInterval = null

// 用户信息
const userInfo = ref({
  name: '管理员',
  role: 'admin',
  avatar: '/avatar.png'
})

// 当前页面标题
const currentPageTitle = computed(() => {
  return route.meta?.title || '手办仓库管理系统'
})

// 面包屑导航
const breadcrumbList = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  const breadcrumbs = []

  matched.forEach(item => {
    if (item.path !== '/') {
      breadcrumbs.push({
        path: item.path,
        meta: item.meta
      })
    }
  })

  return breadcrumbs
})

// 更新时间
const updateTime = () => {
  currentTime.value = dayjs().format('MM-DD HH:mm:ss')
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人信息功能开发中...')
      break
    case 'password':
      ElMessage.info('修改密码功能开发中...')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 清除token
    localStorage.removeItem('token')
    // 跳转到登录页
    router.push('/login')
    ElMessage.success('退出登录成功')
  }).catch(() => {
    // 取消退出
  })
}

onMounted(() => {
  // 初始化移动端检测
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // 初始化时间更新
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('resize', checkMobile)

  // 清理定时器
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.header-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.header-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.collapse-btn {
  margin-right: 16px;
  color: #606266;
  padding: 8px;
}

.collapse-btn:hover {
  color: #409eff;
  background-color: #f5f7fa;
}

.breadcrumb {
  font-size: 14px;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.system-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 13px;
  white-space: nowrap;
}

.user-dropdown {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .header-container {
    padding: 0 12px;
  }

  .collapse-btn {
    margin-right: 12px;
  }

  .page-title {
    font-size: 15px;
  }

  .header-right {
    gap: 8px;
  }
}

/* 平板适配 */
@media (min-width: 768px) and (max-width: 1024px) {
  .header-container {
    padding: 0 16px;
  }

  .breadcrumb {
    font-size: 13px;
  }
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #409eff;
}
</style>
