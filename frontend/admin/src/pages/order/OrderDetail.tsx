import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Descriptions, Table, Tag, Button, Space, Spin, Modal, Input, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { orderApi } from '@/api'
import { formatPrice, formatDateTime } from '@/utils/format'
import { ORDER_STATUS_MAP } from '@/utils/constants'
import type { Order, OrderItem } from '@/types'

export default function OrderDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [cancelModalVisible, setCancelModalVisible] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    if (id) {
      fetchOrder()
    }
  }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const data = await orderApi.getOrderDetail(Number(id))
      setOrder(data)
    } catch (error) {
      console.error('获取订单详情失败:', error)
      message.error('获取订单详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      message.error('请输入取消原因')
      return
    }

    try {
      await orderApi.cancelOrder(Number(id), cancelReason)
      message.success('订单已取消')
      setCancelModalVisible(false)
      fetchOrder()
    } catch (error) {
      console.error('取消订单失败:', error)
    }
  }

  const handleRefund = async (action: 'approve' | 'reject') => {
    Modal.confirm({
      title: action === 'approve' ? '确认退款' : '拒绝退款',
      content: action === 'approve' ? '确定要同意此退款申请吗？' : '确定要拒绝此退款申请吗？',
      onOk: async () => {
        try {
          await orderApi.handleRefund(Number(id), action)
          message.success(action === 'approve' ? '退款成功' : '已拒绝退款')
          fetchOrder()
        } catch (error) {
          console.error('处理退款失败:', error)
        }
      },
    })
  }

  const itemColumns = [
    {
      title: '商品',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: '规格',
      dataIndex: 'spec',
      key: 'spec',
      render: (value: string) => value || '-',
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (value: number) => formatPrice(value),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '小计',
      key: 'subtotal',
      render: (_: unknown, record: OrderItem) => formatPrice(record.price * record.quantity),
    },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!order) {
    return <div>订单不存在</div>
  }

  const statusInfo = ORDER_STATUS_MAP[order.status]

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
          返回列表
        </Button>
        <Space>
          {order.status === 'pending_confirm' && (
            <Button type="primary" danger onClick={() => setCancelModalVisible(true)}>
              取消订单
            </Button>
          )}
          {order.status === 'refunding' && (
            <>
              <Button type="primary" onClick={() => handleRefund('approve')}>
                同意退款
              </Button>
              <Button danger onClick={() => handleRefund('reject')}>
                拒绝退款
              </Button>
            </>
          )}
        </Space>
      </div>

      <Card title="订单信息" style={{ marginBottom: 24 }}>
        <Descriptions column={3}>
          <Descriptions.Item label="订单号">{order.order_no}</Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag color={statusInfo?.color}>{statusInfo?.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="下单时间">{formatDateTime(order.created_at)}</Descriptions.Item>
          <Descriptions.Item label="配送方式">
            <Tag color={order.delivery_type === 'pickup' ? 'purple' : 'blue'}>
              {order.delivery_type === 'pickup' ? '自提' : '配送'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="支付方式">{order.payment_method || '-'}</Descriptions.Item>
          <Descriptions.Item label="支付时间">{order.payment_time ? formatDateTime(order.payment_time) : '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="收货信息" style={{ marginBottom: 24 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="收货人">{order.address.name}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{order.address.phone}</Descriptions.Item>
          <Descriptions.Item label="收货地址" span={2}>
            {order.delivery_type === 'pickup' ? order.pickup_point : order.address.full_address}
          </Descriptions.Item>
          {order.delivery_time && (
            <Descriptions.Item label="期望送达时间">{order.delivery_time}</Descriptions.Item>
          )}
          {order.remark && (
            <Descriptions.Item label="备注" span={2}>{order.remark}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="商品信息" style={{ marginBottom: 24 }}>
        <Table
          columns={itemColumns}
          dataSource={order.items}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Card title="金额信息">
        <Descriptions column={2}>
          <Descriptions.Item label="商品总额">{formatPrice(order.total_amount)}</Descriptions.Item>
          <Descriptions.Item label="优惠金额">-{formatPrice(order.discount_amount)}</Descriptions.Item>
          <Descriptions.Item label="配送费">{order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : '免运费'}</Descriptions.Item>
          <Descriptions.Item label="实付金额">
            <span style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 600 }}>
              {formatPrice(order.pay_amount)}
            </span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title="取消订单"
        open={cancelModalVisible}
        onOk={handleCancel}
        onCancel={() => setCancelModalVisible(false)}
      >
        <Input.TextArea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          rows={4}
          placeholder="请输入取消原因"
        />
      </Modal>
    </div>
  )
}
