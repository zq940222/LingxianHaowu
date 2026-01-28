export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/order/list',
    'pages/order/detail',
    'pages/product/list',
    'pages/product/edit',
    'pages/statistics/index',
    'pages/my/index',
    'pages/my/settings',
  ],
  tabBar: {
    color: '#999999',
    selectedColor: '#1890ff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '工作台',
        // iconPath: 'assets/icons/home.png',
        // selectedIconPath: 'assets/icons/home-active.png',
      },
      {
        pagePath: 'pages/order/list',
        text: '订单',
        // iconPath: 'assets/icons/order.png',
        // selectedIconPath: 'assets/icons/order-active.png',
      },
      {
        pagePath: 'pages/product/list',
        text: '商品',
        // iconPath: 'assets/icons/product.png',
        // selectedIconPath: 'assets/icons/product-active.png',
      },
      {
        pagePath: 'pages/my/index',
        text: '我的',
        // iconPath: 'assets/icons/my.png',
        // selectedIconPath: 'assets/icons/my-active.png',
      },
    ],
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1890ff',
    navigationBarTitleText: '灵鲜好物商家',
    navigationBarTextStyle: 'white',
  },
  permission: {
    'scope.userLocation': {
      desc: '用于配送距离计算',
    },
  },
})
