export interface ProductVariant {
  id: string;
  label: string;
  color: string;
  quantity: number;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  badge?: string;
  learnMoreUrl?: string;
  compareAtPrice?: number;
  price: number;
  variants?: ProductVariant[];
  activeVariantId?: string;
  quantity?: number;
  required?: boolean;
  maxQty?: number;
  rating?: number;
  reviewCount?: number;
}

export interface Step {
  id: string;
  step: number;
  title: string;
  nextLabel: string;
  icon: string;
  products: Product[];
}

export interface BundleData {
  steps: Step[];
}

export interface ReviewItem {
  productId: string;
  variantId?: string;
  name: string;
  variantLabel?: string;
  image: string;
  compareAtPrice?: number;
  price: number;
  quantity: number;
  category: string;
  isFree?: boolean;
  isMonthly?: boolean;
}

