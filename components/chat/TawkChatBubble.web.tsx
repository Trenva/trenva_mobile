// components/TawkChatBubble.web.tsx
import { useEffect } from 'react';

const PROPERTY_ID = '67c06913de20e6190b17114d';
const WIDGET_ID = '1il3pktdh';

// Extend the global Window interface to fix TypeScript errors safely
declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

interface TawkChatBubbleProps {
  userName?: string;
  userEmail?: string;
}

export default function TawkChatBubble({ userName, userEmail }: TawkChatBubbleProps) {
  useEffect(() => {
    // 1. Initialize global objects IMMEDIATELY before script execution
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // 2. Define the onLoad callback IMMEDIATELY so tawk.to catches it on startup
    if (userName || userEmail) {
      window.Tawk_API.onLoad = function () {
        window.Tawk_API.setAttributes({
          ...(userName && { name: userName }),
          ...(userEmail && { email: userEmail }),
        }, (error: any) => {
          if (error) console.error('Tawk error:', error);
        });
      };
    }

    // 3. Inject the script element
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${PROPERTY_ID}/${WIDGET_ID}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.head.appendChild(script);

    // 4. Robust Cleanup on Component Unmount
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      // Completely wipe the widget container from the DOM if it exists
      if (window.Tawk_API && typeof window.Tawk_API.minimize === 'function') {
        try {
          window.Tawk_API.shutdown(); // Removes tawk iframes from DOM cleanly
        } catch (e) {
          // Fallback if shutdown method fails or isn't fully loaded
          const tawkElements = document.querySelectorAll('[id^="tawk"]');
          tawkElements.forEach(el => el.remove());
        }
      }
      // Clear globals to prevent state leaking on re-mounts
      delete window.Tawk_API;
      delete window.Tawk_LoadStart;
    };
  }, [userName, userEmail]); // Re-run if user context switches

  return null;
}
