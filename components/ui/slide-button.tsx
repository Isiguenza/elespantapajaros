"use client";

import { useState, useRef, useEffect } from "react";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface SlideButtonProps {
  onSlideComplete: () => void;
  text?: string;
  className?: string;
  disabled?: boolean;
}

export function SlideButton({
  onSlideComplete,
  text = "Desliza para confirmar",
  className,
  disabled = false,
}: SlideButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const thumbWidth = 60;
  const threshold = 0.85; // 85% to complete

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current || disabled) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const newPosition = Math.max(
        0,
        Math.min(clientX - containerRect.left - thumbWidth / 2, containerRect.width - thumbWidth)
      );

      setPosition(newPosition);

      // Check if completed
      const progress = newPosition / (containerRect.width - thumbWidth);
      if (progress >= threshold && !isCompleted) {
        setIsCompleted(true);
        setIsDragging(false);
        setTimeout(() => {
          onSlideComplete();
        }, 200);
      }
    };

    const handleMouseUp = () => {
      if (!isCompleted) {
        setPosition(0);
      }
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleMouseMove);
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, isCompleted, onSlideComplete, disabled, threshold]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || isCompleted) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const progress = containerRef.current
    ? position / (containerRef.current.offsetWidth - thumbWidth)
    : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-16 w-full rounded-full overflow-hidden border-2 transition-all",
        isCompleted
          ? "bg-green-500 border-green-600"
          : "bg-muted border-primary/30",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* Progress Background */}
      <div
        className="absolute inset-0 bg-primary/20 transition-all"
        style={{ width: `${progress * 100}%` }}
      />

      {/* Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={cn(
            "font-semibold text-sm transition-all",
            isCompleted ? "text-white" : "text-foreground"
          )}
        >
          {isCompleted ? "¡Confirmado!" : text}
        </span>
      </div>

      {/* Thumb */}
      <div
        ref={thumbRef}
        className={cn(
          "absolute top-1 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-all",
          isCompleted && "bg-green-600"
        )}
        style={{
          width: `${thumbWidth}px`,
          left: `${position}px`,
        }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {isCompleted ? (
          <Check className="size-6 text-white" weight="bold" />
        ) : (
          <div className="flex gap-0.5">
            <div className="w-1 h-6 bg-primary-foreground rounded-full" />
            <div className="w-1 h-6 bg-primary-foreground rounded-full" />
            <div className="w-1 h-6 bg-primary-foreground rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
