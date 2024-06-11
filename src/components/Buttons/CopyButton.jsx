import React, { useState } from 'react';

const CopyButton = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        if ('clipboard' in navigator) {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
        }
        else
            console.error('Clipboard not supported');
    };

    return (
        <button className="flex items-center justify-center px-4 py-2 font-semibold text-white transition duration-150 ease-in-out bg-blue-500 rounded hover:bg-blue-700" onClick={copyToClipboard}>
            {
                copied ? 
                (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : 
                (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-2M5 5a2 2 0 012-2h1.5a2 2 0 012 2v1.5a2 2 0 01-2 2H5V5z" />
                    </svg>
                )
            }
        </button>
    );
};

export default CopyButton;
