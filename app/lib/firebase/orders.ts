import {httpsCallable} from "firebase/functions";
import {sendPasswordResetEmail} from "firebase/auth";
import { collection, doc, getDocs, limit, orderBy, query, updateDoc, where } from "firebase/firestore";
import {getFirebaseAuth, getFirebaseDb, getFirebaseFunctions, isFirebaseConfigured} from "./client";
import {
  CreateOrderInput,
  CreateOrderResponse,
  CreateStaffUserInput,
  PaymentMethod,
  StaffOrder,
  StaffOrderItem,
  StaffOrdersResult,
  StaffUser,
  StaffUsersResult,
  UpdateStaffUserInput,
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

const asPaymentMethod = (value: unknown): PaymentMethod =>
  value === "paypal" ? "paypal" : "card";

const toStaffOrderItems = (items: unknown): StaffOrderItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item: Record<string, unknown>) => ({
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    quantity: Number(item.quantity ?? 0),
    unitPrice: Number(item.unitPrice ?? 0),
    weightInGrams: item.weightInGrams ? Number(item.weightInGrams) : undefined,
  }));
};

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
    items: toStaffOrderItems(data.items),
    createdAt: createdAtRaw ? createdAtRaw.toISOString() : undefined,
  };
};

export const getStaffOrders = async (): Promise<StaffOrdersResult> => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured in this environment.");
  }

  const ordersRef = collection(getFirebaseDb(), "orders");

  const uncompletedQuery = query(
    ordersRef,
    where("isComplete", "==", false),
    orderBy("createdAt", "desc"),
    limit(200),
  );

  const completedQuery = query(
    ordersRef,
    where("isComplete", "==", true),
    orderBy("createdAt", "desc"),
    limit(200),
  );

  const [uncompletedSnapshot, completedSnapshot] = await Promise.all([
    getDocs(uncompletedQuery),
    getDocs(completedQuery),
  ]);

  return {
    uncompleted: uncompletedSnapshot.docs.map((d) =>
      toStaffOrder(d.id, d.data() as Record<string, unknown>),
    ),
    completed: completedSnapshot.docs.map((d) =>
      toStaffOrder(d.id, d.data() as Record<string, unknown>),
    ),
  };
};

export const markOrderCompleted = async (orderId: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured in this environment.");
  }

  const orderRef = doc(getFirebaseDb(), "orders", orderId);
  await updateDoc(orderRef, {
    isComplete: true,
    status: "completed",
    completedAt: new Date(),
  });
};

export const getStaffUsers = async (): Promise<StaffUsersResult> => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured in this environment.");
  }

  const callable = httpsCallable<void, StaffUsersResult>(
    getFirebaseFunctions(),
    "listStaffUsers",
  );

  const result = await callable();
  return result.data;
};

export const createStaffUser = async (input: CreateStaffUserInput): Promise<StaffUser> => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured in this environment.");
  }

  const callable = httpsCallable<CreateStaffUserInput, StaffUser>(
    getFirebaseFunctions(),
    "createStaffUser",
  );

  const result = await callable(input);
  return result.data;
};

export const updateStaffUser = async (input: UpdateStaffUserInput): Promise<StaffUser> => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured in this environment.");
  }

  const callable = httpsCallable<UpdateStaffUserInput, StaffUser>(
    getFirebaseFunctions(),
    "updateStaffUser",
  );

  const result = await callable(input);
  return result.data;
};

export const deleteStaffUser = async (uid: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured in this environment.");
  }

  const callable = httpsCallable<{uid: string}, {success: boolean}>(
    getFirebaseFunctions(),
    "deleteStaffUser",
  );

  await callable({uid});
};

export const resetStaffUserPassword = async (uid: string): Promise<{email: string}> => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured in this environment.");
  }

  // First verify user is staff and get their email via Cloud Function
  const callable = httpsCallable<{uid: string}, {success: boolean; email: string}>(
    getFirebaseFunctions(),
    "resetStaffUserPassword",
  );

  const result = await callable({uid});
  const email = result.data.email;

  // Actually send the password reset email using Firebase Auth client SDK
  await sendPasswordResetEmail(getFirebaseAuth(), email);

  return {email};
};
