export interface PricingEntry {
  contractMonths: number;
  productType: 'rent' | 'lease' | 'installment';
  depositZero: boolean;
  minMonthly: number;
}

export interface VehicleCard {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  fuelType: string;
  basePrice: number | null;
  imageKey: string | null;
  displayOrder: number;
  isDomestic: boolean;
  price: { min: number } | null;
  pricingOptions: PricingEntry[];
}

export type SortKey = 'price_asc' | 'price_desc' | 'base_asc' | 'base_desc' | 'name_asc';
export type TabKey = 'all' | 'best' | 'domestic' | 'import' | 'ev' | 'hybrid';

export interface FilterState {
  productTypes: ('rent' | 'lease')[];
  depositZero: boolean | null;
  contractMonths: number[];
}
