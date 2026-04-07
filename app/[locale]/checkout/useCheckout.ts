"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useTranslations } from "next-intl";
import { getDayName, getLocationsForDate } from "@/app/data/LocationList";
import { createOrder } from "@/app/lib/firebase/orders";
import { CreateOrderInput } from "@/app/lib/orders/types";
import type { Stripe, StripeElements } from "@stripe/stripe-js";

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

// Validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Allow only digits, optionally with + at start, spaces, or dashes
  const phoneRegex = /^\+?[\d\s-]+$/;
  return phoneRegex.test(phone) && phone.replace(/[\s-]/g, "").length >= 6;
};

export const validateName = (name: string): boolean => {
  // Disallow special characters like §$%&/?*+°^><#
  const invalidCharsRegex = /[§$%&/?*+°^><#]/;
  return !invalidCharsRegex.test(name);
};

export function useCheckout(
  stripe: Stripe | null,
  elements: StripeElements | null,
  paymentIntentId: string | null,
  expiresAt: string | null,
) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ locale?: string }>();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const { cartItems, cartTotal, clearCart } = useCart();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    pickupDate: tomorrowStr,
    pickupLocation: "",
    specialRequests: "",
    paymentMethod: "card",
  });

  // --- 15-minute session timer ---
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

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeRemaining(0);
        setIsExpired(true);
        cancelPaymentIntent();
      } else {
        setTimeRemaining(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, cancelPaymentIntent]);

  const [availableLocations, setAvailableLocations] = useState(() => {
    return getLocationsForDate(tomorrow);
  });

  const selectedDate = new Date(formData.pickupDate);
  const selectedDayName = getDayName(selectedDate);
  const selectedLocation = availableLocations.find(
    (l) => l.name === formData.pickupLocation,
  );

  const stripeStatus = searchParams.get("stripe");
  const redirectStatus = searchParams.get("redirect_status");
  const returnedOrderNumber = searchParams.get("orderNumber");
  const isStripeSuccessRedirect = stripeStatus === "success" || redirectStatus === "succeeded";
  const isStripeCancelledRedirect = stripeStatus === "cancelled" || redirectStatus === "failed";
  const isStripeReturnRedirect = isStripeSuccessRedirect || isStripeCancelledRedirect;

  // Redirect if cart is empty and not submitted
  useEffect(() => {
    if (cartItems.length === 0 && !isSubmitted && !isStripeReturnRedirect) {
      router.push("/products");
    }
  }, [cartItems.length, isSubmitted, isStripeReturnRedirect, router]);

  useEffect(() => {
    if (!isSubmitted && isStripeSuccessRedirect && returnedOrderNumber) {
      setOrderNumber(returnedOrderNumber);
      setIsSubmitted(true);
      setSubmitError(null);
      clearCart();
      return;
    }

    if (!isSubmitted && isStripeCancelledRedirect) {
      setSubmitError(t("stripePaymentCancelled"));
    }
  }, [
    clearCart,
    isStripeSuccessRedirect,
    isStripeCancelledRedirect,
    isSubmitted,
    returnedOrderNumber,
    t,
  ]);

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
      paymentMethod: formData.paymentMethod === "paypal" ? "paypal" : "card",
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

      let currentOrderNumber = pendingOrderNumber;

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
            paymentIntentId: paymentIntentId,
            orderNumber: currentOrderNumber,
          }),
        });
      }

      const origin = window.location.origin;
      const localeParam = Array.isArray(params.locale)
        ? params.locale[0]
        : params.locale;

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${origin}/${localeParam}/checkout?orderNumber=${encodeURIComponent(currentOrderNumber)}`,
        },
        redirect: "if_required",
      });

      if (error) {
        setSubmitError(error.message || t("orderFailed"));
        return;
      }

      setOrderNumber(currentOrderNumber);
      setIsSubmitted(true);
      clearCart();
      setTimeout(() => {
        router.push("/");
      }, 6000);
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
