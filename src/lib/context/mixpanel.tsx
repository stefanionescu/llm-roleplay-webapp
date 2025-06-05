'use client';

import mixpanel from 'mixpanel-browser';
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

import { initMixpanel } from '@/lib/mixpanel/init';

type MixpanelContextType = {
    isInitialized: boolean;
    mixpanel: typeof mixpanel | null;
};

// Create the context
const MixpanelContext = createContext<MixpanelContextType>({
    isInitialized: false,
    mixpanel: null,
});

// Custom hook to use Mixpanel context
export const useMixpanel = () => {
    const context = useContext(MixpanelContext);
    if (!context) {
        throw new Error(
            'useMixpanel must be used within a MixpanelProvider',
        );
    }
    return context;
};

// Custom hook for Mixpanel tracking with built-in safety checks
export const useMixpanelTracking = () => {
    const { isInitialized, mixpanel: mp } = useMixpanel();

    const track = (
        eventName: string,
        properties?: Record<
            string,
            string | number | boolean
        >,
    ) => {
        if (isInitialized && mp) {
            mp.track(eventName, properties);
        } else if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(
                '🚫 Mixpanel not initialized - tracking skipped:',
                eventName,
            );
        }
    };

    const identify = (userId: string) => {
        if (isInitialized && mp) {
            mp.identify(userId);
        }
    };

    const reset = () => {
        if (isInitialized && mp) {
            mp.reset();
        }
    };

    const setUserProperties = (
        properties: Record<
            string,
            string | number | boolean
        >,
    ) => {
        if (isInitialized && mp) {
            mp.people.set(properties);
        }
    };

    const getSessionId = () => {
        if (isInitialized && mp) {
            const props =
                mp.get_session_recording_properties();
            return (
                (props as { $mp_replay_id?: string })
                    ?.$mp_replay_id || null
            );
        }
        return null;
    };

    return {
        track,
        identify,
        reset,
        setUserProperties,
        getSessionId,
        isInitialized,
    };
};

// Mixpanel Provider component
export const MixpanelProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const [isInitialized, setIsInitialized] =
        useState(false);

    useEffect(() => {
        // Initialize Mixpanel when the component mounts
        const initialize = () => {
            try {
                // Initialize Mixpanel using our existing function
                initMixpanel();

                // Check if initialization was successful
                if (
                    process.env
                        .NEXT_PUBLIC_MIXPANEL_TOKEN &&
                    mixpanel
                ) {
                    setIsInitialized(true);
                } else {
                    if (
                        process.env.NODE_ENV !==
                        'production'
                    ) {
                        // eslint-disable-next-line no-console
                        console.warn(
                            '⚠️ Mixpanel initialization failed - token missing',
                        );
                    }
                }
            } catch {
                // Silently handle any initialization errors
            }
        };

        initialize();
    }, []);

    // Provide the context value
    const contextValue: MixpanelContextType = {
        isInitialized,
        mixpanel: isInitialized ? mixpanel : null,
    };

    return (
        <MixpanelContext.Provider value={contextValue}>
            {children}
        </MixpanelContext.Provider>
    );
};
