import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

const productSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  description: z.string().optional(),
  price: z.number().min(0, "Le prix doit être positif"),
  stock_quantity: z.number().min(0, "Le stock doit être positif"),
  category_id: z.string().min(1, "La catégorie est requise"),
  is_available: z.boolean(),
  image_url: z.string().optional(),
  era: z.string().optional(),
  original_owner: z.string().optional(),
  historical_info: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock_quantity: 1,
      category_id: "",
      is_available: true,
      image_url: "",
      era: "",
      original_owner: "",
      historical_info: "",
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("id, name");
      setCategories(data || []);
    };

    fetchCategories();

    if (isEdit) {
      fetchProduct();
    }
  }, [isEdit, id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      form.reset({
        name: data.name,
        description: data.description || "",
        price: Number(data.price),
        stock_quantity: data.stock_quantity,
        category_id: data.category_id || "",
        is_available: data.is_available,
        image_url: data.image_url || "",
        era: data.era || "",
        original_owner: data.original_owner || "",
        historical_info: data.historical_info || "",
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Erreur lors du chargement du produit");
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (isEdit) {
        const { error } = await supabase
          .from("products")
          .update({
            name: data.name,
            description: data.description,
            price: data.price,
            stock_quantity: data.stock_quantity,
            category_id: data.category_id,
            is_available: data.is_available,
            image_url: data.image_url,
            era: data.era,
            original_owner: data.original_owner,
            historical_info: data.historical_info,
          })
          .eq("id", id);

        if (error) throw error;

        // Log admin action
        if (user) {
          await supabase.from("admin_logs").insert({
            admin_id: user.id,
            action: "UPDATE",
            entity_type: "product",
            entity_id: id,
            details: { name: data.name },
          });
        }

        toast.success("Produit mis à jour avec succès");
      } else {
        const { error } = await supabase.from("products").insert([{
          name: data.name,
          description: data.description,
          price: data.price,
          stock_quantity: data.stock_quantity,
          category_id: data.category_id,
          is_available: data.is_available,
          image_url: data.image_url,
          era: data.era,
          original_owner: data.original_owner,
          historical_info: data.historical_info,
        }]);

        if (error) throw error;

        // Log admin action
        if (user) {
          await supabase.from("admin_logs").insert({
            admin_id: user.id,
            action: "CREATE",
            entity_type: "product",
            details: { name: data.name },
          });
        }

        toast.success("Produit créé avec succès");
      }

      navigate("/admin/products");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Erreur lors de l'enregistrement du produit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/products")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold text-foreground font-serif">
            {isEdit ? "Modifier le produit" : "Nouveau produit"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "Modifiez les informations du produit" : "Ajoutez un nouveau bijou impérial"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <ImageUpload
                currentImage={form.watch("image_url")}
                onImageUploaded={(url) => form.setValue("image_url", url)}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du produit *</FormLabel>
                      <FormControl>
                        <Input placeholder="Couronne impériale..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix (€) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="era"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Époque</FormLabel>
                      <FormControl>
                        <Input placeholder="Premier Empire, Second Empire..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="original_owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Propriétaire d'origine</FormLabel>
                      <FormControl>
                        <Input placeholder="Napoléon Ier, Eugénie..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description détaillée du bijou..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="historical_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Informations historiques</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Histoire et provenance du bijou..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_available"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Disponible à la vente</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Activez pour rendre ce produit visible sur le site
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" variant="royal" disabled={loading}>
                  {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/products")}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;
