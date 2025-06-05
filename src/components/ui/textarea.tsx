import * as React from 'react';

import { cn } from '@/lib/utils/shad';

export type TextareaProps =
    React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<
    HTMLTextAreaElement,
    TextareaProps
>(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                'flex min-h-[120px] w-full resize-none rounded-lg border border-none border-zinc-800 bg-white/5 px-4 py-4 text-sm placeholder:text-zinc-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            ref={ref}
            {...props}
        />
    );
});
Textarea.displayName = 'Textarea';

export { Textarea };
