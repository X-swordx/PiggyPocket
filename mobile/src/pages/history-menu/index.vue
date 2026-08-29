<template>
  <view class="container" :style="themeStyle">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#333" />
      </view>
      <view class="title">
        <text>历史菜单</text>
      </view>
    </view>

    <scroll-view scroll-y class="content">
      <view v-if="groups.length === 0" style="padding: 32px; text-align: center; color: #777;">还没有已完成的历史菜单</view>
      <view v-for="group in groups" :key="group.date" class="date-group">
        <view class="date-header">
          <text>{{ group.label }}</text>
        </view>
        <view class="orders-list">
          <view v-for="order in group.orders" :key="order.id" class="order-card">
            <view class="order-card-header">
              <text class="order-meta">共 {{ order.dishes.length }} 个菜</text>
              <view class="order-rating-row">
                <view v-if="order.rating" class="stars-display">
                  <uni-icons
                    v-for="n in 5"
                    :key="n"
                    :type="n <= order.rating ? 'star-filled' : 'star'"
                    size="14"
                    color="#f59e0b"
                  />
                </view>
                <view v-else class="order-action rate" @click="openRating(order)">
                  <text>去评价</text>
                </view>
                <view class="order-action done">
                  <uni-icons type="checkmark-filled" size="14" color="#fff" />
                  <text>已完成</text>
                </view>
              </view>
            </view>
            <view class="order-dishes">
              <view v-for="dish in order.dishes" :key="dish.itemId" class="dish-row"
                @click="goToDishDetail(dish)">
                <view class="order-icon" :style="dish.image ? {} : (dish.bgColor ? { background: dish.bgColor } : {})">
                  <image v-if="dish.image" class="order-image" :src="dish.image" mode="aspectFill" />
                </view>
                <view class="order-info">
                  <text class="order-name">{{ dish.name }} x{{ dish.quantity }}</text>
                  <text class="order-time">{{ dish.remark }}</text>
                </view>
              </view>
            </view>
            <view v-if="order.ratingImage" class="rating-image-card" @click="previewImage(order.ratingImage)">
              <image class="rating-image" :src="order.ratingImage" mode="aspectFill" />
            </view>
          </view>
        </view>
      </view>
      <view style="height: 100px;"></view>
    </scroll-view>

    <!-- Rating Modal -->
    <view v-if="ratingOrder" class="rating-mask" @click="cancelRating">
      <view class="rating-sheet" @click.stop="">
        <view class="rating-title">
          <text>订单评价</text>
        </view>
        <view class="rating-stars">
          <uni-icons
            v-for="n in 5"
            :key="n"
            :type="n <= ratingValue ? 'star-filled' : 'star'"
            size="36"
            color="#f59e0b"
            @click="setRating(n)"
          />
        </view>
        <view class="rating-image-section">
          <view v-if="!ratingImage" class="rating-image-picker" @click="chooseRatingImage">
            <uni-icons type="camera-filled" size="24" color="var(--theme-primary)" />
            <text>添加评价图片（可选）</text>
          </view>
          <view v-else class="rating-image-preview" @click="previewImage(ratingImage)">
            <image class="rating-image" :src="ratingImage" mode="aspectFill" />
            <view class="rating-image-clear" @click.stop="ratingImage = ''">
              <uni-icons type="clear" size="16" color="#fff" />
            </view>
          </view>
        </view>
        <view class="rating-actions">
          <view class="rating-btn cancel" @click="cancelRating">
            <text>取消</text>
          </view>
          <view
            class="rating-btn confirm"
            :class="{ disabled: ratingValue < 1 || submittingRating || uploadingImage }"
            @click="confirmRating"
          >
            <text>{{ submittingRating ? '提交中...' : '确认' }}</text>
          </view>
        </view>
      </view>
    </view>

    <PrivacyModal ref="privacyModal" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import PrivacyModal from '@/components/PrivacyModal.vue'
import { getCurrentUser, getMyDiningGroups, getGroupOrders, getOrders, updateOrderRating, type FoodieOrder } from '@/services/foodieBuddy'
import { uploadToOSS } from '@/services/oss'
import { themeStyle } from '@/utils/theme'

interface HistoryDish {
  itemId?: number
  dishId?: number
  name: string
  remark: string
  quantity: number
  image?: string
  bgColor?: string
}

interface HistoryOrder {
  id: number
  createdAt: string
  cookDate?: string
  rating?: number
  ratingImage?: string
  dishes: HistoryDish[]
}

interface DateGroup {
  date: string
  label: string
  orders: HistoryOrder[]
}

const groups = ref<DateGroup[]>([])

const formatDate = (dateText: string) => {
  const d = new Date(dateText)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const mapOrder = (order: FoodieOrder): HistoryOrder => {
  return {
    id: order.id,
    createdAt: order.createdAt,
    cookDate: order.cookDate,
    rating: order.rating,
    ratingImage: order.ratingImage,
    dishes: (order.items || []).map((item) => ({
      itemId: item.id,
      dishId: item.dishId,
      name: item.dish?.name || order.orderNo,
      remark: item.remark || '',
      quantity: item.quantity || 1,
      image: item.dish?.image || '',
      bgColor: item.dish?.bgColor || ''
    }))
  }
}

const loadHistory = async () => {
  try {
    const user = await getCurrentUser()
    const diningGroups = await getMyDiningGroups(user.id)
    const groupId = diningGroups[0]?.id
    const [myOrders, groupOrders] = await Promise.all([
      getOrders({ userId: user.id, status: 'completed', page: 1, pageSize: 100 }),
      groupId
        ? getGroupOrders(groupId, { page: 1, pageSize: 100 })
        : Promise.resolve({ list: [] as FoodieOrder[] })
    ])
    const allOrders = [...myOrders.list, ...groupOrders.list]
    const uniqueOrders = Array.from(new Map(allOrders.map((order) => [order.id, order])).values())
    const orders = uniqueOrders.filter((order) => order.status === 'completed').map(mapOrder)
    const map = new Map<string, HistoryOrder[]>()
    orders.forEach((o) => {
      // 老订单没有 cookDate，回退用创建日期分组
      const date = o.cookDate || formatDate(o.createdAt)
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(o)
    })
    // 做菜日期降序：最近做的排在上面
    groups.value = Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, list]) => ({
        date,
        label: date,
        orders: list
      }))
  } catch (err: any) {
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
  }
}

const goBack = () => {
  uni.navigateBack()
}

const ratingOrder = ref<HistoryOrder | null>(null)
const ratingValue = ref(0)
const ratingImage = ref('')
const uploadingImage = ref(false)
const submittingRating = ref(false)
const privacyModal = ref<InstanceType<typeof PrivacyModal>>()

const openRating = (order: HistoryOrder) => {
  ratingOrder.value = order
  ratingValue.value = order.rating || 0
  ratingImage.value = order.ratingImage || ''
}

const setRating = (n: number) => {
  ratingValue.value = n
}

const cancelRating = () => {
  ratingOrder.value = null
  ratingValue.value = 0
  ratingImage.value = ''
}

const previewImage = (url: string) => {
  uni.previewImage({ urls: [url], current: url })
}

const chooseRatingImage = async () => {
  const agreed = await privacyModal.value?.ensurePrivacyAgreement()
  if (!agreed) return

  uni.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFiles?.[0]?.tempFilePath
      if (!tempFilePath) return
      uploadingImage.value = true
      try {
        uni.showLoading({ title: '上传中...' })
        ratingImage.value = await uploadToOSS(tempFilePath, 'order-ratings')
      } catch (err: any) {
        uni.showToast({ title: err.message || '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
        uploadingImage.value = false
      }
    },
    fail: (err) => {
      console.error('chooseMedia fail', err)
      if (err.errMsg?.includes('cancel')) return
      uni.showToast({ title: err.errMsg || '选择图片失败', icon: 'none' })
    }
  })
}

const confirmRating = async () => {
  if (!ratingOrder.value || ratingValue.value < 1 || uploadingImage.value) return
  submittingRating.value = true
  try {
    const user = await getCurrentUser()
    await updateOrderRating(
      ratingOrder.value.id,
      user.id,
      ratingValue.value,
      ratingImage.value || undefined
    )
    uni.showToast({ title: '评价已提交', icon: 'success' })
    cancelRating()
    await loadHistory()
  } catch (err: any) {
    uni.showToast({ title: err.message || '评价失败', icon: 'none' })
  } finally {
    submittingRating.value = false
  }
}

const goToDishDetail = (dish: HistoryDish) => {
  if (!dish.dishId) return
  uni.navigateTo({
    url: `/pages/dish-detail/index?id=${dish.dishId}&readonly=1`
  })
}

onShow(loadHistory)
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--theme-bg);
}

.header {
  display: flex;
  align-items: center;
  padding: 16px;
  padding-top: calc(16px + var(--status-bar-height));
  background: rgba(248, 245, 246, 0.8);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--theme-primary-light);
}

.back-btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
}

.title {
  flex: 1;
  text-align: center;
}

.title text {
  font-size: 18px;
  font-weight: 700;
}

.content {
  padding-bottom: 24px;
}

.date-group {
  padding: 16px 16px 0;
}

.date-header {
  margin-bottom: 12px;
}

.date-header text {
  font-size: 14px;
  font-weight: 600;
  color: #777;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--theme-primary-lightest);
  opacity: 0.85;
}

.order-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.order-meta {
  font-size: 12px;
  color: #777;
}

.order-dishes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dish-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.order-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.order-image {
  width: 100%;
  height: 100%;
}

.order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-name {
  font-size: 14px;
  font-weight: 600;
  color: #111;
}

.order-time {
  font-size: 12px;
  color: #777;
}

.order-action {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 600;
}

.order-action.done {
  background: #e5e7eb;
  color: #9ca3af;
}

.order-rating-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stars-display {
  display: flex;
  align-items: center;
  gap: 2px;
}

.order-action.rate {
  background: var(--theme-primary);
  color: white;
}

.rating-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
}

.rating-sheet {
  width: 100%;
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 24px 16px calc(24px + env(safe-area-inset-bottom));
}

.rating-title {
  text-align: center;
  margin-bottom: 24px;
}

.rating-title text {
  font-size: 18px;
  font-weight: 700;
  color: #111;
}

.rating-stars {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
}

.rating-image-section {
  margin-bottom: 24px;
}

.rating-image-picker {
  height: 96px;
  background: var(--theme-primary-lighter);
  border-radius: 12px;
  border: 2px dashed rgba(var(--theme-primary-rgb), 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.rating-image-picker text {
  font-size: 14px;
  font-weight: 500;
  color: var(--theme-primary);
}

.rating-image-preview {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 12px;
  overflow: hidden;
}

.rating-image-clear {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rating-image-card {
  margin-top: 12px;
  width: 96px;
  height: 96px;
  border-radius: 12px;
  overflow: hidden;
}

.rating-image {
  width: 100%;
  height: 100%;
}

.rating-actions {
  display: flex;
  gap: 12px;
}

.rating-btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.rating-btn.cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.rating-btn.confirm {
  background: var(--theme-primary);
  color: white;
}

.rating-btn.confirm.disabled {
  opacity: 0.5;
}
</style>
