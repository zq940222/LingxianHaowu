import React, { useState, useEffect } from 'react'
import { View, Text, Input, Textarea, Image, Switch, Picker } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { Loading } from '@/components'
import { productApi } from '@/api'
import { priceToYuan, formatPriceYuan } from '@/utils/format'
import { PLACEHOLDER_IMAGE } from '@/constants'
import type { Product, Category } from '@/types'
import './edit.scss'

export default function ProductEdit() {
  const router = useRouter()
  const productId = router.params.id ? Number(router.params.id) : null
  const isEdit = !!productId

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    category_id: 0,
    stock: '',
    unit: '份',
    is_on_sale: true,
    is_hot: false,
    is_recommended: false,
    cover_image: '',
    images: [] as string[],
  })

  useLoad(() => {
    fetchCategories()
    if (isEdit) {
      fetchProduct()
    }
  })

  const fetchCategories = async () => {
    try {
      const data = await productApi.getCategoryList()
      setCategories(data)
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  const fetchProduct = async () => {
    if (!productId) return

    setLoading(true)
    try {
      const product = await productApi.getProductDetail(productId)
      setForm({
        name: product.name,
        description: product.description || '',
        price: String(priceToYuan(product.price)),
        original_price: product.original_price ? String(priceToYuan(product.original_price)) : '',
        category_id: product.category_id,
        stock: String(product.stock),
        unit: product.unit || '份',
        is_on_sale: product.is_on_sale,
        is_hot: product.is_hot,
        is_recommended: product.is_recommended,
        cover_image: product.cover_image || '',
        images: product.images || [],
      })
    } catch (error) {
      console.error('获取商品详情失败:', error)
      Taro.showToast({ title: '获取商品失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setForm({ ...form, [field]: value })
  }

  const handleCategoryChange = (e: any) => {
    const index = Number(e.detail.value)
    if (categories[index]) {
      setForm({ ...form, category_id: categories[index].id })
    }
  }

  const handleChooseImage = async (type: 'cover' | 'images') => {
    try {
      const res = await Taro.chooseImage({
        count: type === 'cover' ? 1 : 9 - form.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })

      for (const tempFilePath of res.tempFilePaths) {
        Taro.showLoading({ title: '上传中...' })
        try {
          const uploadRes = await productApi.uploadProductImage(tempFilePath)
          if (type === 'cover') {
            setForm({ ...form, cover_image: uploadRes.url })
          } else {
            setForm({ ...form, images: [...form.images, uploadRes.url] })
          }
        } catch (error) {
          console.error('上传失败:', error)
          Taro.showToast({ title: '上传失败', icon: 'none' })
        } finally {
          Taro.hideLoading()
        }
      }
    } catch (error) {
      console.error('选择图片失败:', error)
    }
  }

  const handleRemoveImage = (index: number) => {
    const images = [...form.images]
    images.splice(index, 1)
    setForm({ ...form, images })
  }

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      Taro.showToast({ title: '请输入商品名称', icon: 'none' })
      return false
    }
    if (!form.price || Number(form.price) <= 0) {
      Taro.showToast({ title: '请输入有效价格', icon: 'none' })
      return false
    }
    if (!form.category_id) {
      Taro.showToast({ title: '请选择商品分类', icon: 'none' })
      return false
    }
    if (!form.stock || Number(form.stock) < 0) {
      Taro.showToast({ title: '请输入有效库存', icon: 'none' })
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Math.round(Number(form.price) * 100), // 转为分
        original_price: form.original_price ? Math.round(Number(form.original_price) * 100) : undefined,
        category_id: form.category_id,
        stock: Number(form.stock),
        unit: form.unit,
        is_on_sale: form.is_on_sale,
        is_hot: form.is_hot,
        is_recommended: form.is_recommended,
        cover_image: form.cover_image,
        images: form.images,
      }

      if (isEdit && productId) {
        await productApi.updateProduct(productId, data)
        Taro.showToast({ title: '保存成功', icon: 'success' })
      } else {
        await productApi.createProduct(data)
        Taro.showToast({ title: '创建成功', icon: 'success' })
      }

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!productId) return

    Taro.showModal({
      title: '删除商品',
      content: '确定要删除此商品吗？删除后不可恢复。',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await productApi.deleteProduct(productId)
            Taro.showToast({ title: '删除成功', icon: 'success' })
            setTimeout(() => {
              Taro.navigateBack()
            }, 1500)
          } catch (error) {
            console.error('删除失败:', error)
          }
        }
      },
    })
  }

  const getCategoryName = (): string => {
    const category = categories.find((c) => c.id === form.category_id)
    return category ? category.name : '请选择分类'
  }

  const getCategoryIndex = (): number => {
    return categories.findIndex((c) => c.id === form.category_id)
  }

  if (loading) {
    return <Loading fullScreen text='加载中...' />
  }

  return (
    <View className='product-edit'>
      {/* 封面图 */}
      <View className='product-edit__section'>
        <Text className='product-edit__section-title'>商品封面</Text>
        <View className='product-edit__cover' onClick={() => handleChooseImage('cover')}>
          {form.cover_image ? (
            <Image
              className='product-edit__cover-image'
              src={form.cover_image}
              mode='aspectFill'
            />
          ) : (
            <View className='product-edit__cover-placeholder'>
              <Text className='product-edit__cover-icon'>+</Text>
              <Text className='product-edit__cover-text'>添加封面图</Text>
            </View>
          )}
        </View>
      </View>

      {/* 基本信息 */}
      <View className='product-edit__section'>
        <Text className='product-edit__section-title'>基本信息</Text>

        <View className='product-edit__field'>
          <Text className='product-edit__label'>商品名称</Text>
          <Input
            className='product-edit__input'
            placeholder='请输入商品名称'
            value={form.name}
            onInput={(e) => handleInputChange('name', e.detail.value)}
          />
        </View>

        <View className='product-edit__field'>
          <Text className='product-edit__label'>商品描述</Text>
          <Textarea
            className='product-edit__textarea'
            placeholder='请输入商品描述（选填）'
            value={form.description}
            onInput={(e) => handleInputChange('description', e.detail.value)}
          />
        </View>

        <View className='product-edit__field'>
          <Text className='product-edit__label'>商品分类</Text>
          <Picker
            mode='selector'
            range={categories}
            rangeKey='name'
            value={getCategoryIndex()}
            onChange={handleCategoryChange}
          >
            <View className='product-edit__picker'>
              <Text className='product-edit__picker-text'>{getCategoryName()}</Text>
              <Text className='product-edit__picker-arrow'>›</Text>
            </View>
          </Picker>
        </View>
      </View>

      {/* 价格库存 */}
      <View className='product-edit__section'>
        <Text className='product-edit__section-title'>价格库存</Text>

        <View className='product-edit__field'>
          <Text className='product-edit__label'>销售价格(元)</Text>
          <Input
            className='product-edit__input'
            type='digit'
            placeholder='请输入价格'
            value={form.price}
            onInput={(e) => handleInputChange('price', e.detail.value)}
          />
        </View>

        <View className='product-edit__field'>
          <Text className='product-edit__label'>原价(元)</Text>
          <Input
            className='product-edit__input'
            type='digit'
            placeholder='选填，用于显示划线价'
            value={form.original_price}
            onInput={(e) => handleInputChange('original_price', e.detail.value)}
          />
        </View>

        <View className='product-edit__field'>
          <Text className='product-edit__label'>库存</Text>
          <Input
            className='product-edit__input'
            type='number'
            placeholder='请输入库存数量'
            value={form.stock}
            onInput={(e) => handleInputChange('stock', e.detail.value)}
          />
        </View>

        <View className='product-edit__field'>
          <Text className='product-edit__label'>单位</Text>
          <Input
            className='product-edit__input'
            placeholder='如：份、斤、个'
            value={form.unit}
            onInput={(e) => handleInputChange('unit', e.detail.value)}
          />
        </View>
      </View>

      {/* 商品图片 */}
      <View className='product-edit__section'>
        <Text className='product-edit__section-title'>商品图片</Text>
        <View className='product-edit__images'>
          {form.images.map((image, index) => (
            <View key={index} className='product-edit__image-item'>
              <Image
                className='product-edit__image'
                src={image}
                mode='aspectFill'
              />
              <View
                className='product-edit__image-delete'
                onClick={() => handleRemoveImage(index)}
              >
                <Text className='product-edit__image-delete-icon'>×</Text>
              </View>
            </View>
          ))}
          {form.images.length < 9 && (
            <View
              className='product-edit__image-add'
              onClick={() => handleChooseImage('images')}
            >
              <Text className='product-edit__image-add-icon'>+</Text>
            </View>
          )}
        </View>
      </View>

      {/* 商品设置 */}
      <View className='product-edit__section'>
        <Text className='product-edit__section-title'>商品设置</Text>

        <View className='product-edit__switch-field'>
          <Text className='product-edit__label'>上架销售</Text>
          <Switch
            checked={form.is_on_sale}
            onChange={(e) => handleInputChange('is_on_sale', e.detail.value)}
            color='#1890ff'
          />
        </View>

        <View className='product-edit__switch-field'>
          <Text className='product-edit__label'>热卖标签</Text>
          <Switch
            checked={form.is_hot}
            onChange={(e) => handleInputChange('is_hot', e.detail.value)}
            color='#1890ff'
          />
        </View>

        <View className='product-edit__switch-field'>
          <Text className='product-edit__label'>推荐标签</Text>
          <Switch
            checked={form.is_recommended}
            onChange={(e) => handleInputChange('is_recommended', e.detail.value)}
            color='#1890ff'
          />
        </View>
      </View>

      {/* 底部操作 */}
      <View className='product-edit__footer safe-area-bottom'>
        {isEdit && (
          <View className='product-edit__delete' onClick={handleDelete}>
            <Text className='product-edit__delete-text'>删除商品</Text>
          </View>
        )}
        <View
          className='product-edit__save'
          onClick={handleSave}
        >
          <Text className='product-edit__save-text'>
            {saving ? '保存中...' : '保存'}
          </Text>
        </View>
      </View>

      {saving && <Loading fullScreen text='保存中...' />}
    </View>
  )
}
