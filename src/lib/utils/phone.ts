import { parsePhoneNumber } from 'libphonenumber-js';

export const formatPhoneForDisplay = (
    phone: string | undefined,
): string => {
    if (!phone) return '';

    try {
        // Make sure phone has a + prefix for international format
        const phoneWithPlus = phone.startsWith('+')
            ? phone
            : `+${phone}`;

        // Parse the phone number using libphonenumber-js
        const phoneNumber = parsePhoneNumber(phoneWithPlus);

        if (phoneNumber) {
            // Format using the international format which includes the + prefix
            return phoneNumber.formatInternational();
        }
    } catch {
        // Fallback to a simple format if the library fails
        try {
            // Basic country code extraction
            if (!phone.startsWith('+')) {
                phone = '+' + phone;
            }

            // Simple regex to separate country code and number
            return phone.replace(
                /^\+(\d{1,3})(\d+)$/,
                '+$1 $2',
            );
        } catch {
            // If all else fails, return the original
            return phone;
        }
    }

    // Return original if all parsing fails
    return phone;
};
