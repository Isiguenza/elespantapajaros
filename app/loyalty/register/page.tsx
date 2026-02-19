"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface CreatedCard {
  id: string;
  customerName: string;
  barcodeValue: string;
  stamps: number;
  stampsPerReward: number;
}

export default function LoyaltyRegisterPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [card, setCard] = useState<CreatedCard | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tu nombre es requerido");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim() || null,
          customerEmail: email.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.details || data?.error || "Error al crear tarjeta");
      setCard(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Hubo un error, intenta de nuevo";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function walletUrl() {
    if (!card) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/api/wallet/pass/${card.id}`;
  }

  // Success state
  if (card) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-indigo-600 to-indigo-800 p-6 text-white">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-1">
            <p className="text-4xl">🎉</p>
            <h1 className="text-2xl font-bold">¡Bienvenido!</h1>
            <p className="text-indigo-200">
              Tu tarjeta de cliente frecuente está lista
            </p>
          </div>

          {/* Visual card */}
          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider text-indigo-200">
              Espantapájaros
            </p>
            <p className="mt-2 text-xl font-bold">{card.customerName}</p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {Array.from({ length: card.stampsPerReward }).map((_, i) => (
                <div
                  key={i}
                  className={`flex size-10 items-center justify-center rounded-full border-2 ${
                    i < card.stamps
                      ? "border-white bg-white/20"
                      : "border-white/30"
                  }`}
                >
                  {i < card.stamps ? (
                    <span className="text-sm">🍹</span>
                  ) : (
                    <span className="text-xs opacity-40">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 font-mono text-xs text-indigo-200">
              {card.barcodeValue}
            </p>
          </div>

          {/* Apple Wallet download */}
          <a
            href={walletUrl()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 px-6 font-semibold text-white transition hover:bg-gray-900"
          >
            <svg className="size-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Agregar a Apple Wallet
          </a>

          <p className="text-sm text-indigo-200">
            Muestra tu tarjeta cada vez que compres para acumular sellos y ganar premios 🍹
          </p>
        </div>
      </main>
    );
  }

  // Registration form
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-indigo-600 to-indigo-800 p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center text-white">
          <p className="text-4xl">🍹</p>
          <h1 className="mt-2 text-3xl font-bold">Espantapájaros</h1>
          <p className="mt-1 text-indigo-200">
            Regístrate y acumula sellos para ganar bebidas gratis
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Tu nombre *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="¿Cómo te llamas?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Teléfono
              <span className="ml-1 text-xs text-gray-400">(opcional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 ..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Email
              <span className="ml-1 text-xs text-gray-400">(opcional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Registrando..." : "Obtener mi tarjeta"}
          </button>

          <p className="text-center text-xs text-gray-400">
            Cada compra = 1 sello · 8 sellos = 1 bebida gratis 🎁
          </p>
        </form>
      </div>
    </main>
  );
}
