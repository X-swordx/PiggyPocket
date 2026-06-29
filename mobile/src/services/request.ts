const API_BASE_URL = 'http://localhost:3000/api'

interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  query?: Record<string, any>
}

const buildUrl = (url: string, query?: Record<string, any>) => {
  const fullUrl = `${API_BASE_URL}${url}`
  if (!query) return fullUrl

  const params = Object.keys(query)
    .filter((key) => query[key] !== undefined && query[key] !== null && query[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join('&')

  return params ? `${fullUrl}?${params}` : fullUrl
}

export const request = <T>(options: RequestOptions): Promise<T> => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: buildUrl(options.url, options.query),
      method: options.method || 'GET',
      data: options.data,
      success: (res) => {
        const response = res.data as ApiResponse<T> | undefined
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(response?.message || '请求失败'))
          return
        }
        if (!response || response.code !== 0) {
          reject(new Error(response?.message || '请求失败'))
          return
        }
        resolve(response.data)
      },
      fail: (error) => {
        reject(new Error(error.errMsg || '网络异常'))
      }
    })
  })
}
