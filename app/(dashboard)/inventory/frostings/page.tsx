"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash, Snowflake } from "@phosphor-icons/react";
import { toast } from "sonner";

interface Frosting {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

export default function FrostingsPage() {
  const [frostings, setFrostings] = useState<Frosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFrosting, setEditingFrosting] = useState<Frosting | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFrostings();
  }, []);

  async function fetchFrostings() {
    try {
      const res = await fetch("/api/frostings");
      if (res.ok) {
        setFrostings(await res.json());
      }
    } catch (error) {
      toast.error("Error cargando escarchados");
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingFrosting(null);
    setName("");
    setDescription("");
    setSortOrder(frostings.length);
    setDialogOpen(true);
  }

  function openEditDialog(frosting: Frosting) {
    setEditingFrosting(frosting);
    setName(frosting.name);
    setDescription(frosting.description || "");
    setSortOrder(frosting.sortOrder);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!name) {
      toast.error("El nombre es requerido");
      return;
    }

    setSubmitting(true);

    try {
      const url = editingFrosting
        ? `/api/frostings/${editingFrosting.id}`
        : "/api/frostings";
      
      const method = editingFrosting ? "PATCH" : "POST";

      const body = {
        name,
        description: description || null,
        sortOrder,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error");
      }

      toast.success(
        editingFrosting ? "Escarchado actualizado" : "Escarchado creado"
      );
      setDialogOpen(false);
      fetchFrostings();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar escarchado");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de desactivar este escarchado?")) return;

    try {
      const res = await fetch(`/api/frostings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Escarchado desactivado");
      fetchFrostings();
    } catch (error) {
      toast.error("Error al desactivar escarchado");
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Escarchados</h1>
          <p className="text-muted-foreground">
            Gestiona los tipos de escarchado disponibles para bebidas
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 size-4" />
          Nuevo Escarchado
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Escarchados</CardTitle>
          <CardDescription>
            {frostings.length} escarchado{frostings.length !== 1 ? "s" : ""} disponible
            {frostings.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {frostings.map((frosting) => (
                <TableRow key={frosting.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Snowflake className="size-4 text-blue-500" />
                      {frosting.name}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    {frosting.description || (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{frosting.sortOrder}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={frosting.active ? "default" : "secondary"}
                    >
                      {frosting.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(frosting)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      {frosting.active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(frosting.id)}
                        >
                          <Trash className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {frostings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hay escarchados registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFrosting ? "Editar Escarchado" : "Nuevo Escarchado"}
            </DialogTitle>
            <DialogDescription>
              Los escarchados son gratuitos y se pueden agregar a cualquier bebida.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sal, Chamoy, Tajín, etc."
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción opcional del escarchado"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="sortOrder">Orden de visualización</Label>
              <Input
                id="sortOrder"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                min={0}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Los escarchados se ordenan de menor a mayor
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
