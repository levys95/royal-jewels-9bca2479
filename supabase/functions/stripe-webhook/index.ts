import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!stripeKey) {
    console.error("STRIPE_SECRET_KEY not configured");
    return new Response(
      JSON.stringify({ error: "Stripe not configured" }),
      { status: 500 }
    );
  }

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return new Response(
      JSON.stringify({ error: "Webhook secret not configured" }),
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2023-10-16",
  });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);

    console.log("Webhook event received:", event.type);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      console.log("Payment succeeded for order:", orderId);

      // Mettre à jour le statut de paiement de la commande
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "processing",
        })
        .eq("id", orderId);

      if (error) {
        console.error("Error updating order:", error);
        throw error;
      }

      console.log("✅ Paiement confirmé pour la commande", orderId);
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      console.log("Payment failed for order:", orderId);

      const { error } = await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", orderId);

      if (error) {
        console.error("Error updating order:", error);
        throw error;
      }

      console.log("❌ Paiement échoué pour la commande", orderId);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return new Response(
      JSON.stringify({ error: "Webhook handler failed" }),
      { status: 400 }
    );
  }
});
