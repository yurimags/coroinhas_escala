import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface HistoryEntry {
  id: number;
  date: string;
  time: string;
  location: string;
  servers: string[];
  status: string;
}

const defaultHistory: HistoryEntry[] = [
  {
    id: 1,
    date: "2024-03-20",
    time: "07:00",
    location: "Main Church",
    servers: ["John Doe", "Jane Smith"],
    status: "Completed",
  },
  {
    id: 2,
    date: "2024-03-19",
    time: "09:00",
    location: "Chapel",
    servers: ["Mike Johnson"],
    status: "Cancelled",
  },
];

const ScheduleHistory = () => {
  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Histórico de Escalas</CardTitle>
          <div className="flex space-x-2">
            <Input placeholder="Buscar histórico..." className="max-w-sm" />
            <Button variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Servers</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defaultHistory.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.date}</TableCell>
                <TableCell>{entry.time}</TableCell>
                <TableCell>{entry.location}</TableCell>
                <TableCell>{entry.servers.join(", ")}</TableCell>
                <TableCell
                  className={`${entry.status === "Completed" ? "text-green-600" : "text-red-600"}`}
                >
                  {entry.status}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ScheduleHistory;
