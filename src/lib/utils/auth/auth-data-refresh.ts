import { clearAnonSessionData } from '@/lib/utils/auth/auth-main';

// Note: Can change the logic here to do other types of cleanup
export const clearUserData = () => {
    // Note: Mixpanel reset is handled by the calling code as needed
    if (typeof window !== 'undefined') {
        // Clear anonymous session data
        clearAnonSessionData();

        // Close any open modals/dropdowns that might interfere with reload
        document.body.click(); // Force close any open dropdowns
        // Use href assignment for more reliable reload, especially on mobile
        window.location.href = window.location.pathname;
    }
};
