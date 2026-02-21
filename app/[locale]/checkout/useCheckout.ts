"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useTranslations } from "next-intl";
import { getDayName, getLocationsForDate } from "@/app/data/LocationList";

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

export function useCheckout() {
  const t = useTranslations("checkout");
  const router = useRouter();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const { cartItems, cartTotal, clearCart } = useCart();
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const [availableLocations, setAvailableLocations] = useState(() => {
    return getLocationsForDate(tomorrow);
  });

  const selectedDate = new Date(formData.pickupDate);
  const selectedDayName = getDayName(selectedDate);
  const selectedLocation = availableLocations.find(
    (l) => l.name === formData.pickupLocation,
  );

  // Redirect if cart is empty and not submitted
  useEffect(() => {
    if (cartItems.length === 0 && !isSubmitted) {
      router.push("/menu");
    }
  }, [cartItems.length, isSubmitted, router]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submission
    const newErrors: CheckoutErrors = {};

    if (!validateName(formData.firstName)) {
      newErrors.firstName = t("invalidName");
    }
    if (!validateName(formData.lastName)) {
      newErrors.lastName = t("invalidName");
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = t("invalidEmail");
    }
    if (!validatePhone(formData.phone)) {
      newErrors.phone = t("invalidPhone");
    }

    if (!formData.pickupLocation) {
      alert("Bitte wählen Sie einen Abholstandort");
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitted(true);

    // Simulate order processing
    setTimeout(() => {
      clearCart();
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }, 1500);
  };

  return {
    t,
    formData,
    errors,
    isSubmitted,
    cartItems,
    cartTotal,
    availableLocations,
    selectedDayName,
    selectedLocation,
    tomorrowStr,
    tomorrow,
    setAvailableLocations,
    handleChange,
    handleSubmit,
    setPickupDate,
  };
}
