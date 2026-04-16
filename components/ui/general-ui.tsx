import Svg, {Path, Circle, Rect} from "react-native-svg";

export function BackIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 5L8 12L15 19"
        stroke="#2D2D2D"
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchGrayIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={6.5} stroke="#2D2D2D" strokeWidth={1.8} />
      <Path
        d="M20 20L16.8 16.8"
        stroke="#2D2D2D"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BellDarkIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 19C14 20.1046 13.1046 21 12 21C10.8954 21 10 20.1046 10 19M18 8C18 5.23858 15.3137 3 12 3C8.68629 3 6 5.23858 6 8V11.1056C6 11.8042 5.755 12.4808 5.30718 13.0172L4.17588 14.3754C3.56384 15.1109 4.08704 16.25 5.04482 16.25H18.9552C19.913 16.25 20.4362 15.1109 19.8241 14.3754L18.6928 13.0172C18.245 12.4808 18 11.8042 18 11.1056V8Z"
        stroke="#2D2D2D"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FiltersIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 16 16" fill="none">
      <Path
        d="M7.33333 14V10H8.66667V11.3333H14V12.6667H8.66667V14H7.33333ZM2 12.6667V11.3333H6V12.6667H2ZM4.66667 10V8.66667H2V7.33333H4.66667V6H6V10H4.66667ZM7.33333 8.66667V7.33333H14V8.66667H7.33333ZM10 6V2H11.3333V3.33333H14V4.66667H11.3333V6H10ZM2 4.66667V3.33333H8.66667V4.66667H2Z"
        fill="#FF9F0A"
      />
    </Svg>
  );
}

export function SearchOrangeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
        stroke="#FF9F0A"
        strokeWidth={1.8}
      />
      <Path
        d="M21 21L16.65 16.65"
        stroke="#FF9F0A"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CloseOrangeIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M7 7L17 17" stroke="#FF9F0A" strokeWidth={2.1} strokeLinecap="round" />
      <Path d="M17 7L7 17" stroke="#FF9F0A" strokeWidth={2.1} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronRightDarkIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6L15 12L9 18"
        stroke="#2D2D2D"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronDownDarkIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9L12 15L18 9"
        stroke="#2D2D2D"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ProfileCircleIcon({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke="#2D2D2D" strokeWidth={1.8} />
      <Circle cx={12} cy={9} r={2.6} stroke="#2D2D2D" strokeWidth={1.7} />
      <Path
        d="M7.6 16.5C8.4 14.9 9.9 14 12 14C14.1 14 15.6 14.9 16.4 16.5"
        stroke="#2D2D2D"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function WalletOutlineIcon({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V7Z"
        stroke="#2D2D2D"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 11.3H20V15.2H16C14.9 15.2 14 14.3 14 13.2C14 12.1 14.9 11.3 16 11.3Z"
        stroke="#2D2D2D"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HeartOutlineDarkIcon({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.62 20.8116C12.28 20.9316 11.72 20.9316 11.38 20.8116C8.48 19.8216 2 15.6916 2 8.69156C2 5.60156 4.49 3.10156 7.56 3.10156C9.38 3.10156 10.99 3.98156 12 5.34156C13.01 3.98156 14.63 3.10156 16.44 3.10156C19.51 3.10156 22 5.60156 22 8.69156C22 15.6916 15.52 19.8216 12.62 20.8116Z"
        stroke="#2D2D2D"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CouponOutlineIcon({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8.2C5.2 8.2 6.2 7.2 6.2 6H17.8C17.8 7.2 18.8 8.2 20 8.2V15.8C18.8 15.8 17.8 16.8 17.8 18H6.2C6.2 16.8 5.2 15.8 4 15.8V8.2Z"
        stroke="#2D2D2D"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path d="M9 15L15 9" stroke="#2D2D2D" strokeWidth={1.7} strokeLinecap="round" />
      <Circle cx={9} cy={9} r={1.2} fill="#2D2D2D" />
      <Circle cx={15} cy={15} r={1.2} fill="#2D2D2D" />
    </Svg>
  );
}

export function BellOutlineIcon({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 19C14 20.1046 13.1046 21 12 21C10.8954 21 10 20.1046 10 19M18 8C18 5.23858 15.3137 3 12 3C8.68629 3 6 5.23858 6 8V11.1056C6 11.8042 5.755 12.4808 5.30718 13.0172L4.17588 14.3754C3.56384 15.1109 4.08704 16.25 5.04482 16.25H18.9552C19.913 16.25 20.4362 15.1109 19.8241 14.3754L18.6928 13.0172C18.245 12.4808 18 11.8042 18 11.1056V8Z"
        stroke="#2D2D2D"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GlobeOutlineIcon({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke="#2D2D2D" strokeWidth={1.7} />
      <Path d="M3 12H21" stroke="#2D2D2D" strokeWidth={1.4} />
      <Path d="M12 3C14.6 6.5 14.6 17.5 12 21" stroke="#2D2D2D" strokeWidth={1.4} />
    </Svg>
  );
}

export function OrdersOutlineIcon({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 8V6.8C7 4.7 8.7 3 10.8 3H13.2C15.3 3 17 4.7 17 6.8V8"
        stroke="#2D2D2D"
        strokeWidth={1.7}
      />
      <Rect x={4} y={8} width={16} height={12} rx={2.2} stroke="#2D2D2D" strokeWidth={1.7} />
    </Svg>
  );
}

export function HeadsetOutlineIcon({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12V16C20 17.1 19.1 18 18 18H16.8C15.7 18 14.8 17.1 14.8 16V12.8C14.8 11.7 15.7 10.8 16.8 10.8H20"
        stroke="#2D2D2D"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Path
        d="M4 12V16C4 17.1 4.9 18 6 18H7.2C8.3 18 9.2 17.1 9.2 16V12.8C9.2 11.7 8.3 10.8 7.2 10.8H4"
        stroke="#2D2D2D"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function HelpCircleIcon({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke="#2D2D2D" strokeWidth={1.7} />
      <Path
        d="M9.8 9.6C10.2 8.6 11 8 12.1 8C13.5 8 14.5 8.9 14.5 10.1C14.5 11 14 11.5 13.2 12.1C12.5 12.6 12.1 13.1 12.1 14"
        stroke="#2D2D2D"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Circle cx={12.1} cy={16.8} r={0.9} fill="#2D2D2D" />
    </Svg>
  );
}

export function LogoutOutlineIcon({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15.5 16.8L19.8 12.5L15.5 8.2"
        stroke="#2D2D2D"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M19.8 12.5H9.5" stroke="#2D2D2D" strokeWidth={1.8} strokeLinecap="round" />
      <Path
        d="M12.2 5H6.6C5.5 5 4.6 5.9 4.6 7V18C4.6 19.1 5.5 20 6.6 20H12.2"
        stroke="#2D2D2D"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

