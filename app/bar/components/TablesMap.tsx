"use client";

import { cn } from "@/lib/utils";
import type { Table, Reservation } from "@/lib/types";

interface TablesMapProps {
  tables: Table[];
  reservations: Reservation[];
  selectedDate?: string;
}

export function TablesMap({ tables, reservations, selectedDate }: TablesMapProps) {
  // Get reservations for selected date
  const dateReservations = selectedDate
    ? reservations.filter((r) => r.reservationDate === selectedDate)
    : reservations;

  // Create a map of table ID to reservation
  const tableReservations = new Map<string, Reservation>();
  dateReservations.forEach((reservation) => {
    if (
      reservation.status === "pending" ||
      reservation.status === "confirmed"
    ) {
      tableReservations.set(reservation.tableId, reservation);
    }
  });

  // If no tables have positions, show a grid layout
  const hasPositions = tables.some((t) => t.positionX !== null && t.positionY !== null);

  if (!hasPositions) {
    return (
      <div className="h-full bg-neutral-900 p-8">
        <div className="grid grid-cols-4 gap-4">
          {tables.map((table) => {
            const reservation = tableReservations.get(table.id);
            const isReserved = !!reservation;

            return (
              <div
                key={table.id}
                className={cn(
                  "aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-4 transition-all",
                  isReserved
                    ? "bg-blue-100 border-blue-500"
                    : table.status === "occupied"
                    ? "bg-red-100 border-red-500"
                    : "bg-green-100 border-green-500"
                )}
              >
                <div className="text-2xl font-bold text-white">
                  {table.number}
                </div>
                <div className="text-sm text-neutral-400">
                  Cap: {table.capacity}
                </div>
                {isReserved && reservation && (
                  <div className="mt-2 text-xs text-center">
                    <div className="font-semibold text-white">{reservation.reservationTime}</div>
                    <div className="text-neutral-400">{reservation.customerName}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded" />
            <span className="text-sm">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded" />
            <span className="text-sm">Reservada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded" />
            <span className="text-sm">Ocupada</span>
          </div>
        </div>
      </div>
    );
  }

  // Render tables with custom positions
  return (
    <div className="h-full bg-neutral-900 p-8 relative overflow-auto">
      <div className="relative w-full h-full min-h-[600px]">
        {tables.map((table) => {
          if (table.positionX === null || table.positionY === null) return null;

          const reservation = tableReservations.get(table.id);
          const isReserved = !!reservation;
          const isRound = table.shape === "round";

          return (
            <div
              key={table.id}
              className={cn(
                "absolute w-24 h-24 flex flex-col items-center justify-center border-2 transition-all",
                isRound ? "rounded-full" : "rounded-lg",
                isReserved
                  ? "bg-blue-100 border-blue-500"
                  : table.status === "occupied"
                  ? "bg-red-100 border-red-500"
                  : "bg-green-100 border-green-500"
              )}
              style={{
                left: `${table.positionX}px`,
                top: `${table.positionY}px`,
                transform: `rotate(${table.rotation || 0}deg)`,
              }}
            >
              <div className="text-xl font-bold text-white">{table.number}</div>
              <div className="text-xs text-neutral-400">
                Cap: {table.capacity}
              </div>
              {isReserved && reservation && (
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-neutral-800 rounded px-2 py-1 shadow-lg text-xs whitespace-nowrap border border-neutral-700">
                  <div className="font-semibold text-white">{reservation.reservationTime}</div>
                  <div className="text-neutral-400">{reservation.customerName}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-white rounded-lg shadow-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded" />
          <span className="text-sm">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded" />
          <span className="text-sm">Reservada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded" />
          <span className="text-sm">Ocupada</span>
        </div>
      </div>
    </div>
  );
}
