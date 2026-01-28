import { useState, useEffect } from 'react'
import { Table, Card, Button, Modal, Form, Input, Select, DatePicker, Switch, Space, message, Popconfirm, Tag, Image } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { activityApi } from '@/api'
import { formatDateTime } from '@/utils/format'
import { ACTIVITY_TYPE_MAP } from '@/utils/constants'
import type { Activity } from '@/types'

const { RangePicker } = DatePicker

export default function ActivityList() {
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchActivities()
  }, [page, pageSize])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const result = await activityApi.getActivityList({ page, page_size: pageSize })
      setActivities(result.items)
      setTotal(result.total)
    } catch (error) {
      console.error('获取活动列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingActivity(null)
    form.resetFields()
    form.setFieldsValue({ is_active: true, sort_order: 0 })
    setModalVisible(true)
  }

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity)
    form.setFieldsValue({
      ...activity,
      time_range: [dayjs(activity.start_time), dayjs(activity.end_time)],
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await activityApi.deleteActivity(id)
      message.success('删除成功')
      fetchActivities()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    const timeRange = values.time_range as [dayjs.Dayjs, dayjs.Dayjs]
    const data = {
      ...values,
      start_time: timeRange[0].toISOString(),
      end_time: timeRange[1].toISOString(),
    }
    delete data.time_range

    try {
      if (editingActivity) {
        await activityApi.updateActivity(editingActivity.id, data)
        message.success('保存成功')
      } else {
        await activityApi.createActivity(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchActivities()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const columns: TableProps<Activity>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '封面',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (url) => (
        <Image src={url} width={80} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (value) => ACTIVITY_TYPE_MAP[value] || value,
    },
    {
      title: '时间范围',
      key: 'time_range',
      width: 320,
      render: (_, record) => (
        <span>
          {formatDateTime(record.start_time)} ~ {formatDateTime(record.end_time)}
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
            title="确定要删除此活动吗？"
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
          <Button icon={<ReloadOutlined />} onClick={fetchActivities}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加活动
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={activities}
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
        title={editingActivity ? '编辑活动' : '添加活动'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="活动标题"
            rules={[{ required: true, message: '请输入活动标题' }]}
          >
            <Input placeholder="请输入活动标题" />
          </Form.Item>

          <Form.Item
            name="type"
            label="活动类型"
            rules={[{ required: true, message: '请选择活动类型' }]}
          >
            <Select placeholder="请选择活动类型">
              <Select.Option value="popup">弹窗活动</Select.Option>
              <Select.Option value="banner">首页Banner</Select.Option>
              <Select.Option value="groupbuy">拼团活动</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="image"
            label="活动图片"
            rules={[{ required: true, message: '请输入图片URL' }]}
          >
            <Input placeholder="请输入图片URL" />
          </Form.Item>

          <Form.Item name="link" label="跳转链接">
            <Input placeholder="请输入跳转链接（选填）" />
          </Form.Item>

          <Form.Item
            name="time_range"
            label="活动时间"
            rules={[{ required: true, message: '请选择活动时间' }]}
          >
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="sort_order" label="排序">
            <Input type="number" placeholder="数字越小越靠前" />
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
