import React, { useState, useEffect } from 'react'
import { View, Text, Image, Swiper, SwiperItem, ScrollView } from '@tarojs/components'
import Taro, { useLoad, useRouter, useShareAppMessage } from '@tarojs/taro'
import { Loading } from '@/components'
import { productApi } from '@/api'
import { useCart, useAuth } from '@/hooks'
import { formatPriceYuan, formatCount } from '@/utils/format'
import { PAGES, PLACEHOLDER_IMAGE } from '@/constants'
import type { ProductDetail as ProductDetailType } from '@/types'
import './detail.scss'

export default function ProductDetail() {
  const router = useRouter()
  const { id } = router.params

  const [product, setProduct] = useState<ProductDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImage, setCurrentImage] = useState(0)
  const [showSpecPopup, setShowSpecPopup] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [action, setAction] = useState<'cart' | 'buy'>('cart')

  const { addToCart, totalCount } = useCart()
  const { checkLogin } = useAuth()

  useLoad(() => {
    if (id) {
      fetchProduct(Number(id))
    }
  })

  // 分享
  useShareAppMessage(() => ({
    title: product?.name || '灵鲜好物',
    path: `${PAGES.PRODUCT_DETAIL}?id=${id}`,
    imageUrl: product?.cover_image,
  }))

  const fetchProduct = async (productId: number) => {
    try {
      setLoading(true)
      const res = await productApi.getProductDetail(productId)
      setProduct(res)
    } catch (error) {
      console.error('获取商品详情失败:', error)
      Taro.showToast({ title: '商品不存在', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleShowSpec = (type: 'cart' | 'buy') => {
    setAction(type)
    setShowSpecPopup(true)
  }

  const handleCloseSpec = () => {
    setShowSpecPopup(false)
    setQuantity(1)
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity < 1) return
    if (product && newQuantity > product.stock) {
      Taro.showToast({ title: '库存不足', icon: 'none' })
      return
    }
    setQuantity(newQuantity)
  }

  const handleConfirm = async () => {
    if (!product) return

    if (action === 'cart') {
      await addToCart(product, quantity)
      handleCloseSpec()
    } else {
      if (!checkLogin()) return

      // 跳转到确认订单页面
      const orderItem = {
        product_id: product.id,
        quantity,
        product: product,
      }

      Taro.setStorageSync('orderItems', [orderItem])
      Taro.navigateTo({ url: PAGES.ORDER_CONFIRM })
      handleCloseSpec()
    }
  }

  const handleGoCart = () => {
    Taro.switchTab({ url: PAGES.CART })
  }

  if (loading) {
    return <Loading fullscreen />
  }

  if (!product) {
    return (
      <View className='product-detail__empty'>
        <Text>商品不存在</Text>
      </View>
    )
  }

  const images = product.images?.length > 0 ? product.images : [product.cover_image || PLACEHOLDER_IMAGE]

  return (
    <View className='product-detail'>
      <ScrollView scrollY className='product-detail__content'>
        {/* 商品图片轮播 */}
        <Swiper
          className='product-detail__swiper'
          indicatorDots={false}
          autoplay
          circular
          onChange={(e) => setCurrentImage(e.detail.current)}
        >
          {images.map((image, index) => (
            <SwiperItem key={index}>
              <Image
                className='product-detail__image'
                src={image}
                mode='aspectFill'
                onClick={() => {
                  Taro.previewImage({
                    current: image,
                    urls: images,
                  })
                }}
              />
            </SwiperItem>
          ))}
        </Swiper>
        <View className='product-detail__indicator'>
          <Text className='product-detail__indicator-text'>
            {currentImage + 1}/{images.length}
          </Text>
        </View>

        {/* 商品信息 */}
        <View className='product-detail__info'>
          <View className='product-detail__price-row'>
            <View className='product-detail__price-wrapper'>
              {product.group_buy_price ? (
                <>
                  <Text className='product-detail__price'>
                    {formatPriceYuan(product.group_buy_price)}
                  </Text>
                  <View className='product-detail__group-tag'>
                    <Text className='product-detail__group-tag-text'>拼团价</Text>
                  </View>
                  <Text className='product-detail__original-price'>
                    {formatPriceYuan(product.price)}
                  </Text>
                </>
              ) : (
                <>
                  <Text className='product-detail__price'>
                    {formatPriceYuan(product.price)}
                  </Text>
                  {product.original_price > product.price && (
                    <Text className='product-detail__original-price'>
                      {formatPriceYuan(product.original_price)}
                    </Text>
                  )}
                </>
              )}
            </View>
            <Text className='product-detail__sales'>
              已售{formatCount(product.sales)}
            </Text>
          </View>

          <Text className='product-detail__name'>{product.name}</Text>

          {product.description && (
            <Text className='product-detail__desc'>{product.description}</Text>
          )}

          <View className='product-detail__tags'>
            {product.is_hot && (
              <View className='product-detail__tag product-detail__tag--hot'>
                <Text className='product-detail__tag-text'>热卖</Text>
              </View>
            )}
            {product.is_recommended && (
              <View className='product-detail__tag product-detail__tag--recommended'>
                <Text className='product-detail__tag-text'>推荐</Text>
              </View>
            )}
            {product.group_buy_price && (
              <View className='product-detail__tag product-detail__tag--groupbuy'>
                <Text className='product-detail__tag-text'>可拼团</Text>
              </View>
            )}
          </View>
        </View>

        {/* 规格选择 */}
        <View className='product-detail__spec' onClick={() => handleShowSpec('cart')}>
          <Text className='product-detail__spec-label'>规格</Text>
          <Text className='product-detail__spec-value'>
            {product.unit || '请选择规格'}
          </Text>
          <Text className='product-detail__spec-arrow'>›</Text>
        </View>

        {/* 商品详情 */}
        <View className='product-detail__detail'>
          <View className='product-detail__detail-header'>
            <Text className='product-detail__detail-title'>商品详情</Text>
          </View>
          <View className='product-detail__detail-content'>
            {product.description || '暂无详情'}
          </View>
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className='product-detail__footer'>
        <View className='product-detail__footer-actions'>
          <View className='product-detail__footer-item' onClick={handleGoCart}>
            <Text className='product-detail__footer-icon'>🛒</Text>
            <Text className='product-detail__footer-text'>购物车</Text>
            {totalCount > 0 && (
              <View className='product-detail__footer-badge'>
                <Text className='product-detail__footer-badge-text'>
                  {totalCount > 99 ? '99+' : totalCount}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View className='product-detail__footer-buttons'>
          <View
            className='product-detail__footer-btn product-detail__footer-btn--cart'
            onClick={() => handleShowSpec('cart')}
          >
            <Text className='product-detail__footer-btn-text'>加入购物车</Text>
          </View>
          <View
            className='product-detail__footer-btn product-detail__footer-btn--buy'
            onClick={() => handleShowSpec('buy')}
          >
            <Text className='product-detail__footer-btn-text'>立即购买</Text>
          </View>
        </View>
      </View>

      {/* 规格选择弹窗 */}
      {showSpecPopup && (
        <View className='product-detail__popup'>
          <View className='product-detail__popup-mask' onClick={handleCloseSpec} />
          <View className='product-detail__popup-content'>
            <View className='product-detail__popup-header'>
              <Image
                className='product-detail__popup-image'
                src={product.cover_image || PLACEHOLDER_IMAGE}
                mode='aspectFill'
              />
              <View className='product-detail__popup-info'>
                <Text className='product-detail__popup-price'>
                  {formatPriceYuan(product.group_buy_price || product.price)}
                </Text>
                <Text className='product-detail__popup-stock'>
                  库存: {product.stock}
                </Text>
              </View>
              <View className='product-detail__popup-close' onClick={handleCloseSpec}>
                <Text className='product-detail__popup-close-icon'>×</Text>
              </View>
            </View>

            <View className='product-detail__popup-spec'>
              <Text className='product-detail__popup-spec-label'>规格</Text>
              <View className='product-detail__popup-spec-value'>
                <Text className='product-detail__popup-spec-text'>
                  {product.unit || '默认规格'}
                </Text>
              </View>
            </View>

            <View className='product-detail__popup-quantity'>
              <Text className='product-detail__popup-quantity-label'>数量</Text>
              <View className='product-detail__popup-quantity-control'>
                <View
                  className={`product-detail__popup-quantity-btn ${quantity <= 1 ? 'product-detail__popup-quantity-btn--disabled' : ''}`}
                  onClick={() => handleQuantityChange(-1)}
                >
                  <Text className='product-detail__popup-quantity-btn-text'>-</Text>
                </View>
                <Text className='product-detail__popup-quantity-value'>{quantity}</Text>
                <View
                  className='product-detail__popup-quantity-btn'
                  onClick={() => handleQuantityChange(1)}
                >
                  <Text className='product-detail__popup-quantity-btn-text'>+</Text>
                </View>
              </View>
            </View>

            <View className='product-detail__popup-footer'>
              <View
                className={`product-detail__popup-confirm ${action === 'buy' ? 'product-detail__popup-confirm--buy' : ''}`}
                onClick={handleConfirm}
              >
                <Text className='product-detail__popup-confirm-text'>
                  {action === 'cart' ? '加入购物车' : '立即购买'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
