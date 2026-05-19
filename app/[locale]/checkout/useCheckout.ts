"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useTranslations } from "next-intl";
import { getDayName, getLocationsForDate } from "@/app/data/LocationList";
import { createOrder } from "@/app/lib/firebase/orders";
import { CreateOrderInput } from "@/app/lib/orders/types";
import {saveCheckoutState, buildReturnUrl, restoreCheckoutState, clearCheckoutState, getCheckoutStateKey} from "@/app/lib/checkout/checkoutState";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { validateName, validatePhone, validateEmail } from "./useValidation";
import { CheckoutErrors, CheckoutFormData } from "./DTO";
import { isSepaAllowedForPickupDate } from "@/app/lib/helper/Utils";

export function useCheckout(
  stripe: Stripe | null,
  elements: StripeElements | null,
  paymentIntentId: string | null,
  expiresAt: string | null,
  onSuccess?: () => void,
  onPaymentFailed?: () => void,
) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ locale?: string }>();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const { cartItems, cartTotal, clearCart, restoreCart } = useCart();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [errors, setErrors] = useState<CheckoutErrors>({});

  // Restore checkout state (form data + cart items) from localStorage if ?ref= is present
  const [savedState] = useState(() => restoreCheckoutState());
  const [formData, setFormData] = useState<CheckoutFormData>(() => {
    if (savedState) return savedState.formData;
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      pickupDate: tomorrowStr,
      pickupLocation: "",
      specialRequests: "",
      paymentMethod: "card",
    };
  });

  // Clean up localStorage after redirect
  const [checkoutRefKey] = useState(() => getCheckoutStateKey());
  useEffect(() => {
    if (checkoutRefKey) {
      clearCheckoutState(checkoutRefKey);
    }
  }, [checkoutRefKey]);

  // Restore cart items from savedState when returning from a failed payment redirect
  useEffect(() => {
    if (savedState?.cartItems?.length && cartItems.length === 0) {
      restoreCart(savedState.cartItems);
    }
  }, []); // Run once on mount – savedState is captured at mount time

  // #region TIMER
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [pendingOrderNumber, setPendingOrderNumber] = useState<string | null>(null);

  const cancelPaymentIntent = useCallback(async () => {
    if (!paymentIntentId) return;
    try {
      await fetch("/api/stripe/create-payment-intent", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId }),
      });
    } catch (err) {
      console.error("Failed to cancel expired PaymentIntent", err);
    }
  }, [paymentIntentId]);

  // useEffect(() => {
  //   if (!expiresAt) return;

  //   const updateTimer = () => {
  //     const remaining = new Date(expiresAt).getTime() - Date.now();
  //     if (remaining <= 0) {
  //       setTimeRemaining(0);
  //       setIsExpired(true);
  //       cancelPaymentIntent();
  //     } else {
  //       setTimeRemaining(remaining);
  //     }
  //   };

  //   updateTimer();
  //   const interval = setInterval(updateTimer, 1000);
  //   return () => clearInterval(interval);
  // }, [expiresAt, cancelPaymentIntent]);

  const [availableLocations, setAvailableLocations] = useState(() => {
    return getLocationsForDate(tomorrow);
  });

  // Calls the API to update the PaymentIntent's payment_method_types based on the
  // selected pickup date, then syncs the Payment Element with fetchUpdates().
  const updatePaymentMethodsForDate = useCallback(
    async (dateStr: string) => {
      if (!paymentIntentId) return;
      try {
        await fetch("/api/stripe/create-payment-intent", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId, pickupDate: dateStr }),
        });
        await elements?.fetchUpdates();
      } catch (err) {
        console.error("Failed to update payment methods for pickup date", err);
      }
    },
    [paymentIntentId, elements],
  );

  const selectedDate = new Date(formData.pickupDate);
  const selectedDayName = getDayName(selectedDate);
  const selectedLocation = availableLocations.find(
    (l) => l.name === formData.pickupLocation,
  );

  //#region PAYMENT
  const stripeStatus = searchParams.get("stripe");
  const redirectStatus = searchParams.get("redirect_status");
  const returnedOrderNumber = searchParams.get("orderNumber");
  const refParam = searchParams.get("ref");
  const isStripeSuccessRedirect = stripeStatus === "success" || redirectStatus === "succeeded";
  const isStripeProcessingRedirect = redirectStatus === "processing";
  const isStripeCancelledRedirect = stripeStatus === "cancelled" || redirectStatus === "failed" || redirectStatus === "requires_payment_method";
  const isStripeReturnRedirect = isStripeSuccessRedirect || isStripeProcessingRedirect || isStripeCancelledRedirect || !!refParam;

  // Redirect if cart is empty and not submitted
  useEffect(() => {
    if (cartItems.length === 0 && !isSubmitted && !isStripeReturnRedirect) {
      router.push("/products");
    }
  }, [cartItems.length, isSubmitted, isStripeReturnRedirect, router]);

  useEffect(() => {
    // Definitive success (card etc.) — show confirmation
    if (!isSubmitted && isStripeSuccessRedirect && returnedOrderNumber) {
      setOrderNumber(returnedOrderNumber);
      setIsSubmitted(true);
      setSubmitError(null);
      clearCart();
      return;
    }

    // SEPA processing — payment is pending, show confirmation but don't auto-redirect
    if (!isSubmitted && isStripeProcessingRedirect && returnedOrderNumber) {
      setOrderNumber(returnedOrderNumber);
      setIsSubmitted(true);
      setSubmitError(null);
      clearCart();
      return;
    }

    // Failed or declined — restore checkout state and show error
    if (!isSubmitted && isStripeCancelledRedirect) {
      setSubmitError(t("stripePaymentDeclined"));
    }
  }, 
  [clearCart, router, isStripeSuccessRedirect, isStripeProcessingRedirect, isStripeCancelledRedirect, isSubmitted, returnedOrderNumber, t,]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    // For name fields, validate no special characters
    if (name === "firstName" || name === "lastName") {
      setFormData({ ...formData, [name]: value });

      if (value && !validateName(value)) {
        setErrors((prev) => ({ ...prev, [name]: t("invalidName") }));
      } else {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
      return;
    }

    // For phone input, only allow digits, +, spaces, and dashes
    if (name === "phone") {
      const sanitizedValue = value.replace(/[^\d\s+-]/g, "");
      setFormData({ ...formData, [name]: sanitizedValue });

      if (sanitizedValue && !validatePhone(sanitizedValue)) {
        setErrors((prev) => ({ ...prev, phone: t("invalidPhone") }));
      } else {
        setErrors((prev) => ({ ...prev, phone: undefined }));
      }
      return;
    }

    // For email input, validate format
    if (name === "email") {
      setFormData({ ...formData, [name]: value });

      if (value && !validateEmail(value)) {
        setErrors((prev) => ({ ...prev, email: t("invalidEmail") }));
      } else {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear pickupLocation error when a location is selected
    if (name === "pickupLocation" && value) {
      setErrors((prev) => ({ ...prev, pickupLocation: undefined }));
    }

    // Update available locations when date changes
    if (name === "pickupDate") {
      const selectedDate = new Date(value);
      const locations = getLocationsForDate(selectedDate);
      setAvailableLocations(locations);
      updatePaymentMethodsForDate(value);

      // Reset location selection if current selection is not available on new date
      if (
        formData.pickupLocation &&
        !locations.find((l) => l.name === formData.pickupLocation)
      ) {
        setFormData((prev) => ({
          ...prev,
          pickupLocation: "",
        }));
      }
    }
  };

  const setPickupDate = (dateStr: string) => {
    setFormData((prev) => ({ ...prev, pickupDate: dateStr }));
    const selectedDate = new Date(dateStr);
    const locations = getLocationsForDate(selectedDate);
    setAvailableLocations(locations);
    updatePaymentMethodsForDate(dateStr);

    // Reset location selection if current selection is not available on new date
    if (
      formData.pickupLocation &&
      !locations.find((l) => l.name === formData.pickupLocation)
    ) {
      setFormData((prev) => ({
        ...prev,
        pickupDate: dateStr,
        pickupLocation: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (isExpired) return;
    setSubmitError(null);

    // Validate before submission
    const newErrors: CheckoutErrors = {};

    // Check required fields are not empty
    if (!formData.firstName.trim()) {
      newErrors.firstName = t("requiredField");
    } else if (!validateName(formData.firstName)) {
      newErrors.firstName = t("invalidName");
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t("requiredField");
    } else if (!validateName(formData.lastName)) {
      newErrors.lastName = t("invalidName");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("requiredField");
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t("invalidEmail");
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t("requiredField");
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = t("invalidPhone");
    }

    if (!formData.pickupLocation) {
      newErrors.pickupLocation = t("requiredField");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: CreateOrderInput = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      pickupDate: formData.pickupDate,
      pickupLocation: formData.pickupLocation,
      specialRequests: formData.specialRequests?.trim(),
      paymentMethod: formData.paymentMethod === "paypal" ? "paypal" : formData.paymentMethod === "sepa_debit" ? "sepa_debit" : "card",
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        ...(item.weightInGrams != null && { weightInGrams: item.weightInGrams }),
        ...(item.image && { imageUrl: item.image }),
      })),
    };

    try {
      setIsSubmitting(true);

      let currentOrderNumber: string | null = pendingOrderNumber;
      let currentPaymentIntentId = paymentIntentId;

      // Only create a new order on the first attempt; retries reuse the existing order
      if (!currentOrderNumber) {
        const result = await createOrder(payload);
        currentOrderNumber = result.orderNumber;
        setPendingOrderNumber(currentOrderNumber);

        // Attach order number to PaymentIntent so the webhook can match it
        await fetch("/api/stripe/create-payment-intent", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: currentPaymentIntentId,
            orderNumber: currentOrderNumber,
          }),
        });
      }
      
      const origin = window.location.origin;
      const localeParam = Array.isArray(params.locale) ? params.locale[0] : params.locale;

      // Persist checkout state so it can be restored after redirect
      const refKey = saveCheckoutState(formData, cartItems);
      const baseReturnUrl = `${origin}/${localeParam}/checkout?orderNumber=${encodeURIComponent(currentOrderNumber)}`;
      const returnUrl = buildReturnUrl(baseReturnUrl, refKey);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: "if_required",
      });

      if (error) {
        onPaymentFailed?.();
        setSubmitError(error.message || t("orderFailed"));
        return;
      }

      // Payment succeeded without redirect — clean up saved state
      if (refKey) clearCheckoutState(refKey);

      onSuccess?.();
      setOrderNumber(currentOrderNumber);
      setIsSubmitted(true);
      clearCart();
    } catch {
      setSubmitError(t("orderFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    t,
    formData,
    errors,
    isSubmitted,
    isSubmitting,
    submitError,
    orderNumber,
    cartItems,
    cartTotal,
    isStripeReturnRedirect,
    availableLocations,
    selectedDayName,
    selectedLocation,
    isSepaAllowed: isSepaAllowedForPickupDate(formData.pickupDate),
    tomorrowStr,
    tomorrow,
    timeRemaining,
    isExpired,
    setAvailableLocations,
    handleChange,
    handleSubmit,
    setPickupDate,
  };
}
