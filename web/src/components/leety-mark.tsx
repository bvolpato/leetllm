import { cn } from "@/lib/utils"

export function LeetyMark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 64 64"
            aria-hidden="true"
            className={cn("size-8", className)}
            fill="none"
        >
            <g className="origin-center transition-transform duration-300 ease-out group-hover:-rotate-2 group-hover:scale-105">
                <path
                    d="M32 10.6c-3.8-3.1-9.8-2.2-12.2 2.5-5.7-.1-10.3 4.3-10.3 10-4 3.2-3.8 10.1.5 13.2-.7 6.5 4.3 12 10.7 12.2 2.5 4.7 8.6 5.8 12.7 2.6l5.5 4.9 1.1-7.4c6.7-1.2 11.3-7.1 10.2-13.2 4-2.8 4.8-9.1 1.3-12.6-.2-5.8-4.9-10.2-10.6-10-2.1-3.9-6.2-4.4-8.9-2.2Z"
                    fill="currentColor"
                    fillOpacity=".13"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M31.9 12.8v10.4m-1.3-7.8c-3.3-2.1-7.4-.1-7.2 3.5-4-.6-6.9 2.3-6.3 5.9m-2.5 5.3c2.1-2.6 5.9-2.8 8.3-.5m10.3-14.2c3.3-2.1 7.4-.1 7.2 3.5 4-.6 6.9 2.3 6.3 5.9m2.5 5.3c-2.1-2.6-5.9-2.8-8.3-.5"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity=".58"
                />
                <g className="leety-mark-eyes">
                    <circle cx="24.5" cy="34.2" r="2.35" fill="currentColor" />
                    <circle cx="38.3" cy="34.2" r="2.35" fill="currentColor" />
                </g>
                <path
                    d="M24.8 40c1.8 2.7 4.1 4.1 6.7 4.1 2.7 0 5-1.4 6.8-4.1"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
            </g>
            <path
                className="leety-mark-spark"
                d="m51.5 3 2.1 5.4 5.4 2.1-5.4 2.1-2.1 5.4-2.1-5.4-5.4-2.1 5.4-2.1L51.5 3Z"
                fill="currentColor"
            />
        </svg>
    )
}
