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

