import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Card, Input, Select, Button, Tag, Space, Image, Switch, message, Popconfirm } from 'antd'
import type { TableProps } from 'antd'
import { SearchOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { productApi } from '@/api'
import { formatPrice } from '@/utils/format'
import type { Product, Category } from '@/types'

export default function ProductList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [isOnSale, setIsOnSale] = useState<boolean | undefined>()

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [page, pageSize])

  const fetchCategories = async () => {
    try {
      const data = await productApi.getCategoryList()
      setCategories(data)
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const result = await productApi.getProductList({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
        category_id: categoryId,
        is_on_sale: isOnSale,
      })
      setProducts(result.items)
      setTotal(result.total)
    } catch (error) {
      console.error('获取商品列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchProducts()
  }

  const handleStatusChange = async (product: Product, checked: boolean) => {
    try {
      await productApi.updateProductStatus(product.id, checked)
      message.success(checked ? '已上架' : '已下架')
      fetchProducts()
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await productApi.deleteProduct(id)
      message.success('删除成功')
      fetchProducts()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const columns: TableProps<Product>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '封面',
      dataIndex: 'cover_image',
      key: 'cover_image',
      width: 80,
      render: (url) => (
        <Image
          src={url}
          width={60}
          height={60}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/png;base64,..."
        />
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 100,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (value) => formatPrice(value),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      render: (value) => (
        <span style={{ color: value < 10 ? '#ff4d4f' : undefined }}>
          {value}
        </span>
      ),
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      width: 80,
    },
    {
      title: '标签',
      key: 'tags',
      width: 140,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.is_hot && <Tag color="red">热卖</Tag>}
          {record.is_recommended && <Tag color="blue">推荐</Tag>}
          {record.group_buy_price && <Tag color="purple">拼团</Tag>}
        </Space>
      ),
    },
    {
      title: '上架',
      dataIndex: 'is_on_sale',
      key: 'is_on_sale',
      width: 80,
      render: (value, record) => (
        <Switch
          checked={value}
          onChange={(checked) => handleStatusChange(record, checked)}
          size="small"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/products/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此商品吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Input
              placeholder="搜索商品名称"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="选择分类"
              value={categoryId}
              onChange={setCategoryId}
              style={{ width: 150 }}
              allowClear
            >
              {categories.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="上架状态"
              value={isOnSale}
              onChange={setIsOnSale}
              style={{ width: 120 }}
              allowClear
            >
              <Select.Option value={true}>已上架</Select.Option>
              <Select.Option value={false}>已下架</Select.Option>
            </Select>
            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchProducts}>
              刷新
            </Button>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/products/create')}
          >
            添加商品
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={products}
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
