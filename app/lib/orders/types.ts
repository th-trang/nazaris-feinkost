export type PaymentMethod = "card" | "paypal";

export interface OrderItemInput {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  weightInGrams?: number;
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
  items: OrderItemInput[];
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  status: "pending";
}

export interface StaffOrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  weightInGrams?: number;
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
    method: PaymentMethod;
    status: string;
  };
  totals: {
    subtotal: number;
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
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt?: string;
  type: string;
}

export interface StaffUsersResult {
  users: StaffUser[];
}

export interface UpdateUserInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}
