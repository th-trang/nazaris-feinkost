export type PaymentMethod = "card" | "paypal";

export interface OrderItemInput {
	id: string;
	name: string;
	quantity: number;
	unitPrice: number;
	weightInGrams?: number;
	imageUrl?: string;
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
