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
  Popconfirm,
  Card
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import locale from 'antd/es/date-picker/locale/pt_BR';

dayjs.locale('pt-br');

const EscalasTable = () => {
  // ... estados e funções anteriores permanecem iguais ...

  return (
    <Card title="Escalas" className="card-container">
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
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total de ${total} escalas`
        }}
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
            rules={[{ required: true, message: 'Por favor, selecione a data' }]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              locale={locale}
              format="DD/MM/YYYY"
            />
          </Form.Item>

          <Form.Item
            name="horario"
            label="Horário"
            rules={[{ required: true, message: 'Por favor, selecione o horário' }]}
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
            rules={[{ required: true, message: 'Por favor, selecione o local' }]}
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
              rules={[{ required: true, message: 'Por favor, selecione o coroinha' }]}
            >
              <Select
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
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
    </Card>
  );
};

export default EscalasTable; 