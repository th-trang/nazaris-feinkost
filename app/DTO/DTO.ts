
export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pickupDate: string;
  pickupLocation: string;
  specialRequests?: string;
  paymentMethod: string;
}

export interface CheckoutErrors {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  pickupLocation?: string;
}