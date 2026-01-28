import { useState, useEffect } from 'react'
import { Table, Card, Button, Modal, Form, Input, InputNumber, Switch, Space, message, Popconfirm, Tag, TimePicker } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { deliveryApi } from '@/api'
import type { PickupPoint } from '@/types'

export default function PickupPointList() {
  const [loading, setLoading] = useState(false)
  const [points, setPoints] = useState<PickupPoint[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPoint, setEditingPoint] = useState<PickupPoint | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchPoints()
  }, [page, pageSize])

  const fetchPoints = async () => {
    setLoading(true)
    try {
      const result = await deliveryApi.getPickupPointList({ page, page_size: pageSize })
      setPoints(result.items)
      setTotal(result.total)
    } catch (error) {
      console.error('获取自提点失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingPoint(null)
    form.resetFields()
    form.setFieldsValue({ is_active: true, sort_order: 0 })
    setModalVisible(true)
  }

  const handleEdit = (point: PickupPoint) => {
    setEditingPoint(point)
    form.setFieldsValue({
      ...point,
      business_hours: point.business_hours ? [
        dayjs(point.business_hours.split('-')[0], 'HH:mm'),
        dayjs(point.business_hours.split('-')[1], 'HH:mm'),
      ] : undefined,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deliveryApi.deletePickupPoint(id)
      message.success('删除成功')
      fetchPoints()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    const businessHours = values.business_hours as [dayjs.Dayjs, dayjs.Dayjs] | undefined
    const data = {
      ...values,
      business_hours: businessHours
        ? `${businessHours[0].format('HH:mm')}-${businessHours[1].format('HH:mm')}`
        : undefined,
    }

    try {
      if (editingPoint) {
        await deliveryApi.updatePickupPoint(editingPoint.id, data)
        message.success('保存成功')
      } else {
        await deliveryApi.createPickupPoint(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchPoints()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const columns: TableProps<PickupPoint>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '自提点名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '营业时间',
      dataIndex: 'business_hours',
      key: 'business_hours',
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
            title="确定要删除此自提点吗？"
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
          <Button icon={<ReloadOutlined />} onClick={fetchPoints}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加自提点
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={points}
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
        title={editingPoint ? '编辑自提点' : '添加自提点'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="自提点名称"
            rules={[{ required: true, message: '请输入自提点名称' }]}
          >
            <Input placeholder="请输入自提点名称" />
          </Form.Item>

          <Form.Item
            name="address"
            label="详细地址"
            rules={[{ required: true, message: '请输入详细地址' }]}
          >
            <Input placeholder="请输入详细地址" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item
            name="contact_name"
            label="联系人"
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>

          <Form.Item
            name="business_hours"
            label="营业时间"
          >
            <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="longitude"
            label="经度"
          >
            <InputNumber precision={6} style={{ width: '100%' }} placeholder="如：116.397428" />
          </Form.Item>

          <Form.Item
            name="latitude"
            label="纬度"
          >
            <InputNumber precision={6} style={{ width: '100%' }} placeholder="如：39.90923" />
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
