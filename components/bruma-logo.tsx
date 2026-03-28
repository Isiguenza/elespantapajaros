import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrumaLogoProps {
  variant?: "default" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

export function BrumaLogo({ 
  variant = "default", 
  size = "md",
  className,
  showText = true 
}: BrumaLogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16"
  };

  const textSizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl"
  };

  // Intentar cargar logo desde /public/branding, si no existe mostrar texto
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Placeholder para logo - reemplazar cuando se agregue el archivo */}
      <div className={cn(
        "flex items-center justify-center rounded-lg bg-primary",
        sizeClasses[size],
        size === "sm" ? "w-8" : size === "md" ? "w-12" : "w-16"
      )}>
        <span className={cn(
          "font-bold text-primary-foreground",
          size === "sm" ? "text-sm" : size === "md" ? "text-lg" : "text-xl"
        )}>
          B
        </span>
      </div>
      
      {showText && (
        <span className={cn(
          "font-bold tracking-tight",
          variant === "white" ? "text-white" : "text-primary",
          textSizeClasses[size]
        )}>
          BRUMA
        </span>
      )}
    </div>
  );
}
