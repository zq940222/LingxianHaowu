import { useState, useEffect } from 'react'
import { Table, Card, Input, Select, Button, Tag, Space, Modal, InputNumber, message } from 'antd'
import type { TableProps } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { userApi } from '@/api'
import { formatDateTime, formatPhone, formatPrice } from '@/utils/format'
import type { User } from '@/types'

export default function UserList() {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<string>('')
  const [pointsModalVisible, setPointsModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [pointsChange, setPointsChange] = useState(0)
  const [pointsReason, setPointsReason] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [page, pageSize])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const result = await userApi.getUserList({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
        status: status || undefined,
      })
      setUsers(result.items)
      setTotal(result.total)
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchUsers()
  }

  const handleStatusChange = async (user: User, newStatus: 'active' | 'banned') => {
    try {
      await userApi.updateUserStatus(user.id, newStatus)
      message.success('状态更新成功')
      fetchUsers()
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }

  const handlePointsSubmit = async () => {
    if (!selectedUser || !pointsChange || !pointsReason) {
      message.error('请填写完整信息')
      return
    }

    try {
      await userApi.updateUserPoints(selectedUser.id, pointsChange, pointsReason)
      message.success('积分调整成功')
      setPointsModalVisible(false)
      setSelectedUser(null)
      setPointsChange(0)
      setPointsReason('')
      fetchUsers()
    } catch (error) {
      console.error('调整积分失败:', error)
    }
  }

  const columns: TableProps<User>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      ellipsis: true,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone) => phone ? formatPhone(phone) : '-',
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 80,
    },
    {
      title: '订单数',
      dataIndex: 'total_orders',
      key: 'total_orders',
      width: 80,
    },
    {
      title: '消费金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (value) => formatPrice(value),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (value) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => {
              setSelectedUser(record)
              setPointsModalVisible(true)
            }}
          >
            调整积分
          </Button>
          {record.status === 'active' ? (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => handleStatusChange(record, 'banned')}
            >
              禁用
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              onClick={() => handleStatusChange(record, 'active')}
            >
              启用
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索昵称/手机号"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="状态筛选"
            value={status}
            onChange={setStatus}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="active">正常</Select.Option>
            <Select.Option value="banned">禁用</Select.Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
            刷新
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
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

      <Modal
        title="调整积分"
        open={pointsModalVisible}
        onOk={handlePointsSubmit}
        onCancel={() => {
          setPointsModalVisible(false)
          setSelectedUser(null)
          setPointsChange(0)
          setPointsReason('')
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>用户: {selectedUser?.nickname}</div>
          <div>当前积分: {selectedUser?.points}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>调整数量 (正数增加，负数减少):</div>
          <InputNumber
            value={pointsChange}
            onChange={(v) => setPointsChange(v || 0)}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <div style={{ marginBottom: 8 }}>调整原因:</div>
          <Input.TextArea
            value={pointsReason}
            onChange={(e) => setPointsReason(e.target.value)}
            rows={3}
            placeholder="请输入调整原因"
          />
        </div>
      </Modal>
    </div>
  )
}
