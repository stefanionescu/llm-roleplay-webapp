import Image from 'next/image';

import { homeConstants } from '@/config';

export const HeaderImages = () => {
    return (
        <div
            className={`flex items-center justify-center space-x-8`}
        >
            {homeConstants.headerImages.map((image) => (
                <div
                    key={image.alt}
                    className={image.className}
                >
                    <Image
                        src={image.src}
                        alt={image.alt}
                        width={56}
                        height={56}
                        className={`size-[48px] rounded-2xl object-cover md:size-[56px]`}
                        priority
                    />
                </div>
            ))}
        </div>
    );
};
