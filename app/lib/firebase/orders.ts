import {httpsCallable} from "firebase/functions";
import {sendPasswordResetEmail} from "firebase/auth";
import { collection, doc, getDocs, limit, orderBy, query, QueryConstraint, Timestamp, updateDoc, where } from "firebase/firestore";
import {getFirebaseAuth, getFirebaseDb, getFirebaseFunctions, isFirebaseConfigured} from "./client";
import {
  AccountingOrder,
  AccountingRange,
  AccountingResult,
  CreateOrderInput,
  CreateOrderResponse,
  CreateStaffUserInput,
  ResolvedPaymentMethod,
  StaffOrder,
  StaffOrderItem,
  StaffOrdersResult,
  StaffUser,
  StaffUsersResult,
  SETTLED_PAYMENT_STATUSES,
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

const RESOLVED_PAYMENT_METHODS: ResolvedPaymentMethod[] = [
  "card",
  "paypal",
  "sepa_debit",
  "google_pay",
  "apple_pay",
];

const asPaymentMethod = (value: unknown): ResolvedPaymentMethod =>
  RESOLVED_PAYMENT_METHODS.find((method) => method === value) ?? "card";

const toStaffOrderItems = (items: unknown): StaffOrderItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item: Record<string, unknown>) => ({
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    quantity: Number(item.quantity ?? 0),
    unitPrice: Number(item.unitPrice ?? 0),
    // Orders written before lines carried their own total.
    lineTotal: Number(
      item.lineTotal ?? Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0),
    ),
    weightInGrams: item.weightInGrams ? Number(item.weightInGrams) : undefined,
    pieces: item.pieces ? Number(item.pieces) : undefined,
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
      discount: Number(totals.discount ?? 0),
      // Orders written before discounts were stored only had the subtotal.
      total: Number(totals.total ?? totals.subtotal ?? 0),
      currency: String(totals.currency ?? "EUR"),
    },
    items: toStaffOrderItems(data.items),
    createdAt: createdAtRaw ? createdAtRaw.toISOString() : undefined,
  };
};

/**
 * An inclusive range over the day an order was placed. Either end may be left
 * open, so "everything since March" needs no artificial upper bound.
 */
export interface StaffOrderDateRange {
  from?: string;
  to?: string;
}

/**
 * Turns a `YYYY-MM-DD` day into Firestore bounds.
 *
 * Both ends are built from *local* midnight rather than by slicing the stored
 * UTC string: an order placed at 00:30 in Hamburg is 22:30 UTC the day before,
 * and staff looking for "orders placed on the 5th" mean the shop's day.
 */
const toDayBounds = (range: StaffOrderDateRange): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [];

  if (range.from) {
    constraints.push(
      where("createdAt", ">=", Timestamp.fromDate(new Date(`${range.from}T00:00:00`))),
    );
  }

  if (range.to) {
    constraints.push(
      where("createdAt", "<=", Timestamp.fromDate(new Date(`${range.to}T23:59:59.999`))),
    );
  }

  return constraints;
};

export const getStaffOrders = async (
  range: StaffOrderDateRange = {},
): Promise<StaffOrdersResult> => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured in this environment.");
  }

  const ordersRef = collection(getFirebaseDb(), "orders");

  // The range sits on `createdAt`, which is already the orderBy field, so it
  // rides the existing isComplete/createdAt index — no new index needed. It
  // also has to be applied here rather than in the page: filtering after the
  // fetch would only ever search the newest 200 orders.
  const withinRange = toDayBounds(range);

  const uncompletedQuery = query(
    ordersRef,
    where("isComplete", "==", false),
    ...withinRange,
    orderBy("createdAt", "desc"),
    limit(200),
  );

  const completedQuery = query(
    ordersRef,
    where("isComplete", "==", true),
    ...withinRange,
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

/**
 * How many orders a single report may load.
 *
 * A bookkeeping report has to be complete or it is worthless, so rather than
 * silently paging we load up to this many and tell the caller when the range
 * held more — at which point the answer is a narrower range, not a truncated
 * report.
 */
const ACCOUNTING_LIMIT = 2000;

const toDate = (value: unknown): Date | undefined =>
  (value as {toDate?: () => Date} | undefined)?.toDate?.();

const toAccountingOrder = (
  id: string,
  data: Record<string, unknown>,
): AccountingOrder => {
  const base = toStaffOrder(id, data);
  const payment = (data.payment ?? {}) as Record<string, unknown>;
  const paidAt = toDate(data.paidAt);
  const canceledAt = toDate(data.canceledAt);
  const amountReceived = payment.amountReceived;

  return {
    ...base,
    paidAt: paidAt ? paidAt.toISOString() : undefined,
    // A refund is what takes an order back out of the revenue, so a charge
    // that was reversed counts even if the status field was never updated.
    refunded:
      payment.refundStatus === "refunded" ||
      Boolean(payment.refundId) ||
      base.status === "canceled",
    refundId: payment.refundId ? String(payment.refundId) : undefined,
    canceledAt: canceledAt ? canceledAt.toISOString() : undefined,
    amountReceived:
      amountReceived === undefined || amountReceived === null
        ? undefined
        : Number(amountReceived),
  };
};

/**
 * Every order in the range whose payment actually settled — the raw material
 * of the bookkeeping report.
 *
 * The range is applied to `createdAt` because that is the field every order
 * carries and the one Firestore can index; the report then files each order
 * under its payment date, which sits seconds later.
 */
export const getAccountingOrders = async (
  range: AccountingRange,
): Promise<AccountingResult> => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured in this environment.");
  }

  const from = Timestamp.fromDate(new Date(`${range.from}T00:00:00`));
  const to = Timestamp.fromDate(new Date(`${range.to}T23:59:59.999`));

  const settledQuery = query(
    collection(getFirebaseDb(), "orders"),
    where("payment.status", "in", [...SETTLED_PAYMENT_STATUSES]),
    where("createdAt", ">=", from),
    where("createdAt", "<=", to),
    orderBy("createdAt", "asc"),
    // One over the cap, so a full page is distinguishable from an exact fit.
    limit(ACCOUNTING_LIMIT + 1),
  );

  const snapshot = await getDocs(settledQuery);
  const truncated = snapshot.docs.length > ACCOUNTING_LIMIT;

  return {
    orders: snapshot.docs
      .slice(0, ACCOUNTING_LIMIT)
      .map((d) => toAccountingOrder(d.id, d.data() as Record<string, unknown>)),
    truncated,
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

// export const createStaffUser = async (input: CreateStaffUserInput): Promise<StaffUser> => {
//   if (!isFirebaseConfigured) {
//     throw new Error("Firebase is not configured in this environment.");
//   }

//   const callable = httpsCallable<CreateStaffUserInput, StaffUser>(
//     getFirebaseFunctions(),
//     "createStaffUser",
//   );

//   const result = await callable(input);
//   return result.data;
// };

// export const updateStaffUser = async (input: UpdateStaffUserInput): Promise<StaffUser> => {
//   if (!isFirebaseConfigured) {
//     throw new Error("Firebase is not configured in this environment.");
//   }

//   const callable = httpsCallable<UpdateStaffUserInput, StaffUser>(
//     getFirebaseFunctions(),
//     "updateStaffUser",
//   );

//   const result = await callable(input);
//   return result.data;
// };

// export const deleteStaffUser = async (uid: string): Promise<void> => {
//   if (!isFirebaseConfigured) {
//     throw new Error("Firebase is not configured in this environment.");
//   }

//   const callable = httpsCallable<{uid: string}, {success: boolean}>(
//     getFirebaseFunctions(),
//     "deleteStaffUser",
//   );

//   await callable({uid});
// };

// export const resetStaffUserPassword = async (uid: string): Promise<{email: string}> => {
//   if (!isFirebaseConfigured) {
//     throw new Error("Firebase is not configured in this environment.");
//   }

//   // First verify user is staff and get their email via Cloud Function
//   const callable = httpsCallable<{uid: string}, {success: boolean; email: string}>(
//     getFirebaseFunctions(),
//     "resetStaffUserPassword",
//   );

//   const result = await callable({uid});
//   const email = result.data.email;

//   // Actually send the password reset email using Firebase Auth client SDK
//   await sendPasswordResetEmail(getFirebaseAuth(), email);

//   return {email};
// };
