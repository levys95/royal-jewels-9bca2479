import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripePaymentForm } from "@/components/checkout/StripePaymentForm";

// Note: Remplacer par votre clé publique Stripe quand disponible
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface CartItem {
  id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
  };
}

export default function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<"shipping" | "payment">("shipping");

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
        products (id, name, price, stock_quantity)
      `)
      .eq("user_id", userId);

    if (error || !data || data.length === 0) {
      toast.error("Votre panier est vide");
      navigate("/cart");
      return;
    }

    setCartItems(data);
    setLoading(false);
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.products.price * item.quantity), 0);
  };

  const createPendingOrder = async (shippingData: any) => {
    setProcessing(true);

    try {
      // Vérifier le stock
      for (const item of cartItems) {
        if (item.products.stock_quantity < item.quantity) {
          toast.error(`Stock insuffisant pour ${item.products.name}`);
          setProcessing(false);
          return;
        }
      }

      // Créer la commande avec payment_status: "pending"
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: calculateTotal(),
          status: "pending",
          payment_status: "pending", // ✅ En attente du paiement
          shipping_address: shippingData.address,
          shipping_city: shippingData.city,
          shipping_postal_code: shippingData.postalCode,
          shipping_country: shippingData.country,
        })
        .select()
        .single();

      if (orderError || !order) {
        toast.error("Erreur lors de la création de la commande");
        setProcessing(false);
        return;
      }

      // Créer les items de commande
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.products.id,
        quantity: item.quantity,
        unit_price: item.products.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        toast.error("Erreur lors de la création de la commande");
        setProcessing(false);
        return;
      }

      setOrderId(order.id);

      // Appeler l'Edge Function pour créer Payment Intent
      const { data, error: functionError } = await supabase.functions.invoke(
        "create-payment-intent",
        {
          body: {
            amount: calculateTotal(),
            orderId: order.id,
            metadata: { userId: user.id },
          },
        }
      );

      if (functionError || !data?.clientSecret) {
        // Si Stripe n'est pas configuré, on simule le paiement
        if (functionError?.message?.includes("Stripe n'est pas configuré")) {
          toast.info("Mode démo : paiement simulé");
          await handlePaymentSuccess(order.id);
        } else {
          toast.error("Erreur lors de l'initialisation du paiement");
          setProcessing(false);
        }
        return;
      }

      setClientSecret(data.clientSecret);
      setPaymentStep("payment");
      setProcessing(false);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Une erreur est survenue");
      setProcessing(false);
    }
  };

  const handleShippingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const shippingData = {
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      postalCode: formData.get("postalCode") as string,
      country: "France",
    };
    await createPendingOrder(shippingData);
  };

  const handlePaymentSuccess = async (paymentOrderId?: string) => {
    const targetOrderId = paymentOrderId || orderId;
    
    try {
      // Si on a un orderId, on met à jour le stock et vide le panier
      if (targetOrderId) {
        // Mettre à jour le stock
        for (const item of cartItems) {
          await supabase
            .from("products")
            .update({ 
              stock_quantity: item.products.stock_quantity - item.quantity 
            })
            .eq("id", item.products.id);
        }

        // Vider le panier
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id);

        // Marquer comme payé si c'est une simulation
        if (paymentOrderId) {
          await supabase
            .from("orders")
            .update({ payment_status: "paid", status: "processing" })
            .eq("id", paymentOrderId);
        }
      }

      toast.success("Paiement accepté ! Commande confirmée.");
      setTimeout(() => navigate("/orders"), 1500);
    } catch (error) {
      console.error("Error in payment success:", error);
      toast.error("Une erreur est survenue");
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
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
          Finaliser la commande
        </h1>

        {paymentStep === "shipping" ? (
          <form onSubmit={handleShippingSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de livraison</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="address">Adresse</Label>
                      <Input id="address" name="address" required />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Ville</Label>
                        <Input id="city" name="city" required />
                      </div>
                      <div>
                        <Label htmlFor="postalCode">Code postal</Label>
                        <Input id="postalCode" name="postalCode" required />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="sticky top-24 shadow-royal">
                  <CardHeader>
                    <CardTitle>Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.products.name} x{item.quantity}
                          </span>
                          <span className="font-medium">
                            {formatPrice(item.products.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(calculateTotal())}</span>
                    </div>

                    <Button 
                      type="submit" 
                      variant="royal" 
                      size="lg" 
                      className="w-full"
                      disabled={processing}
                    >
                      {processing ? "Traitement..." : "Continuer vers le paiement"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Paiement sécurisé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientSecret && stripePromise ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripePaymentForm
                        onSuccess={() => handlePaymentSuccess()}
                        onError={handlePaymentError}
                      />
                    </Elements>
                  ) : (
                    <div className="bg-muted p-6 rounded-lg text-center">
                      <Lock className="h-12 w-12 text-accent mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Initialisation du paiement...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-24 shadow-royal">
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.products.name} x{item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatPrice(item.products.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(calculateTotal())}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
