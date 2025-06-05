export const runtime = 'edge';

import { privacyPolicy } from '@/config/privacy';
import { InfoLayout } from '@/components/custom/layouts/info-layout';

export default function PrivacyPage() {
    return (
        <div
            className={`no-scrollbar h-screen overflow-y-auto`}
        >
            <InfoLayout markdown={privacyPolicy} />
        </div>
    );
}
