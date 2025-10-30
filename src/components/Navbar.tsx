import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, ShoppingCart, User, LogOut, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

export const Navbar = () => {
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        loadCartCount(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        loadCartCount(session.user.id);
      } else {
        setIsAdmin(false);
        setCartCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    if (!error && data) {
      setIsAdmin(true);
    }
  };

  const loadCartCount = async (userId: string) => {
    const { data, error } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("user_id", userId);
    
    if (!error && data) {
      const total = data.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-elegant">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Crown className="h-8 w-8 text-accent animate-glow" />
          <span className="text-xl font-serif font-bold gradient-royal bg-clip-text text-transparent">
            Bijoux Impériaux
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/catalog"
            className={`text-sm font-medium transition-royal ${
              isActive("/catalog") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Catalogue
          </Link>
          
          {user && (
            <>
              <Link
                to="/orders"
                className={`text-sm font-medium transition-royal ${
                  isActive("/orders") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mes Commandes
              </Link>
              
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1 text-sm font-medium transition-royal ${
                    isActive("/admin") ? "text-accent" : "text-muted-foreground hover:text-accent"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  Administration
                </Link>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 gradient-gold text-xs">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              
              <Link to="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>

              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="outline">Connexion</Button>
              </Link>
              <Link to="/auth?mode=register">
                <Button variant="royal">S'inscrire</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
