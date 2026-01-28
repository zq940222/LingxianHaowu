import { useState, useEffect } from 'react'
import { Table, Card, Button, Modal, Form, Input, InputNumber, Switch, Space, message, Popconfirm, Tag, Select } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { pointsApi } from '@/api'
import type { PointRule } from '@/types'

const RULE_TYPE_OPTIONS = [
  { value: 'sign_in', label: '签到奖励' },
  { value: 'order', label: '订单奖励' },
  { value: 'first_order', label: '首单奖励' },
  { value: 'invite', label: '邀请奖励' },
  { value: 'birthday', label: '生日奖励' },
  { value: 'review', label: '评价奖励' },
]

const RULE_TYPE_MAP: Record<string, string> = {
  sign_in: '签到奖励',
  order: '订单奖励',
  first_order: '首单奖励',
  invite: '邀请奖励',
  birthday: '生日奖励',
  review: '评价奖励',
}

export default function PointRuleList() {
  const [loading, setLoading] = useState(false)
  const [rules, setRules] = useState<PointRule[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<PointRule | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchRules()
  }, [page, pageSize])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const result = await pointsApi.getPointRuleList({ page, page_size: pageSize })
      setRules(result.items)
      setTotal(result.total)
    } catch (error) {
      console.error('获取积分规则失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingRule(null)
    form.resetFields()
    form.setFieldsValue({ is_active: true, type: 'sign_in' })
    setModalVisible(true)
  }

  const handleEdit = (rule: PointRule) => {
    setEditingRule(rule)
    form.setFieldsValue(rule)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await pointsApi.deletePointRule(id)
      message.success('删除成功')
      fetchRules()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (editingRule) {
        await pointsApi.updatePointRule(editingRule.id, values)
        message.success('保存成功')
      } else {
        await pointsApi.createPointRule(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchRules()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const columns: TableProps<PointRule>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '规则类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (value) => RULE_TYPE_MAP[value] || value,
    },
    {
      title: '积分数量',
      dataIndex: 'points',
      key: 'points',
      width: 100,
      render: (value) => `+${value}`,
    },
    {
      title: '每日上限',
      dataIndex: 'daily_limit',
      key: 'daily_limit',
      width: 100,
      render: (value) => value > 0 ? value : '无限制',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
            title="确定要删除此规则吗？"
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
          <Button icon={<ReloadOutlined />} onClick={fetchRules}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加规则
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={rules}
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
        title={editingRule ? '编辑积分规则' : '添加积分规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="规则类型"
            rules={[{ required: true, message: '请选择规则类型' }]}
          >
            <Select placeholder="请选择规则类型" options={RULE_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="points"
            label="积分数量"
            rules={[{ required: true, message: '请输入积分数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type')
              if (type === 'order') {
                return (
                  <Form.Item
                    name="points_per_yuan"
                    label="每消费1元获得积分"
                  >
                    <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="如设置为1，则消费100元获得100积分" />
                  </Form.Item>
                )
              }
              return null
            }}
          </Form.Item>

          <Form.Item
            name="daily_limit"
            label="每日上限"
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0表示无限制" />
          </Form.Item>

          <Form.Item
            name="description"
            label="规则描述"
          >
            <Input.TextArea rows={3} placeholder="请输入规则描述" />
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
