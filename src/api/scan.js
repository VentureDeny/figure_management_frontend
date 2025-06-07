import request from '@/utils/request'

/**
 * 扫码查找手办
 * @param {Object} data - 扫码数据
 * @param {string} data.code - 条码
 * @returns {Promise} 手办信息响应
 */
export const scanFigureApi = (data) => {
  return request({
    url: '/api/scan/figure',
    method: 'POST',
    data
  })
}

/**
 * 扫码查找手办模板
 * @param {Object} data - 扫码数据
 * @param {string} data.code - 条码
 * @returns {Promise} 模板信息响应
 */
export const scanTemplateApi = (data) => {
  return request({
    url: '/api/scan/template',
    method: 'POST',
    data
  })
}
