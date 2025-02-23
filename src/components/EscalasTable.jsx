import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  message,
  Space,
  Popconfirm
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

const EscalasTable = () => {
  const [escalas, setEscalas] = useState([]);
  const [coroinhas, setCoroinhas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEscala, setEditingEscala] = useState(null);
  const [form] = Form.useForm();

  const locais = ['Paróquia', 'RainhaDaPaz', 'CristoRei', 'BomPastor'];
  const horarios = ['07:00', '09:00', '19:00'];

  useEffect(() => {
    fetchEscalas();
    fetchCoroinhas();
  }, []);

  const fetchEscalas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/escalas');
      const data = await response.json();
      setEscalas(data.map(escala => ({
        ...escala,
        data: dayjs(escala.data),
        horario: dayjs(escala.horario, 'HH:mm:ss')
      })));
    } catch (error) {
      message.error('Erro ao carregar escalas');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoroinhas = async () => {
    try {
      const response = await fetch('/api/coroinhas');
      const data = await response.json();
      setCoroinhas(data);
    } catch (error) {
      message.error('Erro ao carregar coroinhas');
    }
  };

  const handleGerarEscala = async (values) => {
    try {
      const response = await fetch('/api/escalas/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: values.data.format('YYYY-MM-DD'),
          horario: values.horario.format('HH:mm:ss'),
          local: values.local
        })
      });

      const data = await response.json();
      if (data.success) {
        message.success('Escala gerada com sucesso');
        fetchEscalas();
        setModalVisible(false);
        form.resetFields();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      message.error(error.message || 'Erro ao gerar escala');
    }
  };

  const handleEdit = async (values) => {
    try {
      const response = await fetch(`/api/escalas/${editingEscala.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coroinha_id: values.coroinha_id,
          data: values.data.format('YYYY-MM-DD'),
          horario: values.horario.format('HH:mm:ss'),
          local: values.local
        })
      });

      const data = await response.json();
      if (data.success) {
        message.success('Escala atualizada com sucesso');
        fetchEscalas();
        setModalVisible(false);
        setEditingEscala(null);
        form.resetFields();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      message.error(error.message || 'Erro ao atualizar escala');
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/escalas/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'escalas.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Erro ao exportar escalas');
    }
  };

  const columns = [
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      render: (data) => data.format('DD/MM/YYYY'),
      sorter: (a, b) => a.data - b.data
    },
    {
      title: 'Horário',
      dataIndex: 'horario',
      key: 'horario',
      render: (horario) => horario.format('HH:mm')
    },
    {
      title: 'Local',
      dataIndex: 'local',
      key: 'local',
      filters: locais.map(local => ({ text: local, value: local })),
      onFilter: (value, record) => record.local === value
    },
    {
      title: 'Coroinha',
      dataIndex: 'coroinha_nome',
      key: 'coroinha_nome'
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingEscala(record);
              form.setFieldsValue({
                ...record,
                coroinha_id: record.coroinha_id
              });
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Tem certeza que deseja excluir esta escala?"
            onConfirm={async () => {
              try {
                const response = await fetch(`/api/escalas/${record.id}`, {
                  method: 'DELETE'
                });
                const data = await response.json();
                if (data.success) {
                  message.success('Escala excluída com sucesso');
                  fetchEscalas();
                }
              } catch (error) {
                message.error('Erro ao excluir escala');
              }
            }}
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingEscala(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Nova Escala
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            Exportar
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={escalas}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingEscala ? 'Editar Escala' : 'Nova Escala'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingEscala(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={editingEscala ? handleEdit : handleGerarEscala}
          layout="vertical"
        >
          <Form.Item
            name="data"
            label="Data"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="horario"
            label="Horário"
            rules={[{ required: true }]}
          >
            <Select>
              {horarios.map(h => (
                <Select.Option key={h} value={h}>
                  {h}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="local"
            label="Local"
            rules={[{ required: true }]}
          >
            <Select>
              {locais.map(local => (
                <Select.Option key={local} value={local}>
                  {local}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {editingEscala && (
            <Form.Item
              name="coroinha_id"
              label="Coroinha"
              rules={[{ required: true }]}
            >
              <Select>
                {coroinhas.map(coroinha => (
                  <Select.Option key={coroinha.id} value={coroinha.id}>
                    {coroinha.nome}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingEscala ? 'Salvar' : 'Gerar'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingEscala(null);
                form.resetFields();
              }}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EscalasTable; 