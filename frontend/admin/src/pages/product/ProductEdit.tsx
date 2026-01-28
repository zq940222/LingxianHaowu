import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, InputNumber, Select, Switch, Button, Card, Space, Upload, message, Spin } from 'antd'
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { productApi } from '@/api'
import { priceToYuan, priceToFen } from '@/utils/format'
import type { Category } from '@/types'

export default function ProductEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([])
  const [imagesFileList, setImagesFileList] = useState<UploadFile[]>([])

  useEffect(() => {
    fetchCategories()
    if (isEdit) {
      fetchProduct()
    }
  }, [id])

  const fetchCategories = async () => {
    try {
      const data = await productApi.getCategoryList()
      setCategories(data)
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  const fetchProduct = async () => {
    if (!id) return
    setLoading(true)
    try {
      const product = await productApi.getProductDetail(Number(id))
      form.setFieldsValue({
        ...product,
        price: priceToYuan(product.price),
        original_price: product.original_price ? priceToYuan(product.original_price) : undefined,
        group_buy_price: product.group_buy_price ? priceToYuan(product.group_buy_price) : undefined,
      })

      if (product.cover_image) {
        setCoverFileList([{
          uid: '-1',
          name: 'cover',
          status: 'done',
          url: product.cover_image,
        }])
      }

      if (product.images?.length) {
        setImagesFileList(product.images.map((url, index) => ({
          uid: `-${index + 2}`,
          name: `image-${index}`,
          status: 'done',
          url,
        })))
      }
    } catch (error) {
      console.error('获取商品详情失败:', error)
      message.error('获取商品详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSaving(true)
    try {
      const data = {
        ...values,
        price: priceToFen(values.price as number),
        original_price: values.original_price ? priceToFen(values.original_price as number) : undefined,
        group_buy_price: values.group_buy_price ? priceToFen(values.group_buy_price as number) : undefined,
        cover_image: coverFileList[0]?.url || coverFileList[0]?.response?.url,
        images: imagesFileList.map((file) => file.url || file.response?.url).filter(Boolean),
      }

      if (isEdit && id) {
        await productApi.updateProduct(Number(id), data)
        message.success('保存成功')
      } else {
        await productApi.createProduct(data)
        message.success('创建成功')
      }
      navigate('/products')
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/products')}
        >
          返回列表
        </Button>
      </div>

      <Card title={isEdit ? '编辑商品' : '添加商品'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: 800 }}
          initialValues={{
            is_on_sale: true,
            is_hot: false,
            is_recommended: false,
            stock: 0,
            unit: '份',
            sort_order: 0,
          }}
        >
          <Form.Item
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="商品描述"
          >
            <Input.TextArea rows={4} placeholder="请输入商品描述" />
          </Form.Item>

          <Form.Item
            name="category_id"
            label="商品分类"
            rules={[{ required: true, message: '请选择商品分类' }]}
          >
            <Select placeholder="请选择分类">
              {categories.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item
              name="price"
              label="销售价格(元)"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <InputNumber min={0} precision={2} style={{ width: 150 }} />
            </Form.Item>

            <Form.Item
              name="original_price"
              label="原价(元)"
            >
              <InputNumber min={0} precision={2} style={{ width: 150 }} />
            </Form.Item>

            <Form.Item
              name="group_buy_price"
              label="拼团价(元)"
            >
              <InputNumber min={0} precision={2} style={{ width: 150 }} />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item
              name="stock"
              label="库存"
              rules={[{ required: true, message: '请输入库存' }]}
            >
              <InputNumber min={0} style={{ width: 150 }} />
            </Form.Item>

            <Form.Item
              name="unit"
              label="单位"
            >
              <Input style={{ width: 100 }} placeholder="份" />
            </Form.Item>

            <Form.Item
              name="sort_order"
              label="排序"
            >
              <InputNumber min={0} style={{ width: 100 }} />
            </Form.Item>
          </Space>

          <Form.Item label="封面图">
            <Upload
              listType="picture-card"
              fileList={coverFileList}
              maxCount={1}
              onChange={({ fileList }) => setCoverFileList(fileList)}
              beforeUpload={() => false}
            >
              {coverFileList.length === 0 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传封面</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item label="商品图片">
            <Upload
              listType="picture-card"
              fileList={imagesFileList}
              maxCount={9}
              multiple
              onChange={({ fileList }) => setImagesFileList(fileList)}
              beforeUpload={() => false}
            >
              {imagesFileList.length < 9 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Space size="large">
            <Form.Item
              name="is_on_sale"
              label="上架销售"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="is_hot"
              label="热卖标签"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="is_recommended"
              label="推荐标签"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Space>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                {isEdit ? '保存' : '创建'}
              </Button>
              <Button onClick={() => navigate('/products')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
