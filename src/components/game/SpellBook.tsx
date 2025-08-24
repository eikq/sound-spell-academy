import { Spell } from "@/game/spells/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  spells: Spell[];
  selectedId?: string;
  onSelect: (spell: Spell) => void;
  onCast?: (spell: Spell) => void;
}

const elementLabel: Record<Spell["element"], string> = {
  fire: "Fire",
  ice: "Ice",
  lightning: "Lightning",
  shadow: "Shadow",
  nature: "Nature",
  arcane: "Arcane",
};

export const SpellBook = ({ spells, selectedId, onSelect, onCast }: Props) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {spells.map((s) => (
        <Card key={s.id} className={cn("p-4 transition-all animate-fade-in", selectedId === s.id && "ring-2 ring-sidebar-ring")}> 
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <button onClick={() => onCast?.(s)} aria-label={`Cast ${s.name}`} className="shrink-0">
                <img
                  src={`/assets/ui/icons/spell_${s.id}.png`}
                  alt={`Icon for ${s.name} (${elementLabel[s.element]})`}
                  className="w-10 h-10 rounded-md border"
                  loading="lazy"
                />
              </button>
              <div>
                <h3 className="font-semibold text-lg">{s.name}</h3>
                <p className="text-sm text-muted-foreground truncate mt-1">{s.lore}</p>
              </div>
            </div>
            <Badge variant="secondary">{elementLabel[s.element]}</Badge>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Difficulty: {"★".repeat(s.difficulty)}</div>
            <Button variant={selectedId === s.id ? "secondary" : "outline"} size="sm" onClick={() => onSelect(s)}>
              {selectedId === s.id ? "Selected" : "Select Text"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SpellBook;
