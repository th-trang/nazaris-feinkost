import { errors } from "@playwright/test";
import { Clock, MapPin } from "lucide-react";
import { getHoursForDay } from "../data/LocationList";
import DatePicker from "./DatePicker";
import DropdownList, { DropdownOption } from "./DropdownList";
import { useTranslations } from "next-intl";

interface PickupFormProps {
  pickupDate: string;
  pickupLocation: string;
  availableLocations: any[]; // Replace with actual type
  selectedDayName: string;
  selectedLocation: any; // Replace with actual type
  errors?: any; // Replace with actual error type
  setPickupDate: (date: string) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  tomorrow: Date;
  specialRequests?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function PickupForm({
  pickupDate,
  pickupLocation,
  availableLocations,
  selectedDayName,
  selectedLocation,
  errors,
  setPickupDate,
  handleChange,
  tomorrow,
  specialRequests,
  onChange,
}: PickupFormProps) {
  const t = useTranslations("checkout");

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <MapPin className="w-5 h-5 text-green-600" />
        </div>
        <h2 className="text-2xl text-gray-900">{t("pickup")}</h2>
      </div>

      <div className="space-y-4">
        {/* Date Picker */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">
            {t("pickupDate")} *
          </label>
          <DatePicker
            value={pickupDate}
            onChange={setPickupDate}
            minDate={tomorrow}
          />
          <p className="text-xs text-gray-500 mt-2">
            {t("selectedDay")}:{" "}
            <span className="font-medium text-green-600">
              {selectedDayName}
            </span>
          </p>
        </div>

        {/* Location Selection */}
        <div>
          <label
            htmlFor="pickupLocation"
            className="block text-sm text-gray-700 mb-2"
          >
            {t("pickupLocation")} *
          </label>

          {availableLocations.length === 0 ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800">
                {t("noLocationsAvailable")}
              </p>
            </div>
          ) : (
            <>
              <DropdownList
                value={pickupLocation}
                onChange={(value) =>
                  handleChange({
                    target: { name: "pickupLocation", value },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
                options={availableLocations.map(
                  (location): DropdownOption => ({
                    value: location.name,
                    label: location.name,
                  }),
                )}
                placeholder={t("pleaseSelect")}
                icon={MapPin}
                headerTitle={t("pickupLocation")}
              />
              {errors.pickupLocation && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.pickupLocation}
                </p>
              )}
            </>
          )}

          {/* Show opening hours for selected location */}
          {selectedLocation && (
            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="space-y-3">
                {/* Address */}
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">{t("address")}</p>
                    <p className="text-green-700">{selectedLocation.address}</p>
                    <p className="text-green-700">{selectedLocation.city}</p>
                  </div>
                </div>
                {/* Opening Hours */}
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">
                      {t("openingHoursOn")} {selectedDayName}:
                    </p>
                    <p className="text-green-700">
                      {getHoursForDay(selectedLocation, selectedDayName)}
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
            {t("specialRequests")}
          </label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            value={specialRequests}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
            placeholder={t("specialRequestsPlaceholder")}
          />
        </div>
      </div>
    </div>
  );
}
