import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VisualProfile } from "@/game/vfx/Profiles";
import { getStoredProfile, setStoredProfile } from "@/game/vfx/Profiles";

interface PerfHUDProps {
  visible: boolean;
  onProfileChange: (profile: VisualProfile) => void;
}

export function PerfHUD({ visible, onProfileChange }: PerfHUDProps) {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.67);
  const [profile, setProfile] = useState<VisualProfile>(getStoredProfile());
  const [autoScaling, setAutoScaling] = useState(false);
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const frameTimesRef = useRef<number[]>([]);
  
  useEffect(() => {
    if (!visible) return;
    
    const updatePerf = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      
      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > 120) {
        frameTimesRef.current.shift();
      }
      
      frameCountRef.current++;
      
      if (frameCountRef.current % 30 === 0) {
        const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const avgFps = 1000 / avgFrameTime;
        
        setFps(Math.round(avgFps * 10) / 10);
        setFrameTime(Math.round(avgFrameTime * 100) / 100);
      }
      
      lastTimeRef.current = now;
      requestAnimationFrame(updatePerf);
    };
    
    requestAnimationFrame(updatePerf);
  }, [visible]);
  
  const handleProfileChange = (newProfile: VisualProfile) => {
    setProfile(newProfile);
    setStoredProfile(newProfile);
    onProfileChange(newProfile);
  };
  
  if (!visible) return null;
  
  const getFpsColor = () => {
    if (fps >= 50) return "text-green-400";
    if (fps >= 30) return "text-yellow-400";
    return "text-red-400";
  };
  
  const profiles: VisualProfile[] = ["low", "medium", "high", "ultra"];
  
  return (
    <Card className="fixed top-4 right-4 p-3 bg-black/80 backdrop-blur-sm border-gray-700 text-white text-xs z-50">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={getFpsColor()}>{fps} FPS</span>
          <span className="text-gray-400">({frameTime}ms)</span>
          {autoScaling && <Badge variant="secondary" className="text-xs">AUTO</Badge>}
        </div>
        
        <div className="flex gap-1">
          {profiles.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={profile === p ? "default" : "outline"}
              className="h-6 px-2 text-xs"
              onClick={() => handleProfileChange(p)}
            >
              {p.toUpperCase()}
            </Button>
          ))}
        </div>
        
        <div className="text-gray-400 text-xs">
          F3: Toggle • F10/F11: Profile ↓/↑
        </div>
      </div>
    </Card>
  );
}