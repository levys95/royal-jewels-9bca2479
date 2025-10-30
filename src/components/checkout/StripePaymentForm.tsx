import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface StripePaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const StripePaymentForm = ({ onSuccess, onError }: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders`,
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || "Erreur de paiement");
        setIsProcessing(false);
      } else {
        onSuccess();
      }
    } catch (err) {
      onError("Une erreur est survenue lors du paiement");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        variant="royal"
        size="lg"
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Traitement du paiement...
          </>
        ) : (
          "Payer maintenant"
        )}
      </Button>
    </form>
  );
};
