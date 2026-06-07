<template>
  <view class="container">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#333" />
      </view>
      <view class="title">
        <text>我的订单</text>
      </view>
    </view>

    <!-- Order Items -->
    <scroll-view scroll-y class="content">
      <view class="section-header">
        <text>已选菜品</text>
      </view>
      <view class="order-list">
        <view v-for="(item, index) in orderItems" :key="index" class="order-item">
          <view class="item-image" v-if="item.name === '手工披萨'" style="background: #e67e22;">
          </view>
          <view class="item-image" v-else-if="item.name === '新鲜佛陀碗'" style="background: #a8d5ba;">
          </view>
          <view class="item-image" v-else style="background: #f0b7a4;">
          </view>
          <view class="item-info">
            <text class="item-name">{{ item.name }}</text>
            <input class="remark-input" v-model="item.remark" placeholder="添加备注..." />
          </view>
          <view class="quantity-control">
            <view class="qty-btn qty-minus" @click="decreaseQty(index)">
              <uni-icons type="minus" size="24" color="#333" />
            </view>
            <text class="qty-number">{{ item.quantity }}</text>
            <view class="qty-btn qty-plus" @click="increaseQty(index)">
              <uni-icons type="plus" size="24" color="#333" />
            </view>
          </view>
        </view>
      </view>

      <!-- Spacer for fixed footer -->
      <view style="height: 120px;"></view>
    </scroll-view>

    <!-- Footer Summary -->
    <view class="footer">
      <view class="footer-content">
        <view class="summary">
          <text class="summary-label">合计</text>
          <text class="summary-value">共 {{ totalItems }} 道菜</text>
        </view>
        <view class="confirm-btn" @click="confirmOrder">
          <uni-icons type="shopping-cart-filled" size="20" color="#fff" />
          <text>确认下单</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'

interface OrderItem {
  name: string
  remark: string
  quantity: number
}

const orderItems = ref<OrderItem[]>([
  {
    name: '手工披萨',
    remark: '加芝士',
    quantity: 1
  },
  {
    name: '新鲜佛陀碗',
    remark: '多酱汁',
    quantity: 1
  },
  {
    name: '草莓奶昔',
    remark: '去冰',
    quantity: 1
  }
])

const totalItems = computed(() => orderItems.value.reduce((sum, item) => sum + item.quantity, 0))

const goBack = () => {
  uni.navigateBack()
}

const decreaseQty = (index: number) => {
  if (orderItems.value[index].quantity > 1) {
    orderItems.value[index].quantity--
  } else {
    orderItems.value.splice(index, 1)
  }
}

const increaseQty = (index: number) => {
  orderItems.value[index].quantity++
}

const confirmOrder = () => {
  uni.showToast({ title: '订单已提交', icon: 'success' })
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #F8F5F6;
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
  border-bottom: 1px solid rgba(255, 194, 204, 0.2);
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
  flex: 1;
  padding-bottom: 16px;
}

.section-header {
  padding: 16px;
}

.section-header text {
  font-size: 20px;
  font-weight: 700;
  color: #111;
}

.order-list {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 194, 204, 0.05);
}

.item-image {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  border: 1px solid rgba(255, 194, 204, 0.1);
  overflow: hidden;
  flex-shrink: 0;
}

.item-img {
  width: 100%;
  height: 100%;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: #111;
}

.remark-input {
  flex: 1;
  font-size: 14px;
  color: #333;
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  min-width: 100px;
  margin-top: 2px;
}

.remark-input:focus {
  outline: none;
  border-color: #ffc2cc;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qty-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-minus {
  background: rgba(255, 194, 204, 0.2);
}

.qty-plus {
  background: #ffc2cc;
}

.qty-number {
  font-size: 16px;
  font-weight: 600;
  color: #111;
  width: 16px;
  text-align: center;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.footer-content {
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid rgba(255, 194, 204, 0.1);
}

.summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.summary-label {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #111;
}

.confirm-btn {
  width: 100%;
  height: 56px;
  background: #ffc2cc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 194, 204, 0.3);
}
</style>
