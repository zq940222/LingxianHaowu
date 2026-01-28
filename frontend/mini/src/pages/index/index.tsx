import React, { useState, useEffect } from 'react'
import { View, Text, Image, Swiper, SwiperItem, ScrollView, Input } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import { ProductCard } from '@/components'
import { productApi, activityApi } from '@/api'
import { useCart } from '@/hooks'
import { usePagination } from '@/hooks/useRequest'
import { PAGES, PLACEHOLDER_IMAGE } from '@/constants'
import type { Product, Category, Activity } from '@/types'
import './index.scss'

interface Banner {
  id: number
  image: string
  link?: string
}

export default function Index() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [hotProducts, setHotProducts] = useState<Product[]>([])
  const [groupBuyProducts, setGroupBuyProducts] = useState<Product[]>([])
  const [activityPopup, setActivityPopup] = useState<Activity | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const { addToCart } = useCart()

  // 推荐商品分页
  const {
    list: recommendedProducts,
    loading,
    hasMore,
    run: loadRecommended,
    loadMore,
  } = usePagination(
    (params) => productApi.getProductList({ ...params, is_recommended: true }),
    { manual: true }
  )

  // 初始化加载
  useLoad(() => {
    fetchData()
  })

  // 下拉刷新
  usePullDownRefresh(async () => {
    await fetchData()
    Taro.stopPullDownRefresh()
  })

  // 上拉加载更多
  useReachBottom(() => {
    if (hasMore && !loading) {
      loadMore()
    }
  })

  const fetchData = async () => {
    try {
      const [bannersRes, categoriesRes, hotRes, groupBuyRes, popupRes] = await Promise.all([
        productApi.getHomeBanners().catch(() => []),
        productApi.getCategoryList().catch(() => []),
        productApi.getHotProducts({ page_size: 6 }).catch(() => ({ items: [] })),
        productApi.getGroupBuyProducts({ page_size: 4 }).catch(() => ({ items: [] })),
        activityApi.getActivityPopup().catch(() => null),
      ])

      setBanners(bannersRes)
      setCategories(categoriesRes.slice(0, 8))
      setHotProducts(hotRes.items)
      setGroupBuyProducts(groupBuyRes.items)

      // 显示活动弹窗
      if (popupRes) {
        setActivityPopup(popupRes)
        setShowPopup(true)
      }

      // 加载推荐商品
      loadRecommended()
    } catch (error) {
      console.error('加载首页数据失败:', error)
    }
  }

  const handleSearch = () => {
    if (!searchValue.trim()) return
    Taro.navigateTo({
      url: `${PAGES.PRODUCT_LIST}?keyword=${encodeURIComponent(searchValue)}`,
    })
  }

  const handleBannerClick = (banner: Banner) => {
    if (banner.link) {
      // 根据链接类型跳转
      if (banner.link.startsWith('/pages')) {
        Taro.navigateTo({ url: banner.link })
      } else if (banner.link.startsWith('http')) {
        Taro.navigateTo({
          url: `/pages/webview/index?url=${encodeURIComponent(banner.link)}`,
        })
      }
    }
  }

  const handleCategoryClick = (category: Category) => {
    Taro.navigateTo({
      url: `${PAGES.PRODUCT_LIST}?categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}`,
    })
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1)
  }

  const handleClosePopup = () => {
    setShowPopup(false)
  }

  const handlePopupClick = () => {
    if (activityPopup?.link) {
      setShowPopup(false)
      Taro.navigateTo({ url: activityPopup.link })
    }
  }

  return (
    <View className='index'>
      {/* 搜索栏 */}
      <View className='index__search'>
        <View className='index__search-bar'>
          <Text className='index__search-icon'>🔍</Text>
          <Input
            className='index__search-input'
            placeholder='搜索商品'
            value={searchValue}
            onInput={(e) => setSearchValue(e.detail.value)}
            onConfirm={handleSearch}
          />
        </View>
      </View>

      <ScrollView scrollY className='index__content'>
        {/* Banner轮播 */}
        {banners.length > 0 && (
          <Swiper
            className='index__banner'
            indicatorDots
            indicatorColor='rgba(255,255,255,0.5)'
            indicatorActiveColor='#fff'
            autoplay
            circular
          >
            {banners.map((banner) => (
              <SwiperItem key={banner.id} onClick={() => handleBannerClick(banner)}>
                <Image
                  className='index__banner-image'
                  src={banner.image}
                  mode='aspectFill'
                />
              </SwiperItem>
            ))}
          </Swiper>
        )}

        {/* 分类快捷入口 */}
        {categories.length > 0 && (
          <View className='index__categories'>
            {categories.map((category) => (
              <View
                key={category.id}
                className='index__category-item'
                onClick={() => handleCategoryClick(category)}
              >
                <Image
                  className='index__category-icon'
                  src={category.icon || PLACEHOLDER_IMAGE}
                  mode='aspectFill'
                />
                <Text className='index__category-name'>{category.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 拼团商品入口 */}
        {groupBuyProducts.length > 0 && (
          <View className='index__section'>
            <View className='index__section-header'>
              <View className='index__section-title'>
                <Text className='index__section-title-text'>限时拼团</Text>
                <View className='index__section-tag'>
                  <Text className='index__section-tag-text'>超值特惠</Text>
                </View>
              </View>
              <View
                className='index__section-more'
                onClick={() => Taro.navigateTo({ url: `${PAGES.PRODUCT_LIST}?type=groupbuy` })}
              >
                <Text className='index__section-more-text'>更多</Text>
                <Text className='index__section-more-icon'>›</Text>
              </View>
            </View>
            <ScrollView scrollX className='index__groupbuy-list'>
              {groupBuyProducts.map((product) => (
                <View
                  key={product.id}
                  className='index__groupbuy-item'
                  onClick={() => Taro.navigateTo({ url: `${PAGES.PRODUCT_DETAIL}?id=${product.id}` })}
                >
                  <Image
                    className='index__groupbuy-image'
                    src={product.cover_image || PLACEHOLDER_IMAGE}
                    mode='aspectFill'
                  />
                  <Text className='index__groupbuy-name'>{product.name}</Text>
                  <View className='index__groupbuy-price'>
                    <Text className='index__groupbuy-price-current'>¥{product.group_buy_price}</Text>
                    <Text className='index__groupbuy-price-original'>¥{product.price}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 热卖商品 */}
        {hotProducts.length > 0 && (
          <View className='index__section'>
            <View className='index__section-header'>
              <View className='index__section-title'>
                <Text className='index__section-title-text'>热卖榜单</Text>
                <View className='index__section-tag index__section-tag--hot'>
                  <Text className='index__section-tag-text'>🔥爆款</Text>
                </View>
              </View>
              <View
                className='index__section-more'
                onClick={() => Taro.navigateTo({ url: `${PAGES.PRODUCT_LIST}?type=hot` })}
              >
                <Text className='index__section-more-text'>更多</Text>
                <Text className='index__section-more-icon'>›</Text>
              </View>
            </View>
            <View className='index__hot-list'>
              {hotProducts.slice(0, 3).map((product, index) => (
                <View
                  key={product.id}
                  className='index__hot-item'
                  onClick={() => Taro.navigateTo({ url: `${PAGES.PRODUCT_DETAIL}?id=${product.id}` })}
                >
                  <View className={`index__hot-rank index__hot-rank--${index + 1}`}>
                    <Text className='index__hot-rank-text'>{index + 1}</Text>
                  </View>
                  <Image
                    className='index__hot-image'
                    src={product.cover_image || PLACEHOLDER_IMAGE}
                    mode='aspectFill'
                  />
                  <View className='index__hot-info'>
                    <Text className='index__hot-name'>{product.name}</Text>
                    <Text className='index__hot-sales'>已售{product.sales}件</Text>
                    <Text className='index__hot-price'>¥{product.price}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 推荐商品 */}
        <View className='index__section'>
          <View className='index__section-header'>
            <View className='index__section-title'>
              <Text className='index__section-title-text'>为你推荐</Text>
            </View>
          </View>
          <View className='index__products'>
            {recommendedProducts.map((product) => (
              <View key={product.id} className='index__product-item'>
                <ProductCard
                  product={product}
                  mode='grid'
                  onAddCart={handleAddToCart}
                />
              </View>
            ))}
          </View>
          {loading && (
            <View className='index__loading'>
              <Text className='index__loading-text'>加载中...</Text>
            </View>
          )}
          {!hasMore && recommendedProducts.length > 0 && (
            <View className='index__no-more'>
              <Text className='index__no-more-text'>— 没有更多了 —</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 活动弹窗 */}
      {showPopup && activityPopup && (
        <View className='index__popup'>
          <View className='index__popup-mask' onClick={handleClosePopup} />
          <View className='index__popup-content'>
            <Image
              className='index__popup-image'
              src={activityPopup.image}
              mode='widthFix'
              onClick={handlePopupClick}
            />
            <View className='index__popup-close' onClick={handleClosePopup}>
              <Text className='index__popup-close-icon'>×</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
