"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface LoyaltyCard {
  id: string;
  customerName: string;
  barcodeValue: string;
  stamps: number;
  totalStamps: number;
  stampsPerReward: number;
  rewardsAvailable: number;
  rewardsRedeemed: number;
}

export default function CardViewPage({
  params,
}: {
  params: Promise<{ barcodeValue: string }>;
}) {
  const [card, setCard] = useState<LoyaltyCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pinRequired, setPinRequired] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState("");

  useEffect(() => {
    async function fetchCard() {
      try {
        const { barcodeValue: bc } = await params;
        setBarcodeValue(bc);
        const res = await fetch(`/api/loyalty/search?barcode=${encodeURIComponent(bc)}`);
        if (!res.ok) {
          setError("Tarjeta no encontrada");
          return;
        }
        const data = await res.json();
        
        // Check if card has PIN protection
        if (data.pinHash) {
          setPinRequired(true);
        } else {
          // No PIN required, show card immediately
          setCard(data);
          setPinVerified(true);
        }
      } catch (err) {
        setError("Error al cargar la tarjeta");
      } finally {
        setLoading(false);
      }
    }
    fetchCard();
  }, [params]);

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin || pin.length !== 4) {
      setPinError("Ingresa tu PIN de 4 dígitos");
      return;
    }
    
    setPinError("");
    setVerifying(true);
    
    try {
      const res = await fetch("/api/loyalty/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcodeValue, pin }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        setPinError(data.error || "PIN incorrecto");
        setPin("");
        return;
      }
      
      // PIN verified, fetch card data
      const cardRes = await fetch(`/api/loyalty/search?barcode=${encodeURIComponent(barcodeValue)}`);
      const cardData = await cardRes.json();
      setCard(cardData);
      setPinVerified(true);
    } catch (err) {
      setPinError("Error al verificar PIN");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center" style={{ backgroundColor: '#1d271b' }}>
        <div className="text-white">Cargando...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6" style={{ backgroundColor: '#1d271b' }}>
        <div className="text-center text-white">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="text-2xl font-bold mb-2">Tarjeta no encontrada</h1>
          <p className="text-green-200">{error || "Verifica el código e intenta de nuevo"}</p>
        </div>
      </main>
    );
  }

  // Show PIN verification screen
  if (pinRequired && !pinVerified) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6" style={{ backgroundColor: '#1d271b' }}>
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center text-white">
            <p className="text-4xl mb-2">🔒</p>
            <h1 className="text-2xl font-bold mb-1">Tarjeta protegida</h1>
            <p className="text-green-200 text-sm">Ingresa tu PIN de 4 dígitos</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-2xl tracking-widest text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
                autoFocus
              />
            </div>

            {pinError && (
              <p className="text-sm font-medium text-red-600">{pinError}</p>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-lg py-3 font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: '#2d3f2b' }}
            >
              {verifying ? "Verificando..." : "Ver tarjeta"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (!card) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6" style={{ backgroundColor: '#1d271b' }}>
        <div className="text-center text-white">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="text-2xl font-bold mb-2">Tarjeta no encontrada</h1>
          <p className="text-green-200">{error || "Verifica el código e intenta de nuevo"}</p>
        </div>
      </main>
    );
  }

  const walletUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/wallet/pass/${card.id}`;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6" style={{ backgroundColor: '#1d271b' }}>
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold">Espantapájaros</h1>
          <p className="text-green-200 text-sm">Tarjeta de Cliente Frecuente</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-green-200">Cliente</p>
              <p className="text-xl font-bold mt-1">{card.customerName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-green-200">Sellos</p>
              <p className="text-2xl font-bold mt-1">{card.stamps}/{card.stampsPerReward}</p>
            </div>
          </div>

          {/* Stamps visualization */}
          <div className="flex items-center justify-center gap-1.5 py-4">
            {Array.from({ length: card.stampsPerReward }).map((_, i) => (
              <div key={i} className="size-12">
                <img
                  src={i < card.stamps ? "/api/assets/hat.png" : "/api/assets/mojito-empty.png"}
                  alt={i < card.stamps ? "Sello" : "Vacío"}
                  className="size-full object-contain"
                />
              </div>
            ))}
          </div>

          {/* Rewards */}
          {card.rewardsAvailable > 0 && (
            <div className="mt-4 rounded-lg bg-yellow-500/20 border border-yellow-500/30 p-3 text-center">
              <p className="text-sm font-semibold text-yellow-200">
                🎉 ¡Tienes {card.rewardsAvailable} {card.rewardsAvailable === 1 ? 'premio' : 'premios'} disponible{card.rewardsAvailable === 1 ? '' : 's'}!
              </p>
            </div>
          )}

          {/* Barcode */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG value={card.barcodeValue} size={120} />
              </div>
              <p className="font-mono text-xs text-green-200">{card.barcodeValue}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold text-white">{card.totalStamps}</p>
            <p className="text-xs text-green-200 mt-1">Sellos totales</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold text-white">{card.rewardsRedeemed}</p>
            <p className="text-xs text-green-200 mt-1">Premios canjeados</p>
          </div>
        </div>

        {/* Apple Wallet download */}
        <a
          href={walletUrl}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 px-6 font-semibold text-white transition hover:bg-gray-900"
        >
          <svg className="size-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          Agregar a Apple Wallet
        </a>

        <p className="text-center text-sm text-green-200">
          Muestra este código QR al comprar para acumular sellos 🍹
        </p>
      </div>
    </main>
  );
}
