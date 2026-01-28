import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import UserList from '@/pages/user/UserList'
import ProductList from '@/pages/product/ProductList'
import ProductEdit from '@/pages/product/ProductEdit'
import CategoryList from '@/pages/product/CategoryList'
import OrderList from '@/pages/order/OrderList'
import OrderDetail from '@/pages/order/OrderDetail'
import ActivityList from '@/pages/activity/ActivityList'
import CouponList from '@/pages/activity/CouponList'
import DeliveryZoneList from '@/pages/delivery/DeliveryZoneList'
import PickupPointList from '@/pages/delivery/PickupPointList'
import PointRuleList from '@/pages/points/PointRuleList'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'users',
        element: <UserList />,
      },
      {
        path: 'products',
        element: <ProductList />,
      },
      {
        path: 'products/create',
        element: <ProductEdit />,
      },
      {
        path: 'products/:id/edit',
        element: <ProductEdit />,
      },
      {
        path: 'categories',
        element: <CategoryList />,
      },
      {
        path: 'orders',
        element: <OrderList />,
      },
      {
        path: 'orders/:id',
        element: <OrderDetail />,
      },
      {
        path: 'activities',
        element: <ActivityList />,
      },
      {
        path: 'coupons',
        element: <CouponList />,
      },
      {
        path: 'delivery-zones',
        element: <DeliveryZoneList />,
      },
      {
        path: 'pickup-points',
        element: <PickupPointList />,
      },
      {
        path: 'point-rules',
        element: <PointRuleList />,
      },
    ],
  },
])

export default router
