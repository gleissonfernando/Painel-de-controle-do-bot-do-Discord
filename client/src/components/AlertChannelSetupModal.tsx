import { useState } from "react";
import { AlertCircle, ChevronRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface AlertChannelSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guildId: string;
  guildName?: string;
}

export default function AlertChannelSetupModal({
  open,
  onOpenChange,
  guildId,
  guildName = "Seu Servidor",
}: AlertChannelSetupModalProps) {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoToSettings = () => {
    navigate(`/dashboard/${guildId}/general`);
    onOpenChange(false);
  };

  const handleCreateChannel = async () => {
    setIsLoading(true);
    try {
      // Aqui você pode adicionar lógica para criar o canal automaticamente
      // Por enquanto, apenas redireciona para as configurações
      toast.info("⏳ Redirecionando para configurações...");
      handleGoToSettings();
    } catch (error) {
      toast.error("❌ Erro ao criar canal");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-primary/20 bg-[#0A0A0A]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <AlertCircle className="text-primary" size={24} />
            </div>
            <AlertDialogTitle className="text-primary">
              Configuração Obrigatória
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground">
            Para que o bot funcione corretamente em <strong>{guildName}</strong>, você precisa configurar um <strong>Canal de Alerta</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
          <p className="text-sm text-foreground font-medium">O Canal de Alerta é utilizado para:</p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-2">
            <li>✓ Enviar mensagens de manutenção</li>
            <li>✓ Enviar avisos globais do bot</li>
            <li>✓ Notificar sobre atualizações importantes</li>
          </ul>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel 
            onClick={() => onOpenChange(false)}
            className="border-border hover:bg-muted/50"
          >
            Fechar
          </AlertDialogCancel>
          <Button
            onClick={handleGoToSettings}
            disabled={isLoading}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Configurar Agora
            <ChevronRight size={16} />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
