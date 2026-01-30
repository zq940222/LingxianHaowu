export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/category/index',
    'pages/product/list',
    'pages/product/detail',
    'pages/cart/index',
    'pages/order/confirm',
    'pages/order/result',
    'pages/order/list',
    'pages/order/detail',
    'pages/my/index',
    'pages/login/index',
    'pages/address/list',
    'pages/address/edit',
    'pages/points/index',
    'pages/coupon/list',
    'pages/groupbuy/detail',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '灵鲜好物',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#07c160',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
      },
      {
        pagePath: 'pages/category/index',
        text: '分类',
      },
      {
        pagePath: 'pages/cart/index',
        text: '购物车',
      },
      {
        pagePath: 'pages/my/index',
        text: '我的',
      },
    ],
  },
  lazyCodeLoading: 'requiredComponents',
})
