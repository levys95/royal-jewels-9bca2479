import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import crownPlaceholder from "@/assets/crown-placeholder.jpg";
import necklacePlaceholder from "@/assets/necklace-placeholder.jpg";
import ringPlaceholder from "@/assets/ring-placeholder.jpg";

interface CartItem {
  id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    stock_quantity: number;
    categories?: {
      name: string;
    };
  };
}

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      loadCart(user.id);
    });
  }, [navigate]);

  const loadCart = async (userId: string) => {
    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_url,
          stock_quantity,
          categories (name)
        )
      `)
      .eq("user_id", userId);

    if (error) {
      toast.error("Erreur lors du chargement du panier");
      return;
    }

    setCartItems(data || []);
    setLoading(false);
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Produit retiré du panier");
    if (user) loadCart(user.id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPlaceholderImage = (category?: string) => {
    if (category?.toLowerCase().includes('couronne')) return crownPlaceholder;
    if (category?.toLowerCase().includes('collier')) return necklacePlaceholder;
    if (category?.toLowerCase().includes('bague')) return ringPlaceholder;
    return crownPlaceholder;
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.products.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-serif font-bold mb-8 gradient-royal bg-clip-text text-transparent">
          Mon Panier
        </h1>

        {cartItems.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Votre panier est vide</h2>
              <p className="text-muted-foreground mb-6">
                Découvrez notre collection de bijoux impériaux
              </p>
              <Button variant="royal" onClick={() => navigate("/catalog")}>
                Parcourir le catalogue
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const displayImage = item.products.image_url || getPlaceholderImage(item.products.categories?.name);
                
                return (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <img 
                          src={displayImage}
                          alt={item.products.name}
                          className="w-24 h-24 object-cover rounded-md"
                        />
                        
                        <div className="flex-1">
                          <h3 className="font-serif font-semibold text-lg mb-1">
                            {item.products.name}
                          </h3>
                          <p className="text-2xl font-bold text-primary mb-2">
                            {formatPrice(item.products.price)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Quantité: {item.quantity}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div>
              <Card className="sticky top-24 shadow-royal">
                <CardContent className="p-6">
                  <h3 className="text-xl font-serif font-bold mb-4">Récapitulatif</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span className="font-medium">{formatPrice(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Livraison</span>
                      <span className="font-medium">Gratuite</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between mb-6">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(calculateTotal())}
                    </span>
                  </div>

                  <Button 
                    variant="royal" 
                    size="lg" 
                    className="w-full"
                    onClick={() => navigate("/checkout")}
                  >
                    Commander
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => navigate("/catalog")}
                  >
                    Continuer mes achats
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
