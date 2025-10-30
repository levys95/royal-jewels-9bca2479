import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, User, Mail, Phone, Loader2 } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Le nom doit contenir moins de 100 caractères"),
  phone: z.string().trim().regex(/^(\+33|0)[1-9](\d{8})$/, "Numéro de téléphone invalide (format: 0612345678)").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Veuillez vous connecter");
          navigate("/auth");
          return;
        }

        setEmail(user.email || "");

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading profile:", error);
          toast.error("Erreur lors du chargement du profil");
          return;
        }

        if (profile) {
          setFullName(profile.full_name || "");
          setPhone(profile.phone || "");
        }
      } catch (error) {
        console.error("Error in loadProfile:", error);
        toast.error("Erreur lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    try {
      const formData = {
        full_name: fullName,
        phone: phone || "",
      };

      const result = profileSchema.safeParse(formData);

      if (!result.success) {
        const fieldErrors: Partial<Record<keyof ProfileFormData, string>> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ProfileFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        setSaving(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Session expirée");
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: result.data.full_name,
          phone: result.data.phone || null,
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast.error("Erreur lors de la mise à jour du profil");
        return;
      }

      toast.success("Profil mis à jour avec succès!");
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Crown className="h-8 w-8 text-accent animate-glow" />
            <h1 className="text-3xl font-serif text-primary">
              Mon Profil
            </h1>
          </div>

          <Card className="shadow-royal">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informations personnelles
              </CardTitle>
              <CardDescription>
                Gérez vos informations de compte
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    L'email ne peut pas être modifié
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Nom complet *
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jean Dupont"
                    className={errors.full_name ? "border-destructive" : ""}
                  />
                  {errors.full_name && (
                    <p className="text-xs text-destructive">{errors.full_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0612345678"
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    variant="royal"
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer les modifications"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}