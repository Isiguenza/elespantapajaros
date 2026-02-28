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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, PencilSimple, Trash, MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Product, Category, Group } from "@/lib/types";

interface Extra {
  id: string;
  name: string;
  description: string | null;
  price: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  groupId: string;
  imageUrl: string;
  active: boolean;
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  groupId: "",
  imageUrl: "",
  active: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [extraDialogOpen, setExtraDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catName, setCatName] = useState("");

  // Extra form states
  const [extraName, setExtraName] = useState("");
  const [extraDescription, setExtraDescription] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [extraSortOrder, setExtraSortOrder] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [productsRes, categoriesRes, groupsRes, extrasRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/groups"),
        fetch("/api/extras"),
      ]);
      if (productsRes.ok) setProducts(await productsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (groupsRes.ok) setGroups(await groupsRes.json());
      if (extrasRes.ok) setExtras(await extrasRes.json());
    } catch {
      toast.error("Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEditDialog(product: Product) {
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      categoryId: product.categoryId || "",
      groupId: product.groupId || "",
      imageUrl: product.imageUrl || "",
      active: product.active,
    });
    setEditingId(product.id);
    setDialogOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      const { imageUrl } = await res.json();
      setForm({ ...form, imageUrl });
      toast.success("Imagen subida");
    } catch {
      toast.error("Error subiendo imagen");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!form.name || !form.price) {
      toast.error("Nombre y precio son requeridos");
      return;
    }
    setSubmitting(true);
    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categoryId: form.categoryId || null,
          groupId: form.groupId || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "Producto actualizado" : "Producto creado");
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Error guardando producto");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Producto eliminado");
      fetchData();
    } catch {
      toast.error("Error eliminando producto");
    } finally {
      setDeleteId(null);
    }
  }

  async function handleCreateCategory() {
    if (!catName.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName }),
      });
      if (!res.ok) throw new Error();
      toast.success("Categoría creada");
      setCatDialogOpen(false);
      setCatName("");
      fetchData();
    } catch {
      toast.error("Error creando categoría");
    }
  }

  // Extra functions
  function openCreateExtraDialog() {
    setEditingExtra(null);
    setExtraName("");
    setExtraDescription("");
    setExtraPrice("");
    setExtraSortOrder(extras.length);
    setExtraDialogOpen(true);
  }

  function openEditExtraDialog(extra: Extra) {
    setEditingExtra(extra);
    setExtraName(extra.name);
    setExtraDescription(extra.description || "");
    setExtraPrice(extra.price);
    setExtraSortOrder(extra.sortOrder);
    setExtraDialogOpen(true);
  }

  async function handleExtraSubmit() {
    if (!extraName || !extraPrice) {
      toast.error("Nombre y precio son requeridos");
      return;
    }

    setSubmitting(true);

    try {
      const url = editingExtra
        ? `/api/extras/${editingExtra.id}`
        : "/api/extras";
      
      const method = editingExtra ? "PATCH" : "POST";

      const body = {
        name: extraName,
        description: extraDescription || null,
        price: extraPrice,
        sortOrder: extraSortOrder,
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
        editingExtra ? "Extra actualizado" : "Extra creado"
      );
      setExtraDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar extra");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteExtra(id: string) {
    if (!confirm("¿Estás seguro de desactivar este extra?")) return;

    try {
      const res = await fetch(`/api/extras/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Extra desactivado");
      fetchData();
    } catch (error) {
      toast.error("Error al desactivar extra");
    }
  }

  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(parseFloat(amount));

  const filtered = products.filter(
    (p) =>
      !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Productos y Extras</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatDialogOpen(true)}>
            <Plus className="mr-1 size-4" /> Categoría
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-1 size-4" /> Producto
          </Button>
          <Button onClick={openCreateExtraDialog} variant="outline">
            <Plus className="mr-1 size-4" /> Extra
          </Button>
        </div>
      </div>

      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
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
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No hay productos
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge variant="secondary">{product.category.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.active ? "default" : "secondary"}>
                        {product.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                        >
                          <PencilSimple className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(product.id)}
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

      {/* Tabla de Extras */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Extras</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {extras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No hay extras registrados
                  </TableCell>
                </TableRow>
              ) : (
                extras.map((extra) => (
                  <TableRow key={extra.id}>
                    <TableCell className="font-medium">{extra.name}</TableCell>
                    <TableCell className="max-w-md">
                      {extra.description || (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(extra.price)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{extra.sortOrder}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={extra.active ? "default" : "secondary"}>
                        {extra.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditExtraDialog(extra)}
                        >
                          <PencilSimple className="size-4" />
                        </Button>
                        {extra.active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExtra(extra.id)}
                          >
                            <Trash className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Mojito Clásico"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción del producto"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Imagen del Producto</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && <span className="text-sm text-muted-foreground">Subiendo...</span>}
              </div>
              {form.imageUrl && (
                <div className="mt-2 relative w-32 h-32 border rounded overflow-hidden">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1"
                    onClick={() => setForm({ ...form, imageUrl: "" })}
                  >
                    <Trash className="size-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
              <Label>Activo</Label>
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

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Ej: Mojitos"
              onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extra Dialog */}
      <Dialog open={extraDialogOpen} onOpenChange={setExtraDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExtra ? "Editar Extra" : "Nuevo Extra"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="extra-name">Nombre *</Label>
              <Input
                id="extra-name"
                value={extraName}
                onChange={(e) => setExtraName(e.target.value)}
                placeholder="Crema batida, Caramelo, etc."
              />
            </div>

            <div>
              <Label htmlFor="extra-description">Descripción</Label>
              <Textarea
                id="extra-description"
                value={extraDescription}
                onChange={(e) => setExtraDescription(e.target.value)}
                placeholder="Descripción opcional del extra"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="extra-price">Precio *</Label>
              <Input
                id="extra-price"
                type="number"
                step="0.01"
                value={extraPrice}
                onChange={(e) => setExtraPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="extra-sortOrder">Orden de visualización</Label>
              <Input
                id="extra-sortOrder"
                type="number"
                value={extraSortOrder}
                onChange={(e) => setExtraSortOrder(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExtraDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExtraSubmit} disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
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
