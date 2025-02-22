import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServerManagement from "../servers/ServerManagement";
import ScheduleManagement from "../schedule/ScheduleManagement";
import ScheduleHistory from "../history/ScheduleHistory";
import SystemSettings from "../settings/SystemSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MainContent: React.FC<MainContentProps> = ({
  activeTab = "servers",
  onTabChange = () => {},
}) => {
  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <Tabs
        defaultValue={activeTab}
        onValueChange={onTabChange}
        className="w-full"
      >
        <div className="mb-6">
          <TabsList className="w-full justify-start bg-white border-b">
            <TabsTrigger value="servers" className="flex-1">
              Gerenciamento de Coroinhas
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex-1">
              Gerenciamento de Escalas
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              Histórico de Escalas
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              Configurações
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="servers" className="mt-0">
          <ServerManagement />
        </TabsContent>

        <TabsContent value="schedule" className="mt-0">
          <ScheduleManagement />
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <ScheduleHistory />
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MainContent;
