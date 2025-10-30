import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  era?: string;
  original_owner?: string;
  stock_quantity: number;
  categories?: {
    name: string;
  };
}

export default function Favorites() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
      loadFavorites(user.id);
    });
  }, [navigate]);

  const loadFavorites = async (uid: string) => {
    const { data, error } = await supabase
      .from("favorites")
      .select(`
        product_id,
        products (
          id,
          name,
          price,
          image_url,
          era,
          original_owner,
          stock_quantity,
          categories (name)
        )
      `)
      .eq("user_id", uid);

    if (error) {
      console.error("Error loading favorites:", error);
    } else {
      const favoriteProducts = data
        .map(f => f.products)
        .filter(p => p !== null) as unknown as Product[];
      setProducts(favoriteProducts);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <LoadingSpinner size="lg" text="Chargement de vos favoris..." className="py-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <h1 className="text-4xl font-serif font-bold text-primary">
            Mes Favoris
          </h1>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Aucun favori"
            description="Ajoutez des produits à vos favoris en cliquant sur le cœur ❤️"
            action={{
              label: "Découvrir le catalogue",
              onClick: () => navigate("/catalog")
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image_url={product.image_url}
                era={product.era}
                original_owner={product.original_owner}
                stock_quantity={product.stock_quantity}
                category={product.categories?.name}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
