import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  OrderedListOutlined,
  GiftOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores'

const { Header, Sider, Content } = Layout

const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/users',
    icon: <UserOutlined />,
    label: '用户管理',
  },
  {
    key: 'product',
    icon: <ShoppingOutlined />,
    label: '商品管理',
    children: [
      {
        key: '/products',
        label: '商品列表',
      },
      {
        key: '/categories',
        label: '分类管理',
      },
    ],
  },
  {
    key: '/orders',
    icon: <OrderedListOutlined />,
    label: '订单管理',
  },
  {
    key: 'activity',
    icon: <GiftOutlined />,
    label: '营销活动',
    children: [
      {
        key: '/activities',
        label: '活动管理',
      },
      {
        key: '/coupons',
        label: '优惠券管理',
      },
    ],
  },
  {
    key: 'delivery',
    icon: <EnvironmentOutlined />,
    label: '配送管理',
    children: [
      {
        key: '/delivery-zones',
        label: '配送区域',
      },
      {
        key: '/pickup-points',
        label: '自提点',
      },
    ],
  },
  {
    key: '/point-rules',
    icon: <TrophyOutlined />,
    label: '积分规则',
  },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { admin, isLoggedIn, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true })
    }
  }, [isLoggedIn, navigate])

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/products/')) return ['/products']
    if (path.startsWith('/orders/')) return ['/orders']
    return [path]
  }

  const getOpenKeys = () => {
    const path = location.pathname
    if (path.startsWith('/products') || path.startsWith('/categories')) return ['product']
    if (path.startsWith('/activities') || path.startsWith('/coupons')) return ['activity']
    if (path.startsWith('/delivery-zones') || path.startsWith('/pickup-points')) return ['delivery']
    return []
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        style={{
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <AppstoreOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          {!collapsed && (
            <span style={{ marginLeft: 8, fontSize: 16, fontWeight: 600, color: '#333' }}>
              灵鲜好物
            </span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div
            style={{ cursor: 'pointer', fontSize: 18 }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{admin?.name || admin?.username || '管理员'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
