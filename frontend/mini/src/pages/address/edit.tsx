import React, { useState, useEffect } from 'react'
import { View, Text, Input, Switch } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { userApi } from '@/api'
import { validateAddressForm } from '@/utils/validate'
import type { Address } from '@/types'
import './edit.scss'

export default function AddressEdit() {
  const router = useRouter()
  const { id } = router.params

  const isEdit = !!id

  const [form, setForm] = useState({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    is_default: false,
  })
  const [region, setRegion] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useLoad(() => {
    if (isEdit) {
      fetchAddress(Number(id))
    }
  })

  const fetchAddress = async (addressId: number) => {
    try {
      setLoading(true)
      const res = await userApi.getAddressDetail(addressId)
      setForm({
        name: res.name,
        phone: res.phone,
        province: res.province,
        city: res.city,
        district: res.district,
        detail: res.detail,
        is_default: res.is_default,
      })
      setRegion([res.province, res.city, res.district])
    } catch (error) {
      console.error('获取地址失败:', error)
      Taro.showToast({ title: '地址不存在', icon: 'none' })
      Taro.navigateBack()
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleRegionChange = (e: any) => {
    const { value } = e.detail
    setRegion(value)
    setForm((prev) => ({
      ...prev,
      province: value[0],
      city: value[1],
      district: value[2],
    }))
  }

  const handleSubmit = async () => {
    const validation = validateAddressForm(form)
    if (!validation.valid) {
      Taro.showToast({ title: validation.message!, icon: 'none' })
      return
    }

    try {
      setSubmitting(true)

      if (isEdit) {
        await userApi.updateAddress(Number(id), form)
        Taro.showToast({ title: '保存成功', icon: 'success' })
      } else {
        await userApi.addAddress(form)
        Taro.showToast({ title: '添加成功', icon: 'success' })
      }

      // 触发地址更新事件
      Taro.eventCenter.trigger('addressUpdated')

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('保存地址失败:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleGetPhoneNumber = (e: any) => {
    if (e.detail.code) {
      // 需要后端解密获取手机号
      Taro.showToast({ title: '获取手机号功能需要后端配合', icon: 'none' })
    }
  }

  if (loading) {
    return (
      <View className='address-edit__loading'>
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <View className='address-edit'>
      <View className='address-edit__form'>
        <View className='address-edit__field'>
          <Text className='address-edit__label'>收货人</Text>
          <Input
            className='address-edit__input'
            placeholder='请输入收货人姓名'
            value={form.name}
            onInput={(e) => handleInputChange('name', e.detail.value)}
          />
        </View>

        <View className='address-edit__field'>
          <Text className='address-edit__label'>手机号</Text>
          <Input
            className='address-edit__input'
            type='number'
            placeholder='请输入手机号'
            maxlength={11}
            value={form.phone}
            onInput={(e) => handleInputChange('phone', e.detail.value)}
          />
        </View>

        <View className='address-edit__field'>
          <Text className='address-edit__label'>所在地区</Text>
          <picker mode='region' value={region} onChange={handleRegionChange}>
            <View className='address-edit__picker'>
              <Text
                className={`address-edit__picker-text ${region.length === 0 ? 'address-edit__picker-text--placeholder' : ''}`}
              >
                {region.length > 0 ? region.join(' ') : '请选择省市区'}
              </Text>
              <Text className='address-edit__picker-arrow'>›</Text>
            </View>
          </picker>
        </View>

        <View className='address-edit__field address-edit__field--textarea'>
          <Text className='address-edit__label'>详细地址</Text>
          <Input
            className='address-edit__input'
            placeholder='请输入详细地址（街道、门牌号等）'
            value={form.detail}
            onInput={(e) => handleInputChange('detail', e.detail.value)}
          />
        </View>

        <View className='address-edit__field address-edit__field--switch'>
          <Text className='address-edit__label'>设为默认地址</Text>
          <Switch
            checked={form.is_default}
            color='#07c160'
            onChange={(e) => handleInputChange('is_default', e.detail.value)}
          />
        </View>
      </View>

      <View className='address-edit__footer'>
        <View
          className={`address-edit__submit ${submitting ? 'address-edit__submit--disabled' : ''}`}
          onClick={handleSubmit}
        >
          <Text className='address-edit__submit-text'>
            {submitting ? '保存中...' : '保存'}
          </Text>
        </View>
      </View>
    </View>
  )
}
