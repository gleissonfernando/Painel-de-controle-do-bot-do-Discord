import React, { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  DoorOpen, 
  Save, 
  MapPin, 
  UserPlus,
  UserMinus
} from "lucide-react";
import { toast } from "sonner";

export default function WelcomeGoodbyePage() {
  const { guildId } = useParams<{ guildId: string }>();
  
  const { data: channels } = trpc.guilds.channels.useQuery(
    { guildId: guildId || "" },
    { enabled: !!guildId }
  );

  const { data: config, refetch } = trpc.welcomeGoodbye.get.useQuery(
    { guildId: guildId || "" },
    { enabled: !!guildId }
  );

  const saveMutation = trpc.welcomeGoodbye.save.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    }
  });

  const [formData, setFormData] = useState({
    welcomeEnabled: true,
    welcomeChannelId: "",
    welcomeTitle: "👑 Bem-vindo(a) ao clã Magnatas",
    welcomeMessage: "seja bem-vindo ao império Magnatas.",
    welcomeBanner: "",
    goodbyeEnabled: true,
    goodbyeChannelId: "",
    goodbyeTitle: "🚪 Saída do clã Magnatas",
    goodbyeMessage: "saiu do império Magnatas.",
    goodbyeBanner: ""
  });

  // Sync data when loaded
  React.useEffect(() => {
    if (config) {
      setFormData({
        welcomeEnabled: config.welcomeEnabled ?? true,
        welcomeChannelId: config.welcomeChannelId || "",
        welcomeTitle: (config as any).welcomeTitle || "👑 Bem-vindo(a) ao clã Magnatas",
        welcomeMessage: config.welcomeMessage || "seja bem-vindo ao império Magnatas.",
        welcomeBanner: (config as any).welcomeBanner || "",
        goodbyeEnabled: config.goodbyeEnabled ?? true,
        goodbyeChannelId: config.goodbyeChannelId || "",
        goodbyeTitle: (config as any).goodbyeTitle || "🚪 Saída do clã Magnatas",
        goodbyeMessage: config.goodbyeMessage || "saiu do império Magnatas.",
        goodbyeBanner: (config as any).goodbyeBanner || ""
      });
    }
  }, [config]);

  const handleSave = () => {
    saveMutation.mutate({
      guildId: guildId || "",
      config: formData
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="space-y-1">
        <h1 className="text-4xl font-black text-primary flex items-center gap-3 tracking-tighter italic uppercase">
          <DoorOpen size={40} />
          Entrada / Saída
        </h1>
        <p className="text-muted-foreground font-medium">Configure as mensagens automáticas de boas-vindas e despedida</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Entrada */}
        <Card className="border-border bg-[#0A0A0A] shadow-2xl">
          <CardHeader className="bg-[#050505] border-b border-border/50">
            <CardTitle className="text-xl flex items-center gap-2 text-white uppercase italic font-black">
              <UserPlus className="h-5 w-5 text-green-500" />
              Configuração de Entrada
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} className="text-primary" /> Canal de Entrada
                </label>
                <Select 
                  value={formData.welcomeChannelId} 
                  onValueChange={(val) => setFormData({...formData, welcomeChannelId: val})}
                >
                  <SelectTrigger className="bg-[#111] border-border/50 font-bold">
                    <SelectValue placeholder="Escolha o canal..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-border">
                    {channels?.filter(c => c.type === 0).map((channel) => (
                      <SelectItem key={channel.id} value={channel.id} className="font-bold">
                        # {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Título</label>
                <Input 
                  className="bg-[#111] border-border/50 font-bold"
                  value={formData.welcomeTitle}
                  onChange={(e) => setFormData({...formData, welcomeTitle: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Mensagem</label>
                <Textarea 
                  className="bg-[#111] border-border/50 font-bold min-h-[100px]"
                  value={formData.welcomeMessage}
                  onChange={(e) => setFormData({...formData, welcomeMessage: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">URL da Imagem (Banner)</label>
                <Input 
                  className="bg-[#111] border-border/50 font-bold"
                  placeholder="https://link-da-imagem.png"
                  value={formData.welcomeBanner}
                  onChange={(e) => setFormData({...formData, welcomeBanner: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saída */}
        <Card className="border-border bg-[#0A0A0A] shadow-2xl">
          <CardHeader className="bg-[#050505] border-b border-border/50">
            <CardTitle className="text-xl flex items-center gap-2 text-white uppercase italic font-black">
              <UserMinus className="h-5 w-5 text-red-500" />
              Configuração de Saída
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} className="text-primary" /> Canal de Saída
                </label>
                <Select 
                  value={formData.goodbyeChannelId} 
                  onValueChange={(val) => setFormData({...formData, goodbyeChannelId: val})}
                >
                  <SelectTrigger className="bg-[#111] border-border/50 font-bold">
                    <SelectValue placeholder="Escolha o canal..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-border">
                    {channels?.filter(c => c.type === 0).map((channel) => (
                      <SelectItem key={channel.id} value={channel.id} className="font-bold">
                        # {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Título</label>
                <Input 
                  className="bg-[#111] border-border/50 font-bold"
                  value={formData.goodbyeTitle}
                  onChange={(e) => setFormData({...formData, goodbyeTitle: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Mensagem</label>
                <Textarea 
                  className="bg-[#111] border-border/50 font-bold min-h-[100px]"
                  value={formData.goodbyeMessage}
                  onChange={(e) => setFormData({...formData, goodbyeMessage: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">URL da Imagem (Banner)</label>
                <Input 
                  className="bg-[#111] border-border/50 font-bold"
                  placeholder="https://link-da-imagem.png"
                  value={formData.goodbyeBanner}
                  onChange={(e) => setFormData({...formData, goodbyeBanner: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="h-14 px-10 bg-primary hover:bg-primary/90 text-white font-black uppercase italic text-lg gap-3 shadow-xl shadow-primary/20"
        >
          <Save size={20} /> Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
