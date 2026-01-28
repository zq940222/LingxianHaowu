import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { EmptyState } from '@/components'
import { useUserStore } from '@/stores'
import { userApi } from '@/api'
import { formatAddress, formatPhone } from '@/utils/format'
import { PAGES } from '@/constants'
import './list.scss'

export default function AddressList() {
  const { addresses, fetchAddresses } = useUserStore()

  useDidShow(() => {
    fetchAddresses()
  })

  const handleAddAddress = () => {
    Taro.navigateTo({ url: PAGES.ADDRESS_EDIT })
  }

  const handleEditAddress = (id: number) => {
    Taro.navigateTo({ url: `${PAGES.ADDRESS_EDIT}?id=${id}` })
  }

  const handleSetDefault = async (id: number) => {
    try {
      await userApi.setDefaultAddress(id)
      Taro.showToast({ title: '设置成功', icon: 'success' })
      fetchAddresses()
    } catch (error) {
      console.error('设置默认地址失败:', error)
    }
  }

  const handleDeleteAddress = (id: number) => {
    Taro.showModal({
      title: '提示',
      content: '确定要删除该地址吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await userApi.deleteAddress(id)
            Taro.showToast({ title: '删除成功', icon: 'success' })
            fetchAddresses()
          } catch (error) {
            console.error('删除地址失败:', error)
          }
        }
      },
    })
  }

  if (addresses.length === 0) {
    return (
      <View className='address-list address-list--empty'>
        <EmptyState
          icon='address'
          title='暂无收货地址'
          description='添加收货地址，方便配送商品'
          buttonText='添加地址'
          onButtonClick={handleAddAddress}
        />
      </View>
    )
  }

  return (
    <View className='address-list'>
      <View className='address-list__content'>
        {addresses.map((address) => (
          <View key={address.id} className='address-list__item'>
            <View
              className='address-list__item-main'
              onClick={() => handleEditAddress(address.id)}
            >
              <View className='address-list__item-header'>
                <Text className='address-list__item-name'>{address.name}</Text>
                <Text className='address-list__item-phone'>
                  {formatPhone(address.phone)}
                </Text>
                {address.is_default && (
                  <View className='address-list__item-default'>
                    <Text className='address-list__item-default-text'>默认</Text>
                  </View>
                )}
              </View>
              <Text className='address-list__item-address'>
                {formatAddress(address)}
              </Text>
            </View>

            <View className='address-list__item-actions'>
              {!address.is_default && (
                <View
                  className='address-list__item-action'
                  onClick={() => handleSetDefault(address.id)}
                >
                  <Text className='address-list__item-action-icon'>○</Text>
                  <Text className='address-list__item-action-text'>设为默认</Text>
                </View>
              )}
              <View
                className='address-list__item-action'
                onClick={() => handleEditAddress(address.id)}
              >
                <Text className='address-list__item-action-icon'>✎</Text>
                <Text className='address-list__item-action-text'>编辑</Text>
              </View>
              <View
                className='address-list__item-action'
                onClick={() => handleDeleteAddress(address.id)}
              >
                <Text className='address-list__item-action-icon'>🗑</Text>
                <Text className='address-list__item-action-text'>删除</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View className='address-list__footer'>
        <View className='address-list__add' onClick={handleAddAddress}>
          <Text className='address-list__add-icon'>+</Text>
          <Text className='address-list__add-text'>新增收货地址</Text>
        </View>
      </View>
    </View>
  )
}
