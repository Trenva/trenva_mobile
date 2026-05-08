export const appFonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
} as const;

export const fontStyles = {
  regular: { fontFamily: appFonts.regular },
  medium: { fontFamily: appFonts.medium },
  semibold: { fontFamily: appFonts.semibold },
  bold: { fontFamily: appFonts.bold },
} as const;
