import { Badge } from "@/components/ui/badge";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const statusConfig = {
    pending: { label: "En attente", className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
    processing: { label: "En cours", className: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
    shipped: { label: "Expédié", className: "bg-purple-500/10 text-purple-700 border-purple-500/20" },
    delivered: { label: "Livré", className: "bg-green-500/10 text-green-700 border-green-500/20" },
    cancelled: { label: "Annulé", className: "bg-red-500/10 text-red-700 border-red-500/20" },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

export const PaymentStatusBadge = ({ status }: PaymentStatusBadgeProps) => {
  const statusConfig = {
    pending: { label: "En attente", className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
    paid: { label: "Payé", className: "bg-green-500/10 text-green-700 border-green-500/20" },
    failed: { label: "Échoué", className: "bg-red-500/10 text-red-700 border-red-500/20" },
    refunded: { label: "Remboursé", className: "bg-gray-500/10 text-gray-700 border-gray-500/20" },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};
