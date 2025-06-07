<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="login-background">
      <div class="bg-shape bg-shape-1"></div>
      <div class="bg-shape bg-shape-2"></div>
      <div class="bg-shape bg-shape-3"></div>
    </div>

    <!-- 登录表单容器 -->
    <div class="login-wrapper">
      <div class="login-form-container">
        <!-- Logo和标题 -->
        <div class="login-header">
          <div class="logo-section">

            <h1 class="system-title">手办仓库管理系统</h1>
          </div>
          <p class="system-subtitle">Figure Warehouse Management System</p>
        </div>

        <!-- 登录表单 -->
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          size="large"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              prefix-icon="User"
              :disabled="loading"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              :disabled="loading"
              show-password
              clearable
            />
          </el-form-item>

          <el-form-item class="login-actions">
            <el-button
              type="primary"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 底部信息 -->
        <div class="login-footer">
          <p class="copyright">© 2024 手办仓库管理系统 All Rights Reserved</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { loginApi } from '@/api/auth'

const router = useRouter()

// 表单引用
const loginFormRef = ref()

// 加载状态
const loading = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    // 表单验证
    await loginFormRef.value.validate()

    loading.value = true

    // 调用登录API
    const response = await loginApi({
      username: loginForm.username,
      password: loginForm.password
    })

    if (response.code === 200) {
      // 登录成功
      const { token, operator } = response.data

      // 存储token和用户信息
      localStorage.setItem('token', token)
      localStorage.setItem('userInfo', JSON.stringify(operator))

      ElMessage.success(response.message || '登录成功')

      // 跳转到首页
      router.push('/home')
    } else {
      // 登录失败
      ElMessage.error(response.message || '登录失败')
    }
  } catch (error) {
    console.error('登录错误:', error)

    if (error.response && error.response.data) {
      ElMessage.error(error.response.data.message || '登录失败')
    } else if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
  } finally {
    loading.value = false
  }
}

// 页面挂载时的处理
onMounted(() => {
  // 如果已经登录，直接跳转到首页
  const token = localStorage.getItem('token')
  if (token) {
    router.push('/home')
  }

  // 开发环境下预填充表单（可选）
  if (import.meta.env.DEV) {
    loginForm.username = 'admin'
    loginForm.password = 'password'
  }
})
</script>

<style scoped>
.login-container {
  height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.bg-shape-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  left: -150px;
  animation-delay: 0s;
}

.bg-shape-2 {
  width: 200px;
  height: 200px;
  top: 50%;
  right: -100px;
  animation-delay: 2s;
}

.bg-shape-3 {
  width: 400px;
  height: 400px;
  bottom: -200px;
  left: 30%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.login-wrapper {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 400px;
  margin: 0 20px;
}

.login-form-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.logo {
  width: 48px;
  height: 48px;
  margin-right: 12px;
}

.system-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.system-subtitle {
  font-size: 14px;
  color: #8492a6;
  margin: 0;
}

.login-form {
  width: 100%;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.login-actions {
  margin-bottom: 0;
}

.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.login-btn:active {
  transform: translateY(0);
}

.login-footer {
  text-align: center;
  margin-top: 24px;
}

.copyright {
  font-size: 12px;
  color: #8492a6;
  margin: 0;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .login-form-container {
    padding: 32px 24px;
    margin: 0 16px;
    border-radius: 12px;
  }

  .system-title {
    font-size: 20px;
  }

  .logo {
    width: 40px;
    height: 40px;
  }

  .bg-shape-1 {
    width: 200px;
    height: 200px;
    top: -100px;
    left: -100px;
  }

  .bg-shape-2 {
    width: 150px;
    height: 150px;
    right: -75px;
  }

  .bg-shape-3 {
    width: 250px;
    height: 250px;
    bottom: -125px;
  }
}

/* 平板适配 */
@media (min-width: 768px) and (max-width: 1024px) {
  .login-form-container {
    max-width: 420px;
    padding: 48px;
  }
}

/* 大屏幕适配 */
@media (min-width: 1200px) {
  .login-form-container {
    max-width: 450px;
    padding: 56px;
  }

  .system-title {
    font-size: 26px;
  }
}
</style>
