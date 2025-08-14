import { Spell } from "@/game/spells/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  spells: Spell[];
  selectedId?: string;
  onSelect: (spell: Spell) => void;
  onCast?: (spell: Spell) => void;
  displayMode?: 'canon' | 'original';
}

const elementLabel: Record<Spell["element"], string> = {
  fire: "Fire",
  ice: "Ice",
  lightning: "Lightning",
  shadow: "Shadow",
  nature: "Nature",
  arcane: "Arcane",
};

export const SpellBook = ({ spells, selectedId, onSelect, onCast, displayMode = 'canon' }: Props) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterElement, setFilterElement] = useState<string>('all');

  const categories = Array.from(new Set(spells.map(s => s.category)));
  const elements = Array.from(new Set(spells.map(s => s.element)));

  const filteredSpells = spells.filter(spell => {
    const categoryMatch = filterCategory === 'all' || spell.category === filterCategory;
    const elementMatch = filterElement === 'all' || spell.element === filterElement;
    return categoryMatch && elementMatch;
  });

  const getSpellName = (spell: Spell) => {
    return displayMode === 'canon' ? spell.canonical : spell.displayName;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Category:</label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Element:</label>
          <Select value={filterElement} onValueChange={setFilterElement}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {elements.map(el => (
                <SelectItem key={el} value={el}>{elementLabel[el]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Spell Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSpells.map((s) => (
          <Card key={s.id} className={cn("p-4 transition-all animate-fade-in hover:shadow-md", selectedId === s.id && "ring-2 ring-sidebar-ring")}> 
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <button onClick={() => onCast?.(s)} aria-label={`Cast ${getSpellName(s)}`} className="shrink-0 hover:scale-105 transition-transform">
                  <div className="w-10 h-10 rounded-md border bg-gradient-to-br from-brand/20 to-brand-2/20 flex items-center justify-center text-brand font-bold text-xs">
                    {s.element.slice(0, 2).toUpperCase()}
                  </div>
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{getSpellName(s)}</h3>
                  <p className="text-sm text-muted-foreground truncate mt-1">{s.effect}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{s.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {s.cooldownMs}ms cd
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="secondary" className={cn(
                  s.element === 'fire' && "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
                  s.element === 'ice' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                  s.element === 'lightning' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                  s.element === 'shadow' && "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                  s.element === 'nature' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                  s.element === 'arcane' && "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200"
                )}>
                  {elementLabel[s.element]}
                </Badge>
                <div className="text-xs text-muted-foreground">{"★".repeat(s.difficulty)}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Power: {s.basePower > 0 ? `+${s.basePower.toFixed(1)}` : s.basePower < 0 ? s.basePower.toFixed(1) : 'Utility'}
              </div>
              <Button variant={selectedId === s.id ? "secondary" : "outline"} size="sm" onClick={() => onSelect(s)}>
                {selectedId === s.id ? "Selected" : "Select"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      {filteredSpells.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No spells match the current filters.
        </div>
      )}
    </div>
  );
};

export default SpellBook;
