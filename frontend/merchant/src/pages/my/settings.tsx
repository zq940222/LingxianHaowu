import React, { useState, useEffect } from 'react'
import { View, Text, Input, Switch, Image } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { Loading } from '@/components'
import { merchantApi } from '@/api'
import { useMerchantStore } from '@/stores'
import { PLACEHOLDER_IMAGE } from '@/constants'
import './settings.scss'

export default function Settings() {
  const { merchant, fetchMerchantInfo } = useMerchantStore()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    store_name: '',
    store_address: '',
    phone: '',
  })

  const [settings, setSettings] = useState({
    auto_confirm: false,
    notify_new_order: true,
    notify_refund: true,
  })

  useLoad(() => {
    if (merchant) {
      setForm({
        store_name: merchant.store_name || '',
        store_address: merchant.store_address || '',
        phone: merchant.phone || '',
      })
    }
    fetchSettings()
  })

  const fetchSettings = async () => {
    try {
      const data = await merchantApi.getSettings()
      setSettings(data)
    } catch (error) {
      console.error('获取设置失败:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setForm({ ...form, [field]: value })
  }

  const handleSettingChange = async (field: string, value: boolean) => {
    const newSettings = { ...settings, [field]: value }
    setSettings(newSettings)

    try {
      await merchantApi.updateSettings({ [field]: value })
    } catch (error) {
      console.error('更新设置失败:', error)
      // 回滚
      setSettings(settings)
    }
  }

  const handleSave = async () => {
    if (!form.store_name.trim()) {
      Taro.showToast({ title: '请输入店铺名称', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      await merchantApi.updateMerchantInfo({
        store_name: form.store_name.trim(),
        store_address: form.store_address.trim(),
        phone: form.phone.trim(),
      })
      await fetchMerchantInfo()
      Taro.showToast({ title: '保存成功', icon: 'success' })
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleChooseAvatar = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })

      Taro.showLoading({ title: '上传中...' })
      // 上传头像逻辑...
      Taro.hideLoading()
      Taro.showToast({ title: '暂不支持', icon: 'none' })
    } catch (error) {
      console.error('选择图片失败:', error)
    }
  }

  return (
    <View className='settings'>
      {/* 店铺信息 */}
      <View className='settings__section'>
        <Text className='settings__section-title'>店铺信息</Text>

        <View className='settings__avatar-field' onClick={handleChooseAvatar}>
          <Text className='settings__label'>店铺头像</Text>
          <View className='settings__avatar-right'>
            <Image
              className='settings__avatar'
              src={merchant?.avatar || PLACEHOLDER_IMAGE}
              mode='aspectFill'
            />
            <Text className='settings__arrow'>›</Text>
          </View>
        </View>

        <View className='settings__field'>
          <Text className='settings__label'>店铺名称</Text>
          <Input
            className='settings__input'
            placeholder='请输入店铺名称'
            value={form.store_name}
            onInput={(e) => handleInputChange('store_name', e.detail.value)}
          />
        </View>

        <View className='settings__field'>
          <Text className='settings__label'>店铺地址</Text>
          <Input
            className='settings__input'
            placeholder='请输入店铺地址'
            value={form.store_address}
            onInput={(e) => handleInputChange('store_address', e.detail.value)}
          />
        </View>

        <View className='settings__field'>
          <Text className='settings__label'>联系电话</Text>
          <Input
            className='settings__input'
            type='number'
            placeholder='请输入联系电话'
            value={form.phone}
            onInput={(e) => handleInputChange('phone', e.detail.value)}
          />
        </View>
      </View>

      {/* 订单设置 */}
      <View className='settings__section'>
        <Text className='settings__section-title'>订单设置</Text>

        <View className='settings__switch-field'>
          <View className='settings__switch-left'>
            <Text className='settings__label'>自动接单</Text>
            <Text className='settings__desc'>开启后新订单将自动确认</Text>
          </View>
          <Switch
            checked={settings.auto_confirm}
            onChange={(e) => handleSettingChange('auto_confirm', e.detail.value)}
            color='#1890ff'
          />
        </View>
      </View>

      {/* 通知设置 */}
      <View className='settings__section'>
        <Text className='settings__section-title'>通知设置</Text>

        <View className='settings__switch-field'>
          <View className='settings__switch-left'>
            <Text className='settings__label'>新订单通知</Text>
            <Text className='settings__desc'>有新订单时推送通知</Text>
          </View>
          <Switch
            checked={settings.notify_new_order}
            onChange={(e) => handleSettingChange('notify_new_order', e.detail.value)}
            color='#1890ff'
          />
        </View>

        <View className='settings__switch-field'>
          <View className='settings__switch-left'>
            <Text className='settings__label'>退款通知</Text>
            <Text className='settings__desc'>有退款申请时推送通知</Text>
          </View>
          <Switch
            checked={settings.notify_refund}
            onChange={(e) => handleSettingChange('notify_refund', e.detail.value)}
            color='#1890ff'
          />
        </View>
      </View>

      {/* 保存按钮 */}
      <View className='settings__footer safe-area-bottom'>
        <View className='settings__save' onClick={handleSave}>
          <Text className='settings__save-text'>
            {saving ? '保存中...' : '保存'}
          </Text>
        </View>
      </View>

      {saving && <Loading fullScreen text='保存中...' />}
    </View>
  )
}
