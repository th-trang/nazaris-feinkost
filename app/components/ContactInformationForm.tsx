'use client';

import { Mail, Phone, User } from "lucide-react";
import InputField from "@/app/components/InputField";
import { useTranslations } from "next-intl";
import { CheckoutErrors } from "@/app/DTO/DTO";

interface ContactInformationFormProps {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  errors?: CheckoutErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}


export function ContactInformationForm({ firstName, lastName, email, phone, errors, onChange }: ContactInformationFormProps) {
    const t = useTranslations("checkout");
    
    return(
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-2xl text-gray-900">{t('contactInfo')}</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <InputField
                    id="firstName"
                    name="firstName"
                    label={t('firstName')}
                    value={firstName || ''}
                    onChange={onChange}
                    required
                    error={errors?.firstName}
                  />

                  <InputField
                    id="lastName"
                    name="lastName"
                    label={t('lastName')}
                    value={lastName || ''}
                    onChange={onChange}
                    required
                    error={errors?.lastName}
                  />

                  <InputField
                    id="email"
                    name="email"
                    label={t('email')}
                    type="email"
                    value={email || ''}
                    onChange={onChange}
                    required
                    error={errors?.email}
                    icon={Mail}
                  />

                  <InputField
                    id="phone"
                    name="phone"
                    label={t('phone')}
                    type="tel"
                    value={phone || ''}
                    onChange={onChange}
                    required
                    placeholder="+49 123 456789"
                    error={errors?.phone}
                    icon={Phone}
                  />
                </div>
              </div>
    )

}