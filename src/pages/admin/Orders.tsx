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
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/OrderStatusBadge";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  profiles: {
    email: string;
    full_name: string | null;
    phone: string | null;
  };
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          total_amount,
          status,
          payment_status,
          shipping_address,
          shipping_city,
          shipping_postal_code,
          user_id
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const ordersWithProfiles = await Promise.all(
        (data || []).map(async (order) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name, phone")
            .eq("id", order.user_id)
            .single();

          return {
            ...order,
            profiles: profile || { email: "", full_name: null, phone: null },
          };
        })
      );

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Statut mis à jour avec succès");
      fetchOrders();

      // Log admin action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("admin_logs").insert({
          admin_id: user.id,
          action: "UPDATE",
          entity_type: "order",
          entity_id: orderId,
          details: { status: newStatus },
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
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
          Gestion des commandes
        </h1>
        <p className="text-muted-foreground">Gérez toutes les commandes de la boutique</p>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">
                  {order.id.substring(0, 8)}...
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {order.profiles.full_name || order.profiles.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{order.profiles.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell className="font-bold">
                  {Number(order.total_amount).toLocaleString("fr-FR")} €
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={order.payment_status as any} />
                </TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onValueChange={(value) => handleStatusChange(order.id, value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="processing">En cours</SelectItem>
                      <SelectItem value="shipped">Expédié</SelectItem>
                      <SelectItem value="delivered">Livré</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Client</p>
                  <p className="font-medium">
                    {selectedOrder.profiles.full_name || selectedOrder.profiles.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.profiles.email}</p>
                  {selectedOrder.profiles.phone && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.profiles.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Adresse de livraison</p>
                  <p>{selectedOrder.shipping_address}</p>
                  <p>
                    {selectedOrder.shipping_postal_code} {selectedOrder.shipping_city}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Statut</p>
                  <OrderStatusBadge status={selectedOrder.status as any} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paiement</p>
                  <PaymentStatusBadge status={selectedOrder.payment_status as any} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Montant total</p>
                  <p className="text-2xl font-bold">
                    {Number(selectedOrder.total_amount).toLocaleString("fr-FR")} €
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
