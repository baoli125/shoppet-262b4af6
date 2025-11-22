import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateMultiPetAllocation } from "@/utils/feedingCalculator";

interface Pet {
  id: string;
  name: string;
  nickname?: string;
  type: string;
  weight?: number;
  daily_food_override_gr?: number;
}

interface Product {
  id: string;
  name: string;
  weight?: string;
  category: string;
  portion_gr_per_day?: number;
  portion_gr_per_kg_per_day?: number;
}

interface MultiPetSelectorProps {
  pets: Pet[];
  product: Product;
  quantity: number;
  onAllocationChange?: (allocation: any) => void;
}

export const MultiPetSelector = ({ 
  pets, 
  product, 
  quantity,
  onAllocationChange 
}: MultiPetSelectorProps) => {
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>(
    pets.map(p => p.id) // Default: all pets selected
  );
  const [policy, setPolicy] = useState<'split-by-need' | 'equal' | 'manual'>('split-by-need');

  const togglePet = (petId: string) => {
    setSelectedPetIds(prev => 
      prev.includes(petId) 
        ? prev.filter(id => id !== petId)
        : [...prev, petId]
    );
  };

  const selectedPets = pets.filter(p => selectedPetIds.includes(p.id));
  
  const allocation = selectedPets.length > 0 
    ? calculateMultiPetAllocation(
        selectedPets,
        [{ product, quantity }],
        policy
      )
    : null;

  const getPetIcon = (type: string) => {
    const icons: Record<string, string> = {
      dog: "🐕",
      cat: "🐱",
      bird: "🐦",
      fish: "🐟",
      other: "🐾"
    };
    return icons[type] || "🐾";
  };

  return (
    <Card className="p-5 space-y-4 bg-gradient-to-br from-primary/5 to-accent/5 border-2">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">🐾 Chọn thú cưng sử dụng</h3>
        <Select value={policy} onValueChange={(v: any) => setPolicy(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="split-by-need">Chia theo nhu cầu</SelectItem>
            <SelectItem value="equal">Chia đều</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {pets.map(pet => (
          <div key={pet.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
            <Checkbox
              id={pet.id}
              checked={selectedPetIds.includes(pet.id)}
              onCheckedChange={() => togglePet(pet.id)}
            />
            <Label htmlFor={pet.id} className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getPetIcon(pet.type)}</span>
                <div>
                  <div className="font-semibold">
                    {pet.name} {pet.nickname && `(${pet.nickname})`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pet.weight ? `${pet.weight}kg` : 'Chưa có cân nặng'}
                  </div>
                </div>
              </div>
            </Label>
            {selectedPetIds.includes(pet.id) && allocation && (
              <div className="text-right text-sm">
                <div className="font-bold text-primary">
                  {allocation.perPet.find(p => p.petId === pet.id)?.estimatedDays || 0}d
                </div>
                <div className="text-xs text-muted-foreground">
                  {allocation.perPet.find(p => p.petId === pet.id)?.gramsAllocated || 0}g
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {allocation && selectedPets.length > 0 && (
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tổng khẩu phần:</span>
            <span className="font-bold">{allocation.totalGrams.toLocaleString()}g</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phương thức:</span>
            <Badge variant="secondary">
              {policy === 'split-by-need' ? 'Chia theo nhu cầu' : 'Chia đều'}
            </Badge>
          </div>
          {allocation.leftoverGrams && allocation.leftoverGrams > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dư thừa:</span>
              <span className="text-orange-600 font-semibold">+{allocation.leftoverGrams}g</span>
            </div>
          )}
          <div className="pt-2 text-xs text-muted-foreground">
            💡 Tip: Thời gian ước tính dựa trên cân nặng và chế độ ăn hiện tại của mỗi bé
          </div>
        </div>
      )}

      {selectedPets.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Vui lòng chọn ít nhất 1 thú cưng
        </div>
      )}
    </Card>
  );
};