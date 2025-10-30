import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AdminLog {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

const Logs = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from("admin_logs")
          .select(`
            id,
            created_at,
            action,
            entity_type,
            entity_id,
            details,
            admin_id
          `)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;

        // Fetch profiles separately
        const logsWithProfiles = await Promise.all(
          (data || []).map(async (log) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", log.admin_id)
              .single();

            return {
              ...log,
              profiles: profile || { email: "", full_name: null },
            };
          })
        );

        setLogs(logsWithProfiles);
      } catch (error) {
        console.error("Error fetching logs:", error);
        toast.error("Erreur lors du chargement des logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    const variants: Record<string, string> = {
      CREATE: "bg-green-500/10 text-green-700 border-green-500/20",
      UPDATE: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      DELETE: "bg-red-500/10 text-red-700 border-red-500/20",
    };

    return (
      <Badge variant="outline" className={variants[action] || ""}>
        {action}
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
          Journal d'activité
        </h1>
        <p className="text-muted-foreground">
          Historique des actions administrateurs (100 dernières entrées)
        </p>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Heure</TableHead>
              <TableHead>Administrateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Type d'entité</TableHead>
              <TableHead>Détails</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs">
                  {new Date(log.created_at).toLocaleString("fr-FR")}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {log.profiles.full_name || log.profiles.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{log.profiles.email}</p>
                  </div>
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{log.entity_type}</Badge>
                </TableCell>
                <TableCell>
                  {log.details && (
                    <pre className="text-xs text-muted-foreground max-w-md overflow-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Logs;
