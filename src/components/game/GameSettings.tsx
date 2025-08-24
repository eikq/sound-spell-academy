import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GameSettings } from "@/types/game";
import { ArrowLeft, Volume2, Mic, Eye, Type } from "lucide-react";
import { toast } from "sonner";

interface GameSettingsProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onClose: () => void;
}

export default function GameSettingsModal({ settings, onSettingsChange, onClose }: GameSettingsProps) {
  const [tempSettings, setTempSettings] = useState<GameSettings>(settings);

  const handleSave = () => {
    onSettingsChange(tempSettings);
    localStorage.setItem('arcane-settings', JSON.stringify(tempSettings));
    toast.success("Settings saved successfully!");
    onClose();
  };

  const handleRestore = () => {
    const defaultSettings: GameSettings = {
      language: 'en-US',
      sensitivity: 0.7,
      hotwordMode: false,
      ipSafeMode: false,
      micEnabled: true,
      pushToTalk: false,
      sfxVolume: 0.8,
      musicVolume: 0.6,
      voiceVolume: 0.8,
      highContrast: false,
      fontSize: 100
    };
    setTempSettings(defaultSettings);
    toast.info("Settings restored to defaults");
  };

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Game Settings</CardTitle>
              <CardDescription>Customize your magical experience</CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Speech Recognition */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mic className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Speech Recognition</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={tempSettings.language} onValueChange={(value) => updateSetting('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="es-ES">Spanish</SelectItem>
                    <SelectItem value="fr-FR">French</SelectItem>
                    <SelectItem value="de-DE">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Sensitivity: {Math.round(tempSettings.sensitivity * 100)}%</Label>
                <Slider
                  value={[tempSettings.sensitivity]}
                  onValueChange={([value]) => updateSetting('sensitivity', value)}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="hotword">Hotword Mode</Label>
                <Switch
                  id="hotword"
                  checked={tempSettings.hotwordMode}
                  onCheckedChange={(checked) => updateSetting('hotwordMode', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="pushToTalk">Push to Talk</Label>
                <Switch
                  id="pushToTalk"
                  checked={tempSettings.pushToTalk}
                  onCheckedChange={(checked) => updateSetting('pushToTalk', checked)}
                />
              </div>
            </div>
          </div>

          {/* Audio */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Audio Levels</h3>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>SFX Volume: {Math.round(tempSettings.sfxVolume * 100)}%</Label>
                <Slider
                  value={[tempSettings.sfxVolume]}
                  onValueChange={([value]) => updateSetting('sfxVolume', value)}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Music Volume: {Math.round(tempSettings.musicVolume * 100)}%</Label>
                <Slider
                  value={[tempSettings.musicVolume]}
                  onValueChange={([value]) => updateSetting('musicVolume', value)}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Voice Chat Volume: {Math.round(tempSettings.voiceVolume * 100)}%</Label>
                <Slider
                  value={[tempSettings.voiceVolume]}
                  onValueChange={([value]) => updateSetting('voiceVolume', value)}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
            </div>
          </div>

          {/* Accessibility */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Accessibility</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="highContrast">High Contrast</Label>
                <Switch
                  id="highContrast"
                  checked={tempSettings.highContrast}
                  onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Font Size: {tempSettings.fontSize}%</Label>
                <Slider
                  value={[tempSettings.fontSize]}
                  onValueChange={([value]) => updateSetting('fontSize', value)}
                  min={90}
                  max={120}
                  step={5}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1" data-event="settings_save">
              Apply Settings
            </Button>
            <Button onClick={handleRestore} variant="outline" data-event="settings_restore">
              Restore Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}