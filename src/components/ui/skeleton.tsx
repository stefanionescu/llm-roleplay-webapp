import 'react-loading-skeleton/dist/skeleton.css'; // Import the CSS

import SkeletonLib, {
    SkeletonTheme,
} from 'react-loading-skeleton';

// Define props type including borderRadius
interface SkeletonWrapperProps
    extends React.HTMLAttributes<HTMLDivElement> {
    baseColor?: string;
    highlightColor?: string;
    borderRadius?: string | number;
}

function SkeletonWrapper({
    className,
    borderRadius = '0.75rem',
    baseColor = '#333333', // Default base color
    highlightColor = '#444', // Default highlight color
    ...props
}: SkeletonWrapperProps) {
    // Use the new props type
    return (
        <SkeletonTheme
            baseColor={baseColor} // Use prop or default
            highlightColor={highlightColor} // Use prop or default
        >
            <SkeletonLib
                className={className}
                borderRadius={borderRadius} // Pass borderRadius prop
                {...props}
            />
        </SkeletonTheme>
    );
}

export { SkeletonWrapper as Skeleton }; // Export the wrapper as Skeleton
