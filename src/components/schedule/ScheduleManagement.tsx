import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateScheduleDialog } from "./CreateScheduleDialog";

interface Schedule {
  id: number;
  date: Date;
  time: string;
  location: string;
  servers: string[];
  status: "scheduled" | "completed" | "cancelled";
}

const defaultSchedules: Schedule[] = [
  {
    id: 1,
    date: new Date(),
    time: "07:00",
    location: "Igreja Matriz",
    servers: ["João Silva", "Maria Santos"],
    status: "scheduled",
  },
  {
    id: 2,
    date: new Date(),
    time: "09:00",
    location: "Capela",
    servers: ["Pedro Oliveira"],
    status: "scheduled",
  },
];

const ScheduleManagement = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gerenciamento de Escalas</CardTitle>
            <CreateScheduleDialog />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horário</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Coroinhas</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defaultSchedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>{schedule.time}</TableCell>
                        <TableCell>{schedule.location}</TableCell>
                        <TableCell>{schedule.servers.join(", ")}</TableCell>
                        <TableCell className="capitalize">
                          {schedule.status}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleManagement;
