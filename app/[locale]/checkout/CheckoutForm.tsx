import { useCheckout } from "./useCheckout";
import { CreditCard, CheckCircle, AlertTriangle } from "lucide-react";
import { useStripe, useElements, PaymentElement, ExpressCheckoutElement } from "@stripe/react-stripe-js";
import { useLocale } from "next-intl";
import OrderSummary from "@/app/components/OrderSummary";
import { ContactInformationForm } from "@/app/components/ContactInformationForm";
import PickupForm from "@/app/components/PickupForm";

export function CheckoutForm({ paymentIntentId, expiresAt, onSuccess, onPaymentFailed }: { paymentIntentId: string | null; expiresAt: string | null; onSuccess?: () => void; onPaymentFailed?: () => void }) {
  const locale = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const {
    t,
    formData,
    errors,
    isSubmitted,
    isSubmitting,
    submitError,
    orderNumber,
    cartItems,
    cartTotal,
    cartSubtotal,
    cartDiscount,
    cartDiscountPercent,
    bundleDiscountRolle,
    bundleDiscountBoerek,
    rolleBundleFreeCount,
    boerekBundleFreeCount,
    cartPricingError,
    isStripeReturnRedirect,
    availableLocations,
    selectedDayName,
    selectedLocation,
    setAvailableLocations,
    tomorrow,
    // isExpired,
    handleChange,
    handleSubmit,
    handleExpressCheckoutConfirm,
    setPickupDate,
  } = useCheckout(stripe, elements, paymentIntentId, expiresAt, onSuccess, onPaymentFailed);

  // Show nothing while redirecting
  if (cartItems.length === 0 && !isSubmitted && !isStripeReturnRedirect) {
    return null;
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center pt-[130px]">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-gray-100">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-14 h-14 text-green-600" />
            </div>
            <h2 className="text-3xl text-gray-900 mb-4">
              {t('orderSuccess')}
            </h2>
            <p className="text-gray-700 mb-2">
              {t('thankYou')}
            </p>
            <p className="text-gray-600 text-sm mb-4">
              {t('confirmationEmail')}
            </p>
            <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-green-800 mb-2">
                {t('orderNumber')}:{" "}
                <span className="font-mono">
                  {orderNumber ?? "-"}
                </span>
              </p>
              <p className="text-sm text-green-800">
                {t('pickup')}: {formData.pickupLocation}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {t('pickupOn')}{" "}
                {new Date(
                  formData.pickupDate,
                ).toLocaleDateString(locale, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // if (isExpired) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center py-20 px-4">
  //       <div className="max-w-md w-full text-center">
  //         <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-gray-100">
  //           <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
  //             <AlertTriangle className="w-14 h-14 text-amber-600" />
  //           </div>
  //           <h2 className="text-3xl text-gray-900 mb-4">
  //             {t("sessionExpired")}
  //           </h2>
  //           <p className="text-gray-700 mb-6">
  //             {t("sessionExpiredMessage")}
  //           </p>
  //           <button
  //             onClick={() => window.location.reload()}
  //             className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg"
  //           >
  //             {t("tryAgain")}
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto pt-[50px]">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl lg:text-5xl tracking-tight text-gray-900 mb-4">
                {t('title')}
              </h1>
              <p className="text-gray-700">
                {t('completeOrder')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Information */}
              <ContactInformationForm 
                firstName={formData.firstName}
                lastName={formData.lastName}
                email={formData.email}
                phone={formData.phone}
                errors={errors}
                onChange={handleChange}
              />

              <PickupForm
                pickupDate={formData.pickupDate}
                pickupLocation={formData.pickupLocation}
                availableLocations={availableLocations}
                selectedDayName={selectedDayName}
                selectedLocation={selectedLocation}
                errors={errors}
                setPickupDate={setPickupDate}
                handleChange={handleChange}
                tomorrow={tomorrow}
                specialRequests={formData.specialRequests}
                onChange={handleChange}
              />

              {/* Payment Method – Stripe Payment Element */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-2xl text-gray-900">{t('paymentMethod')}</h2>
                </div>

                <div className="mb-6">
                  <ExpressCheckoutElement
                    onConfirm={(event) => {
                      void handleExpressCheckoutConfirm(event as any);
                    }}
                    options={{
                      buttonType: {
                        applePay: "buy",
                        googlePay: "buy",
                      },
                      paymentMethods: {
                        applePay: "auto",
                        googlePay: "auto",
                      },
                    }}
                  />
                </div>

                {/* Customise the Payment Element layout via the `layout` option.
                    Supported types: "accordion" | "tabs" | "auto"
                    @see https://docs.stripe.com/elements/payment-element#layout */}
                <PaymentElement
                  options={{
                    layout: {
                      type: "accordion",
                      defaultCollapsed: false,
                      radios: true,
                      spacedAccordionItems: true,
                    },
                  }}
                />
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <OrderSummary
                isSubmitting={isSubmitting}
                submitError={submitError}
                cartItems={cartItems}
                cartSubtotal={cartSubtotal}
                cartDiscount={cartDiscount}
                cartDiscountPercent={cartDiscountPercent}
                bundleDiscountRolle={bundleDiscountRolle}
                bundleDiscountBoerek={bundleDiscountBoerek}
                rolleBundleFreeCount={rolleBundleFreeCount}
                boerekBundleFreeCount={boerekBundleFreeCount}
                cartTotal={cartTotal}
                cartPricingError={cartPricingError}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}