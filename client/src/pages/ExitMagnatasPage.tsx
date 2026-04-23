import React, { useState, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  Upload, 
  Image as ImageIcon, 
  Send, 
  Globe, 
  MapPin, 
  User as UserIcon,
  Eye,
  Settings,
  X,
  FlaskConical,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ExitMagnatasPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: channels, isLoading: channelsLoading } = trpc.guilds.channels.useQuery(
    { guildId: guildId || "" },
    { enabled: !!guildId }
  );

  const sendExitMutation = trpc.welcomeGoodbye.sendExit.useMutation({
    onSuccess: () => {
      toast.success("🚀 Mensagem de saída enviada com sucesso!");
    },
    onError: (error) => {
      toast.error(`❌ Erro ao enviar: ${error.message}`);
    }
  });

  const sendTestMutation = trpc.welcomeGoodbye.sendTest.useMutation({
    onSuccess: () => {
      toast.success("🧪 Teste de envio realizado com sucesso!");
    },
    onError: (error) => {
      toast.error(`❌ Erro no teste: ${error.message}`);
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = (mode: "local" | "global") => {
    if (!selectedChannel && mode === "local") {
      toast.error("Selecione um canal para o envio local");
      return;
    }
    if (!imagePreview) {
      toast.error("Faça o upload de uma imagem para o banner de saída");
      return;
    }

    sendExitMutation.mutate({
      guildId: guildId || "",
      channelId: selectedChannel,
      mode,
      imageUrl: imagePreview,
      userName: user?.name || "Membro",
      userAvatar: user?.avatar || ""
    });
  };

  const handleTest = () => {
    if (!selectedChannel) {
      toast.error("Selecione um canal para o teste");
      return;
    }
    sendTestMutation.mutate({
      guildId: guildId || "",
      channelId: selectedChannel,
      type: "EXIT",
      imageUrl: imagePreview || "https://i.imgur.com/8nNfQfR.png" // Fallback image for test
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-primary flex items-center gap-3 tracking-tighter italic uppercase">
            <LogOut size={40} className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            Saída Magnatas
          </h1>
          <p className="text-muted-foreground font-medium">Gerencie a saída de membros do império</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleTest}
            disabled={sendTestMutation.isPending}
            className="border-primary text-primary hover:bg-primary/10 font-black uppercase italic gap-2"
          >
            <FlaskConical size={18} /> Testar Envio
          </Button>
          <Badge variant="outline" className="border-red-500/50 text-red-500 bg-red-500/5 px-4 py-1.5 text-sm font-bold uppercase tracking-widest">
            Sistema Magnatas (Saída)
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card className="border-border bg-[#0A0A0A] shadow-2xl overflow-hidden">
            <CardHeader className="bg-[#050505] border-b border-border/50">
              <CardTitle className="text-xl flex items-center gap-2 text-white uppercase italic font-black">
                <Settings className="h-5 w-5 text-primary" />
                Configuração de Saída
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              {/* Channel Selection */}
              <div className="space-y-3">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} className="text-primary" /> Selecionar Canal (Call)
                </label>
                <Select value={selectedChannel || ""} onValueChange={setSelectedChannel}>
                  <SelectTrigger className="bg-[#111] border-border/50 h-14 text-lg font-bold focus:ring-primary/50">
                    <SelectValue placeholder="Escolha o canal de destino..." />
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

              {/* Image Upload */}
              <div className="space-y-3">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Upload size={14} className="text-primary" /> Banner de Saída
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative border-2 border-dashed border-border/50 rounded-xl p-10 flex flex-col items-center justify-center gap-4 bg-[#111] hover:bg-[#151515] hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                  />
                  <div className="p-4 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                    <ImageIcon size={32} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-white uppercase italic">Clique para Upload</p>
                    <p className="text-xs text-muted-foreground font-bold">PNG, JPG ou GIF (Máx. 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <Button 
                  onClick={() => handleSend("local")}
                  disabled={sendExitMutation.isPending}
                  className="h-16 bg-white hover:bg-gray-200 text-black font-black uppercase italic text-lg gap-3 shadow-xl shadow-white/5"
                >
                  <Send size={20} /> Enviar Local
                </Button>
                <Button 
                  onClick={() => handleSend("global")}
                  disabled={sendExitMutation.isPending}
                  className="h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase italic text-lg gap-3 shadow-xl shadow-primary/20"
                >
                  <Globe size={20} /> Enviar Global
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Eye size={14} className="text-primary" /> Preview de Saída
            </h3>
            {imagePreview && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setImagePreview(null)}
                className="h-6 text-[10px] font-black uppercase text-destructive hover:bg-destructive/10"
              >
                <X size={12} className="mr-1" /> Remover Imagem
              </Button>
            )}
          </div>

          {/* Discord Style Embed Preview */}
          <div className="bg-[#313338] rounded-lg shadow-2xl overflow-hidden border border-white/5">
            {/* Banner */}
            <div className="relative h-48 bg-[#1e1f22] flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Banner Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/20">
                  <ImageIcon size={48} />
                  <p className="text-xs font-black uppercase italic">Banner Saída Magnatas</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#313338] to-transparent opacity-60" />
            </div>

            {/* Content */}
            <div className="p-6 relative -mt-12">
              <div className="flex items-end gap-4 mb-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-[#313338] shadow-xl grayscale opacity-70">
                    <AvatarImage src={user?.avatar || ""} />
                    <AvatarFallback className="bg-gray-600 text-white font-black text-2xl">
                      {user?.name?.[0] || "M"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-gray-500 border-4 border-[#313338] rounded-full" />
                </div>
                <div className="pb-2">
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                    🚪 Saída do clã Magnatas
                  </h2>
                  <p className="text-red-500 font-bold text-sm uppercase tracking-widest">1v99 • Membro Desconectado</p>
                </div>
              </div>

              <div className="space-y-4 bg-[#2b2d31] p-5 rounded-xl border border-white/5">
                <div className="space-y-1">
                  <p className="text-white font-bold text-lg">
                    <span className="text-red-500">@{user?.name || "usuario"}</span> saiu do império Magnatas.
                  </p>
                  <p className="text-gray-400 text-sm leading-relaxed italic">
                    "Um guerreiro a menos na linha de frente. O império continua sua marcha."
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1e1f22] p-3 rounded-lg border border-white/5">
                    <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Status</p>
                    <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                      <AlertTriangle size={12} /> Desconectado
                    </p>
                  </div>
                  <div className="bg-[#1e1f22] p-3 rounded-lg border border-white/5">
                    <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Motivo</p>
                    <p className="text-xs font-bold text-white">Saída Voluntária</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <LogOut size={12} className="text-red-500" />
                  <span>Sistema Magnatas (Saída) • {new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-red-500" />
                  <span>v1.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
