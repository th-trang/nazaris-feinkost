import type {PaymentMethod, ResolvedPaymentMethod} from "./paymentMethods.js";
import type {CartLineInput, OrderTotals, PricedLine} from "./pricing.js";

export type {PaymentMethod, ResolvedPaymentMethod} from "./paymentMethods.js";

export type {CartLineInput, OrderTotals};

/**
 * Everything the browser is trusted with: who is picking the order up, when,
 * and which products in what amounts. Prices are never accepted from the
 * client — they come from the catalog via the pricing engine.
 */
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

/** A priced line as persisted on the order document. */
export type StoredOrderItem = Omit<PricedLine, "rawUnitPrice">;

/** Order fields the notification emails render. */
export interface OrderNotificationPayload {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	pickupDate: string;
	pickupLocation: string;
	specialRequests?: string;
	/** The method the payment actually settled with, wallets included. */
	paymentMethod: ResolvedPaymentMethod;
	items: StoredOrderItem[];
}
