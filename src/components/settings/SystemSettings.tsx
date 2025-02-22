import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AltarServerConfig } from "./AltarServerConfig";

interface SystemSettingsProps {
  onSave?: (settings: any) => void;
  initialSettings?: {
    rules: {
      maxSchedulesPerDay: number;
      requireRoleMatch: boolean;
    };
    locations: string[];
    timeSlots: string[];
  };
}

const SystemSettings = ({
  onSave = () => {},
  initialSettings = {
    rules: {
      maxSchedulesPerDay: 2,
      requireRoleMatch: true,
    },
    locations: ["Main Church", "Chapel", "Parish Hall"],
    timeSlots: ["07:00", "09:00", "18:00", "19:30"],
  },
}: SystemSettingsProps) => {
  return (
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="locations">Locais</TabsTrigger>
          <TabsTrigger value="timeSlots">Horários</TabsTrigger>
          <TabsTrigger value="weeklyConfig">Configuração Semanal</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maxSchedules">
                    Maximum Schedules per Day
                  </Label>
                  <Input
                    id="maxSchedules"
                    type="number"
                    className="w-20"
                    defaultValue={initialSettings.rules.maxSchedulesPerDay}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="roleMatch">Require Role Match</Label>
                  <Switch
                    id="roleMatch"
                    defaultChecked={initialSettings.rules.requireRoleMatch}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Manage Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  {initialSettings.locations.map((location, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-4"
                    >
                      <Input defaultValue={location} />
                      <Button variant="destructive" size="sm">
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button className="w-full">Add Location</Button>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeSlots">
          <Card>
            <CardHeader>
              <CardTitle>Manage Time Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  {initialSettings.timeSlots.map((timeSlot, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-4"
                    >
                      <Input type="time" defaultValue={timeSlot} />
                      <Button variant="destructive" size="sm">
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button className="w-full">Add Time Slot</Button>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weeklyConfig">
          <AltarServerConfig />
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end gap-4">
        <Button variant="outline">Cancel</Button>
        <Button onClick={() => onSave(initialSettings)}>Save Changes</Button>
      </div>
    </div>
  );
};

export default SystemSettings;
