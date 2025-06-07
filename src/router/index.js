import { createRouter, createWebHistory } from 'vue-router'
import LayoutMain from '@/layout/LayoutMain.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login/LoginPage.vue'),
      meta: { title: '操作员登录' }
    },
     {
      path: '/',
      component: LayoutMain,
      redirect: '/home',
      children: [
        {
          path: 'home',
          name: 'Home',
          component: () => import('@/views/Home/HomePage.vue'),
          meta: { title: '首页', icon: 'HomeFilled' }
        },
        {
          path: 'inbound',
          name: 'Inbound',
          component: () => import('@/views/Inbound/InboundPage.vue'),
          meta: { title: '手办入库', icon: 'Download' }
        },
        {
          path: 'outbound',
          name: 'Outbound',
          component: () => import('@/views/Outbound/OutboundPage.vue'),
          meta: { title: '手办出库', icon: 'Upload' }
        },
        {
          path: 'members',
          name: 'Members',
          component: () => import('@/views/Members/MembersPage.vue'),
          meta: { title: '会员管理', icon: 'User' }
        },
        {
          path: 'inventory',
          name: 'Inventory',
          component: () => import('@/views/Inventory/InventoryPage.vue'),
          meta: { title: '手办管理', icon: 'TrophyBase' } // 奖杯底座，象征手办收藏
        },
        {
          path: 'templates',
          name: 'Templates',
          component: () => import('@/views/Templates/TemplatesPage.vue'),
          meta: { title: '模板管理', icon: 'Document' } // 文档图标，象征模板
        },
        {
          path: 'transactions',
          name: 'Transactions',
          component: () => import('@/views/Transactions/TransactionsPage.vue'),
          meta: { title: '交易管理', icon: 'Tickets' } // 票据图标，象征交易记录
        },
        {
          path: 'tags',
          name: 'Tags',
          component: () => import('@/views/Tag/TagPage.vue'),
          meta: { title: '标签管理', icon: 'PriceTag' } // 价格标签图标，象征标签
        }
        /*
        {
          path: 'inventory',
          name: 'Inventory',
          component: () => import('@/views/Inventory/index.vue'),
          meta: { title: '手办管理', icon: 'Box' }
        },
        {
          path: 'inventory/edit/:id',
          name: 'EditInventory',
          component: () => import('@/views/Inventory/edit.vue'),
          meta: { title: '编辑手办', icon: 'Edit', hidden: true }
        },

        {
          path: 'members/add',
          name: 'AddMember',
          component: () => import('@/views/Members/add.vue'),
          meta: { title: '添加会员', icon: 'UserFilled', hidden: true }
        },
        {
          path: 'members/edit/:id',
          name: 'EditMember',
          component: () => import('@/views/Members/edit.vue'),
          meta: { title: '编辑会员', icon: 'Edit', hidden: true }
        },
        {
          path: 'transactions',
          name: 'Transactions',
          component: () => import('@/views/Transactions/index.vue'),
          meta: { title: '交易记录', icon: 'Tickets' }
        },
        {
          path: 'points',
          name: 'Points',
          component: () => import('@/views/Points/index.vue'),
          meta: { title: '积分管理', icon: 'Medal' }
        },
        {
          path: 'logs',
          name: 'Logs',
          component: () => import('@/views/Logs/index.vue'),
          meta: { title: '操作日志', icon: 'Document' }
        },
        {
          path: 'reports',
          name: 'Reports',
          component: () => import('@/views/Reports/index.vue'),
          meta: { title: '统计报表', icon: 'TrendCharts' }
        }*/
      ]
    },

  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 手办仓库管理系统` : '手办仓库管理系统'

  // 简单的登录验证（实际项目中需要更完善的认证逻辑）
  const token = localStorage.getItem('token')

  if (to.name !== 'Login' && !token) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && token) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
