import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  HistoryOutlined,
  SettingOutlined
} from '@ant-design/icons';
import CoroinhasTable from './components/servers/CoroinhasTable';
import EscalasTable from './components/servers/EscalasTable';
// ... outros imports

const { Content, Sider } = Layout;

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div className="logo" />
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
          <Menu.Item key="1" icon={<UserOutlined />}>
            <Link to="/coroinhas">Coroinhas</Link>
          </Menu.Item>
          <Menu.Item key="2" icon={<CalendarOutlined />}>
            <Link to="/escalas">Escalas</Link>
          </Menu.Item>
          <Menu.Item key="3" icon={<HistoryOutlined />}>
            <Link to="/historico">Histórico</Link>
          </Menu.Item>
          <Menu.Item key="4" icon={<SettingOutlined />}>
            <Link to="/configuracoes">Configurações</Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout className="site-layout">
        <Content style={{ margin: '16px' }}>
          <Routes>
            <Route path="/coroinhas" element={<CoroinhasTable />} />
            <Route path="/escalas" element={<EscalasTable />} />
            {/* Adicione outras rotas conforme necessário */}
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App; 