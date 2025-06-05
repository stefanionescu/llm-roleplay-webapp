import mixpanel from 'mixpanel-browser';

import {
    EVENTS,
    ApiErrorEventProperties,
    ErrorType,
    ApiRoute,
} from '@/types/mixpanel';

const MIXPANEL_TOKEN =
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

/**
 * Check if Mixpanel is properly initialized
 */
const isMixpanelReady = (): boolean => {
    return !!MIXPANEL_TOKEN && !!mixpanel;
};

/**
 * Utility function to track error events with type safety
 */
const trackErrorEvent = async (
    properties: ApiErrorEventProperties,
): Promise<void> => {
    if (!isMixpanelReady()) return;

    return new Promise((resolve) => {
        setTimeout(() => {
            try {
                mixpanel.track(
                    EVENTS.API_ERROR,
                    properties,
                );
                resolve();
            } catch {
                resolve();
            }
        }, 0);
    });
};

/**
 * Track inference API errors
 */
export const trackInferenceError = async (
    errorType: ErrorType,
    errorMessage: string,
    statusCode?: number,
    details?: string,
    userAgent?: string,
): Promise<void> => {
    const errorProperties: ApiErrorEventProperties = {
        'Error Route': 'inference',
        'Error Type': errorType,
        'Error Message': errorMessage,
        'Error Timestamp': new Date().toISOString(),
    };

    if (statusCode !== undefined) {
        errorProperties['Error Status Code'] = statusCode;
    }

    if (details) {
        errorProperties['Error Details'] = details;
    }

    if (userAgent) {
        errorProperties['Error User Agent'] = userAgent;
    }

    await trackErrorEvent(errorProperties);
};

/**
 * Track RAG API errors
 */
export const trackRagError = async (
    errorType: ErrorType,
    errorMessage: string,
    statusCode?: number,
    details?: string,
    userAgent?: string,
): Promise<void> => {
    const errorProperties: ApiErrorEventProperties = {
        'Error Route': 'rag',
        'Error Type': errorType,
        'Error Message': errorMessage,
        'Error Timestamp': new Date().toISOString(),
    };

    if (statusCode !== undefined) {
        errorProperties['Error Status Code'] = statusCode;
    }

    if (details) {
        errorProperties['Error Details'] = details;
    }

    if (userAgent) {
        errorProperties['Error User Agent'] = userAgent;
    }

    await trackErrorEvent(errorProperties);
};

/**
 * Track RAG verify usage API errors
 */
export const trackRagVerifyUsageError = async (
    errorType: ErrorType,
    errorMessage: string,
    statusCode?: number,
    details?: string,
    userAgent?: string,
): Promise<void> => {
    const errorProperties: ApiErrorEventProperties = {
        'Error Route': 'rag_verify_usage',
        'Error Type': errorType,
        'Error Message': errorMessage,
        'Error Timestamp': new Date().toISOString(),
    };

    if (statusCode !== undefined) {
        errorProperties['Error Status Code'] = statusCode;
    }

    if (details) {
        errorProperties['Error Details'] = details;
    }

    if (userAgent) {
        errorProperties['Error User Agent'] = userAgent;
    }

    await trackErrorEvent(errorProperties);
};

/**
 * Generic function to track API errors for any route
 */
export const trackApiError = async (
    route: ApiRoute,
    errorType: ErrorType,
    errorMessage: string,
    statusCode?: number,
    details?: string,
    userAgent?: string,
): Promise<void> => {
    const errorProperties: ApiErrorEventProperties = {
        'Error Route': route,
        'Error Type': errorType,
        'Error Message': errorMessage,
        'Error Timestamp': new Date().toISOString(),
    };

    if (statusCode !== undefined) {
        errorProperties['Error Status Code'] = statusCode;
    }

    if (details) {
        errorProperties['Error Details'] = details;
    }

    if (userAgent) {
        errorProperties['Error User Agent'] = userAgent;
    }

    await trackErrorEvent(errorProperties);
};
