'use client';

import { Toaster } from 'react-hot-toast';

const HotToaster = () => {
    return (
        <Toaster
            containerClassName="z-[100003]"
            position="bottom-center"
            toastOptions={{
                style: {
                    background: '#27272a', // zinc-800
                    color: '#fafafa', // zinc-50
                    border: '1px solid #3f3f46', // zinc-700
                    textAlign: 'center',
                    minWidth: '280px',
                    wordBreak: 'break-word',
                    hyphens: 'auto',
                },
                success: {
                    duration: 3000,
                    icon: '🎉',
                },
                error: {
                    duration: 6000,
                    icon: '😢',
                },
            }}
        />
    );
};

export { HotToaster };
