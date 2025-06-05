'use client';

import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { cn } from '@/lib/utils/shad';
import { Flex } from '@/components/ui/flex';
import { useStore } from '@/lib/zustand/store';
import { Dialog } from '@/components/ui/dialog';
import { DialogPortal } from '@/components/ui/dialog';
import { DialogOverlay } from '@/components/ui/dialog';
import { DialogContent } from '@/components/ui/dialog';
import { AuthModalSeo } from '@/features/auth/components/auth-modal-seo';
import { AuthModalOTPStep } from '@/features/auth/components/otp-step/auth-modal-otp-step';
import { AuthModalInputStep } from '@/features/auth/components/input-step/auth-modal-input-step';
import { AuthModalWaitlistStep } from '@/features/auth/components/waitlist-step/auth-modal-waitlist-step';

export const AuthModal = () => {
    const {
        isAuthModalOpen,
        setIsAuthModalOpen,
        authStep,
        setAuthStep,
        setAuthIdentifier,
        setAuthResendCountdown,
        setPreviousAuthMode,
        setLastOtpRequestTime,
    } = useStore(
        useShallow((state) => ({
            isAuthModalOpen: state.isAuthModalOpen,
            setIsAuthModalOpen: state.setIsAuthModalOpen,
            authStep: state.authStep,
            setAuthStep: state.setAuthStep,
            setAuthIdentifier: state.setAuthIdentifier,
            setAuthResendCountdown:
                state.setAuthResendCountdown,
            setPreviousAuthMode: state.setPreviousAuthMode,
            setLastOtpRequestTime:
                state.setLastOtpRequestTime,
        })),
    );

    // Reset the auth step and identifier when modal is closed
    useEffect(() => {
        if (!isAuthModalOpen) {
            // Small timeout to avoid visual glitches during close animation
            const timer = setTimeout(() => {
                // Reset auth step to input
                setAuthStep('input');

                // Clear auth details
                setAuthIdentifier(null);
                setAuthResendCountdown(0);

                // Reset OTP cooldown to allow requesting immediately on next open
                setLastOtpRequestTime(0);

                // Always reset to email mode on close
                setPreviousAuthMode('email');
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [
        isAuthModalOpen,
        setAuthStep,
        setAuthIdentifier,
        setAuthResendCountdown,
        setPreviousAuthMode,
        setLastOtpRequestTime,
    ]);

    const renderAuthStep = () => {
        switch (authStep) {
            case 'otp':
                return <AuthModalOTPStep />;
            case 'waitlist':
                return <AuthModalWaitlistStep />;
            case 'input':
            default:
                return <AuthModalInputStep />;
        }
    };

    // Handle modal close and reset
    const handleOpenChange = (open: boolean) => {
        setIsAuthModalOpen(open);
        // The reset will be handled by the useEffect
    };

    return (
        <Dialog
            open={isAuthModalOpen}
            onOpenChange={handleOpenChange}
        >
            <DialogPortal>
                <DialogOverlay />

                <DialogContent
                    ariaTitle="Characters"
                    className={cn(
                        'fixed left-[50%] top-[50%] z-50 w-[96vw] max-w-md translate-x-[-50%] translate-y-[-50%]',
                        'rounded-xl border border-white/10 bg-zinc-800 p-0 shadow-lg',
                        'md:w-[400px]',
                        '!m-0',
                        'focus:outline-none focus:ring-0',
                    )}
                >
                    <AuthModalSeo />

                    <Flex
                        className="relative w-full px-4 py-6"
                        items="center"
                        direction="col"
                        gap="lg"
                    >
                        {renderAuthStep()}
                    </Flex>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
};
