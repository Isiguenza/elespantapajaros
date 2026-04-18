"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Reservation, Table } from "@/lib/types";

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation?: Reservation | null;
  tables: Table[];
  onSuccess: () => void;
}

export function ReservationDialog({
  open,
  onOpenChange,
  reservation,
  tables,
  onSuccess,
}: ReservationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tableId: "",
    customerName: "",
    customerPhone: "",
    guestCount: 2,
    reservationDate: "",
    reservationTime: "",
    duration: 120,
    notes: "",
  });

  // Load reservation data when editing
  useEffect(() => {
    if (reservation) {
      setFormData({
        tableId: reservation.tableId,
        customerName: reservation.customerName,
        customerPhone: reservation.customerPhone || "",
        guestCount: reservation.guestCount,
        reservationDate: reservation.reservationDate,
        reservationTime: reservation.reservationTime,
        duration: reservation.duration,
        notes: reservation.notes || "",
      });
    } else {
      // Reset form for new reservation
      const today = new Date().toISOString().split("T")[0];
      setFormData({
        tableId: "",
        customerName: "",
        customerPhone: "",
        guestCount: 2,
        reservationDate: today,
        reservationTime: "",
        duration: 120,
        notes: "",
      });
    }
  }, [reservation, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = reservation
        ? `/api/reservations/${reservation.id}`
        : "/api/reservations";
      const method = reservation ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error saving reservation");
      }

      toast.success(
        reservation ? "Reserva actualizada" : "Reserva creada exitosamente"
      );
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la reserva");
    } finally {
      setLoading(false);
    }
  };

  // Filter tables by capacity
  const availableTables = tables.filter(
    (table) => table.capacity >= formData.guestCount
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {reservation ? "Editar Reserva" : "Nueva Reserva"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.reservationDate}
                onChange={(e) =>
                  setFormData({ ...formData, reservationDate: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="time">Hora *</Label>
              <Input
                id="time"
                type="time"
                required
                value={formData.reservationTime}
                onChange={(e) =>
                  setFormData({ ...formData, reservationTime: e.target.value })
                }
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duración</Label>
            <Select
              value={String(formData.duration)}
              onValueChange={(value) =>
                setFormData({ ...formData, duration: Number(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1.5 horas</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="150">2.5 horas</SelectItem>
                <SelectItem value="180">3 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customerName">Nombre del Cliente *</Label>
              <Input
                id="customerName"
                required
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                placeholder="Juan Pérez"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) =>
                  setFormData({ ...formData, customerPhone: e.target.value })
                }
                placeholder="555-1234"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Guest Count */}
            <div className="space-y-2">
              <Label htmlFor="guestCount">Número de Personas *</Label>
              <Input
                id="guestCount"
                type="number"
                required
                min="1"
                max="20"
                value={formData.guestCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    guestCount: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* Table */}
            <div className="space-y-2">
              <Label htmlFor="table">Mesa *</Label>
              <Select
                value={formData.tableId}
                onValueChange={(value) =>
                  setFormData({ ...formData, tableId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mesa" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      Mesa {table.number} (Cap: {table.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableTables.length === 0 && (
                <p className="text-sm text-red-500">
                  No hay mesas disponibles con capacidad para {formData.guestCount}{" "}
                  personas
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Especiales</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Alergias, preferencias, ocasión especial..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || availableTables.length === 0}>
              {loading ? "Guardando..." : reservation ? "Actualizar" : "Crear Reserva"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
