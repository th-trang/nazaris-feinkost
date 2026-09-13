/** What the checkout form can declare. */
export type PaymentMethod = "card" | "paypal" | "sepa_debit";

/**
 * What a payment can turn out to have settled with. Apple Pay and Google Pay
 * are wallets on top of `card`, so they only become visible after the charge
 * exists and the webhook resolves them.
 */
export type ResolvedPaymentMethod = PaymentMethod | "google_pay" | "apple_pay";

/**
 * What the browser may send for one cart line. Prices and product names are
 * deliberately absent: the backend resolves them from the catalog.
 */
export interface CartLineInput {
  productId: string;
  quantity: number;
  weightInGrams?: number;
  pieces?: number;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  discountPercent: number;
  bundleDiscountRolle: number;
  bundleDiscountBoerek: number;
  rolleBundleFreeCount: number;
  boerekBundleFreeCount: number;
  total: number;
  currency: string;
}

export interface CreateOrderInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pickupDate: string;
  pickupLocation: string;
  specialRequests?: string;
  paymentMethod: PaymentMethod;
  paymentIntentId?: string;
  items: CartLineInput[];
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  status: "pending";
  totals: OrderTotals;
}

export interface CreatePaymentIntentInput {
  items: CartLineInput[];
  pickupDate: string;
}

export interface PaymentSession {
  clientSecret: string;
  paymentIntentId: string;
  expiresAt: string;
  totals: OrderTotals;
}

/**
 * Mutating a payment session requires echoing back its client secret — that is
 * the proof the caller owns this checkout and not somebody else's.
 */
export interface PaymentSessionRef {
  paymentIntentId: string;
  clientSecret: string;
}

export interface UpdatePaymentIntentInput extends PaymentSessionRef {
  items: CartLineInput[];
  pickupDate: string;
}

export interface BindOrderToPaymentIntentInput extends PaymentSessionRef {
  orderNumber: string;
}

export interface UpdatePaymentIntentResult {
  success: boolean;
  sepaAllowed: boolean;
  totals: OrderTotals;
}

export interface StaffOrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  weightInGrams?: number;
  pieces?: number;
}

export interface StaffOrder {
  id: string;
  orderNumber: string;
  status: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  pickup: {
    date: string;
    location: string;
  };
  payment: {
    method: ResolvedPaymentMethod;
    status: string;
  };
  totals: {
    subtotal: number;
    discount?: number;
    total?: number;
    currency: string;
  };
  items: StaffOrderItem[];
  createdAt?: string;
}

export interface StaffOrdersResult {
  uncompleted: StaffOrder[];
  completed: StaffOrder[];
}

export interface StaffUser {
  uid: string;
  email: string;
  displayName: string | null;
  isAdmin: boolean;
  isStaff: boolean;
  createdAt: string | null;
}

export interface StaffUsersResult {
  users: StaffUser[];
}

export interface CreateStaffUserInput {
  email: string;
  password: string;
  displayName?: string;
  isAdmin?: boolean;
}

export interface UpdateStaffUserInput {
  uid: string;
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
  isStaff?: boolean;
}

export const SETTLED_PAYMENT_STATUSES = ["paid", "underpaid"] as const;

export interface AccountingOrder extends StaffOrder {
  paidAt?: string;
  refunded: boolean;
  refundId?: string;
  canceledAt?: string;
  amountReceived?: number;
}
export interface AccountingRange {
  from: string;
  to: string;
}

export interface AccountingResult {
  orders: AccountingOrder[];
  truncated: boolean;
}

export interface AccountingSummary {
  orderCount: number;
  refundedCount: number;
  paidTotal: number;
  refundedTotal: number;
  revenue: number;
  discountTotal: number;
  currency: string;
}
