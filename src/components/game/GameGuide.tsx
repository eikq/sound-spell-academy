import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Mic, Zap, Target, Shield, Settings, Volume2 } from "lucide-react";

interface GameGuideProps {
  children?: React.ReactNode;
}

export const GameGuide = ({ children }: GameGuideProps) => {
  const [open, setOpen] = useState(false);

  const elementColors = {
    fire: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    ice: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    lightning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    shadow: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    nature: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    arcane: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200"
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            Game Guide
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand" />
            Arcane Diction - Wizard's Guide
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basics" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="combat">Combat</TabsTrigger>
            <TabsTrigger value="spells">Spells</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-4">
            <h3 className="text-lg font-semibold">Getting Started</h3>
            
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-brand" />
                  <span className="font-medium">Voice Casting</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Speak spell names clearly into your microphone. The game recognizes both canonical names 
                  ("Expelliarmus") and common pronunciations ("expelli-ar-mus").
                </p>
                <div className="bg-muted/50 p-3 rounded">
                  <p className="text-xs font-medium">Quick Test:</p>
                  <p className="text-xs text-muted-foreground">Try saying "Lumos" - it should cast a light spell!</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand" />
                  <span className="font-medium">Game Modes</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <Badge variant="secondary" className="mb-1">Practice Mode</Badge>
                    <p className="text-sm text-muted-foreground">
                      Perfect your pronunciation without pressure. Visual feedback shows accuracy.
                    </p>
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-1">Magical Duel</Badge>
                    <p className="text-sm text-muted-foreground">
                      Battle an AI opponent. Cast spells to reduce their HP to zero!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-brand" />
                  <span className="font-medium">Audio Tips</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Speak clearly and at normal volume</li>
                  <li>• Avoid background noise when possible</li>
                  <li>• The microphone visualizer shows if you're being heard</li>
                  <li>• Louder speech increases spell power</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="combat" className="space-y-4">
            <h3 className="text-lg font-semibold">Combat System</h3>
            
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand" />
                  <span className="font-medium">Health & Damage</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-medium text-green-600 dark:text-green-400">Offensive Spells</p>
                    <p className="text-muted-foreground">Deal damage based on accuracy and volume</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-600 dark:text-blue-400">Defensive Spells</p>
                    <p className="text-muted-foreground">Reduce incoming damage or provide buffs</p>
                  </div>
                  <div>
                    <p className="font-medium text-purple-600 dark:text-purple-400">Healing Spells</p>
                    <p className="text-muted-foreground">Restore health and remove debuffs</p>
                  </div>
                  <div>
                    <p className="font-medium text-yellow-600 dark:text-yellow-400">Utility Spells</p>
                    <p className="text-muted-foreground">Provide temporary bonuses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand" />
                  <span className="font-medium">Power & Accuracy</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="font-medium">Accuracy Formula:</p>
                    <p className="text-muted-foreground">Based on pronunciation similarity (60%) + phonetic matching (40%)</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="font-medium">Power Calculation:</p>
                    <p className="text-muted-foreground">Base Power × Accuracy Bonus × Volume Bonus × Combo Multiplier</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand" />
                  <span className="font-medium">Combos</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Cast spells in sequence within 2.5 seconds for bonus damage!
                </p>
                <div className="space-y-2">
                  <div className="bg-muted/50 p-2 rounded text-xs">
                    <span className="font-medium">Shadow + Ice:</span> "Umbral Shatter" - Extra frost damage
                  </div>
                  <div className="bg-muted/50 p-2 rounded text-xs">
                    <span className="font-medium">Arcane Chain:</span> Multiple arcane spells create "Perfect Sigil"
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="spells" className="space-y-4">
            <h3 className="text-lg font-semibold">Spell Categories</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">Offensive Charms</h4>
                  <div className="space-y-1 text-sm">
                    <div>Stupefy - Lightning stun</div>
                    <div>Incendio - Fire damage + burn</div>
                    <div>Expelliarmus - Arcane disarm</div>
                    <div>Sectumsempra - Shadow slash</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">Defensive Magic</h4>
                  <div className="space-y-1 text-sm">
                    <div>Protego - Barrier shield</div>
                    <div>Expecto Patronum - Anti-shadow ward</div>
                    <div>Finite - Dispel effects</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 text-purple-600 dark:text-purple-400">Support Spells</h4>
                  <div className="space-y-1 text-sm">
                    <div>Lumos - Accuracy boost</div>
                    <div>Episkey - Healing + cleanse</div>
                    <div>Alohomora - Unlock/weaken</div>
                    <div>Reparo - Self-buff</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 text-red-600 dark:text-red-400">Advanced Curses</h4>
                  <div className="space-y-1 text-sm">
                    <div>Petrificus Totalus - Root/bind</div>
                    <div>Silencio - Mute debuff</div>
                    <div>Confundo - Confusion</div>
                    <div>Avada Kedavra - Ultimate power</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold">Element Types</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className={elementColors.fire}>Fire - Burn DoT</Badge>
                  <Badge className={elementColors.ice}>Ice - Slow effects</Badge>
                  <Badge className={elementColors.lightning}>Lightning - Quick cast</Badge>
                  <Badge className={elementColors.shadow}>Shadow - Debuffs</Badge>
                  <Badge className={elementColors.nature}>Nature - Healing</Badge>
                  <Badge className={elementColors.arcane}>Arcane - Versatile</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <h3 className="text-lg font-semibold">Voice Recognition Guide</h3>
            
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-brand" />
                  <span className="font-medium">Pronunciation Tips</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-xs font-medium mb-1">Easy Spells (Recommended for beginners):</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>"Lumos" - LOO-mos</div>
                      <div>"Nox" - NOX (one syllable)</div>
                      <div>"Reparo" - reh-PAR-oh</div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-xs font-medium mb-1">Medium Spells:</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>"Expelliarmus" - ek-spel-ee-AR-mus</div>
                      <div>"Stupefy" - STOO-puh-fy</div>
                      <div>"Protego" - pro-TAY-go</div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-xs font-medium mb-1">Advanced Spells:</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>"Wingardium Leviosa" - win-GAR-dee-um le-vee-OH-sa</div>
                      <div>"Expecto Patronum" - ex-PEK-toh pah-TROH-num</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-brand" />
                  <span className="font-medium">Auto-Cast Settings</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Minimum Accuracy:</span>
                    <p className="text-muted-foreground text-xs">How precisely you must say the spell (default: 65%)</p>
                  </div>
                  <div>
                    <span className="font-medium">Confidence Threshold:</span>
                    <p className="text-muted-foreground text-xs">How confident the speech recognition must be (default: 50%)</p>
                  </div>
                  <div>
                    <span className="font-medium">Cooldown Protection:</span>
                    <p className="text-muted-foreground text-xs">Prevents spam casting (1.2s global, 3s per spell)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <h3 className="text-lg font-semibold">Advanced Techniques</h3>
            
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand" />
                  <span className="font-medium">Charge System</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="bg-muted/50 p-3 rounded">
                    <span className="font-medium">Volume = Power:</span>
                    <p className="text-muted-foreground text-xs">Speak louder to charge your spells with more energy</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <span className="font-medium">Pitch Matters:</span>
                    <p className="text-muted-foreground text-xs">Consistent pitch shows confidence and improves recognition</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand" />
                  <span className="font-medium">Strategy Tips</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use "Lumos" first for accuracy boost in difficult fights</li>
                  <li>• "Protego" before enemy attacks reduces damage by 70%</li>
                  <li>• "Aguamenti" counters burn effects from fire spells</li>
                  <li>• Chain shadow spells for maximum combo damage</li>
                  <li>• "Episkey" not only heals but cleanses debuffs</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand" />
                  <span className="font-medium">Troubleshooting</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-red-600 dark:text-red-400">Spells not casting?</span>
                    <p className="text-muted-foreground text-xs">Check microphone permissions and speak more clearly</p>
                  </div>
                  <div>
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">Low accuracy?</span>
                    <p className="text-muted-foreground text-xs">Practice pronunciation guides and try common aliases</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600 dark:text-blue-400">Audio issues?</span>
                    <p className="text-muted-foreground text-xs">Refresh page, check browser audio settings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />
            
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Master these techniques to become a true Arcane Duelist!
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GameGuide;