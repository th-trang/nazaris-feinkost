import { httpsCallable } from "firebase/functions";
import {
  BindOrderToPaymentIntentInput,
  CreatePaymentIntentInput,
  PaymentSession,
  PaymentSessionRef,
  UpdatePaymentIntentInput,
  UpdatePaymentIntentResult,
} from "../orders/types";
import { getFirebaseFunctions, isFirebaseConfigured } from "./client";

const callFunction = async <TInput, TResult>(
  name: string,
  payload: TInput,
): Promise<TResult> => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured in this environment.");
  }

  const callable = httpsCallable<TInput, TResult>(getFirebaseFunctions(), name);
  const result = await callable(payload);
  return result.data;
};

/**
 * Opens a payment session. The amount is computed by the backend from the
 * product catalog — this call only says which products are being ordered.
 */
export const createPaymentIntent = (
  input: CreatePaymentIntentInput,
): Promise<PaymentSession> =>
  callFunction<CreatePaymentIntentInput, PaymentSession>(
    "createPaymentIntent",
    input,
  );

/** Re-prices the session after the cart or the pickup date changed. */
export const updatePaymentIntent = (
  input: UpdatePaymentIntentInput,
): Promise<UpdatePaymentIntentResult> =>
  callFunction<UpdatePaymentIntentInput, UpdatePaymentIntentResult>(
    "updatePaymentIntent",
    input,
  );

export const cancelPaymentIntent = (
  input: PaymentSessionRef,
): Promise<{ success: boolean; status: string }> =>
  callFunction<PaymentSessionRef, { success: boolean; status: string }>(
    "cancelPaymentIntent",
    input,
  );

/**
 * Re-attaches an existing order to a fresh payment session, which is what a
 * retry after a declined payment produces. Without it the webhook would have
 * no way to match the successful payment to the order.
 */
export const bindOrderToPaymentIntent = (
  input: BindOrderToPaymentIntentInput,
): Promise<{ success: boolean; orderNumber: string }> =>
  callFunction<BindOrderToPaymentIntentInput, { success: boolean; orderNumber: string }>(
    "bindOrderToPaymentIntent",
    input,
  );
