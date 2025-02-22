import { Link, useLocation } from 'react-router-dom';

export function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? "bg-gray-800" : "";
  };

  return (
    <div className="w-64 bg-gray-900 min-h-screen text-white p-4">
      <h1 className="text-2xl font-bold mb-8">Altar Server</h1>
      
      <nav className="space-y-4">
        <Link 
          to="/coroinhas" 
          className={`flex items-center space-x-2 p-2 hover:bg-gray-800 rounded ${isActive('/coroinhas')}`}
        >
          <span>👤</span>
          <span>Coroinhas</span>
        </Link>
        
        <Link 
          to="/escalas" 
          className={`flex items-center space-x-2 p-2 hover:bg-gray-800 rounded ${isActive('/escalas')}`}
        >
          <span>📅</span>
          <span>Escalas</span>
        </Link>
        
        <Link 
          to="/historico" 
          className={`flex items-center space-x-2 p-2 hover:bg-gray-800 rounded ${isActive('/historico')}`}
        >
          <span>📚</span>
          <span>Histórico</span>
        </Link>
        
        <Link 
          to="/configuracoes" 
          className={`flex items-center space-x-2 p-2 hover:bg-gray-800 rounded ${isActive('/configuracoes')}`}
        >
          <span>⚙️</span>
          <span>Configurações</span>
        </Link>
      </nav>

      <div className="absolute bottom-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            AD
          </div>
          <div>
            <div className="font-medium">Admin User</div>
            <div className="text-sm text-gray-400">admin@church.org</div>
          </div>
        </div>
      </div>
    </div>
  );
} 