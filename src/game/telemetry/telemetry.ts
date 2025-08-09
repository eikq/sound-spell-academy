export interface TelemetryCast {
  accuracy: number; // 0..1
  loudness: number; // 0..1
  pitch?: number | null; // Hz
  element: string;
  power: number; // 0..1
  damage: number;
  latencyMs?: number;
  comboId?: string | null;
  chainStacks?: number;
  chargeTier?: number;
}

export function logCast(ev: TelemetryCast) {
  // Future: send to Supabase table
  // For now, console log structured event
  // eslint-disable-next-line no-console
  console.log("telemetry/cast", ev);
}
