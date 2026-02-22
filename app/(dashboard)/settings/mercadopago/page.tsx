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
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, CreditCard, Trash, CheckCircle, XCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

interface MercadoPagoDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  posId: string | null;
  storeId: string | null;
  active: boolean;
  createdAt: string;
}

export default function MercadoPagoSettingsPage() {
  const [devices, setDevices] = useState<MercadoPagoDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    deviceId: "",
    name: "",
    posId: "",
    storeId: "",
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    try {
      const res = await fetch("/api/mercadopago/devices");
      if (res.ok) {
        setDevices(await res.json());
      }
    } catch {
      toast.error("Error cargando dispositivos");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.deviceId) {
      toast.error("Device ID es requerido");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/mercadopago/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: form.deviceId.trim(),
          name: form.name.trim() || form.deviceId.trim(),
          posId: form.posId.trim() || null,
          storeId: form.storeId.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al registrar dispositivo");
      }

      toast.success("Dispositivo registrado exitosamente");
      setDialogOpen(false);
      setForm({ deviceId: "", name: "", posId: "", storeId: "" });
      fetchDevices();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(deviceId: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/mercadopago/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!res.ok) throw new Error();

      toast.success(currentActive ? "Dispositivo desactivado" : "Dispositivo activado");
      fetchDevices();
    } catch {
      toast.error("Error al actualizar dispositivo");
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = confirm(
      `¿Eliminar el dispositivo "${name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/mercadopago/devices/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Dispositivo eliminado");
      fetchDevices();
    } catch {
      toast.error("Error al eliminar dispositivo");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mercado Pago</h1>
          <p className="text-sm text-muted-foreground">
            Configura tus terminales Point para cobros con tarjeta
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 size-4" /> Agregar Terminal
        </Button>
      </div>

      {/* Instructions Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">1. Obtén tu Access Token</p>
            <p className="text-muted-foreground">
              Ve a{" "}
              <a
                href="https://www.mercadopago.com.mx/developers/panel"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Mercado Pago Developers
              </a>{" "}
              y copia tu Access Token de producción.
            </p>
          </div>
          <div>
            <p className="font-medium">2. Configura la variable de entorno</p>
            <p className="text-muted-foreground">
              En Vercel: Settings → Environment Variables → Agrega{" "}
              <code className="rounded bg-muted px-1">MERCADOPAGO_ACCESS_TOKEN</code>
            </p>
          </div>
          <div>
            <p className="font-medium">3. Obtén el Device ID de tu terminal</p>
            <p className="text-muted-foreground">
              Ejecuta en tu terminal:{" "}
              <code className="block mt-1 rounded bg-muted p-2 text-xs">
                curl -X GET 'https://api.mercadopago.com/point/integration-api/devices' \<br />
                {" "}-H 'Authorization: Bearer TU_ACCESS_TOKEN'
              </code>
            </p>
          </div>
          <div>
            <p className="font-medium">4. Registra tu terminal aquí</p>
            <p className="text-muted-foreground">
              Copia el <code>id</code> de tu terminal y regístrala usando el botón de arriba.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Terminales Registradas</CardTitle>
          <CardDescription>
            Gestiona tus terminales Point de Mercado Pago
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead>POS ID</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : devices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No hay terminales registradas
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="size-4 text-muted-foreground" />
                        <span className="font-medium">{device.deviceName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{device.deviceId}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {device.posId || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={device.active}
                          onCheckedChange={() =>
                            handleToggleActive(device.id, device.active)
                          }
                        />
                        <Badge
                          variant={device.active ? "default" : "secondary"}
                        >
                          {device.active ? (
                            <>
                              <CheckCircle className="mr-1 size-3" /> Activa
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1 size-3" /> Inactiva
                            </>
                          )}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDelete(device.id, device.deviceName)
                        }
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Device Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Terminal Point</DialogTitle>
            <DialogDescription>
              Agrega una nueva terminal de Mercado Pago a tu sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Device ID *</Label>
              <Input
                value={form.deviceId}
                onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
                placeholder="PAX_A910__SMARTPOS1490612051"
              />
              <p className="text-xs text-muted-foreground">
                El ID único de tu terminal Point
              </p>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Point Smart Principal"
              />
              <p className="text-xs text-muted-foreground">
                Nombre descriptivo para identificar la terminal
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>POS ID</Label>
                <Input
                  value={form.posId}
                  onChange={(e) => setForm({ ...form, posId: e.target.value })}
                  placeholder="25042881"
                />
              </div>
              <div className="space-y-2">
                <Label>Store ID</Label>
                <Input
                  value={form.storeId}
                  onChange={(e) =>
                    setForm({ ...form, storeId: e.target.value })
                  }
                  placeholder="39774689"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Registrando..." : "Registrar Terminal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
