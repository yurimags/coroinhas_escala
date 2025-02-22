import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Users, Calendar, History, Settings, Menu } from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar = ({ collapsed = false, onToggle = () => {} }: SidebarProps) => {
  const navigate = useNavigate();
  const navItems = [
    {
      title: "Coroinhas",
      icon: <Users className="w-5 h-5" />,
      path: "/servers",
    },
    {
      title: "Escalas",
      icon: <Calendar className="w-5 h-5" />,
      path: "/schedule",
    },
    {
      title: "Histórico",
      icon: <History className="w-5 h-5" />,
      path: "/history",
    },
    {
      title: "Configurações",
      icon: <Settings className="w-5 h-5" />,
      path: "/settings",
    },
  ];

  return (
    <div className="h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h1 className={`font-bold text-xl ${collapsed ? "hidden" : "block"}`}>
          Altar Server
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-gray-100 text-gray-700"
                }
                ${collapsed ? "justify-center" : ""}`
              }
            >
              {item.icon}
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium">AD</span>
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-500">admin@church.org</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
