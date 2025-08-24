import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mic, Zap, Target, Shield } from "lucide-react";

interface HelpModalProps {
  onClose: () => void;
}

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>How to Play Arcane Diction</CardTitle>
              <CardDescription>Master the art of voice-powered spellcasting</CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="spells">Spells</TabsTrigger>
              <TabsTrigger value="combat">Combat</TabsTrigger>
              <TabsTrigger value="tips">Tips</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basics" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mic className="w-5 h-5 mr-2" />
                      Voice Recognition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Speak spell names clearly and confidently</li>
                      <li>• Your pronunciation accuracy determines spell power</li>
                      <li>• Louder, clearer speech = more powerful spells</li>
                      <li>• Practice mode helps you learn correct pronunciation</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Game Modes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li><strong>Practice:</strong> Learn spells without pressure</li>
                      <li><strong>Quick Match:</strong> Fight real players online</li>
                      <li><strong>Private Rooms:</strong> Duel friends with room codes</li>
                      <li><strong>Bot Battles:</strong> Practice against AI opponents</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="spells" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Spell Elements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong className="text-red-500">Fire:</strong> High damage, burn effects
                      </div>
                      <div>
                        <strong className="text-blue-500">Ice:</strong> Crowd control, freezing
                      </div>
                      <div>
                        <strong className="text-yellow-500">Lightning:</strong> Fast, stunning attacks
                      </div>
                      <div>
                        <strong className="text-purple-500">Shadow:</strong> Debuffs, dark magic
                      </div>
                      <div>
                        <strong className="text-green-500">Nature:</strong> Healing, regeneration
                      </div>
                      <div>
                        <strong className="text-cyan-500">Arcane:</strong> Pure magic, versatile
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Popular Spells</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li><strong>Expelliarmus:</strong> "ex-spel-ee-AR-mus" - Disarming spell</li>
                      <li><strong>Stupefy:</strong> "STOO-puh-fy" - Stunning bolt</li>
                      <li><strong>Incendio:</strong> "in-SEN-dee-oh" - Fire spell</li>
                      <li><strong>Protego:</strong> "pro-TAY-go" - Shield charm</li>
                      <li><strong>Wingardium Leviosa:</strong> "win-GAR-dee-um le-vee-OH-sa" - Levitation</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="combat" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="w-5 h-5 mr-2" />
                      Combo System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Cast compatible spells within 2.5 seconds for combos</li>
                      <li>• Fire + Lightning = Plasma Burst (1.5x damage)</li>
                      <li>• Ice + Shadow = Frost Curse (freeze + damage over time)</li>
                      <li>• Experiment to discover more combinations!</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Balance offense and defense</li>
                      <li>• Use healing spells at low health</li>
                      <li>• Counter enemy elements strategically</li>
                      <li>• Time your combos for maximum impact</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="tips" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pronunciation Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Speak at normal volume - shouting doesn't help</li>
                      <li>• Enunciate clearly, especially syllable stress</li>
                      <li>• Practice difficult spells in Practice mode first</li>
                      <li>• Use a quiet environment for best recognition</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Tactical Advice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Learn 3-4 spells really well rather than knowing many poorly</li>
                      <li>• Watch for spell cooldowns - timing is crucial</li>
                      <li>• Defensive spells can save you in clutch moments</li>
                      <li>• Study your opponent's patterns and adapt</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}