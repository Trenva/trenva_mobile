import type { ApiProduct } from "../api/shop";
import type { ProductFilters } from "../../store/product-filter-store";

function normalize(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function matches(value?: string | null, target?: string | null) {
  if (!target) return true;
  return normalize(value) === normalize(target);
}

function includesText(value?: string | null, target?: string | null) {
  if (!target) return true;
  return normalize(value).includes(normalize(target));
}

function toPrice(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

export function applyProductFilters(products: ApiProduct[], filters: ProductFilters) {
  let result = [...products];

  if (filters.category) {
    result = result.filter(
      (item) => matches(item.category, filters.category) || includesText(item.title, filters.category),
    );
  }

  if (filters.subcategory) {
    result = result.filter(
      (item) => matches(item.subcategory, filters.subcategory) || includesText(item.title, filters.subcategory),
    );
  }

  if (filters.leveltwo) {
    result = result.filter(
      (item) => matches(item.leveltwocategory, filters.leveltwo) || includesText(item.title, filters.leveltwo),
    );
  }

  if (filters.query) {
    const q = normalize(filters.query);
    result = result.filter((item) => {
      const title = normalize(item.title);
      const category = normalize(item.category);
      const subcategory = normalize(item.subcategory);
      const leveltwo = normalize(item.leveltwocategory);
      return title.includes(q) || category.includes(q) || subcategory.includes(q) || leveltwo.includes(q);
    });
  }

  if (filters.color) {
    const target = normalize(filters.color);
    result = result.filter((item) => includesText(item.title, target) || includesText(item.description, target));
  }

  if (typeof filters.minPrice === "number") {
    result = result.filter((item) => toPrice(item.price) >= filters.minPrice!);
  }

  if (typeof filters.maxPrice === "number") {
    result = result.filter((item) => toPrice(item.price) <= filters.maxPrice!);
  }

  if (filters.sort === "top_sales") {
    result.sort((a, b) => {
      const aBoost = Number(Boolean(a.featured)) + Number(Boolean(a.promo));
      const bBoost = Number(Boolean(b.featured)) + Number(Boolean(b.promo));
      if (bBoost !== aBoost) return bBoost - aBoost;
      return toPrice(b.price) - toPrice(a.price);
    });
  } else if (filters.sort === "most_recent") {
    result.sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
  } else if (filters.sort === "popular") {
    result.sort((a, b) => Number(b.average_rating ?? 0) - Number(a.average_rating ?? 0));
  } else if (filters.sort === "price_asc") {
    result.sort((a, b) => toPrice(a.price) - toPrice(b.price));
  } else if (filters.sort === "price_desc") {
    result.sort((a, b) => toPrice(b.price) - toPrice(a.price));
  }

  return result;
}
