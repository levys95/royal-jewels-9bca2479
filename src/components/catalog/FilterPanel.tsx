import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterPanelProps {
  categories: Array<{ id: string; name: string }>;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (value: [number, number]) => void;
  maxPrice: number;
  stockFilter: string;
  onStockFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export const FilterPanel = ({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  maxPrice,
  stockFilter,
  onStockFilterChange,
  sortBy,
  onSortByChange,
  onReset,
  hasActiveFilters,
}: FilterPanelProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Réinitialiser
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Catégorie */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Catégorie</Label>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Prix */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Prix : {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
          </Label>
          <Slider
            min={0}
            max={maxPrice}
            step={100}
            value={priceRange}
            onValueChange={(value) => onPriceRangeChange(value as [number, number])}
            className="mt-2"
          />
        </div>

        {/* Stock */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Disponibilité</Label>
          <RadioGroup value={stockFilter} onValueChange={onStockFilterChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="stock-all" />
              <Label htmlFor="stock-all" className="font-normal cursor-pointer">
                Tous les articles
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="in-stock" id="stock-in" />
              <Label htmlFor="stock-in" className="font-normal cursor-pointer">
                En stock uniquement
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unique" id="stock-unique" />
              <Label htmlFor="stock-unique" className="font-normal cursor-pointer">
                Pièces uniques
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Tri */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Trier par</Label>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récent</SelectItem>
              <SelectItem value="price-asc">Prix croissant</SelectItem>
              <SelectItem value="price-desc">Prix décroissant</SelectItem>
              <SelectItem value="name">Nom A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
