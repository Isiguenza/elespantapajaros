"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Users, Clock, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { Reservation } from "@/lib/types";

interface ReservationsListProps {
  reservations: Reservation[];
  onConfirm: (id: string) => void;
  onEdit: (reservation: Reservation) => void;
  onDelete: (id: string) => void;
}

const statusColors = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  arrived: "bg-green-500",
  cancelled: "bg-gray-500",
  no_show: "bg-red-500",
};

const statusLabels = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  arrived: "Llegó",
  cancelled: "Cancelada",
  no_show: "No Show",
};

export function ReservationsList({
  reservations,
  onConfirm,
  onEdit,
  onDelete,
}: ReservationsListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleConfirm = async (id: string) => {
    setConfirmingId(id);
    try {
      await onConfirm(id);
    } finally {
      setConfirmingId(null);
    }
  };

  // Group reservations by date
  const groupedReservations = reservations.reduce((acc, reservation) => {
    const date = reservation.reservationDate;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(reservation);
    return acc;
  }, {} as Record<string, Reservation[]>);

  // Sort dates
  const sortedDates = Object.keys(groupedReservations).sort();

  if (reservations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500">
        <p>No hay reservas</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-4">
        {sortedDates.map((date) => {
          const dateReservations = groupedReservations[date];
          const parsedDate = new Date(date + "T00:00:00");

          return (
            <div key={date} className="space-y-2">
              {/* Date header */}
              <h3 className="font-semibold text-lg sticky top-0 bg-neutral-950 text-white z-10 py-2">
                {format(parsedDate, "EEEE d 'de' MMMM", { locale: es })}
              </h3>

              {/* Reservations for this date */}
              <div className="space-y-2">
                {dateReservations
                  .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime))
                  .map((reservation) => (
                    <div
                      key={reservation.id}
                      className="border border-neutral-800 rounded-lg p-4 hover:bg-neutral-900 transition-colors bg-neutral-950"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          {/* Time and Status */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-neutral-500" />
                              <span className="font-semibold text-lg text-white">
                                {reservation.reservationTime}
                              </span>
                            </div>
                            <Badge className={statusColors[reservation.status]}>
                              {statusLabels[reservation.status]}
                            </Badge>
                          </div>

                          {/* Customer name */}
                          <p className="font-medium text-white">
                            {reservation.customerName}
                          </p>

                          {/* Details */}
                          <div className="flex items-center gap-4 text-sm text-neutral-400">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{reservation.guestCount} personas</span>
                            </div>
                            {reservation.table && (
                              <span>Mesa {reservation.table.number}</span>
                            )}
                            <span>{reservation.duration} min</span>
                          </div>

                          {/* Phone */}
                          {reservation.customerPhone && (
                            <p className="text-sm text-neutral-500">
                              Tel: {reservation.customerPhone}
                            </p>
                          )}

                          {/* Notes */}
                          {reservation.notes && (
                            <p className="text-sm text-neutral-400 italic">
                              {reservation.notes}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          {(reservation.status === "pending" ||
                            reservation.status === "confirmed") && (
                            <Button
                              size="sm"
                              onClick={() => handleConfirm(reservation.id)}
                              disabled={confirmingId === reservation.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {confirmingId === reservation.id
                                ? "..."
                                : "Llegó"}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(reservation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDelete(reservation.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
