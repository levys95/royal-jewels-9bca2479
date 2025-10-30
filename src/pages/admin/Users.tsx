import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  user_roles: Array<{ role: string }>;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          phone,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user roles separately
      const usersWithRoles = await Promise.all(
        (data || []).map(async (user) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);

          return {
            ...user,
            user_roles: roles || [],
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // First, remove existing roles
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Then add the new role
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: newRole as "admin" | "client" | "livreur" }]);

      if (error) throw error;

      toast.success("Rôle mis à jour avec succès");
      fetchUsers();

      // Log admin action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("admin_logs").insert({
          admin_id: user.id,
          action: "UPDATE",
          entity_type: "user_role",
          entity_id: userId,
          details: { role: newRole },
        });
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Erreur lors de la mise à jour du rôle");
    }
  };

  const getRoleBadge = (roles: Array<{ role: string }>) => {
    if (!roles || roles.length === 0) return <Badge variant="outline">Client</Badge>;

    const role = roles[0].role;
    const variants: Record<string, { label: string; className: string }> = {
      admin: { label: "Administrateur", className: "bg-primary text-primary-foreground" },
      livreur: { label: "Livreur", className: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
      client: { label: "Client", className: "bg-gray-500/10 text-gray-700 border-gray-500/20" },
    };

    const config = variants[role] || variants.client;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground font-serif mb-2">
          Gestion des utilisateurs
        </h1>
        <p className="text-muted-foreground">Gérez les utilisateurs et leurs rôles</p>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nom complet</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Date d'inscription</TableHead>
              <TableHead>Rôle actuel</TableHead>
              <TableHead>Changer le rôle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const currentRole = user.user_roles?.[0]?.role || "client";
              
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.full_name || "-"}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>{getRoleBadge(user.user_roles)}</TableCell>
                  <TableCell>
                    <Select
                      value={currentRole}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="livreur">Livreur</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Users;
