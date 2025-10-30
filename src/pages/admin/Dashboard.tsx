import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatsCard from "@/components/admin/StatsCard";
import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/OrderStatusBadge";

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
}

interface RecentOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total revenue and orders
        const { data: orders } = await supabase
          .from("orders")
          .select("total_amount, payment_status");

        const totalRevenue = orders
          ?.filter(o => o.payment_status === "paid")
          .reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

        // Fetch products count
        const { count: productsCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true });

        // Fetch users count
        const { count: usersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Fetch recent orders with profiles
        const { data: recentOrdersData } = await supabase
          .from("orders")
          .select(`
            id,
            created_at,
            total_amount,
            status,
            payment_status,
            user_id
          `)
          .order("created_at", { ascending: false })
          .limit(10);

        // Fetch profiles separately
        const ordersWithProfiles = await Promise.all(
          (recentOrdersData || []).map(async (order) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", order.user_id)
              .single();

            return {
              ...order,
              profiles: profile || { email: "", full_name: null },
            };
          })
        );

        setStats({
          totalRevenue,
          totalOrders: orders?.length || 0,
          totalProducts: productsCount || 0,
          totalUsers: usersCount || 0,
        });

        setRecentOrders(ordersWithProfiles);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground font-serif mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de votre boutique impériale</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Chiffre d'affaires"
          value={`${stats.totalRevenue.toLocaleString("fr-FR")} €`}
          icon={TrendingUp}
        />
        <StatsCard
          title="Commandes"
          value={stats.totalOrders}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Produits"
          value={stats.totalProducts}
          icon={Package}
        />
        <StatsCard
          title="Utilisateurs"
          value={stats.totalUsers}
          icon={Users}
        />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {order.profiles.full_name || order.profiles.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold">{Number(order.total_amount).toLocaleString("fr-FR")} €</p>
                  <OrderStatusBadge status={order.status as any} />
                  <PaymentStatusBadge status={order.payment_status as any} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
