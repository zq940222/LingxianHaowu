import { get, put } from '@/utils/request'
import type { PointRule } from '@/types'

export async function getPointRuleList(): Promise<PointRule[]> {
  return get('/admin/point-rules')
}

export async function updatePointRule(id: number, data: Partial<PointRule>): Promise<PointRule> {
  return put(`/admin/point-rules/${id}`, data)
}
