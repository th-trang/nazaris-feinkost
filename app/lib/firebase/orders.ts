import {httpsCallable} from "firebase/functions";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {getFirebaseDb, getFirebaseFunctions, isFirebaseConfigured} from "./client";
import {
  CreateOrderInput,
  CreateOrderResponse,
  PaymentMethod,
  StaffOrder,
  StaffOrderItem,
  StaffOrdersResult,
  StaffUser,
  StaffUsersResult,
  UpdateUserInput,
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

const toStaffUser = (id: string, data: Record<string, unknown>): StaffUser => {
  const createdAtRaw = (data.createdAt as {toDate?: () => Date} | undefined)?.toDate?.();

  return {
    id,
    firstName: String(data.firstName ?? ""),
    lastName: String(data.lastName ?? ""),
    email: String(data.email ?? ""),
    phone: String(data.phone ?? ""),
    type: String(data.type ?? "customer"),
    createdAt: createdAtRaw ? createdAtRaw.toISOString() : undefined,
  };
};

export const getStaffUsers = async (): Promise<StaffUsersResult> => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured in this environment.");
  }

  const usersRef = collection(getFirebaseDb(), "users");
  const usersQuery = query(
    usersRef,
    orderBy("createdAt", "desc"),
    limit(500),
  );

  const snapshot = await getDocs(usersQuery);

  return {
    users: snapshot.docs.map((d) =>
      toStaffUser(d.id, d.data() as Record<string, unknown>),
    ),
  };
};

export const updateUser = async (input: UpdateUserInput): Promise<void> => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured in this environment.");
  }

  const userRef = doc(getFirebaseDb(), "users", input.userId);
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.firstName !== undefined) {
    updates.firstName = input.firstName;
  }
  if (input.lastName !== undefined) {
    updates.lastName = input.lastName;
  }
  if (input.email !== undefined) {
    updates.email = input.email;
  }
  if (input.phone !== undefined) {
    updates.phone = input.phone;
  }

  await updateDoc(userRef, updates);
};
