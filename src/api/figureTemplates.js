import request from '@/utils/request'

/**
 * 获取手办模板列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页大小
 * @param {string} params.keyword - 搜索关键词
 * @param {string} params.series - 系列筛选
 * @param {string} params.manufacturer - 厂商筛选
 * @returns {Promise} 模板列表响应
 */
export const getFigureTemplatesApi = (params) => {
  return request.get('/api/figure-templates', { params })
}

/**
 * 创建手办模板
 * @param {Object} data - 模板数据
 * @param {string} data.barcode - 条形码
 * @param {string} data.special_code - 特殊编码
 * @param {string} data.name - 模板名称
 * @param {string} data.series - 系列
 * @param {string} data.character - 角色
 * @param {string} data.manufacturer - 厂商
 * @param {string} data.release_date - 发售日期
 * @param {number} data.original_price - 原价（分）
 * @param {number} data.reference_price - 参考价格（分）
 * @param {Array} data.tags - 标签数组
 * @returns {Promise} 创建响应
 */
export const createFigureTemplateApi = (data) => {
  return request.post('/api/figure-templates', data)
}

/**
 * 获取手办模板详情
 * @param {number} id - 模板ID
 * @returns {Promise} 模板详情响应
 */
export const getFigureTemplateApi = (id) => {
  return request.get(`/api/figure-templates/${id}`)
}

/**
 * 更新手办模板
 * @param {number} id - 模板ID
 * @param {Object} data - 更新数据
 * @returns {Promise} 更新响应
 */
export const updateFigureTemplateApi = (id, data) => {
  return request.put(`/api/figure-templates/${id}`, data)
}

/**
 * 删除手办模板
 * @param {number} id - 模板ID
 * @returns {Promise} 删除响应
 */
export const deleteFigureTemplateApi = (id) => {
  return request.delete(`/api/figure-templates/${id}`)
}

/**
 * 搜索手办模板
 * @param {string} keyword - 搜索关键词
 * @returns {Promise} 搜索结果响应
 */
export const searchFigureTemplatesApi = (keyword) => {
  return request.get('/api/figure-templates/search', {
    params: { keyword }
  })
}

/**
 * 获取模板统计信息
 * @returns {Promise} 统计信息响应
 */
export const getTemplateStatsApi = () => {
  return request.get('/api/figure-templates/stats')
}

/**
 * 获取系列列表
 * @returns {Promise} 系列列表响应
 */
export const getSeriesListApi = () => {
  return request.get('/api/figure-templates/series')
}

/**
 * 获取厂商列表
 * @returns {Promise} 厂商列表响应
 */
export const getManufacturersListApi = () => {
  return request.get('/api/figure-templates/manufacturers')
}
