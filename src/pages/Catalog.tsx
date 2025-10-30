import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import { ProductSkeletonGrid } from "@/components/catalog/ProductSkeleton";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  era?: string;
  original_owner?: string;
  stock_quantity: number;
  category_id?: string;
  categories?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [loading, setLoading] = useState(true);

  const maxPrice = useMemo(() => {
    if (products.length === 0) return 100000;
    return Math.max(...products.map(p => p.price));
  }, [products]);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0 && priceRange[1] === 100000) {
      setPriceRange([0, maxPrice]);
    }
  }, [maxPrice, products.length]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Erreur lors du chargement des catégories");
      return;
    }

    setCategories(data || []);
  };

  const loadProducts = async () => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select(`
        *,
        categories (name)
      `)
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      toast.error("Erreur lors du chargement des produits");
      setLoading(false);
      return;
    }

    setProducts(data || []);
    setLoading(false);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.original_owner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.era?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesStock = 
        stockFilter === "all" ? true :
        stockFilter === "in-stock" ? product.stock_quantity > 0 :
        stockFilter === "unique" ? product.stock_quantity === 1 : true;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });

    // Tri
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "recent":
      default:
        // Déjà trié par created_at desc dans la requête
        break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, priceRange, stockFilter, sortBy]);

  const hasActiveFilters = 
    selectedCategory !== "all" || 
    stockFilter !== "all" || 
    priceRange[0] !== 0 || 
    priceRange[1] !== maxPrice ||
    searchQuery !== "";

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setStockFilter("all");
    setPriceRange([0, maxPrice]);
    setSearchQuery("");
    setSortBy("recent");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2 text-primary">
            Catalogue Impérial
          </h1>
          <p className="text-muted-foreground">
            Explorez notre collection exclusive de bijoux royaux
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, propriétaire, époque..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Panneau de filtres */}
          <aside className="lg:col-span-1">
            <FilterPanel
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              maxPrice={maxPrice}
              stockFilter={stockFilter}
              onStockFilterChange={setStockFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              onReset={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </aside>

          {/* Liste des produits */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {loading ? "Chargement..." : `${filteredAndSortedProducts.length} bijou${filteredAndSortedProducts.length > 1 ? 'x' : ''} trouvé${filteredAndSortedProducts.length > 1 ? 's' : ''}`}
              </p>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  Filtres actifs
                </Badge>
              )}
            </div>

            {loading ? (
              <ProductSkeletonGrid count={6} />
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground mb-2">Aucun bijou trouvé</p>
                <p className="text-sm text-muted-foreground">
                  Essayez d'ajuster vos critères de recherche
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {filteredAndSortedProducts.map(product => (
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
          </div>
        </div>
      </main>
    </div>
  );
}
