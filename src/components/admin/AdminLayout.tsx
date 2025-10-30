import { Link, useLocation, Outlet } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FolderTree,
  FileText,
  LogOut,
  Crown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AdminLayout = () => {
  const { isAdmin, isLoading } = useAdminCheck();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", path: "/admin/dashboard" },
    { icon: Package, label: "Produits", path: "/admin/products" },
    { icon: ShoppingCart, label: "Commandes", path: "/admin/orders" },
    { icon: FolderTree, label: "Catégories", path: "/admin/categories" },
    { icon: Users, label: "Utilisateurs", path: "/admin/users" },
    { icon: FileText, label: "Logs", path: "/admin/logs" },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border shadow-lg">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <Crown className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground font-serif">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Bijoux Impériaux</p>
            </div>
          </Link>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-royal"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-3"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
