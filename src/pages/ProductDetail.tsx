import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Crown, ArrowLeft, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import crownPlaceholder from "@/assets/crown-placeholder.jpg";
import necklacePlaceholder from "@/assets/necklace-placeholder.jpg";
import ringPlaceholder from "@/assets/ring-placeholder.jpg";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  historical_info?: string;
  original_owner?: string;
  era?: string;
  categories?: {
    name: string;
  };
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (name)
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Erreur lors du chargement du produit");
      navigate("/catalog");
      return;
    }

    setProduct(data);
    setLoading(false);
  };

  const addToCart = async () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour ajouter au panier");
      navigate("/auth");
      return;
    }

    if (!product || product.stock_quantity === 0) {
      toast.error("Ce produit n'est plus disponible");
      return;
    }

    setAdding(true);

    const { data: existing, error: checkError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();

    if (checkError) {
      toast.error("Erreur lors de l'ajout au panier");
      setAdding(false);
      return;
    }

    if (existing) {
      toast.info("Ce produit est déjà dans votre panier");
      setAdding(false);
      navigate("/cart");
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .insert({
        user_id: user.id,
        product_id: product.id,
        quantity: 1,
      });

    if (error) {
      toast.error("Erreur lors de l'ajout au panier");
    } else {
      toast.success("Produit ajouté au panier!");
      setTimeout(() => navigate("/cart"), 1000);
    }

    setAdding(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPlaceholderImage = () => {
    if (product?.categories?.name.toLowerCase().includes('couronne')) return crownPlaceholder;
    if (product?.categories?.name.toLowerCase().includes('collier')) return necklacePlaceholder;
    if (product?.categories?.name.toLowerCase().includes('bague')) return ringPlaceholder;
    return crownPlaceholder;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const displayImage = product.image_url || getPlaceholderImage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/catalog")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au catalogue
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative">
            <img 
              src={displayImage} 
              alt={product.name}
              className="w-full h-auto rounded-lg shadow-royal"
            />
            {product.stock_quantity === 1 && (
              <Badge className="absolute top-4 right-4 gradient-gold">
                <Crown className="h-3 w-3 mr-1" />
                Pièce Unique
              </Badge>
            )}
          </div>

          <div>
            <div className="mb-4">
              {product.categories && (
                <Badge variant="outline" className="mb-2">
                  {product.categories.name}
                </Badge>
              )}
              <h1 className="text-4xl font-serif font-bold mb-2 gradient-royal bg-clip-text text-transparent">
                {product.name}
              </h1>
              {product.era && (
                <p className="text-lg text-muted-foreground">{product.era}</p>
              )}
              {product.original_owner && (
                <p className="text-sm text-muted-foreground italic">
                  Propriétaire original: {product.original_owner}
                </p>
              )}
            </div>

            <div className="text-4xl font-bold text-primary mb-6">
              {formatPrice(product.price)}
            </div>

            {product.description && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{product.description}</p>
                </CardContent>
              </Card>
            )}

            {product.historical_info && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Crown className="h-5 w-5 text-accent" />
                    Histoire Impériale
                  </h3>
                  <p className="text-muted-foreground">{product.historical_info}</p>
                </CardContent>
              </Card>
            )}

            <Separator className="my-6" />

            <div className="flex items-center gap-4 mb-6">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Disponibilité</p>
                <p className="text-sm text-muted-foreground">
                  {product.stock_quantity > 0 ? `${product.stock_quantity} en stock` : 'Épuisé'}
                </p>
              </div>
            </div>

            <Button 
              variant="royal" 
              size="lg" 
              className="w-full" 
              disabled={product.stock_quantity === 0 || adding}
              onClick={addToCart}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {adding ? 'Ajout en cours...' : product.stock_quantity === 0 ? 'Indisponible' : 'Ajouter au panier'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
