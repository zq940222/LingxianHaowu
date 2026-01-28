import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Spin } from 'antd'
import {
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { dashboardApi } from '@/api'
import { formatPrice } from '@/utils/format'
import type { DashboardStats } from '@/types'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topProducts, setTopProducts] = useState<
    { id: number; name: string; sales: number; amount: number }[]
  >([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsData, productsData] = await Promise.all([
        dashboardApi.getDashboardStats(),
        dashboardApi.getTopProducts(10),
      ])
      setStats(statsData)
      setTopProducts(productsData)
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      width: 80,
    },
    {
      title: '销售额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (value: number) => formatPrice(value),
    },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>数据概览</h2>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日订单"
              value={stats?.today_orders || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日营收"
              value={stats?.today_amount ? stats.today_amount / 100 : 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日新用户"
              value={stats?.today_users || 0}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理订单"
              value={stats?.pending_orders || 0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats?.total_users || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总订单数"
              value={stats?.total_orders || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总营收"
              value={stats?.total_amount ? stats.total_amount / 100 : 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="库存预警商品"
              value={stats?.low_stock_products || 0}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: stats?.low_stock_products ? '#ff4d4f' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="热销商品 TOP10">
            <Table
              columns={columns}
              dataSource={topProducts}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="快捷操作">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  onClick={() => window.location.href = '/orders'}
                >
                  <ShoppingCartOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                  <div style={{ marginTop: 8 }}>订单管理</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  onClick={() => window.location.href = '/products'}
                >
                  <FileTextOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                  <div style={{ marginTop: 8 }}>商品管理</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  onClick={() => window.location.href = '/coupons'}
                >
                  <DollarOutlined style={{ fontSize: 32, color: '#faad14' }} />
                  <div style={{ marginTop: 8 }}>优惠券</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  onClick={() => window.location.href = '/users'}
                >
                  <UserOutlined style={{ fontSize: 32, color: '#722ed1' }} />
                  <div style={{ marginTop: 8 }}>用户管理</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
