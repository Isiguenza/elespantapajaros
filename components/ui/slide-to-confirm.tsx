"use client";

import { useState, useRef, useEffect } from "react";
import { Check } from "@phosphor-icons/react";

interface SlideToConfirmProps {
  onConfirm: () => void;
  disabled?: boolean;
}

export function SlideToConfirm({ onConfirm, disabled = false }: SlideToConfirmProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number) => {
    if (disabled) return;
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !containerRef.current || !sliderRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const sliderWidth = sliderRef.current.offsetWidth;
    const maxPosition = containerRect.width - sliderWidth;
    
    let newPosition = clientX - containerRect.left - sliderWidth / 2;
    newPosition = Math.max(0, Math.min(newPosition, maxPosition));
    
    setPosition(newPosition);

    // Check if slider reached the end (95% of max position)
    if (newPosition >= maxPosition * 0.95) {
      setIsDragging(false);
      onConfirm();
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    setPosition(0);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const handleMouseUp = () => handleEnd();
    const handleTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-20 bg-muted rounded-full overflow-hidden select-none"
    >
      {/* Background track */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-semibold text-muted-foreground">
          Desliza para confirmar →
        </span>
      </div>

      {/* Progress fill */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-green-500/20 transition-all rounded-full"
        style={{
          width: containerRef.current
            ? `${((position + (sliderRef.current?.offsetWidth + 16 || 0)) / containerRef.current.offsetWidth) * 100}%`
            : "0%",
        }}
      />

      {/* Slider button */}
      <div
        ref={sliderRef}
        className={`absolute top-2 bottom-2 left-2 w-16 bg-green-600 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow ${
          isDragging ? "shadow-lg" : ""
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        style={{ transform: `translateX(${position}px)` }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      >
        <Check className="size-7 text-white" weight="bold" />
      </div>
    </div>
  );
}
