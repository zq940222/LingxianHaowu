import { get, post, put, del } from '@/utils/request'
import type { DeliveryZone, PickupPoint } from '@/types'

// 配送区域
export async function getDeliveryZoneList(): Promise<DeliveryZone[]> {
  return get('/admin/delivery-zones')
}

export async function createDeliveryZone(data: Partial<DeliveryZone>): Promise<DeliveryZone> {
  return post('/admin/delivery-zones', data)
}

export async function updateDeliveryZone(id: number, data: Partial<DeliveryZone>): Promise<DeliveryZone> {
  return put(`/admin/delivery-zones/${id}`, data)
}

export async function deleteDeliveryZone(id: number): Promise<void> {
  return del(`/admin/delivery-zones/${id}`)
}

// 自提点
export async function getPickupPointList(): Promise<PickupPoint[]> {
  return get('/admin/pickup-points')
}

export async function createPickupPoint(data: Partial<PickupPoint>): Promise<PickupPoint> {
  return post('/admin/pickup-points', data)
}

export async function updatePickupPoint(id: number, data: Partial<PickupPoint>): Promise<PickupPoint> {
  return put(`/admin/pickup-points/${id}`, data)
}

export async function deletePickupPoint(id: number): Promise<void> {
  return del(`/admin/pickup-points/${id}`)
}
