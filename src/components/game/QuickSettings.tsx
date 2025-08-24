import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Mic, MicOff, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface QuickSettingsProps {
  micEnabled: boolean;
  onMicToggle: (enabled: boolean) => void;
  pushToTalk: boolean;
  onPushToTalkToggle: (enabled: boolean) => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  hotwordMode: boolean;
  onHotwordToggle: (enabled: boolean) => void;
}

const QuickSettings: React.FC<QuickSettingsProps> = ({
  micEnabled,
  onMicToggle,
  pushToTalk,
  onPushToTalkToggle,
  sensitivity,
  onSensitivityChange,
  hotwordMode,
  onHotwordToggle,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* NEW: QoL - Mic toggle button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onMicToggle(!micEnabled)}
        className={micEnabled ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}
      >
        {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </Button>

      {/* NEW: QoL - Quick settings popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Voice Settings</h4>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Push-to-Talk Mode</span>
                <Switch checked={pushToTalk} onCheckedChange={onPushToTalkToggle} />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Hotword Detection</span>
                <Switch checked={hotwordMode} onCheckedChange={onHotwordToggle} />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sensitivity</span>
                  <span className="text-xs text-muted-foreground">{Math.round(sensitivity * 100)}%</span>
                </div>
                <Slider
                  value={[sensitivity]}
                  onValueChange={([value]) => onSensitivityChange(value)}
                  max={1}
                  min={0.3}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default QuickSettings;