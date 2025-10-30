import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  created_at: string;
  order_items: Array<{
    quantity: number;
    unit_price: number;
    products: {
      name: string;
    };
  }>;
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
        return;
      }
      loadOrders(user.id);
    });
  }, [navigate]);

  const loadOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          quantity,
          unit_price,
          products (name)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erreur lors du chargement des commandes");
      return;
    }

    setOrders(data || []);
    setLoading(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-500",
      paid: "bg-blue-500",
      processing: "bg-purple-500",
      shipped: "bg-orange-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500",
    };

    const statusLabels: Record<string, string> = {
      pending: "En attente",
      paid: "Payée",
      processing: "En traitement",
      shipped: "Expédiée",
      delivered: "Livrée",
      cancelled: "Annulée",
    };

    return (
      <Badge className={`${statusColors[status]} text-white`}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <LoadingSpinner size="lg" text="Chargement de vos commandes..." className="py-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-serif font-bold mb-8 text-primary">
          Mes Commandes
        </h1>

        {orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Aucune commande"
            description="Vous n'avez pas encore passé de commande"
            action={{
              label: "Découvrir le catalogue",
              onClick: () => navigate("/catalog")
            }}
          />
        ) : (
          <div className="space-y-6 animate-fade-in">
            {orders.map((order, index) => (
              <Card 
                key={order.id} 
                className="shadow-elegant hover:shadow-royal transition-royal animate-slide-up"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-serif font-bold text-xl mb-2">
                          Commande #{order.id.slice(0, 8)}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Articles</h4>
                      {order.order_items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                          <span className="text-muted-foreground">
                            {item.products.name} x{item.quantity}
                          </span>
                          <span className="font-medium">
                            {formatPrice(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Adresse de livraison</p>
                        <p className="text-muted-foreground">
                          {order.shipping_address}<br />
                          {order.shipping_postal_code} {order.shipping_city}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
