import React from 'react';
import PaymentSettingsForm from './PaymentSettingsForm';
import { getPaymentSettings } from './actions';

export const metadata = {
    title: 'Cài đặt Thanh toán | RentFlow',
};

export default async function PaymentSettingsPage() {
    const settings = await getPaymentSettings();

    return (
        <div className="p-6">
            <PaymentSettingsForm initialData={settings} />
        </div>
    );
}
