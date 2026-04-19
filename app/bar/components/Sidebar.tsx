"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeView: "pos" | "reservations";
  onViewChange: (view: "pos" | "reservations") => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebarOpen");
    if (saved !== null) {
      setIsOpen(saved === "true");
    }
  }, []);

  // Save sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem("sidebarOpen", String(newState));
  };

  const menuItems = [
    {
      id: "pos" as const,
      icon: ShoppingCart,
      label: "POS",
    },
    {
      id: "reservations" as const,
      icon: Calendar,
      label: "Reservas",
    },
  ];

  return (
    <div
      className={cn(
        "relative h-full bg-neutral-950 border-r border-neutral-800 text-white transition-all duration-300 flex flex-col",
        isOpen ? "w-60" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-neutral-800">
        {isOpen ? (
          <img 
            src="/logos/horiz.png" 
            alt="BRUMA" 
            className="h-8 w-auto"
          />
        ) : (
          <img 
            src="/logos/isotipo.png" 
            alt="BRUMA" 
            className="h-8 w-auto mx-auto"
          />
        )}
      </div>

      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800"
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Menu items */}
      <nav className="flex-1 pt-4 px-2 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {isOpen && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t border-neutral-800">
          <p className="text-xs text-neutral-500 text-center">
            BRUMA POS
          </p>
        </div>
      )}
    </div>
  );
}
