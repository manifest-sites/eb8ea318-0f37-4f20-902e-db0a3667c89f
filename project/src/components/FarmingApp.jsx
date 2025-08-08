import React, { useState, useEffect } from 'react'
import { Card, Button, Modal, Form, Input, Select, DatePicker, Table, Space, Tag, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { Crop } from '../entities/Crop'
import dayjs from 'dayjs'

const { Option } = Select

const cropTypes = ['Vegetable', 'Grain', 'Fruit', 'Herb', 'Legume']
const statusOptions = ['planted', 'growing', 'ready', 'harvested']

const statusColors = {
  planted: 'blue',
  growing: 'green',
  ready: 'orange', 
  harvested: 'purple'
}

function FarmingApp() {
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCrop, setEditingCrop] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadCrops()
  }, [])

  const loadCrops = async () => {
    try {
      setLoading(true)
      const response = await Crop.list()
      if (response.success) {
        setCrops(response.data || [])
      }
    } catch (error) {
      message.error('Failed to load crops')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCrop = () => {
    setEditingCrop(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEditCrop = (crop) => {
    setEditingCrop(crop)
    form.setFieldsValue({
      ...crop,
      plantedDate: crop.plantedDate ? dayjs(crop.plantedDate) : null,
      harvestDate: crop.harvestDate ? dayjs(crop.harvestDate) : null
    })
    setModalVisible(true)
  }

  const handleDeleteCrop = async (cropId) => {
    try {
      // Since there's no delete method, we'll update status to 'harvested'
      await Crop.update(cropId, { status: 'harvested' })
      message.success('Crop marked as harvested')
      loadCrops()
    } catch (error) {
      message.error('Failed to update crop')
    }
  }

  const handleSubmit = async (values) => {
    try {
      const cropData = {
        ...values,
        plantedDate: values.plantedDate?.format('YYYY-MM-DD'),
        harvestDate: values.harvestDate?.format('YYYY-MM-DD')
      }

      if (editingCrop) {
        await Crop.update(editingCrop._id, cropData)
        message.success('Crop updated successfully')
      } else {
        await Crop.create(cropData)
        message.success('Crop added successfully')
      }
      
      setModalVisible(false)
      loadCrops()
    } catch (error) {
      message.error('Failed to save crop')
    }
  }

  const columns = [
    {
      title: 'Crop Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: cropTypes.map(type => ({ text: type, value: type })),
      onFilter: (value, record) => record.type === value
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>
      ),
      filters: statusOptions.map(status => ({ text: status.toUpperCase(), value: status })),
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Planted Date',
      dataIndex: 'plantedDate',
      key: 'plantedDate',
      render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-'
    },
    {
      title: 'Harvest Date',
      dataIndex: 'harvestDate',
      key: 'harvestDate',
      render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-'
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty) => qty || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditCrop(record)}
            size="small"
          />
          <Button 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteCrop(record._id)}
            size="small"
            disabled={record.status === 'harvested'}
          />
        </Space>
      )
    }
  ]

  const stats = {
    total: crops.length,
    planted: crops.filter(c => c.status === 'planted').length,
    growing: crops.filter(c => c.status === 'growing').length,
    ready: crops.filter(c => c.status === 'ready').length,
    harvested: crops.filter(c => c.status === 'harvested').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-green-800 mb-2">🌾 Farm Manager</h1>
          <p className="text-green-600">Track your crops from seed to harvest</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
            <div className="text-gray-500">Total Crops</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.planted}</div>
            <div className="text-gray-500">Planted</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.growing}</div>
            <div className="text-gray-500">Growing</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.ready}</div>
            <div className="text-gray-500">Ready</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.harvested}</div>
            <div className="text-gray-500">Harvested</div>
          </Card>
        </div>

        <Card 
          title="Your Crops" 
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddCrop}
              className="bg-green-600 hover:bg-green-700 border-green-600"
            >
              Add Crop
            </Button>
          }
        >
          <Table 
            columns={columns}
            dataSource={crops}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            className="responsive-table"
          />
        </Card>

        <Modal
          title={editingCrop ? 'Edit Crop' : 'Add New Crop'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          className="crop-modal"
        >
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            className="mt-4"
          >
            <Form.Item
              name="name"
              label="Crop Name"
              rules={[{ required: true, message: 'Please enter crop name' }]}
            >
              <Input placeholder="e.g., Tomatoes, Corn, Wheat" />
            </Form.Item>

            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true, message: 'Please select crop type' }]}
            >
              <Select placeholder="Select crop type">
                {cropTypes.map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status">
                {statusOptions.map(status => (
                  <Option key={status} value={status}>{status.toUpperCase()}</Option>
                ))}
              </Select>
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="plantedDate"
                label="Planted Date"
              >
                <DatePicker className="w-full" />
              </Form.Item>

              <Form.Item
                name="harvestDate"
                label="Harvest Date"
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </div>

            <Form.Item
              name="quantity"
              label="Quantity"
            >
              <Input type="number" placeholder="Number of plants/seeds" />
            </Form.Item>

            <Form.Item
              name="notes"
              label="Notes"
            >
              <Input.TextArea rows={3} placeholder="Additional notes about this crop..." />
            </Form.Item>

            <div className="flex justify-end space-x-2">
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                className="bg-green-600 hover:bg-green-700 border-green-600"
              >
                {editingCrop ? 'Update' : 'Add'} Crop
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  )
}

export default FarmingApp