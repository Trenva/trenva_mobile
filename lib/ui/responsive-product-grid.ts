export type ResponsiveProductGrid = {
  columns: number;
  gap: number;
  cardWidth: number;
  imageHeight: number;
  trackWidth: number;
};

type Options = {
  width: number;
  mobileSideInset?: number;
  gap?: number;
};

// Shared rule used by homepage suggested section and all vertical product grids.
export function getResponsiveProductGrid({
  width,
  mobileSideInset = 40,
  gap = 12,
}: Options): ResponsiveProductGrid {
  const columns = 2;
  const cardWidth =
    width >= 1100
      ? 208
      : width >= 768
        ? 196
        : Math.floor((width - mobileSideInset - gap * (columns - 1)) / columns);
  const imageHeight = width >= 1100 ? 148 : width >= 768 ? 140 : 122;
  const trackWidth = cardWidth * columns + gap * (columns - 1);

  return {
    columns,
    gap,
    cardWidth,
    imageHeight,
    trackWidth,
  };
}

