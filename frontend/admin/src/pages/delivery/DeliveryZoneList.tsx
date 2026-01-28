import { useState, useEffect } from 'react'
import { Table, Card, Button, Modal, Form, Input, InputNumber, Switch, Space, message, Popconfirm, Tag } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { deliveryApi } from '@/api'
import { formatPrice, priceToYuan, priceToFen } from '@/utils/format'
import type { DeliveryZone } from '@/types'

export default function DeliveryZoneList() {
  const [loading, setLoading] = useState(false)
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchZones()
  }, [page, pageSize])

  const fetchZones = async () => {
    setLoading(true)
    try {
      const result = await deliveryApi.getDeliveryZoneList({ page, page_size: pageSize })
      setZones(result.items)
      setTotal(result.total)
    } catch (error) {
      console.error('获取配送区域失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingZone(null)
    form.resetFields()
    form.setFieldsValue({ is_active: true, sort_order: 0 })
    setModalVisible(true)
  }

  const handleEdit = (zone: DeliveryZone) => {
    setEditingZone(zone)
    form.setFieldsValue({
      ...zone,
      delivery_fee: priceToYuan(zone.delivery_fee),
      free_delivery_amount: priceToYuan(zone.free_delivery_amount),
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deliveryApi.deleteDeliveryZone(id)
      message.success('删除成功')
      fetchZones()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    const data = {
      ...values,
      delivery_fee: priceToFen(values.delivery_fee as number),
      free_delivery_amount: priceToFen(values.free_delivery_amount as number),
    }

    try {
      if (editingZone) {
        await deliveryApi.updateDeliveryZone(editingZone.id, data)
        message.success('保存成功')
      } else {
        await deliveryApi.createDeliveryZone(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchZones()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const columns: TableProps<DeliveryZone>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '区域名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '配送费',
      dataIndex: 'delivery_fee',
      key: 'delivery_fee',
      width: 100,
      render: (value) => formatPrice(value),
    },
    {
      title: '免配送费门槛',
      dataIndex: 'free_delivery_amount',
      key: 'free_delivery_amount',
      width: 130,
      render: (value) => value > 0 ? `满${formatPrice(value)}` : '无门槛',
    },
    {
      title: '配送时间',
      dataIndex: 'delivery_time',
      key: 'delivery_time',
      width: 120,
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (value) => (
        <Tag color={value ? 'green' : 'default'}>{value ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此配送区域吗？"
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
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Button icon={<ReloadOutlined />} onClick={fetchZones}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加配送区域
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={zones}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>

      <Modal
        title={editingZone ? '编辑配送区域' : '添加配送区域'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="区域名称"
            rules={[{ required: true, message: '请输入区域名称' }]}
          >
            <Input placeholder="请输入区域名称" />
          </Form.Item>

          <Form.Item
            name="areas"
            label="覆盖范围"
            rules={[{ required: true, message: '请输入覆盖范围' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入覆盖的小区/街道，多个用逗号分隔" />
          </Form.Item>

          <Form.Item
            name="delivery_fee"
            label="配送费(元)"
            rules={[{ required: true, message: '请输入配送费' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="free_delivery_amount"
            label="免配送费门槛(元)"
            rules={[{ required: true, message: '请输入免配送费门槛' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0表示无门槛" />
          </Form.Item>

          <Form.Item
            name="delivery_time"
            label="配送时间说明"
          >
            <Input placeholder="如：每日9:00-21:00" />
          </Form.Item>

          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
          </Form.Item>

          <Form.Item name="is_active" label="启用状态" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
