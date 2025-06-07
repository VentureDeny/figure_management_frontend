import request from '@/utils/request'

/**
 * 获取手办列表
 * @param {Object} params - 查询参数
 * @returns {Promise} 手办列表响应
 */
export const getFiguresApi = (params) => {
  return request({
    url: '/api/figures',
    method: 'GET',
    params
  })
}

/**
 * 获取在库手办
 * @param {Object} params - 查询参数
 * @returns {Promise} 在库手办响应
 */
export const getInStockFiguresApi = (params) => {
  return request({
    url: '/api/figures/in-stock',
    method: 'GET',
    params
  })
}

/**
 * 获取已售出手办
 * @param {Object} params - 查询参数
 * @returns {Promise} 已售出手办响应
 */
export const getSoldFiguresApi = (params) => {
  return request({
    url: '/api/figures/sold',
    method: 'GET',
    params
  })
}

/**
 * 搜索手办
 * @param {Object} params - 搜索参数
 * @returns {Promise} 搜索响应
 */
export const searchFiguresApi = (params) => {
  return request({
    url: '/api/figures/search',
    method: 'GET',
    params
  })
}

/**
 * 获取手办详情
 * @param {number} id - 手办ID
 * @returns {Promise} 手办详情响应
 */
export const getFigureDetailApi = (id) => {
  return request({
    url: `/api/figures/${id}`,
    method: 'GET'
  })
}

/**
 * 获取手办全链路历史
 * @param {number} id - 手办ID
 * @returns {Promise} 历史记录响应
 */
export const getFigureHistoryApi = (id) => {
  return request({
    url: `/api/figures/${id}/history`,
    method: 'GET'
  })
}

/**
 * 创建手办
 * @param {Object} data - 手办数据
 * @returns {Promise} 创建响应
 */
export const createFigureApi = (data) => {
  return request({
    url: '/api/figures',
    method: 'POST',
    data
  })
}

/**
 * 更新手办
 * @param {number} id - 手办ID
 * @param {Object} data - 更新数据
 * @returns {Promise} 更新响应
 */
export const updateFigureApi = (id, data) => {
  return request({
    url: `/api/figures/${id}`,
    method: 'PUT',
    data
  })
}

/**
 * 删除手办
 * @param {number} id - 手办ID
 * @returns {Promise} 删除响应
 */
export const deleteFigureApi = (id) => {
  return request({
    url: `/api/figures/${id}`,
    method: 'DELETE'
  })
}

/**
 * 添加手办照片
 * @param {number} id - 手办ID
 * @param {Object} data - 照片数据
 * @returns {Promise} 添加响应
 */
export const addFigurePhotosApi = (id, data) => {
  return request({
    url: `/api/figures/${id}/photos`,
    method: 'POST',
    data
  })
}

/**
 * 删除手办照片
 * @param {number} figureId - 手办ID
 * @param {number} photoId - 照片ID
 * @returns {Promise} 删除响应
 */
export const deleteFigurePhotoApi = (figureId, photoId) => {
  return request({
    url: `/api/figures/${figureId}/photos/${photoId}`,
    method: 'DELETE'
  })
}

/**
 * 设置主照片
 * @param {number} figureId - 手办ID
 * @param {number} photoId - 照片ID
 * @returns {Promise} 设置响应
 */
export const setMainPhotoApi = (figureId, photoId) => {
  return request({
    url: `/api/figures/${figureId}/photos/${photoId}/main`,
    method: 'PUT'
  })
}

/**
 * 获取系列列表
 * @returns {Promise} 系列列表响应
 */
export const getSeriesListApi = () => {
  return request({
    url: '/api/figure-templates/series',
    method: 'GET'
  })
}

/**
 * 获取厂商列表
 * @returns {Promise} 厂商列表响应
 */
export const getManufacturersListApi = () => {
  return request({
    url: '/api/figure-templates/manufacturers',
    method: 'GET'
  })
}


// 上传图片
export const uploadImageApi = (file, type = 'figure') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  return request.post('/api/upload/image', formData)
}
