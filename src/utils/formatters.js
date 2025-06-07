// src/utils/formatters.js

/**
 * 格式化日期时间
 * @param {string|Date} dateTime - 日期时间
 * @param {string} format - 格式类型 'datetime'|'date'|'time'
 * @returns {string} 格式化后的字符串
 */
export const formatDateTime = (dateTime, format = 'datetime') => {
  if (!dateTime) return ''

  const date = new Date(dateTime)

  if (isNaN(date.getTime())) return ''

  const options = {
    datetime: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    },
    date: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  }

  return date.toLocaleString('zh-CN', options[format])
}

/**
 * 格式化价格（分转元）
 * @param {number} price - 价格（分）
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的价格字符串
 */
export const formatPrice = (price, decimals = 2) => {
  if (typeof price !== 'number' || isNaN(price)) return '0.00'
  return (price / 100).toFixed(decimals)
}

/**
 * 格式化利润显示
 * @param {number} profit - 利润金额
 * @returns {object} 包含样式类和显示文本的对象
 */
export const formatProfit = (profit) => {
  const formattedProfit = Math.abs(profit || 0).toFixed(2)

  if (profit > 0) {
    return {
      class: 'profit-positive',
      text: `+¥${formattedProfit}`,
      type: 'success'
    }
  } else if (profit < 0) {
    return {
      class: 'profit-negative',
      text: `-¥${formattedProfit}`,
      type: 'danger'
    }
  } else {
    return {
      class: 'profit-zero',
      text: '¥0.00',
      type: 'info'
    }
  }
}

/**
 * 获取图片完整URL
 * @param {string} path - 图片路径
 * @returns {string} 完整的图片URL
 */
export const getImageUrl = (path) => {
  if (!path) return '/placeholder.png'
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_BASE_URL || ''}${path}`
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化数字，添加千分位分隔符
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字字符串
 */
export const formatNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return '0'
  return num.toLocaleString('zh-CN')
}

/**
 * 格式化百分比
 * @param {number} value - 数值（0-1之间或0-100之间）
 * @param {number} decimals - 小数位数
 * @param {boolean} isPercent - 输入值是否已经是百分比格式（0-100）
 * @returns {string} 格式化后的百分比字符串
 */
export const formatPercent = (value, decimals = 2, isPercent = false) => {
  if (typeof value !== 'number' || isNaN(value)) return '0%'

  const percentage = isPercent ? value : value * 100
  return percentage.toFixed(decimals) + '%'
}

/**
 * 格式化手机号（隐藏中间4位）
 * @param {string} phone - 手机号
 * @returns {string} 格式化后的手机号
 */
export const formatPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return ''

  // 移除所有非数字字符
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }

  return phone
}

/**
 * 格式化身份证号（隐藏中间部分）
 * @param {string} idCard - 身份证号
 * @returns {string} 格式化后的身份证号
 */
export const formatIdCard = (idCard) => {
  if (!idCard || typeof idCard !== 'string') return ''

  if (idCard.length === 18) {
    return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
  } else if (idCard.length === 15) {
    return idCard.replace(/(\d{6})\d{6}(\d{3})/, '$1******$2')
  }

  return idCard
}

/**
 * 格式化时间间隔（相对时间）
 * @param {string|Date} dateTime - 时间
 * @returns {string} 相对时间字符串
 */
export const formatRelativeTime = (dateTime) => {
  if (!dateTime) return ''

  const date = new Date(dateTime)
  const now = new Date()
  const diffMs = now - date

  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSeconds < 60) {
    return '刚刚'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 30) {
    return `${diffDays}天前`
  } else if (diffMonths < 12) {
    return `${diffMonths}个月前`
  } else {
    return `${diffYears}年前`
  }
}

/**
 * 截断文本并添加省略号
 * @param {string} text - 文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的文本
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || typeof text !== 'string') return ''

  if (text.length <= maxLength) return text

  return text.substring(0, maxLength) + '...'
}

/**
 * 格式化状态标签类型
 * @param {string} status - 状态值
 * @returns {string} Element Plus 标签类型
 */
export const getStatusTagType = (status) => {
  const statusMap = {
    '在库': 'success',
    '已售出': 'warning',
    '已损坏': 'danger',
    '买入': 'primary',
    '卖出': 'success',
    '正常': 'success',
    '异常': 'danger',
    '待处理': 'warning',
    '已完成': 'success'
  }

  return statusMap[status] || 'info'
}
