import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Card, Input, Select, Button, Tag, Space, DatePicker } from 'antd'
import type { TableProps } from 'antd'
import { SearchOutlined, ReloadOutlined, ExportOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { orderApi } from '@/api'
import { formatPrice, formatDateTime } from '@/utils/format'
import { ORDER_STATUS_MAP, ORDER_STATUS_OPTIONS } from '@/utils/constants'
import type { Order, OrderStatus } from '@/types'

const { RangePicker } = DatePicker

export default function OrderList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<OrderStatus | undefined>()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [page, pageSize])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
      }

      if (keyword) params.keyword = keyword
      if (status) params.status = status
      if (dateRange) {
        params.start_date = dateRange[0].format('YYYY-MM-DD')
        params.end_date = dateRange[1].format('YYYY-MM-DD')
      }

      const result = await orderApi.getOrderList(params as Parameters<typeof orderApi.getOrderList>[0])
      setOrders(result.items)
      setTotal(result.total)
    } catch (error) {
      console.error('获取订单列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchOrders()
  }

  const handleExport = async () => {
    try {
      const params: Record<string, unknown> = {}
      if (keyword) params.keyword = keyword
      if (status) params.status = status
      if (dateRange) {
        params.start_date = dateRange[0].format('YYYY-MM-DD')
        params.end_date = dateRange[1].format('YYYY-MM-DD')
      }

      const result = await orderApi.exportOrders(params as Parameters<typeof orderApi.exportOrders>[0])
      window.open(result.url, '_blank')
    } catch (error) {
      console.error('导出失败:', error)
    }
  }

  const columns: TableProps<Order>['columns'] = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      width: 120,
      render: (user) => user?.nickname || '-',
    },
    {
      title: '商品数',
      dataIndex: 'items',
      key: 'items',
      width: 80,
      render: (items) => items?.length || 0,
    },
    {
      title: '实付金额',
      dataIndex: 'pay_amount',
      key: 'pay_amount',
      width: 100,
      render: (value) => formatPrice(value),
    },
    {
      title: '配送方式',
      dataIndex: 'delivery_type',
      key: 'delivery_type',
      width: 90,
      render: (value) => (
        <Tag color={value === 'pickup' ? 'purple' : 'blue'}>
          {value === 'pickup' ? '自提' : '配送'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => {
        const statusInfo = ORDER_STATUS_MAP[value]
        return <Tag color={statusInfo?.color}>{statusInfo?.text || value}</Tag>
      },
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (value) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/orders/${record.id}`)}
        >
          详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Input
              placeholder="搜索订单号/手机号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="订单状态"
              value={status}
              onChange={setStatus}
              style={{ width: 130 }}
              allowClear
              options={ORDER_STATUS_OPTIONS}
            />
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            />
            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchOrders}>
              刷新
            </Button>
          </div>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>
    </div>
  )
}
