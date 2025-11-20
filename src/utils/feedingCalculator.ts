// Utility functions for calculating feeding duration

interface Pet {
  weight?: number;
  type: string;
}

interface Product {
  weight?: string;
  category: string;
}

/**
 * Calculate how many days a food product will last for a pet
 * @param pet Pet information including weight and type
 * @param product Product information including weight
 * @returns Estimated days the food will last
 */
export const calculateFeedingDays = (pet: Pet, product: Product): number => {
  if (!pet.weight || !product.weight) return 0;

  // Extract weight in kg from product weight string (e.g., "5kg" -> 5)
  const weightMatch = product.weight.match(/(\d+\.?\d*)/);
  if (!weightMatch) return 0;
  
  const productWeightKg = parseFloat(weightMatch[1]);
  const petWeightKg = pet.weight;

  // Calculate daily food requirement based on pet type and weight
  // General formula: Pet should eat 2-3% of body weight per day for adult pets
  let dailyPercentage = 0.025; // 2.5% default
  
  if (pet.type === 'dog') {
    // Dogs: 2-3% for adults, 3-4% for puppies
    if (petWeightKg < 10) {
      dailyPercentage = 0.035; // Small dogs eat more per kg
    } else if (petWeightKg < 25) {
      dailyPercentage = 0.025;
    } else {
      dailyPercentage = 0.02; // Large dogs eat less per kg
    }
  } else if (pet.type === 'cat') {
    // Cats: 2-4% for adults, 4-5% for kittens
    dailyPercentage = 0.03;
  } else if (pet.type === 'bird') {
    dailyPercentage = 0.05; // Birds eat about 5% of body weight
  } else if (pet.type === 'rabbit') {
    dailyPercentage = 0.04; // Rabbits eat about 4% of body weight
  }

  const dailyFoodKg = petWeightKg * dailyPercentage;
  const estimatedDays = Math.floor((productWeightKg / dailyFoodKg) * 1000) / 1000;
  
  return Math.round(estimatedDays);
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
