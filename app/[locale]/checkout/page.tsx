"use client";

import { CreditCard, MapPin, User, Mail, Phone, CheckCircle, Clock } from "lucide-react";
import { useCheckout } from "./useCheckout";
import { getHoursForDay } from "@/app/data/LocationList";
import DatePicker from "@/app/components/DatePicker";
import DropdownList, { DropdownOption } from "@/app/components/DropdownList";

export default function CheckoutPage() {
  const {
    t,
    formData,
    errors,
    isSubmitted,
    cartItems,
    cartTotal,
    availableLocations,
    selectedDayName,
    selectedLocation,
    setAvailableLocations,
    tomorrowStr,
    tomorrow,
    handleChange,
    handleSubmit,
    setPickupDate,
  } = useCheckout();

  // Show nothing while redirecting
  if (cartItems.length === 0 && !isSubmitted) {
    return null;
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center">
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
                  #{Math.floor(Math.random() * 10000)}
                </span>
              </p>
              <p className="text-sm text-green-800">
                {t('pickup')}: {formData.pickupLocation}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {t('pickupOn')}{" "}
                {new Date(
                  formData.pickupDate,
                ).toLocaleDateString("de-DE", {
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

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto pt-[50px]">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl tracking-tight text-gray-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-gray-700">
            {t('completeOrder')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Information */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-2xl text-gray-900">{t('contactInfo')}</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm text-gray-700 mb-2">
                      {t('firstName')} *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${errors.firstName ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm text-gray-700 mb-2">
                      {t('lastName')} *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${errors.lastName ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
                      {t('email')} *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={`w-full pl-12 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm text-gray-700 mb-2">
                      {t('phone')} *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="+49 123 456789"
                        className={`w-full pl-12 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-2xl text-gray-900">
                    {t('pickup')}
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Date Picker */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      {t('pickupDate')} *
                    </label>
                    <DatePicker
                      value={formData.pickupDate}
                      onChange={setPickupDate}
                      minDate={tomorrow}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {t('selectedDay')}: <span className="font-medium text-green-600">{selectedDayName}</span>
                    </p>
                  </div>

                  {/* Location Selection */}
                  <div>
                    <label
                      htmlFor="pickupLocation"
                      className="block text-sm text-gray-700 mb-2"
                    >
                      {t('pickupLocation')} *
                    </label>

                    {availableLocations.length === 0 ? (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-800">
                          {t('noLocationsAvailable')}
                        </p>
                      </div>
                    ) : (
                      <DropdownList
                        value={formData.pickupLocation}
                        onChange={(value) => handleChange({ target: { name: 'pickupLocation', value } } as React.ChangeEvent<HTMLInputElement>)}
                        options={availableLocations.map((location): DropdownOption => ({
                          value: location.name,
                          label: location.name,
                        }))}
                        placeholder={t('pleaseSelect')}
                        icon={MapPin}
                        headerTitle={t('pickupLocation')}
                      />
                    )}

                    {/* Show opening hours for selected location */}
                    {selectedLocation && (
                      <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="space-y-3">
                          {/* Address */}
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-green-900">{t('address')}</p>
                              <p className="text-green-700">{selectedLocation.address}</p>
                              <p className="text-green-700">{selectedLocation.city}</p>
                            </div>
                          </div>
                          {/* Opening Hours */}
                          <div className="flex items-start space-x-2">
                            <Clock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-green-900">
                                {t('openingHoursOn')}{" "}
                                {selectedDayName}:
                              </p>
                              <p className="text-green-700">
                                {getHoursForDay(
                                  selectedLocation,
                                  selectedDayName,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label
                      htmlFor="specialRequests"
                      className="block text-sm text-gray-700 mb-2"
                    >
                      {t('specialRequests')}
                    </label>
                    <textarea
                      id="specialRequests"
                      name="specialRequests"
                      value={formData.specialRequests}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                      placeholder={t('specialRequestsPlaceholder')}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-2xl text-gray-900">{t('paymentMethod')}</h2>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-green-500 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === "card"}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="ml-3 text-gray-900">{t('creditCard')}</span>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-green-500 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.paymentMethod === "paypal"}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="ml-3 text-gray-900">PayPal</span>
                  </label>

                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 sticky top-24">
                <h2 className="text-2xl text-gray-900 mb-6">{t('orderSummary')}</h2>

                {/* Cart Items */}
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 py-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm text-gray-900 truncate">{item.name}</h3>
                        <p className="text-xs text-gray-600">{t('quantity')}: {item.quantity}</p>
                        <p className="text-sm text-gray-900 mt-1">
                          €{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-gray-700">
                    <span>{t('total')}</span>
                    <span>€{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full mt-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
                >
                  {t('placeOrder')}
                </button>

                <p className="text-xs text-gray-600 text-center mt-4">
                  {t('termsNotice')}
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
