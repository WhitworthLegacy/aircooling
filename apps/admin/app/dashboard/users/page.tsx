"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Shield,
  ShieldCheck,
  Wrench,
  MoreVertical,
  Mail,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Card, Button, Badge, Input, Select, Modal } from "@/components/ui";
import { useUserRole } from "@/lib/useUserRole";
import { apiFetch } from "@/lib/apiClient";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
};

const ROLE_OPTIONS = [
  { value: "technicien", label: "Technicien" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const ROLE_ICONS: Record<string, typeof Shield> = {
  technicien: Wrench,
  admin: Shield,
  super_admin: ShieldCheck,
};

const ROLE_COLORS: Record<string, string> = {
  technicien: "bg-blue-100 text-blue-800",
  admin: "bg-purple-100 text-purple-800",
  super_admin: "bg-amber-100 text-amber-800",
};

export default function UsersPage() {
  const router = useRouter();
  const { canAccessUsers, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("technicien");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!roleLoading && !canAccessUsers) {
      router.push("/dashboard");
    }
  }, [roleLoading, canAccessUsers, router]);

  useEffect(() => {
    if (canAccessUsers) {
      fetchUsers();
    }
  }, [canAccessUsers]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await apiFetch<any>("/api/admin/users");
      setUsers(res.data?.users || res.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    setCreating(true);
    try {
      await apiFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
      });
      setShowCreateModal(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("technicien");
      await fetchUsers();
    } catch (err) {
      console.error("Failed to create user:", err);
    } finally {
      setCreating(false);
    }
  };

  const updateRole = async (userId: string, role: string) => {
    setUpdating(true);
    try {
      await apiFetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
      setEditingUser(null);
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("fr-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (roleLoading || !canAccessUsers) return null;

  return (
    <PageContainer>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-airDark">Utilisateurs</h1>
            <p className="text-sm text-airMuted mt-1">
              {users.length} utilisateur{users.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant="primary"
            icon={<UserPlus className="w-5 h-5" />}
            onClick={() => setShowCreateModal(true)}
          >
            Ajouter
          </Button>
        </div>

        {loading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-airPrimary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-airMuted">Chargement...</p>
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-airBorder">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Rôle</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Créé le</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Dernière connexion</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const RoleIcon = ROLE_ICONS[user.role] || Shield;
                    return (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-airMuted" />
                            <span className="font-medium text-airDark">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {editingUser === user.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                className="text-sm border border-airBorder rounded-lg px-2 py-1"
                                defaultValue={user.role}
                                onChange={(e) => updateRole(user.id, e.target.value)}
                                disabled={updating}
                              >
                                {ROLE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="text-xs text-airMuted hover:text-airDark"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                ROLE_COLORS[user.role] || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              <RoleIcon className="w-3 h-3" />
                              {ROLE_OPTIONS.find((o) => o.value === user.role)?.label || user.role}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-airMuted">{formatDate(user.created_at)}</td>
                        <td className="px-4 py-3 text-airMuted">{formatDate(user.last_sign_in_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-airMuted hover:text-airDark transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Create user modal */}
        {showCreateModal && (
          <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nouvel utilisateur">
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="nom@aircooling.be"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                icon={<Mail className="w-5 h-5" />}
              />
              <Input
                label="Mot de passe"
                type="password"
                placeholder="Minimum 8 caractères"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Select
                label="Rôle"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                options={ROLE_OPTIONS}
              />
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={createUser}
                  loading={creating}
                  disabled={!newEmail || !newPassword}
                  className="flex-1"
                >
                  Créer
                </Button>
              </div>
            </div>
          </Modal>
        )}
    </PageContainer>
  );
}
