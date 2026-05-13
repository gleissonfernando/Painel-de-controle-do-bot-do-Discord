import { useState, useRef, useEffect } from "react";
import { useSession, Guild } from "@/contexts/SessionContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

export function InlineServerSelector() {
  const { guilds = [], activeGuild, setActiveGuild, isLoadingGuilds } = useSession();
  
  // Acessar ícones de forma segura para evitar undefined
  const ChevronDown = LucideIcons.ChevronDown || (() => null);
  const Search = LucideIcons.Search || (() => null);
  const Plus = LucideIcons.Plus || (() => null);
  const Settings = LucideIcons.Settings || (() => null);
  const Check = LucideIcons.Check || (() => null);
  const Users = LucideIcons.Users || (() => null);
  const ArrowRight = LucideIcons.ArrowRight || (() => null);
  const Loader2 = LucideIcons.Loader2 || (() => null);
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredGuilds = guilds.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map(w => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleSelect = (guild: Guild) => {
    setActiveGuild(guild.id);
    setIsOpen(false);
    // Navegar para o dashboard do servidor selecionado
    setLocation(`/dashboard/${guild.id}`);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-1">
        Servidor Atual
      </p>
      
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border ${
          isOpen 
            ? "bg-[#1e1e24] border-primary/30 ring-1 ring-primary/20 shadow-lg shadow-black/40" 
            : "bg-[#18181c] border-white/5 hover:border-white/10 hover:bg-[#1e1e24]"
        }`}
      >
        <div className="relative">
          <Avatar className="w-9 h-9 border border-white/5">
            {activeGuild?.icon ? (
              <AvatarImage
                src={`https://cdn.discordapp.com/icons/${activeGuild.id}/${activeGuild.icon}.png`}
                alt={activeGuild.name}
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {activeGuild ? getInitials(activeGuild.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#18181c] rounded-full shadow-sm" />
        </div>
        
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
            {activeGuild?.name || "Selecionar Servidor"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Users size={10} className="text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground font-medium">
              {activeGuild?.memberCount || 0} membros
            </p>
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className="text-muted-foreground" />
        </motion.div>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 right-0 z-50 mt-1 bg-[#18181c] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[420px]"
          >
            {/* Search Header */}
            <div className="p-3 border-b border-white/5 bg-[#1a1a20]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Filtrar servidores..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0f0f13] border border-white/5 rounded-lg py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Servers List */}
            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
              {isLoadingGuilds ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 size={24} className="text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground">Carregando servidores...</p>
                </div>
              ) : filteredGuilds.length > 0 ? (
                filteredGuilds.map((guild) => (
                  <button
                    key={guild.id}
                    onClick={() => handleSelect(guild)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all group ${
                      activeGuild?.id === guild.id 
                        ? "bg-primary/5 border-l-2 border-primary" 
                        : "hover:bg-white/5 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="w-8 h-8 border border-white/5">
                        {guild.icon ? (
                          <AvatarImage
                            src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                            alt={guild.name}
                          />
                        ) : null}
                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                          {getInitials(guild.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#18181c] rounded-full" />
                    </div>
                    
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-medium truncate ${activeGuild?.id === guild.id ? "text-primary" : "text-foreground"}`}>
                          {guild.name}
                        </p>
                        {activeGuild?.id === guild.id && (
                          <Check size={12} className="text-green-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {guild.memberCount} membros
                      </p>
                    </div>
                    
                    <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </button>
                ))
              ) : (
                <div className="py-8 px-4 text-center">
                  <p className="text-xs text-muted-foreground">Nenhum servidor encontrado</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-2 border-t border-white/5 bg-[#1a1a20] grid grid-cols-2 gap-2">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setLocation("/servers");
                }}
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium text-foreground transition-colors border border-white/5"
              >
                <Plus size={14} className="text-primary" />
                Novo
              </button>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setLocation(`/dashboard/${activeGuild?.id}/general`);
                }}
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium text-foreground transition-colors border border-white/5"
              >
                <Settings size={14} className="text-muted-foreground" />
                Gerenciar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
