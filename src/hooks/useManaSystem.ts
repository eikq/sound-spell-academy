import { useCallback, useEffect, useRef } from "react";

interface ManaSystemProps {
  currentMana: number;
  maxMana: number;
  onManaChange: (newMana: number) => void;
  regenRate?: number; // mana per second
  enabled?: boolean;
}

export function useManaSystem({
  currentMana,
  maxMana,
  onManaChange,
  regenRate = 8, // Much faster: 8 mana per second
  enabled = true
}: ManaSystemProps) {
  const lastRegenTime = useRef(Date.now());
  const animationFrame = useRef<number>();

  const consumeMana = useCallback((amount: number): boolean => {
    if (!enabled) return true;
    
    if (currentMana >= amount) {
      onManaChange(Math.max(0, currentMana - amount));
      return true;
    }
    return false;
  }, [currentMana, onManaChange, enabled]);

  const addMana = useCallback((amount: number) => {
    if (!enabled) return;
    onManaChange(Math.min(maxMana, currentMana + amount));
  }, [currentMana, maxMana, onManaChange, enabled]);

  // Mana regeneration loop
  useEffect(() => {
    if (!enabled) return;

    const regenerate = () => {
      const now = Date.now();
      const deltaTime = (now - lastRegenTime.current) / 1000; // Convert to seconds
      lastRegenTime.current = now;

      if (currentMana < maxMana) {
        const regenAmount = regenRate * deltaTime;
        onManaChange(Math.min(maxMana, currentMana + regenAmount));
      }

      animationFrame.current = requestAnimationFrame(regenerate);
    };

    animationFrame.current = requestAnimationFrame(regenerate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [currentMana, maxMana, onManaChange, regenRate, enabled]);

  return {
    consumeMana,
    addMana,
    canCast: (manaCost: number) => !enabled || currentMana >= manaCost,
    setEnabled: (newEnabled: boolean) => {
      // This function doesn't actually change state, but allows calls for API consistency
      // The enabled state should be controlled via the props.enabled parameter
    }
  };
}