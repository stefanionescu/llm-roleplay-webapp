import { useEffect, useState } from 'react';

import { uiConstants } from '@/config';

export const useVideoSize = () => {
    const [orientation, setOrientation] = useState({
        hasNonPhoneSpecialRatio: false,
        isPhoneLandscape: false,
        isMediumSquare: false,
        forcesSmallerVideoHeight: false,
        forcesBiggerVideoHeight: false,
    });

    useEffect(() => {
        const checkOrientation = () => {
            if (typeof window === 'undefined') return;

            const width = window.innerWidth;
            const height = window.innerHeight;
            const aspectRatio = width / height;

            // More lenient checks for 3:4 and 4:3 ratios
            const tolerance =
                uiConstants.breakpoints.threeFourTolerance; // 5% tolerance
            const is3by4 =
                Math.abs(
                    aspectRatio -
                        uiConstants.breakpoints
                            .isThreeByFourAspect,
                ) < tolerance;
            const is4by3 =
                Math.abs(
                    aspectRatio -
                        uiConstants.breakpoints
                            .isFourByThreeAspect,
                ) < tolerance;

            // Check if the aspect ratio is close to 1:1 (square)
            // We'll consider it "near square" if it's within 5% of 1:1
            const isNearSquare =
                Math.abs(
                    aspectRatio -
                        uiConstants.breakpoints
                            .isNearSquareAspect,
                ) < tolerance;

            // Check landscape orientation
            const isLandscape = width > height;

            // Use a combination of screen size and user agent detection
            const minTabletWidth =
                uiConstants.breakpoints.phone;
            const maxTabletWidth =
                uiConstants.breakpoints.tablet;
            const isTabletSize =
                window.innerWidth >= minTabletWidth &&
                window.innerWidth <= maxTabletWidth;

            // Check for common tablet user agent strings
            const userAgent =
                navigator.userAgent.toLowerCase();
            const isTabletUA =
                /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
                    userAgent,
                );

            // Check for phone
            const isPhone =
                /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(
                    userAgent,
                );

            const hasNonPhoneSpecialRatio =
                is3by4 ||
                is4by3 ||
                isNearSquare ||
                (isLandscape &&
                    (isTabletSize || isTabletUA));
            const isPhoneLandscape = isPhone && isLandscape;

            const isMediumSquare =
                isNearSquare &&
                width >=
                    uiConstants.breakpoints
                        .mediumSquareMinWidth &&
                width <= uiConstants.breakpoints.tablet;
            const forcesSmallerVideoHeight =
                ((is4by3 || is3by4) && isLandscape) ||
                (isTabletSize &&
                    isTabletUA &&
                    isPhoneLandscape &&
                    isLandscape);
            const forcesBiggerVideoHeight =
                (is4by3 || is3by4) && isPhone;

            setOrientation({
                hasNonPhoneSpecialRatio,
                isPhoneLandscape,
                isMediumSquare,
                forcesSmallerVideoHeight,
                forcesBiggerVideoHeight,
            });
        };

        if (typeof window !== 'undefined') {
            checkOrientation();
            window.addEventListener(
                'resize',
                checkOrientation,
            );

            return () =>
                window.removeEventListener(
                    'resize',
                    checkOrientation,
                );
        }
    }, []);

    return orientation;
};
