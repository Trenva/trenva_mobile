import { Image as ExpoImage, type ImageContentFit } from "expo-image";
import type { StyleProp, ViewStyle, ImageStyle } from "react-native";

type CachedImageProps = {
  uri: string;
  style?: StyleProp<ImageStyle | ViewStyle>;
  contentFit?: ImageContentFit;
  className?: string;
};

export function CachedImage({ uri, style, contentFit = "cover", className }: CachedImageProps) {
  const ImageAny = ExpoImage as any;
  return (
    <ImageAny
      source={{ uri }}
      style={[{ width: "100%", height: "100%" }, style] as StyleProp<ImageStyle>}
      className={className}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={120}
    />
  );
}

export function prefetchImageUris(uris: Array<string | null | undefined>, limit = 20) {
  const unique = Array.from(
    new Set(
      uris
        .map((uri) => (typeof uri === "string" ? uri.trim() : ""))
        .filter((uri) => uri.length > 0),
    ),
  ).slice(0, limit);

  if (unique.length === 0) return;

  const ImageAny = ExpoImage as any;
  if (typeof ImageAny?.prefetch === "function") {
    void ImageAny.prefetch(unique);
  }
}
