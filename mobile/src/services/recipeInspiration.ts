import { API_BASE_URL, request } from './request'
import { decodeUtf8, concatBytes } from './aiRecipe'

export interface RecipeOptionGroups {
  ingredient: string[]
  spicy: string[]
  preference: string[]
  taboo: string[]
}

export interface InspiredIngredient {
  name: string
  amount: string
}

export interface InspiredDish {
  name: string
  reason?: string
  description?: string
  cookingTime?: string
  ingredients: InspiredIngredient[]
  steps: string[]
}

export interface GenerateRecipesData {
  ingredients: string[]
  people?: number
  spicy?: string
  preferences?: string[]
  taboos?: string[]
  notes?: string
}

export interface SaveInspiredDishesData {
  userId: number
  groupId: number
  dishes: Array<
    Pick<InspiredDish, 'name' | 'description' | 'cookingTime' | 'ingredients' | 'steps'>
  >
}

export const getRecipeInspirationOptions = () => {
  return request<RecipeOptionGroups>({
    url: '/foodie-buddy/recipe-inspiration/options'
  })
}

export interface StreamInspirationTask {
  abort: () => void
}

interface StreamInspirationHandlers {
  /** 每帧都是"累积到当前"的推荐菜列表，直接整体替换即可 */
  onPartial: (dishes: InspiredDish[]) => void
  onDone: () => void
  onError: (message: string) => void
}

/**
 * 流式生成推荐菜（SSE over POST）。
 *
 * 小程序走 enableChunked + onChunkReceived 真流式，卡片随生成逐张出现；
 * H5 端 onChunkReceived 不触发，由 success 回调解析完整响应体退化为非流式
 * ——与 aiRecipe.streamRecipe 同一条代码路径覆盖两端。
 */
export const streamInspiredRecipes = (
  data: GenerateRecipesData,
  handlers: StreamInspirationHandlers
): StreamInspirationTask => {
  const url = `${API_BASE_URL}/foodie-buddy/recipe-inspiration/stream`

  let finished = false
  let aborted = false
  let pendingBytes = new Uint8Array(0)
  let buffer = ''

  const finish = () => {
    if (finished || aborted) return
    finished = true
    handlers.onDone()
  }

  const fail = (message: string) => {
    if (finished || aborted) return
    finished = true
    handlers.onError(message)
  }

  /** 流式中间帧字段可能只补全一半，防御性清洗后再交给页面渲染 */
  const sanitize = (raw: any): InspiredDish[] => {
    if (!raw || !Array.isArray(raw.dishes)) return []
    return raw.dishes.map((d: any) => {
      const ingredients = Array.isArray(d?.ingredients)
        ? d.ingredients
            .filter((i: any) => i && typeof i.name === 'string' && i.name.trim())
            .slice(0, 12)
            .map((i: any) => ({ name: String(i.name), amount: String(i.amount ?? '') }))
        : []
      const steps = Array.isArray(d?.steps)
        ? d.steps.filter((s: unknown): s is string => typeof s === 'string' && !!s.trim()).slice(0, 8)
        : []
      return {
        name: typeof d?.name === 'string' ? d.name : '',
        reason: typeof d?.reason === 'string' ? d.reason : undefined,
        description: typeof d?.description === 'string' ? d.description : undefined,
        cookingTime: typeof d?.cookingTime === 'string' ? d.cookingTime : undefined,
        ingredients,
        steps
      }
    })
  }

  /** 按 SSE 空行切帧；返回是否已收到结束/错误帧 */
  const consume = (chunk: string) => {
    buffer += chunk
    const frames = buffer.split('\n\n')
    buffer = frames.pop() || ''

    for (const frame of frames) {
      const line = frame.split('\n').find((item) => item.startsWith('data:'))
      if (!line) continue
      const payload = line.slice(5).trim()
      if (!payload) continue
      if (payload === '[DONE]') {
        finish()
        return true
      }
      try {
        const parsed = JSON.parse(payload)
        if (parsed && parsed.error) {
          fail(parsed.error)
          return true
        }
        if (!finished && !aborted) handlers.onPartial(sanitize(parsed))
      } catch {
        // 半个 JSON，忽略即可，后续帧会带上完整内容
      }
    }
    return false
  }

  // enableChunked / onChunkReceived 不在 @dcloudio/types 里，需要绕过类型检查
  const task = uni.request({
    url,
    method: 'POST',
    data,
    header: { 'Content-Type': 'application/json' },
    enableChunked: true,
    responseType: 'text',
    success: (res: any) => {
      if (finished || aborted) return
      if (res.statusCode < 200 || res.statusCode >= 300) {
        fail(typeof res.data === 'string' ? '生成失败，请重试' : res.data?.message || '生成失败，请重试')
        return
      }
      if (typeof res.data === 'string' && res.data) consume(res.data)
      finish()
    },
    fail: (error: any) => {
      if (aborted) return
      fail(error?.errMsg || '网络异常，请重试')
    }
  } as any) as any

  task?.onChunkReceived?.((res: { data: ArrayBuffer }) => {
    if (finished || aborted) return
    const incoming = new Uint8Array(res.data)
    const { text, rest } = decodeUtf8(concatBytes(pendingBytes, incoming))
    pendingBytes = rest
    if (text) consume(text)
  })

  return {
    abort: () => {
      if (finished) return
      aborted = true
      task?.abort?.()
    }
  }
}

export const saveInspiredDishes = (data: SaveInspiredDishesData) => {
  return request<{ count: number }>({
    url: '/foodie-buddy/recipe-inspiration/save',
    method: 'POST',
    data
  })
}
