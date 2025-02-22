import React, { useState } from "react";
import Sidebar from "./dashboard/Sidebar";
import MainContent from "./dashboard/MainContent";

interface HomeProps {
  defaultTab?: string;
}

const Home: React.FC<HomeProps> = ({ defaultTab = "servers" }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="flex h-screen bg-background">
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <MainContent
          activeTab={activeTab}
          onTabChange={(value) => setActiveTab(value)}
        />
      </div>
    </div>
  );
};

export default Home;
