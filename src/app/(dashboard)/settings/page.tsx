import PageHeader from '@/components/common/PageHeader';
import { getSettingsData, getOrgMembers } from './actions';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
    const [settingsResult, membersResult] = await Promise.all([
        getSettingsData(),
        getOrgMembers(),
    ]);

    return (
        <>
            <PageHeader
                title="Cài đặt"
                subtitle="Quản lý thông tin cá nhân và tổ chức."
            />
            <SettingsClient
                profile={settingsResult.profile}
                email={settingsResult.email || ''}
                members={membersResult.data || []}
            />
        </>
    );
}
