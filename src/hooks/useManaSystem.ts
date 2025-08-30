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
  regenRate = 10, // 10 mana per second - fast regeneration
  enabled = true
}: ManaSystemProps) {
  const lastUpdateTime = useRef(Date.now());
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  // Consume mana function
  const consumeMana = useCallback((amount: number): boolean => {
    if (!enabled) return true;
    
    if (currentMana >= amount) {
      const newMana = Math.max(0, currentMana - amount);
      onManaChange(newMana);
      console.log(`💙 Mana consumed: ${amount}, remaining: ${newMana}`);
      return true;
    }
    console.log(`❌ Insufficient mana: need ${amount}, have ${currentMana}`);
    return false;
  }, [currentMana, onManaChange, enabled]);

  // Add mana function
  const addMana = useCallback((amount: number) => {
    if (!enabled) return;
    const newMana = Math.min(maxMana, currentMana + amount);
    onManaChange(newMana);
  }, [currentMana, maxMana, onManaChange, enabled]);

  // Check if can cast spell
  const canCast = useCallback((manaCost: number): boolean => {
    return !enabled || currentMana >= manaCost;
  }, [currentMana, enabled]);

  // Mana regeneration with reliable interval
  useEffect(() => {
    if (!enabled) {
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (intervalId.current) {
      clearInterval(intervalId.current);
    }

    // Start new regeneration interval - 100ms updates for smooth regen
    intervalId.current = setInterval(() => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateTime.current) / 1000; // Convert to seconds
      lastUpdateTime.current = now;

      if (currentMana < maxMana) {
        const regenAmount = regenRate * deltaTime;
        const newMana = Math.min(maxMana, currentMana + regenAmount);
        if (newMana !== currentMana) {
          onManaChange(newMana);
        }
      }
    }, 100); // Update every 100ms for smooth regeneration

    // Cleanup function
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
    };
  }, [currentMana, maxMana, onManaChange, regenRate, enabled]);

  return {
    consumeMana,
    addMana,
    canCast
  };
}