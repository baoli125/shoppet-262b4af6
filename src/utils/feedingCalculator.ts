// Utility functions for calculating feeding duration and multi-pet allocation

interface Pet {
  id?: string;
  name?: string;
  weight?: number;
  type: string;
  daily_food_override_gr?: number;
}

interface Product {
  id?: string;
  weight?: string;
  category: string;
  portion_gr_per_day?: number;
  portion_gr_per_kg_per_day?: number;
}

interface PetAllocation {
  petId: string;
  petName: string;
  gramsAllocated: number;
  dailyIntakeGr: number;
  estimatedDays: number;
  estimatedFinishDate: string;
}

interface MultiPetCalculation {
  totalGrams: number;
  policyUsed: string;
  perPet: PetAllocation[];
  leftoverGrams?: number;
}

/**
 * Calculate daily food intake for a pet in grams
 * Priority order:
 * 1. pet.daily_food_override_gr (user override)
 * 2. product.portion_gr_per_day (product-specific)
 * 3. product.portion_gr_per_kg_per_day * pet.weight
 * 4. Fallback by species/size config
 */
export const calculateDailyIntake = (pet: Pet, product: Product): number => {
  // Priority 1: User override
  if (pet.daily_food_override_gr && pet.daily_food_override_gr > 0) {
    return pet.daily_food_override_gr;
  }

  // Priority 2: Product-specific portion
  if (product.portion_gr_per_day && product.portion_gr_per_day > 0) {
    return product.portion_gr_per_day;
  }

  // Priority 3: Product portion per kg
  if (product.portion_gr_per_kg_per_day && pet.weight && pet.weight > 0) {
    return product.portion_gr_per_kg_per_day * pet.weight;
  }

  // Priority 4: Fallback by species/size
  if (!pet.weight || pet.weight <= 0) return 0;

  const petWeightKg = pet.weight;
  let gramsPerKg = 25; // Default 25g per kg

  if (pet.type === 'dog') {
    if (petWeightKg < 10) {
      gramsPerKg = 30; // Small dogs: 30g/kg/day
    } else if (petWeightKg < 25) {
      gramsPerKg = 25; // Medium dogs: 25g/kg/day
    } else {
      gramsPerKg = 20; // Large dogs: 20g/kg/day
    }
  } else if (pet.type === 'cat') {
    gramsPerKg = 40; // Cats: 40g/kg/day
  } else if (pet.type === 'bird') {
    gramsPerKg = 50; // Birds: 50g/kg/day (5% of body weight)
  } else if (pet.type === 'rabbit') {
    gramsPerKg = 40; // Rabbits: 40g/kg/day
  }

  return Math.round(petWeightKg * gramsPerKg);
};

/**
 * Calculate how many days a food product will last for a pet
 */
export const calculateFeedingDays = (pet: Pet, product: Product): number => {
  if (!product.weight) return 0;

  const weightMatch = product.weight.match(/(\d+\.?\d*)/);
  if (!weightMatch) return 0;
  
  const productWeightKg = parseFloat(weightMatch[1]);
  const productWeightGrams = productWeightKg * 1000;

  const dailyIntakeGr = calculateDailyIntake(pet, product);
  if (dailyIntakeGr <= 0) return 0;

  const days = productWeightGrams / dailyIntakeGr;
  return Math.round(days * 10) / 10; // 1 decimal place
};

/**
 * Multi-pet allocation calculation
 * @param pets Array of pets
 * @param products Array of products with quantities
 * @param policy 'split-by-need' | 'equal' | 'manual'
 * @param startDate Optional start date
 * @param manualAllocations Optional manual allocations (for 'manual' policy)
 */
export const calculateMultiPetAllocation = (
  pets: Pet[],
  products: { product: Product; quantity: number }[],
  policy: 'split-by-need' | 'equal' | 'manual' = 'split-by-need',
  startDate?: Date,
  manualAllocations?: { [petId: string]: number }
): MultiPetCalculation => {
  const start = startDate || new Date();

  // Calculate total grams from all products
  const totalGrams = products.reduce((sum, { product, quantity }) => {
    const weightMatch = product.weight?.match(/(\d+\.?\d*)/);
    if (!weightMatch) return sum;
    const weightKg = parseFloat(weightMatch[1]);
    return sum + (weightKg * 1000 * quantity);
  }, 0);

  if (totalGrams === 0) {
    return { totalGrams: 0, policyUsed: policy, perPet: [] };
  }

  let perPet: PetAllocation[] = [];

  if (policy === 'manual' && manualAllocations) {
    // Manual allocation
    perPet = pets.map(pet => {
      const gramsAllocated = manualAllocations[pet.id!] || 0;
      const dailyIntakeGr = calculateDailyIntake(pet, products[0].product);
      const estimatedDays = dailyIntakeGr > 0 ? gramsAllocated / dailyIntakeGr : 0;
      const finishDate = new Date(start);
      finishDate.setDate(finishDate.getDate() + Math.floor(estimatedDays));

      return {
        petId: pet.id!,
        petName: pet.name || 'Unknown',
        gramsAllocated,
        dailyIntakeGr,
        estimatedDays: Math.round(estimatedDays * 10) / 10,
        estimatedFinishDate: finishDate.toISOString().split('T')[0]
      };
    });
  } else if (policy === 'equal') {
    // Equal allocation
    const gramsPerPet = totalGrams / pets.length;
    
    perPet = pets.map(pet => {
      const dailyIntakeGr = calculateDailyIntake(pet, products[0].product);
      const estimatedDays = dailyIntakeGr > 0 ? gramsPerPet / dailyIntakeGr : 0;
      const finishDate = new Date(start);
      finishDate.setDate(finishDate.getDate() + Math.floor(estimatedDays));

      return {
        petId: pet.id!,
        petName: pet.name || 'Unknown',
        gramsAllocated: Math.round(gramsPerPet),
        dailyIntakeGr,
        estimatedDays: Math.round(estimatedDays * 10) / 10,
        estimatedFinishDate: finishDate.toISOString().split('T')[0]
      };
    });
  } else {
    // Split-by-need (default)
    const dailyIntakes = pets.map(pet => calculateDailyIntake(pet, products[0].product));
    const totalDailyIntake = dailyIntakes.reduce((sum, intake) => sum + intake, 0);

    if (totalDailyIntake === 0) {
      return { totalGrams, policyUsed: policy, perPet: [] };
    }

    perPet = pets.map((pet, index) => {
      const dailyIntakeGr = dailyIntakes[index];
      const proportion = dailyIntakeGr / totalDailyIntake;
      const gramsAllocated = Math.round(totalGrams * proportion);
      const estimatedDays = dailyIntakeGr > 0 ? gramsAllocated / dailyIntakeGr : 0;
      const finishDate = new Date(start);
      finishDate.setDate(finishDate.getDate() + Math.floor(estimatedDays));

      return {
        petId: pet.id!,
        petName: pet.name || 'Unknown',
        gramsAllocated,
        dailyIntakeGr,
        estimatedDays: Math.round(estimatedDays * 10) / 10,
        estimatedFinishDate: finishDate.toISOString().split('T')[0]
      };
    });
  }

  const allocatedTotal = perPet.reduce((sum, p) => sum + p.gramsAllocated, 0);
  const leftoverGrams = totalGrams - allocatedTotal;

  return {
    totalGrams,
    policyUsed: policy,
    perPet,
    leftoverGrams: leftoverGrams > 0 ? Math.round(leftoverGrams) : undefined
  };
};

/**
 * Get user-friendly message about feeding duration
 */
export const getFeedingDurationMessage = (days: number, petName?: string): string => {
  if (days === 0) return "";
  
  const target = petName ? `bé ${petName}` : "thú cưng của bạn";
  
  if (days < 7) {
    return `Đủ cho ${target} ăn khoảng ${days} ngày`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `Đủ cho ${target} ăn khoảng ${weeks} tuần`;
  } else if (days < 90) {
    const months = Math.floor(days / 30);
    return `Đủ cho ${target} ăn khoảng ${months} tháng`;
  } else {
    return `Đủ cho ${target} ăn hơn 3 tháng`;
  }
};

/**
 * Check if food is running low (less than 5 days remaining)
 */
export const isFoodRunningLow = (endDate: string): boolean => {
  const end = new Date(endDate);
  const today = new Date();
  const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysRemaining > 0 && daysRemaining <= 5;
};

/**
 * Get days remaining until food runs out
 */
export const getDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const today = new Date();
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};
