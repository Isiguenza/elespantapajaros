"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import type { Discount } from "@/lib/types";

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "percentage" as "percentage" | "fixed_amount" | "flexible",
    value: 0,
    requiresAuthorization: false,
    active: true,
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  async function fetchDiscounts() {
    try {
      const res = await fetch("/api/discounts");
      if (res.ok) {
        const data = await res.json();
        setDiscounts(data);
      }
    } catch (error) {
      console.error("Error fetching discounts:", error);
      toast.error("Error al cargar descuentos");
    } finally {
      setLoading(false);
    }
  }

  function handleNewDiscount() {
    setEditingDiscount(null);
    setFormData({
      name: "",
      description: "",
      type: "percentage",
      value: 0,
      requiresAuthorization: false,
      active: true,
    });
    setShowDialog(true);
  }

  function handleEdit(discount: Discount) {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      description: discount.description || "",
      type: discount.type,
      value: parseFloat(discount.value.toString()),
      requiresAuthorization: discount.requiresAuthorization,
      active: discount.active,
    });
    setShowDialog(true);
  }

  async function handleSubmit() {
    try {
      // Validation
      if (!formData.name) {
        toast.error("Por favor ingresa un nombre");
        return;
      }

      // For non-flexible discounts, validate value
      if (formData.type !== "flexible") {
        if (formData.value <= 0) {
          toast.error("Por favor ingresa un valor válido");
          return;
        }

        if (formData.type === "percentage" && (formData.value < 0 || formData.value > 100)) {
          toast.error("El porcentaje debe estar entre 0 y 100");
          return;
        }
      }

      const url = editingDiscount
        ? `/api/discounts/${editingDiscount.id}`
        : "/api/discounts";
      
      const method = editingDiscount ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingDiscount ? "Descuento actualizado" : "Descuento creado");
        setShowDialog(false);
        fetchDiscounts();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al guardar descuento");
      }
    } catch (error) {
      console.error("Error saving discount:", error);
      toast.error("Error al guardar descuento");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este descuento?")) return;

    try {
      const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Descuento eliminado");
        fetchDiscounts();
      } else {
        toast.error("Error al eliminar descuento");
      }
    } catch (error) {
      console.error("Error deleting discount:", error);
      toast.error("Error al eliminar descuento");
    }
  }

  async function handleToggleActive(discount: Discount) {
    try {
      const res = await fetch(`/api/discounts/${discount.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !discount.active }),
      });

      if (res.ok) {
        toast.success(discount.active ? "Descuento desactivado" : "Descuento activado");
        fetchDiscounts();
      } else {
        toast.error("Error al cambiar estado");
      }
    } catch (error) {
      console.error("Error toggling active:", error);
      toast.error("Error al cambiar estado");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Descuentos</h1>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Descuentos</h1>
        <Button onClick={handleNewDiscount}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Descuento
        </Button>
      </div>

      {/* Discounts Table */}
      <div className="border rounded-lg">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-4">Nombre</th>
              <th className="text-left p-4">Tipo</th>
              <th className="text-left p-4">Valor</th>
              <th className="text-left p-4">Autorización</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-right p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((discount) => (
              <tr key={discount.id} className="border-t">
                <td className="p-4">
                  <div>
                    <div className="font-medium">{discount.name}</div>
                    {discount.description && (
                      <div className="text-sm text-muted-foreground">{discount.description}</div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant="outline">
                    {discount.type === "percentage" ? "Porcentaje" : "Monto Fijo"}
                  </Badge>
                </td>
                <td className="p-4">
                  <span className="font-semibold">
                    {discount.type === "percentage"
                      ? `${discount.value}%`
                      : `$${discount.value}`}
                  </span>
                </td>
                <td className="p-4">
                  {discount.requiresAuthorization ? (
                    <Badge variant="secondary">Requiere PIN</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">No requiere</span>
                  )}
                </td>
                <td className="p-4">
                  <Badge variant={discount.active ? "default" : "secondary"}>
                    {discount.active ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(discount)}
                    >
                      {discount.active ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(discount)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(discount.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {discounts.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No hay descuentos creados
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDiscount ? "Editar Descuento" : "Nuevo Descuento"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej: Descuento Empleado"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                  <SelectItem value="fixed_amount">Monto Fijo ($)</SelectItem>
                  <SelectItem value="flexible">Flexible (se elige al aplicar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type !== "flexible" && (
              <div className="space-y-2">
                <Label>
                  Valor * {formData.type === "percentage" ? "(%)" : "($)"}
                </Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  min="0"
                  max={formData.type === "percentage" ? "100" : undefined}
                  step={formData.type === "percentage" ? "1" : "0.01"}
                />
              </div>
            )}
            
            {formData.type === "flexible" && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Descuento Flexible:</strong> El cajero podrá elegir el porcentaje (10%, 20%, 30%, 50%, 60%) o ingresar un monto fijo en pesos al momento de aplicar el descuento.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requiresAuthorization}
                onChange={(e) =>
                  setFormData({ ...formData, requiresAuthorization: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label>Requiere autorización (PIN de manager)</Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label>Activo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingDiscount ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
