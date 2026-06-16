import React from 'react';
import NewIncidentClient from './NewIncidentClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Báo sự cố mới | RentFlow',
};

export default function NewIncidentPage() {
    return <NewIncidentClient />;
}
