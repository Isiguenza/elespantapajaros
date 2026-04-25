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
      <div className="h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-8">
        <div className="grid grid-cols-4 gap-6">
          {tables.map((table) => {
            const reservation = tableReservations.get(table.id);
            const isReserved = !!reservation;

            return (
              <div
                key={table.id}
                className={cn(
                  "aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-4 transition-all cursor-pointer hover:scale-105 hover:shadow-2xl relative overflow-hidden",
                  isReserved
                    ? "bg-gradient-to-br from-blue-500/20 to-blue-600/30 border-blue-400 shadow-lg shadow-blue-500/20"
                    : table.status === "occupied"
                    ? "bg-gradient-to-br from-red-500/20 to-red-600/30 border-red-400 shadow-lg shadow-red-500/20"
                    : "bg-gradient-to-br from-green-500/20 to-green-600/30 border-green-400 shadow-lg shadow-green-500/20"
                )}
              >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }} />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="text-4xl font-bold text-white mb-1">
                    {table.number}
                  </div>
                  <div className="text-sm font-medium text-white/70 mb-2">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {table.capacity}
                    </span>
                  </div>
                  {isReserved && reservation && (
                    <div className="mt-2 text-xs text-center bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
                      <div className="font-bold text-white text-sm">{reservation.reservationTime}</div>
                      <div className="text-white/80 truncate max-w-[120px]">{reservation.customerName}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-center gap-8 bg-black/40 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-400 rounded-lg shadow-lg shadow-green-500/30" />
            <span className="text-sm font-medium text-white">Disponible</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-400 rounded-lg shadow-lg shadow-blue-500/30" />
            <span className="text-sm font-medium text-white">Reservada</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-400 rounded-lg shadow-lg shadow-red-500/30" />
            <span className="text-sm font-medium text-white">Ocupada</span>
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
