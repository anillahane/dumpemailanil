import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "auditor" | "auditee" | "reviewer";

export interface User {
  id: string;
  name: string;
  empId: string;
  role: UserRole;
  baseLocation: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Record<UserRole, User> = {
  admin: { id: "1", name: "Naveen Kumar", empId: "EMP1001", role: "admin", baseLocation: "Bangalore" },
  auditor: { id: "2", name: "Arun Sharma", empId: "EMP1012", role: "auditor", baseLocation: "Hubli" },
  auditee: { id: "3", name: "Ramesh Patil", empId: "EMP2045", role: "auditee", baseLocation: "Mysore" },
  reviewer: { id: "4", name: "Balaji Rao", empId: "EMP1005", role: "reviewer", baseLocation: "Bangalore" },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (role: UserRole) => setUser(MOCK_USERS[role]);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
