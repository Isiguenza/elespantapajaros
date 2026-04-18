"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ReservationDialog } from "./ReservationDialog";
import { ReservationsList } from "./ReservationsList";
import { TablesMap } from "./TablesMap";
import type { Reservation, Table } from "@/lib/types";

export function ReservationsView() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedDate, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tables
      const tablesRes = await fetch("/api/tables");
      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(tablesData);
      }

      // Fetch reservations
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

      const reservationsRes = await fetch(`/api/reservations?${params}`);
      if (reservationsRes.ok) {
        const reservationsData = await reservationsRes.json();
        setReservations(reservationsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      const res = await fetch(`/api/reservations/${id}/confirm`, {
        method: "POST",
      });

      if (!res.ok) throw new Error();

      toast.success("Cliente confirmado");
      fetchData();
    } catch (error) {
      toast.error("Error confirmando reserva");
    }
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de cancelar esta reserva?")) return;

    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Reserva cancelada");
      fetchData();
    } catch (error) {
      toast.error("Error cancelando reserva");
    }
  };

  const handleNewReservation = () => {
    setEditingReservation(null);
    setShowDialog(true);
  };

  // Filter reservations by search
  const filteredReservations = reservations.filter((reservation) =>
    reservation.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 p-6 space-y-4 bg-neutral-950">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">Reservas</h1>
          <Button onClick={handleNewReservation} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-4">
          {/* Date filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Fecha</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Estado</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="arrived">Llegó</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre del cliente..."
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-5 overflow-hidden">
        {/* Left: Reservations List (2/5) */}
        <div className="col-span-2 border-r border-neutral-800">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Cargando...</p>
            </div>
          ) : (
            <ReservationsList
              reservations={filteredReservations}
              onConfirm={handleConfirm}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>

        {/* Right: Tables Map (3/5) */}
        <div className="col-span-3">
          <TablesMap
            tables={tables}
            reservations={reservations}
            selectedDate={selectedDate}
          />
        </div>
      </div>

      {/* Dialog */}
      <ReservationDialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) setEditingReservation(null);
        }}
        reservation={editingReservation}
        tables={tables}
        onSuccess={fetchData}
      />
    </div>
  );
}
