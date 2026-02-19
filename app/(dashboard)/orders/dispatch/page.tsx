"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CookingPot,
  CheckCircle,
  Clock,
  ArrowRight,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Order } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function DispatchPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?status=preparing,ready");
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function updateOrderStatus(
    orderId: string,
    status: "ready" | "delivered"
  ) {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        status === "ready" ? "Orden lista para entregar" : "Orden entregada"
      );
      fetchOrders();
    } catch {
      toast.error("Error actualizando orden");
    }
  }

  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  const statusColors = {
    preparing: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    ready: "bg-green-500/10 text-green-600 border-green-500/20",
  };

  function OrderCard({ order }: { order: Order }) {
    const timeAgo = formatDistanceToNow(new Date(order.createdAt), {
      addSuffix: true,
      locale: es,
    });

    return (
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              #{order.orderNumber}
            </CardTitle>
            <Badge
              variant="outline"
              className={
                statusColors[order.status as keyof typeof statusColors] ?? ""
              }
            >
              {order.status === "preparing" ? "Preparando" : "Lista"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>{timeAgo}</span>
            {order.customerName && (
              <>
                <span>·</span>
                <span>{order.customerName}</span>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-start gap-2 text-sm">
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {item.quantity}x
                </Badge>
                <div>
                  <span className="font-medium">{item.productName}</span>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground">
                      → {item.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {order.notes && (
            <div className="mt-3 rounded-md bg-muted p-2 text-xs">
              <strong>Nota:</strong> {order.notes}
            </div>
          )}
        </CardContent>
        <CardFooter>
          {order.status === "preparing" ? (
            <Button
              className="w-full"
              onClick={() => updateOrderStatus(order.id, "ready")}
            >
              <CheckCircle className="mr-2 size-4" />
              Marcar Lista
            </Button>
          ) : (
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => updateOrderStatus(order.id, "delivered")}
            >
              <ArrowRight className="mr-2 size-4" />
              Entregar
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Despacho</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Despacho</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <CookingPot className="size-3" />
            {preparingOrders.length} preparando
          </Badge>
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="size-3" />
            {readyOrders.length} listas
          </Badge>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center text-muted-foreground">
            <CookingPot className="mb-4 size-12" />
            <p className="text-lg font-medium">No hay órdenes pendientes</p>
            <p className="text-sm">Las nuevas órdenes aparecerán aquí</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Preparing Column */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CookingPot className="size-5 text-yellow-600" />
              Preparando ({preparingOrders.length})
            </h2>
            <div className="space-y-3">
              {preparingOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {preparingOrders.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay órdenes preparándose
                </p>
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CheckCircle className="size-5 text-green-600" />
              Listas para Entregar ({readyOrders.length})
            </h2>
            <div className="space-y-3">
              {readyOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {readyOrders.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay órdenes listas
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
