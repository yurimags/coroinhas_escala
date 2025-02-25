import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CoroinhaFormData } from "@/types/coroinha";

interface CoroinhaFormProps {
  initialData?: Partial<CoroinhaFormData>;
  onSubmit: (data: CoroinhaFormData) => void;
  onCancel: () => void;
}

const DIAS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];
const LOCAIS = ["Matriz", "Rainha da Paz", "Cristo Rei", "Bom Pastor"];

export function CoroinhaForm({
  initialData,
  onSubmit,
  onCancel,
}: CoroinhaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CoroinhaFormData>({
    defaultValues: {
      nome: initialData?.nome || "",
      acolito: initialData?.acolito || false,
      sub_acolito: initialData?.sub_acolito || false,
      disponibilidade_dias: initialData?.disponibilidade_dias || [],
      disponibilidade_locais: initialData?.disponibilidade_locais || [],
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          {...register("nome", { required: "Nome é obrigatório" })}
          className={errors.nome ? "border-red-500" : ""}
        />
        {errors.nome && (
          <span className="text-sm text-red-500">{errors.nome.message}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label>Função</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox id="acolito" {...register("acolito")} />
            <Label htmlFor="acolito">Acólito</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="sub_acolito" {...register("sub_acolito")} />
            <Label htmlFor="sub_acolito">Sub-Acólito</Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Disponibilidade - Dias</Label>
        <div className="grid grid-cols-2 gap-2">
          {DIAS.map((dia) => (
            <div key={dia} className="flex items-center gap-2">
              <Checkbox
                id={`dia-${dia}`}
                {...register("disponibilidade_dias")}
                value={dia}
              />
              <Label htmlFor={`dia-${dia}`}>{dia}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Disponibilidade - Locais</Label>
        <div className="grid grid-cols-2 gap-2">
          {LOCAIS.map((local) => (
            <div key={local} className="flex items-center gap-2">
              <Checkbox
                id={`local-${local}`}
                {...register("disponibilidade_locais")}
                value={local}
              />
              <Label htmlFor={`local-${local}`}>{local}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{initialData ? "Salvar" : "Adicionar"}</Button>
      </div>
    </form>
  );
}
