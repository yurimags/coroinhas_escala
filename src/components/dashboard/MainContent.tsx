import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServerManagement from "../servers/ServerManagement";
import ScheduleManagement from "../schedule/ScheduleManagement";
import ScheduleHistory from "../history/ScheduleHistory";
import SystemSettings from "../settings/SystemSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, History, Settings } from "lucide-react";

const MainContent: React.FC<MainContentProps> = ({
  activeTab = "servers",
  onTabChange = () => {},
}) => {
  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <Tabs
        defaultValue={activeTab}
        onValueChange={onTabChange}
        className="space-y-6"
      >
        <div className="flex justify-between items-center border-b pb-4">
          <TabsList className="bg-white">
            <TabsTrigger value="servers" className="px-6">
              <Users className="w-4 h-4 mr-2" />
              Coroinhas
            </TabsTrigger>
            <TabsTrigger value="schedule" className="px-6">
              <Calendar className="w-4 h-4 mr-2" />
              Escalas
            </TabsTrigger>
            <TabsTrigger value="history" className="px-6">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="settings" className="px-6">
              <Settings className="w-4 h-4 mr-2" />
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
