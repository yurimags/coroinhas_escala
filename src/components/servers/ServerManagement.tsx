import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Search, Settings } from "lucide-react";
import { ServerConfigDialog } from "./ServerConfigDialog";

interface ServerDisplay {
  id: number;
  name: string;
  community: string;
  isSubAcolyte: boolean;
  isAcolyte: boolean;
  scheduleCount: number;
}

const mapServerToDisplay = (server: Server): ServerDisplay => ({
  id: server.id,
  name: server.nome,
  community: server.comunidade,
  isSubAcolyte: server.sub_acolito,
  isAcolyte: server.acolito,
  scheduleCount: server.escala
});

const mapDisplayToServer = (display: Partial<ServerDisplay>): Partial<Server> => ({
  nome: display.name,
  comunidade: display.community,
  sub_acolito: display.isSubAcolyte,
  acolito: display.isAcolyte,
  escala: display.scheduleCount
});

interface ServerFormProps {
  server?: Server;
  onClose?: () => void;
}

import { useServers, Server } from "@/lib/hooks/useServers";
import { useToast } from "@/components/ui/use-toast";

// ... rest of the imports

const ServerForm: React.FC<{ server?: Server; onClose?: () => void }> = ({
  server,
  onClose,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" defaultValue={server?.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="community">Community</Label>
        <Select defaultValue={server?.community}>
          <SelectTrigger>
            <SelectValue placeholder="Select community" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="st-mary">St. Mary</SelectItem>
            <SelectItem value="st-joseph">St. Joseph</SelectItem>
            <SelectItem value="st-peter">St. Peter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="sub-acolyte" defaultChecked={server?.isSubAcolyte} />
        <Label htmlFor="sub-acolyte">Sub-Acolyte</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="acolyte" defaultChecked={server?.isAcolyte} />
        <Label htmlFor="acolyte">Acolyte</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button>Save</Button>
      </div>
    </div>
  );
};

const ServerManagement: React.FC = () => {
  const { servers, loading, error, addServer, updateServer, deleteServer } =
    useServers();
  const { toast } = useToast();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const handleAddServer = async (displayData: Partial<ServerDisplay>) => {
    const serverData = mapDisplayToServer(displayData);
    try {
      await addServer(serverData);
      toast({
        title: "Sucesso",
        description: "Coroinha adicionado com sucesso",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar coroinha",
        variant: "destructive",
      });
    }
  };

  const handleUpdateServer = async (id: number, displayData: Partial<ServerDisplay>) => {
    const serverData = mapDisplayToServer(displayData);
    try {
      await updateServer(id, serverData);
      toast({
        title: "Sucesso",
        description: "Coroinha atualizado com sucesso",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar coroinha",
        variant: "destructive",
      });
    }
  };

  const handleDeleteServer = async (id: number) => {
    try {
      await deleteServer(id);
      toast({
        title: "Sucesso",
        description: "Coroinha removido com sucesso",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao remover coroinha",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Gerenciamento de Coroinhas</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Coroinha
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Coroinha</DialogTitle>
              </DialogHeader>
              <ServerForm />
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input placeholder="Buscar coroinhas..." />
          <Button variant="outline">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Community</TableHead>
              <TableHead>Sub-Acolyte</TableHead>
              <TableHead>Acolyte</TableHead>
              <TableHead>Schedule Count</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servers.map((server) => {
              const displayServer = mapServerToDisplay(server);
              return (
              <TableRow key={displayServer.id}>
                <TableCell>{displayServer.name}</TableCell>
                <TableCell>{displayServer.community}</TableCell>
                <TableCell>{displayServer.isSubAcolyte ? "Yes" : "No"}</TableCell>
                <TableCell>{displayServer.isAcolyte ? "Yes" : "No"}</TableCell>
                <TableCell>{displayServer.scheduleCount}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Coroinha</DialogTitle>
                          </DialogHeader>
                          <ServerForm server={server} />
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="icon">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <ServerConfigDialog
                          server={{
                            ...server,
                            availableDays: [],
                            availableLocations: [],
                          }}
                          onClose={() => {}}
                          onSave={(data) => console.log(data)}
                        />
                      </Dialog>
                    </div>
                    <Button variant="outline" size="icon">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ServerManagement;
