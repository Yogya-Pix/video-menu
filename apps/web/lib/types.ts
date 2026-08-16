export interface PublicMenuResponse {
  restaurant: {
    name: string;
    description: string | null;
    logoUrl: string | null;
  };
  categories: { id: string; name: string }[];
  items: PublicMenuItem[];
}

export interface PublicMenuItem {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  categoryId: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
}

export type VideoStatus = "PENDING" | "READY" | "FAILED";

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  categoryId: string | null;
  isAvailable: boolean;
  sortOrder: number;
  videoKey: string | null;
  videoStatus: VideoStatus;
  thumbnailKey: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface SessionUser {
  id: string;
  email: string;
  role: "OWNER" | "STAFF";
}

export interface SessionRestaurant {
  id: string;
  name: string;
  slug: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

export type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface OrderItem {
  id: string;
  quantity: number;
  nameSnapshot: string;
  priceCentsSnapshot: number;
  menuItemId: string | null;
}

export interface Order {
  id: string;
  status: OrderStatus;
  tableLabel: string | null;
  notes: string | null;
  totalCents: number;
  createdAt: string;
  items: OrderItem[];
}
