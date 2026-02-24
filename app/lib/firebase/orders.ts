import {httpsCallable} from "firebase/functions";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {getFirebaseDb, getFirebaseFunctions, isFirebaseConfigured} from "./client";
import {
  CreateOrderInput,
  CreateOrderResponse,
  PaymentMethod,
  StaffOrder,
  StaffOrdersResult,
} from "../orders/types";

export const createOrder = async (
  payload: CreateOrderInput,
): Promise<CreateOrderResponse> => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured in this environment.");
  }

  const callable = httpsCallable<CreateOrderInput, CreateOrderResponse>(
    getFirebaseFunctions(),
    "createOrder",
  );

  const result = await callable(payload);
  return result.data;
};

const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const asPaymentMethod = (value: unknown): PaymentMethod =>
  value === "paypal" ? "paypal" : "card";

const toStaffOrder = (id: string, data: Record<string, unknown>): StaffOrder => {
  const customer = (data.customer ?? {}) as Record<string, unknown>;
  const pickup = (data.pickup ?? {}) as Record<string, unknown>;
  const payment = (data.payment ?? {}) as Record<string, unknown>;
  const totals = (data.totals ?? {}) as Record<string, unknown>;

  const createdAtRaw = (data.createdAt as {toDate?: () => Date} | undefined)?.toDate?.();

  return {
    id,
    orderNumber: String(data.orderNumber ?? ""),
    status: String(data.status ?? "pending"),
    customer: {
      firstName: String(customer.firstName ?? ""),
      lastName: String(customer.lastName ?? ""),
      email: String(customer.email ?? ""),
      phone: String(customer.phone ?? ""),
    },
    pickup: {
      date: String(pickup.date ?? ""),
      location: String(pickup.location ?? ""),
    },
    payment: {
      method: asPaymentMethod(payment.method),
      status: String(payment.status ?? "pending"),
    },
    totals: {
      subtotal: Number(totals.subtotal ?? 0),
      currency: String(totals.currency ?? "EUR"),
    },
    createdAt: createdAtRaw ? createdAtRaw.toISOString() : undefined,
  };
};

export const getStaffOrders = async (): Promise<StaffOrdersResult> => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured in this environment.");
  }

  const today = getTodayDateString();
  const ordersRef = collection(getFirebaseDb(), "orders");

  const upcomingQuery = query(
    ordersRef,
    where("pickup.date", ">=", today),
    orderBy("pickup.date", "asc"),
    limit(200),
  );

  const pastQuery = query(
    ordersRef,
    where("pickup.date", "<", today),
    orderBy("pickup.date", "desc"),
    limit(200),
  );

  const [upcomingSnapshot, pastSnapshot] = await Promise.all([
    getDocs(upcomingQuery),
    getDocs(pastQuery),
  ]);

  return {
    upcoming: upcomingSnapshot.docs.map((doc) =>
      toStaffOrder(doc.id, doc.data() as Record<string, unknown>),
    ),
    past: pastSnapshot.docs.map((doc) =>
      toStaffOrder(doc.id, doc.data() as Record<string, unknown>),
    ),
  };
};
