import { useState, useEffect } from 'react'
import { Table, Card, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Switch, Space, message, Popconfirm, Tag, Progress } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { activityApi } from '@/api'
import { formatDateTime, formatPrice, priceToYuan, priceToFen } from '@/utils/format'
import { COUPON_TYPE_MAP } from '@/utils/constants'
import type { Coupon } from '@/types'

const { RangePicker } = DatePicker

export default function CouponList() {
  const [loading, setLoading] = useState(false)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchCoupons()
  }, [page, pageSize])

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const result = await activityApi.getCouponList({ page, page_size: pageSize })
      setCoupons(result.items)
      setTotal(result.total)
    } catch (error) {
      console.error('获取优惠券列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingCoupon(null)
    form.resetFields()
    form.setFieldsValue({ is_active: true, type: 'fixed' })
    setModalVisible(true)
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    form.setFieldsValue({
      ...coupon,
      value: coupon.type === 'fixed' ? priceToYuan(coupon.value) : coupon.value,
      min_amount: priceToYuan(coupon.min_amount),
      time_range: [dayjs(coupon.start_time), dayjs(coupon.end_time)],
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await activityApi.deleteCoupon(id)
      message.success('删除成功')
      fetchCoupons()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    const timeRange = values.time_range as [dayjs.Dayjs, dayjs.Dayjs]
    const data = {
      ...values,
      value: values.type === 'fixed' ? priceToFen(values.value as number) : values.value,
      min_amount: priceToFen(values.min_amount as number),
      start_time: timeRange[0].toISOString(),
      end_time: timeRange[1].toISOString(),
    }
    delete data.time_range

    try {
      if (editingCoupon) {
        await activityApi.updateCoupon(editingCoupon.id, data)
        message.success('保存成功')
      } else {
        await activityApi.createCoupon(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchCoupons()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const columns: TableProps<Coupon>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '优惠券名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (value) => COUPON_TYPE_MAP[value] || value,
    },
    {
      title: '优惠',
      key: 'value',
      width: 100,
      render: (_, record) => (
        record.type === 'fixed'
          ? formatPrice(record.value)
          : `${record.value}折`
      ),
    },
    {
      title: '使用门槛',
      dataIndex: 'min_amount',
      key: 'min_amount',
      width: 100,
      render: (value) => `满${formatPrice(value)}`,
    },
    {
      title: '领取/使用',
      key: 'usage',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.claimed_count}/{record.total_count}</div>
          <Progress
            percent={(record.claimed_count / record.total_count) * 100}
            size="small"
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: '有效期',
      key: 'time_range',
      width: 200,
      render: (_, record) => (
        <span style={{ fontSize: 12 }}>
          {formatDateTime(record.start_time).slice(0, 10)} ~ {formatDateTime(record.end_time).slice(0, 10)}
        </span>
      ),
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
            title="确定要删除此优惠券吗？"
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
          <Button icon={<ReloadOutlined />} onClick={fetchCoupons}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加优惠券
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={coupons}
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
        title={editingCoupon ? '编辑优惠券' : '添加优惠券'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="优惠券名称"
            rules={[{ required: true, message: '请输入优惠券名称' }]}
          >
            <Input placeholder="请输入优惠券名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="优惠券类型"
            rules={[{ required: true, message: '请选择优惠券类型' }]}
          >
            <Select placeholder="请选择类型">
              <Select.Option value="fixed">满减券</Select.Option>
              <Select.Option value="percent">折扣券</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
            {({ getFieldValue }) => (
              <Form.Item
                name="value"
                label={getFieldValue('type') === 'fixed' ? '优惠金额(元)' : '折扣(1-99)'}
                rules={[{ required: true, message: '请输入优惠数值' }]}
              >
                <InputNumber
                  min={getFieldValue('type') === 'fixed' ? 0.01 : 1}
                  max={getFieldValue('type') === 'fixed' ? undefined : 99}
                  precision={getFieldValue('type') === 'fixed' ? 2 : 0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            )}
          </Form.Item>

          <Form.Item
            name="min_amount"
            label="使用门槛(元)"
            rules={[{ required: true, message: '请输入使用门槛' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="total_count"
            label="发放数量"
            rules={[{ required: true, message: '请输入发放数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="time_range"
            label="有效期"
            rules={[{ required: true, message: '请选择有效期' }]}
          >
            <RangePicker showTime style={{ width: '100%' }} />
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
