'use client';

import { TrimOptionSelector } from './TrimOptionSelector';

interface Trim {
  id: string;
  trim_name: string;
  base_price: number;
  tax_reduced_price: number | null;
}

interface TrimOption {
  id: string;
  trim_id: string | null;
  vehicle_id: string;
  option_name: string;
  option_price: number;
  option_type: string;
}

interface Props {
  trims: Trim[];
  options: TrimOption[];
  slug: string;
}

export function TrimOptionSelectorWrapper({ trims, options, slug }: Props) {
  if (trims.length === 0) return null;
  return <TrimOptionSelector trims={trims} options={options} slug={slug} />;
}
