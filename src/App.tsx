import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ServersPage from './routes/servers';
import { Sidebar } from './components/Sidebar';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 p-4 overflow-auto">
          <Routes>
            <Route path="/" element={<ServersPage />} />
            <Route path="/coroinhas" element={<ServersPage />} />
            <Route path="/escalas" element={<div>Escalas</div>} />
            <Route path="/historico" element={<div>Histórico</div>} />
            <Route path="/configuracoes" element={<div>Configurações</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
