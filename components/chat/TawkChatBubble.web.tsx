import { useEffect } from "react";

const PROPERTY_ID = "67c06913de20e6190b17114d";
const WIDGET_ID = "1il3pktdh";
const SCRIPT_ID = "trenva-tawk-script";

declare global {
  interface Window {
    Tawk_API?: {
      onLoad?: () => void;
      setAttributes?: (
        attributes: { name?: string; email?: string },
        callback?: (error?: unknown) => void,
      ) => void;
      maximize?: () => void;
      minimize?: () => void;
      shutdown?: () => void;
    };
    Tawk_LoadStart?: Date;
  }
}

interface TawkChatBubbleProps {
  userName?: string;
  userEmail?: string;
  bottomOffset?: number;
}

export default function TawkChatBubble({ userName, userEmail }: TawkChatBubbleProps) {
  useEffect(() => {
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = window.Tawk_LoadStart || new Date();

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `https://embed.tawk.to/${PROPERTY_ID}/${WIDGET_ID}`;
      script.charset = "UTF-8";
      script.setAttribute("crossorigin", "*");
      document.head.appendChild(script);
    }

    return () => {
      try {
        window.Tawk_API?.shutdown?.();
      } catch {
        document.querySelectorAll('[id^="tawk"]').forEach((element) => element.remove());
      }
      document.getElementById(SCRIPT_ID)?.remove();
      delete window.Tawk_API;
      delete window.Tawk_LoadStart;
    };
  }, []);

  useEffect(() => {
    const attributes = {
      ...(userName ? { name: userName } : {}),
      ...(userEmail ? { email: userEmail } : {}),
    };

    if (!attributes.name && !attributes.email) return;

    function setAttributesWhenReady() {
      if (window.Tawk_API?.setAttributes) {
        window.Tawk_API.setAttributes(attributes, (error) => {
          if (error) console.error("Tawk attribute error:", error);
        });
        return;
      }

      window.setTimeout(setAttributesWhenReady, 300);
    }

    if (window.Tawk_API) {
      window.Tawk_API.onLoad = setAttributesWhenReady;
    }
    setAttributesWhenReady();
  }, [userName, userEmail]);

  return null;
}
