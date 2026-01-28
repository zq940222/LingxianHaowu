import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/stores'
import { formatAddress, formatPhone } from '@/utils/format'
import { PAGES } from '@/constants'
import type { Address } from '@/types'
import './index.scss'

interface AddressSelectorProps {
  visible: boolean
  selected?: Address | null
  onSelect: (address: Address) => void
  onClose: () => void
}

export default function AddressSelector({
  visible,
  selected,
  onSelect,
  onClose,
}: AddressSelectorProps) {
  const { addresses, fetchAddresses } = useUserStore()

  const handleSelect = (address: Address) => {
    onSelect(address)
    onClose()
  }

  const handleAddAddress = () => {
    onClose()
    Taro.navigateTo({
      url: PAGES.ADDRESS_EDIT,
      success: () => {
        // 返回时刷新地址列表
        Taro.eventCenter.once('addressUpdated', () => {
          fetchAddresses()
        })
      },
    })
  }

  const handleManageAddress = () => {
    onClose()
    Taro.navigateTo({ url: PAGES.ADDRESS_LIST })
  }

  if (!visible) return null

  return (
    <View className='address-selector'>
      <View className='address-selector__mask' onClick={onClose} />
      <View className='address-selector__popup'>
        <View className='address-selector__header'>
          <Text className='address-selector__title'>选择收货地址</Text>
          <View className='address-selector__close' onClick={onClose}>
            <Text className='address-selector__close-icon'>×</Text>
          </View>
        </View>

        <View className='address-selector__list'>
          {addresses.length === 0 ? (
            <View className='address-selector__empty'>
              <Text className='address-selector__empty-text'>暂无收货地址</Text>
            </View>
          ) : (
            addresses.map((address) => (
              <View
                key={address.id}
                className={`address-selector__item ${selected?.id === address.id ? 'address-selector__item--selected' : ''}`}
                onClick={() => handleSelect(address)}
              >
                <View className='address-selector__item-main'>
                  <View className='address-selector__item-header'>
                    <Text className='address-selector__item-name'>{address.name}</Text>
                    <Text className='address-selector__item-phone'>
                      {formatPhone(address.phone)}
                    </Text>
                    {address.is_default && (
                      <View className='address-selector__item-default'>
                        <Text className='address-selector__item-default-text'>默认</Text>
                      </View>
                    )}
                  </View>
                  <Text className='address-selector__item-address'>
                    {formatAddress(address)}
                  </Text>
                </View>
                <View className='address-selector__item-check'>
                  {selected?.id === address.id && (
                    <Text className='address-selector__item-check-icon'>✓</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View className='address-selector__footer'>
          <View className='address-selector__add' onClick={handleAddAddress}>
            <Text className='address-selector__add-icon'>+</Text>
            <Text className='address-selector__add-text'>新增收货地址</Text>
          </View>
          <View className='address-selector__manage' onClick={handleManageAddress}>
            <Text className='address-selector__manage-text'>管理</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
