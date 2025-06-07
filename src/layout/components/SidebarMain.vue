<template>
  <div class="sidebar-container">
    <!-- Logo区域 -->
    <div class="logo-container">
      <span class="logo-text" v-if="!collapse">手办仓库</span>
    </div>

    <!-- 菜单 -->
    <el-scrollbar class="menu-scrollbar">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapse && !isMobile"
        :unique-opened="!isMobile"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#ffffff"
        router
        :class="menuClass"
      >
        <template v-for="item in menuList" :key="item.path">
          <el-menu-item
            v-if="!item.children || item.children.length === 0"
            :index="item.path"
            @click="handleMenuClick(item)"
            :class="menuItemClass"
          >
            <el-icon>
              <component :is="item.meta.icon" />
            </el-icon>
            <template #title>{{ item.meta.title }}</template>
          </el-menu-item>

          <el-sub-menu
            v-else
            :index="item.path"
          >
            <template #title>
              <el-icon>
                <component :is="item.meta.icon" />
              </el-icon>
              <span>{{ item.meta.title }}</span>
            </template>

            <el-menu-item
              v-for="child in item.children"
              :key="child.path"
              :index="child.path"
              @click="handleMenuClick(child)"
              :class="menuItemClass"
            >
              <el-icon>
                <component :is="child.meta.icon" />
              </el-icon>
              <template #title>{{ child.meta.title }}</template>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Props
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

const route = useRoute()
const router = useRouter()

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 菜单样式类
const menuClass = computed(() => {
  return {
    'menu-mobile': props.isMobile
  }
})

// 菜单项样式类
const menuItemClass = computed(() => {
  return {
    'menu-item-mobile': props.isMobile
  }
})

// 菜单列表
const menuList = computed(() => {
  const routes = router.getRoutes()
  const layoutRoute = routes.find(r => r.path === '/')

  if (!layoutRoute || !layoutRoute.children) return []

  return layoutRoute.children
    .filter(child => !child.meta?.hidden)
    .map(child => ({
      path: child.path.startsWith('/') ? child.path : `/${child.path}`,
      meta: child.meta || {},
      children: child.children?.filter(grandChild => !grandChild.meta?.hidden) || []
    }))
})

// 处理菜单点击
const handleMenuClick = (item) => {
  if (route.path !== item.path) {
    router.push(item.path)
  }

  // 移动端点击菜单后自动关闭侧边栏
  if (props.isMobile) {
    // 通过父组件处理
    // 这里可以emit一个事件给父组件
  }
}
</script>

<style scoped>
.sidebar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  background-color: #002140;
  border-bottom: 1px solid #1f2937;
  flex-shrink: 0;
}

.logo-img {
  width: 32px;
  height: 32px;
  margin-right: 12px;
}

.logo-img-mini {
  width: 32px;
  height: 32px;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.menu-scrollbar {
  flex: 1;
  height: 0; /* 触发flex子项的高度计算 */
}

.el-menu {
  border-right: none;
  height: 100%;
}

.el-menu:not(.el-menu--collapse) {
  width: 200px;
}

/* 移动端菜单样式 */
.menu-mobile.el-menu:not(.el-menu--collapse) {
  width: 200px;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .logo-container {
    height: 50px;
  }

  .logo-text {
    font-size: 16px;
  }

  .logo-img,
  .logo-img-mini {
    width: 28px;
    height: 28px;
  }
}

/* 菜单项基础样式 */
:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  color: #fff !important;
  transition: all 0.3s ease;
}

/* 菜单项悬停效果 */
:deep(.el-menu-item:hover) {
  background-color: rgba(24, 144, 255, 0.1) !important;
  color: #1890ff !important;
}

/* 激活状态的菜单项 */
:deep(.el-menu-item.is-active) {
  background-color: #1890ff !important;
  color: #ffffff !important;
  font-weight: 600;
  position: relative;
}

/* 激活状态的左侧指示条 */
:deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #ffffff;
}

/* 子菜单标题样式 */
:deep(.el-sub-menu .el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  color: #fff !important;
  transition: all 0.3s ease;
}

:deep(.el-sub-menu .el-sub-menu__title:hover) {
  background-color: rgba(24, 144, 255, 0.1) !important;
  color: #1890ff !important;
}

/* 子菜单项样式 */
:deep(.el-sub-menu .el-menu-item) {
  background-color: rgba(0, 21, 41, 0.5) !important;
  margin-left: 0;
  padding-left: 50px !important;
}

:deep(.el-sub-menu .el-menu-item:hover) {
  background-color: rgba(24, 144, 255, 0.15) !important;
  color: #1890ff !important;
}

:deep(.el-sub-menu .el-menu-item.is-active) {
  background-color: #1890ff !important;
  color: #ffffff !important;
  font-weight: 600;
}

/* 图标样式 */
:deep(.el-menu-item .el-icon) {
  margin-right: 12px;
  font-size: 16px;
  color: inherit;
}

:deep(.el-sub-menu .el-sub-menu__title .el-icon) {
  margin-right: 12px;
  font-size: 16px;
  color: inherit;
}

/* 折叠状态下的图标居中 */
:deep(.el-menu--collapse .el-menu-item .el-icon) {
  margin-right: 0;
}

:deep(.el-menu--collapse .el-sub-menu .el-sub-menu__title .el-icon) {
  margin-right: 0;
}

/* 移动端菜单项高度调整 */
@media (max-width: 767px) {
  :deep(.el-menu-item) {
    height: 44px;
    line-height: 44px;
  }

  :deep(.el-sub-menu .el-sub-menu__title) {
    height: 44px;
    line-height: 44px;
  }
}

/* 滚动条样式 */
:deep(.el-scrollbar__bar) {
  opacity: 0;
  transition: opacity 0.3s;
}

:deep(.el-scrollbar:hover .el-scrollbar__bar) {
  opacity: 1;
}

/* 滚动条轨道 */
:deep(.el-scrollbar__thumb) {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

:deep(.el-scrollbar__thumb:hover) {
  background-color: rgba(255, 255, 255, 0.4);
}
</style>
