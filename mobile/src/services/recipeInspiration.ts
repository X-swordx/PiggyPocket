import { request } from './request'

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

// 一次生成多道完整菜谱，模型耗时较长，超时放宽到 90 秒
export const generateInspiredRecipes = (data: GenerateRecipesData) => {
  return request<{ dishes: InspiredDish[] }>({
    url: '/foodie-buddy/recipe-inspiration/generate',
    method: 'POST',
    data,
    timeout: 90000
  })
}

export const saveInspiredDishes = (data: SaveInspiredDishesData) => {
  return request<{ count: number }>({
    url: '/foodie-buddy/recipe-inspiration/save',
    method: 'POST',
    data
  })
}
