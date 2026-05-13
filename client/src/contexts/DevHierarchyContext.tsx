import React, { createContext, useContext, useState, useEffect } from "react";

export type DevRole = "master" | "creator" | "helper" | "none";

interface DevUser {
  id: string;
  username: string;
  role: DevRole;
  createdAt: number;
}

interface DevHierarchyContextType {
  currentRole: DevRole;
  devUsers: DevUser[];
  addDevUser: (user: DevUser) => void;
  removeDevUser: (userId: string) => void;
  updateDevRole: (userId: string, role: DevRole) => void;
  canManageDevs: () => boolean;
  canAccessDev: () => boolean;
}

const DevHierarchyContext = createContext<DevHierarchyContextType | undefined>(undefined);

// ID do desenvolvedor mestre
const MASTER_DEV_ID = "761011766440230932";

interface DevHierarchyProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function DevHierarchyProvider({
  children,
  userId,
}: DevHierarchyProviderProps) {
  const [devUsers, setDevUsers] = useState<DevUser[]>(() => {
    const saved = localStorage.getItem("dev_users");
    return saved ? JSON.parse(saved) : [];
  });

  const currentRole: DevRole = userId === MASTER_DEV_ID ? "master" : 
    devUsers.find(u => u.id === userId)?.role || "none";

  useEffect(() => {
    localStorage.setItem("dev_users", JSON.stringify(devUsers));
  }, [devUsers]);

  const addDevUser = (user: DevUser) => {
    if (currentRole !== "master" && currentRole !== "creator") {
      throw new Error("Você não tem permissão para adicionar desenvolvedores");
    }
    
    setDevUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) {
        return prev.map(u => u.id === user.id ? user : u);
      }
      return [...prev, user];
    });
  };

  const removeDevUser = (userId: string) => {
    if (currentRole !== "master") {
      throw new Error("Apenas o desenvolvedor mestre pode remover desenvolvedores");
    }
    
    setDevUsers(prev => prev.filter(u => u.id !== userId));
  };

  const updateDevRole = (userId: string, role: DevRole) => {
    if (currentRole !== "master") {
      throw new Error("Apenas o desenvolvedor mestre pode alterar roles");
    }
    
    setDevUsers(prev =>
      prev.map(u => u.id === userId ? { ...u, role } : u)
    );
  };

  const canManageDevs = () => {
    return currentRole === "master" || currentRole === "creator";
  };

  const canAccessDev = () => {
    return currentRole !== "none";
  };

  return (
    <DevHierarchyContext.Provider
      value={{
        currentRole,
        devUsers,
        addDevUser,
        removeDevUser,
        updateDevRole,
        canManageDevs,
        canAccessDev,
      }}
    >
      {children}
    </DevHierarchyContext.Provider>
  );
}

export function useDevHierarchy() {
  const context = useContext(DevHierarchyContext);
  if (context === undefined) {
    throw new Error("useDevHierarchy must be used within a DevHierarchyProvider");
  }
  return context;
}
