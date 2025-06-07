<template>
  <div class="layout-container">
    <!-- 移动端遮罩层 -->
    <div
      v-if="isMobile && !isCollapse"
      class="mobile-overlay"
      @click="handleCloseSidebar"
    ></div>

    <!-- 侧边栏 -->
    <el-aside
      :width="sidebarWidth"
      :class="sidebarClass"
    >
      <SidebarMain :collapse="isCollapse" :is-mobile="isMobile" />
    </el-aside>

    <!-- 主内容区域 -->
    <el-container class="main-container">
      <!-- 顶部导航栏 -->
      <el-header :height="headerHeight" class="header">
        <HeaderMain
          @toggle-sidebar="toggleSidebar"
          :collapse="isCollapse"
          :is-mobile="isMobile"
        />
      </el-header>

      <!-- 主要内容 -->
      <el-main class="main-content">
        <div class="content-wrapper">
          <router-view />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SidebarMain from './components/SidebarMain.vue'
import HeaderMain from './components/HeaderMain.vue'

// 响应式状态
const windowWidth = ref(window.innerWidth)
const isCollapse = ref(false)

// 是否为移动端
const isMobile = computed(() => windowWidth.value < 768)

// 侧边栏宽度
const sidebarWidth = computed(() => {
  if (isMobile.value) {
    return isCollapse.value ? '0px' : '200px'
  }
  return isCollapse.value ? '64px' : '200px'
})

// 顶部栏高度
const headerHeight = computed(() => {
  return isMobile.value ? '50px' : '60px'
})

// 侧边栏样式类
const sidebarClass = computed(() => {
  return [
    'sidebar',
    {
      'sidebar-mobile': isMobile.value,
      'sidebar-hidden': isMobile.value && isCollapse.value
    }
  ]
})

// 切换侧边栏
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 移动端关闭侧边栏
const handleCloseSidebar = () => {
  if (isMobile.value) {
    isCollapse.value = true
  }
}

// 窗口大小变化处理
const handleResize = () => {
  windowWidth.value = window.innerWidth

  // 移动端自动收起侧边栏
  if (isMobile.value) {
    isCollapse.value = true
  } else {
    // 桌面端默认展开
    isCollapse.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  // 初始化时处理
  handleResize()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;
}

.sidebar {
  background-color: #001529;
  transition: all 0.3s ease;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
  z-index: 1001;
  overflow: hidden;
}

.sidebar-mobile {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 1002;
}

.sidebar-hidden {
  transform: translateX(-100%);
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1001;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 0; /* 防止内容溢出 */
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 1000;
}

.main-content {
  background-color: #f0f2f5;
  padding: 0;
  overflow: auto;
  flex: 1;
}

.content-wrapper {
  padding: 16px;
  min-height: 100%;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .content-wrapper {
    padding: 12px;
  }

  .main-container {
    margin-left: 0 !important;
  }
}

/* 平板适配 */
@media (min-width: 768px) and (max-width: 1024px) {
  .content-wrapper {
    padding: 16px;
  }
}

/* 桌面端 */
@media (min-width: 1025px) {
  .content-wrapper {
    padding: 20px;
  }
}
</style>
