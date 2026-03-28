"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, PencilSimple, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Table as TableType } from "@/lib/types";

interface TableForm {
  number: string;
  name: string;
  capacity: number;
  status: "available" | "occupied" | "reserved";
}

const emptyForm: TableForm = {
  number: "",
  name: "",
  capacity: 4,
  status: "available",
};

export default function TablesPage() {
  const [tables, setTables] = useState<TableType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TableForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  async function fetchTables() {
    try {
      const res = await fetch("/api/tables");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTables(data);
    } catch {
      toast.error("Error cargando mesas");
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(table: TableType) {
    setEditingId(table.id);
    setForm({
      number: table.number,
      name: table.name || "",
      capacity: table.capacity,
      status: table.status,
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.number.trim()) {
      toast.error("El número de mesa es requerido");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId ? `/api/tables/${editingId}` : "/api/tables";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error");
      }

      toast.success(editingId ? "Mesa actualizada" : "Mesa creada");
      setDialogOpen(false);
      fetchTables();
    } catch (error: any) {
      toast.error(error.message || "Error guardando mesa");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/tables/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error");
      }
      toast.success("Mesa eliminada");
      fetchTables();
    } catch (error: any) {
      toast.error(error.message || "Error eliminando mesa");
    } finally {
      setDeleteId(null);
    }
  }

  const statusColors = {
    available: "default",
    occupied: "destructive",
    reserved: "secondary",
  } as const;

  const statusLabels = {
    available: "Disponible",
    occupied: "Ocupada",
    reserved: "Reservada",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mesas</h1>
          <p className="text-muted-foreground">
            Gestiona las mesas del restaurante
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4 mr-2" />
          Nueva Mesa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Mesas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : tables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No hay mesas registradas
                  </TableCell>
                </TableRow>
              ) : (
                tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">
                      Mesa {table.number}
                    </TableCell>
                    <TableCell>
                      {table.name || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {table.capacity} {table.capacity === 1 ? "persona" : "personas"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[table.status]}>
                        {statusLabels[table.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(table)}
                        >
                          <PencilSimple className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(table.id)}
                          disabled={table.status === "occupied"}
                        >
                          <Trash className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para crear/editar mesa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Mesa" : "Nueva Mesa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Número *</Label>
              <Input
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                placeholder="Ej: 1, 2, A1, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Mesa Principal, Terraza 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Capacidad *</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={form.status}
                onValueChange={(v: any) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="occupied">Ocupada</SelectItem>
                  <SelectItem value="reserved">Reservada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar mesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La mesa será desactivada y no aparecerá en el sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
