import { memo } from 'react';

export const MemoButton = memo(
    ({
        onClick,
        disabled,
        children,
        className,
    }: {
        disabled: boolean;
        className?: string;
        onClick: () => void;
        children: React.ReactNode;
    }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={className}
        >
            {children}
        </button>
    ),
);

MemoButton.displayName = 'MemoButton';
