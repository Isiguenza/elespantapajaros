"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/utils/sound";
import type { Order } from "@/lib/types";
import { SpeakerHigh, GridFour } from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DispatchMonitorPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [previousOrderIds, setPreviousOrderIds] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?status=preparing,ready");
      if (res.ok) {
        const newOrders = await res.json();
        const newOrderIds = new Set<string>(newOrders.map((o: Order) => o.id));
        const hasNewOrder = newOrders.some((o: Order) => !previousOrderIds.has(o.id));
        
        if (hasNewOrder && previousOrderIds.size > 0) {
          playNotificationSound();
        }
        
        setPreviousOrderIds(newOrderIds);
        setOrders(newOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }, [previousOrderIds]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  function getOrderUrgency(order: Order) {
    const minutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    if (minutes > 10) return "urgent"; // Red
    if (minutes > 7) return "warning"; // Orange  
    if (minutes > 4) return "attention"; // Yellow
    return "normal"; // Gray
  }

  function getUrgencyColor(urgency: string) {
    switch (urgency) {
      case "urgent": return "bg-red-600";
      case "warning": return "bg-orange-600";
      case "attention": return "bg-yellow-600";
      default: return "bg-neutral-700";
    }
  }

  function getElapsedTime(createdAt: string) {
    const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}m ${seconds}s`;
  }

  function toggleExpand(orderId: string) {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }

  return (
    <div className="h-screen bg-black p-6 overflow-auto">
      {/* Top right controls */}
      <div className="fixed top-6 right-6 flex gap-2 z-50">
        <button className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700">
          <SpeakerHigh className="size-5 text-white" />
        </button>
        <button className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700">
          <GridFour className="size-5 text-white" />
        </button>
      </div>

      {/* Grid de órdenes */}
      <div className="grid grid-cols-4 gap-4 max-w-screen-2xl">
        {orders.length === 0 ? (
          <div className="col-span-4 flex items-center justify-center h-96 text-neutral-500">
            No hay órdenes pendientes
          </div>
        ) : (
          orders.map((order) => {
            const urgency = getOrderUrgency(order);
            const urgencyColor = getUrgencyColor(urgency);
            const isExpanded = expandedOrders.has(order.id);
            const visibleItems = isExpanded ? order.items : order.items?.slice(0, 3);
            const hasMoreItems = (order.items?.length || 0) > 3;

            return (
              <div
                key={order.id}
                className="bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-all"
              >
                {/* Header con color de urgencia */}
                <div className={`${urgencyColor} px-4 py-2 flex items-center justify-between`}>
                  <div className="text-white font-bold text-lg">#{order.orderNumber}</div>
                  <div className="text-white text-sm">{getElapsedTime(order.createdAt.toString())}</div>
                </div>

                <div className="px-4 py-3">
                  {/* Nombre del mesero/cajero */}
                  <div className="text-neutral-400 text-xs mb-3">
                    Para llevar • Laura
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {visibleItems?.map((item, idx) => (
                      <div key={idx} className="text-white">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold">{item.quantity}</span>
                          <div className="flex-1">
                            <div className="font-medium">{item.productName}</div>
                            {item.frostingName && (
                              <div className="text-blue-400 text-sm">{item.frostingName}</div>
                            )}
                            {item.dryToppingName && (
                              <div className="text-neutral-400 text-sm">{item.dryToppingName}</div>
                            )}
                            {item.extraName && (
                              <div className="text-neutral-400 text-sm">{item.extraName}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Botón para expandir/contraer */}
                    {hasMoreItems && (
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1 mt-2"
                      >
                        <span>↕</span>
                        <span>{isExpanded ? `Ocultar` : `${(order.items?.length || 0) - 3} producto${(order.items?.length || 0) - 3 > 1 ? 's' : ''} más`}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
