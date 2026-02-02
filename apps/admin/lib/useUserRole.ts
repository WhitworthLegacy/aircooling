"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "./supabase";

export type UserRole = "technicien" | "admin" | "super_admin" | null;

export type RolePermissions = {
  role: UserRole;
  loading: boolean;
  canAccessDashboard: boolean;
  canAccessAppointments: boolean;
  canAccessPlan: boolean;
  canAccessClients: boolean;
  canAccessDevis: boolean;
  canAccessCRM: boolean;
  canAccessInventory: boolean;
  canAccessConversations: boolean;
  canAccessInterventions: boolean;
  canAccessMissions: boolean;
  canAccessFinances: boolean;
  canAccessSettings: boolean;
  canAccessUsers: boolean;
};

export function useUserRole(): RolePermissions {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setRole(null);
          return;
        }

        // Fetch role from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        setRole((profile?.role as UserRole) || null);
      } catch {
        setRole(null);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, []);

  const isAdmin = role === "admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";

  return {
    role,
    loading,
    // Technicien: dashboard + appointments + plan
    canAccessDashboard: role !== null,
    canAccessAppointments: role !== null,
    canAccessPlan: role !== null,
    // Admin+: everything except finances/settings/users
    canAccessClients: isAdmin,
    canAccessDevis: isAdmin,
    canAccessCRM: isAdmin,
    canAccessInventory: isAdmin,
    canAccessConversations: isAdmin,
    canAccessInterventions: isAdmin,
    canAccessMissions: isAdmin,
    // Super Admin only
    canAccessFinances: isSuperAdmin,
    canAccessSettings: isSuperAdmin,
    canAccessUsers: isSuperAdmin,
  };
}
