import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Volume2, Mic, Eye, Zap } from "lucide-react";

export interface GameSettings {
  displayMode: 'canon' | 'original';
  minAccuracy: number;
  minConfidence: number;
  hotwordMode: boolean;
  audioGain: number;
  visualEffects: boolean;
  autoRestartRecognition: boolean;
}

interface SettingsProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  children?: React.ReactNode;
}

const defaultSettings: GameSettings = {
  displayMode: 'canon',
  minAccuracy: 65,
  minConfidence: 50,
  hotwordMode: false,
  audioGain: 100,
  visualEffects: true,
  autoRestartRecognition: true
};

export const Settings = ({ settings, onSettingsChange, children }: SettingsProps) => {
  const [open, setOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<GameSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalSettings(defaultSettings);
  };

  const updateSetting = (key: keyof GameSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <SettingsIcon className="w-4 h-4" />
            Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-brand" />
            Game Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="w-4 h-4" />
                Display Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-mode">Spell Names Display</Label>
                <Select 
                  value={localSettings.displayMode} 
                  onValueChange={(value: 'canon' | 'original') => updateSetting('displayMode', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canon">Canon (Expelliarmus, Stupefy, etc.)</SelectItem>
                    <SelectItem value="original">Original (Disarm, Stun, etc.)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Canon shows Harry Potter spell names, Original shows safe alternative names. 
                  Voice recognition works with both!
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="visual-effects">Enhanced Visual Effects</Label>
                  <p className="text-xs text-muted-foreground">
                    Bloom filters, particle effects, camera shake
                  </p>
                </div>
                <Switch
                  id="visual-effects"
                  checked={localSettings.visualEffects}
                  onCheckedChange={(checked) => updateSetting('visualEffects', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Voice Recognition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mic className="w-4 h-4" />
                Voice Recognition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min-accuracy">
                  Minimum Accuracy: {localSettings.minAccuracy}%
                </Label>
                <Slider
                  id="min-accuracy"
                  min={50}
                  max={90}
                  step={5}
                  value={[localSettings.minAccuracy]}
                  onValueChange={(value) => updateSetting('minAccuracy', value[0])}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  How precisely you must pronounce spells. Lower = more forgiving.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-confidence">
                  Confidence Threshold: {localSettings.minConfidence}%
                </Label>
                <Slider
                  id="min-confidence"
                  min={30}
                  max={80}
                  step={5}
                  value={[localSettings.minConfidence]}
                  onValueChange={(value) => updateSetting('minConfidence', value[0])}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Speech recognition confidence required. Lower = triggers more easily.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-restart">Auto-Restart Recognition</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically restart voice recognition if it stops
                  </p>
                </div>
                <Switch
                  id="auto-restart"
                  checked={localSettings.autoRestartRecognition}
                  onCheckedChange={(checked) => updateSetting('autoRestartRecognition', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="hotword-mode">Hotword Mode (Experimental)</Label>
                  <p className="text-xs text-muted-foreground">
                    Only activate on specific wake words
                  </p>
                </div>
                <Switch
                  id="hotword-mode"
                  checked={localSettings.hotwordMode}
                  onCheckedChange={(checked) => updateSetting('hotwordMode', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Audio Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Volume2 className="w-4 h-4" />
                Audio Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audio-gain">
                  Microphone Sensitivity: {localSettings.audioGain}%
                </Label>
                <Slider
                  id="audio-gain"
                  min={50}
                  max={150}
                  step={10}
                  value={[localSettings.audioGain]}
                  onValueChange={(value) => updateSetting('audioGain', value[0])}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Adjust if the mic visualizer doesn't respond to your voice properly.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-4 h-4" />
                Performance Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Use Chrome/Edge for best speech recognition</p>
                <p>• Close other tabs using microphone</p>
                <p>• Ensure stable internet connection</p>
                <p>• Disable visual effects on slower devices</p>
                <p>• Lower accuracy threshold if recognition is too strict</p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Settings;