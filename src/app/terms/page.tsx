export const runtime = 'edge';

import { termsAndConditions } from '@/config/terms';
import { InfoLayout } from '@/components/custom/layouts/info-layout';

export default function TermsPage() {
    return (
        <div
            className={`no-scrollbar h-screen overflow-y-auto`}
        >
            <InfoLayout markdown={termsAndConditions} />
        </div>
    );
}
