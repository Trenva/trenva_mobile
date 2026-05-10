import { apiClient } from "./client";
import { API_BASE_URL } from "./config";
import { getCached, setCached } from "../cache/memory-cache";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ApiPage<T> = {
  count: number;
  next: string | null;
  results: T[];
};

export type ApiProduct = {
  id?: number;
  pid?: string;
  category?: string;
  subcategory?: string;
  leveltwocategory?: string;
  vendor?: string;
  title: string;
  image?: string | null;
  description?: string | null;
  price?: string | number | null;
  old_price?: string | number | null;
  discount_percentage?: string | number | null;
  in_stock?: boolean | string | number | null;
  product_status?: string;
  status?: boolean;
  featured?: boolean;
  promo?: boolean;
  average_rating?: number | string;
  size?: string | null;
  p_images?: Array<{
    id?: number;
    images?: string | null;
    product?: number | null;
    date?: string;
  }>;
};

export type ApiCategory = {
  cid: string;
  title: string;
  image?: string | null;
  product_count?: number;
};

export type ApiSlider = {
  id: number;
  title?: string;
  update?: string;
  discount_info?: string;
  action?: string;
  action_button?: string;
  image?: string | null;
  icon?: string | null;
  date?: string;
};

export type ApiFlashSale = {
  id: number;
  fsid?: string;
  title?: string;
  description?: string | null;
  is_active?: boolean;
  featured?: boolean;
  banner_image?: string | null;
  remaining_time?: {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    formatted?: string;
    expired?: boolean;
  };
};

export type ApiFlashSaleProduct = {
  id: number;
  flash_sale: number;
  product: number;
  flash_sale_price?: string | number | null;
  effective_price?: string | number | null;
  product_details?: {
    id?: number;
    pid?: string;
    title?: string;
    image?: string | null;
    price?: string | number | null;
    old_price?: string | number | null;
    discount_percentage?: string | number | null;
    in_stock?: boolean | string | number | null;
    promo?: boolean;
    product_status?: string;
  };
  added_at?: string;
};

export type ApiSubCategory = {
  scid: string;
  title: string;
  image?: string | null;
  category?: number;
  category_name?: string;
  product_count?: number;
};

export type ApiLevelTwoCategory = {
  l2cid: string;
  title: string;
  image?: string | null;
  category?: number;
  category_name?: string;
  subcategory?: number;
  subcategory_name?: string;
  product_count?: number;
};

export type ApiCartItem = {
  id: number;
  product: number;
  product_name?: string;
  product_image?: string | null;
  product_price?: string | number | null;
  product_color?: string | null;
  product_size?: string | null;
  qty: number;
  total_price?: string | number | null;
};

export type ApiAddress = {
  id: number;
  user?: number;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  city?: string | null;
  company?: string | null;
  apartment?: string | null;
  state?: string | null;
  postal?: string | null;
  status?: string | null;
  delete?: boolean;
};

export type ApiOrder = {
  oid: string;
  id?: number;
  tracking_id?: string | null;
  user?: number;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  address?: string | null;
  apartment_floor?: string | null;
  town?: string | null;
  postal?: string | null;
  phone_number?: string | null;
  email_address?: string | null;
  order_note?: string | null;
  payment_method?: string | null;
  price?: string | number | null;
  paid_status?: boolean;
  order_date?: string | null;
  product_status?: string | null;
  delivery_method?: string | null;
  coupon_used?: boolean;
  session_token?: string | null;
  items?: Array<{
    id?: number;
    item?: string;
    product_name?: string;
    image?: string | null;
    qty?: number;
    product_color?: string | null;
    product_size?: string | null;
    price?: string | number | null;
    total?: string | number | null;
    product_status?: string | null;
    order_date?: string | null;
  }>;
};

export type ApiWallet = {
  id: number;
  user?: number;
  balance?: string | number | null;
  user_email?: string;
  user_name?: string;
};

export type ApiTransaction = {
  id: number;
  wallet?: number;
  amount?: string | number | null;
  balance_after?: string | number | null;
  transaction_type?: "credit" | "debit" | string;
  status?: string;
  reference?: string;
  description?: string;
  created_at?: string;
  formatted_date?: string;
};

type MobilePaystackInitPayload = {
  addressId: number;
  deliveryMethod?: string;
  orderNote?: string;
  callbackUrl?: string;
  couponCode?: string;
  couponId?: number;
};

type MobilePaystackInitResponse = {
  success: boolean;
  authorization_url?: string;
  reference?: string;
  amount?: string;
  error?: string;
};

type MobilePaystackVerifyResponse = {
  success: boolean;
  order_id?: number;
  oid?: string;
  message?: string;
  error?: string;
};

type MobileWalletCheckoutPayload = {
  addressId: number;
  deliveryMethod?: string;
  orderNote?: string;
  couponCode?: string;
  couponId?: number;
};

type MobileWalletCheckoutResponse = {
  success: boolean;
  order_id?: number;
  oid?: string;
  wallet_balance?: string;
  message?: string;
  error?: string;
};

type CouponValidateResponse = {
  valid: boolean;
  message?: string;
  coupon?: {
    id: number;
    coupon_code: string;
    discount: string | number;
    discount_type?: string;
    minimum_order?: string | number | null;
    products?: Array<{
      id?: number;
      pid?: string;
      title?: string;
    }>;
    used_by?: string[];
  };
};

export type ApiCoupon = {
  id: number;
  coupon_code: string;
  discount?: string | number;
  discount_type?: "percentage" | "fixed" | string;
  minimum_order?: string | number | null;
  active?: boolean;
  usage_limit?: number | null;
  usage_count?: number;
  expiry_date?: string | null;
  used_by?: string[];
};

export type ApiWishlistItem = {
  id: number;
  product: number;
  product_details?: {
    id?: number;
    pid?: string;
    title?: string;
    image?: string | null;
    price?: string | number | null;
    old_price?: string | number | null;
    discount_percentage?: string | number | null;
    in_stock?: boolean | string | number | null;
  };
};

export function isExplicitlyOutOfStock(value: unknown) {
  if (value === false) return true;
  if (typeof value === "number") return value === 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "false" || normalized === "0" || normalized === "no" || normalized === "out_of_stock" || normalized === "out of stock";
  }
  return false;
}

export type ApiProductImage = {
  id: number;
  images?: string | null;
  product?: number | null;
  date?: string;
};

export type ApiVendor = {
  vid: string;
  user?: number;
  name: string;
  is_following?: boolean;
  follower_count?: number;
  image?: string | null;
  verified?: boolean;
  description?: string | null;
  date?: string;
  store_name?: string | null;
  business_name?: string | null;
  phone_number?: string | null;
  address?: string | null;
  category?: string | null;
  chat_resp_time?: string | null;
  shipping_on_time?: string | null;
  total_products?: number;
  total_orders?: number;
  total_revenue?: string | number | null;
};

export type ApiProductReview = {
  id: number;
  user?: number;
  user_name?: string;
  user_email?: string;
  product?: number;
  product_name?: string;
  review?: string;
  rating?: number;
  formatted_date?: string;
};

export function getWishlistProductId(item: ApiWishlistItem) {
  const nestedId = item.product_details?.id;
  if (typeof nestedId === "number") return nestedId;
  return item.product;
}

function unwrapResults<T>(payload: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.results ?? [];
}

function unwrapPage<T>(payload: T[] | PaginatedResponse<T>): ApiPage<T> {
  if (Array.isArray(payload)) {
    return {
      count: payload.length,
      next: null,
      results: payload,
    };
  }
  return {
    count: Number(payload.count ?? 0),
    next: payload.next ?? null,
    results: payload.results ?? [],
  };
}

async function fetchAllPages<T>(
  path: string,
  params?: Record<string, string | number | boolean>,
) {
  const all: T[] = [];
  let nextUrl: string | null = path;
  let nextParams: Record<string, string | number | boolean> | undefined = params;

  while (nextUrl) {
    const response: { data: PaginatedResponse<T> | T[] } = await apiClient.get<PaginatedResponse<T> | T[]>(nextUrl, {
      params: nextParams,
    });
    const payload: PaginatedResponse<T> | T[] = response.data;

    if (Array.isArray(payload)) {
      all.push(...payload);
      break;
    }

    all.push(...(payload.results ?? []));
    nextUrl = payload.next;
    nextParams = undefined;
  }

  return all;
}

function getApiOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL;
  }
}

function normalizeUrlForImage(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    // Encode each path segment safely (avoids spaces/special-char failures on Android release).
    const normalizedPath = url.pathname
      .split("/")
      .map((segment) => {
        if (!segment) return segment;
        try {
          return encodeURIComponent(decodeURIComponent(segment));
        } catch {
          return encodeURIComponent(segment);
        }
      })
      .join("/");
    url.pathname = normalizedPath;
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function toThumbKey(value: string) {
  // URI-safe and runtime-safe across RN/web without relying on btoa/polyfills.
  return encodeURIComponent(value).replace(/%/g, "~");
}

export function resolveMediaUrl(path?: string | null) {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return normalizeUrlForImage(path);
  }
  const origin = getApiOrigin();
  const absolute = path.startsWith("/") ? `${origin}${path}` : `${origin}/${path}`;
  return normalizeUrlForImage(absolute);
}

export function resolveMediaThumbUrl(
  path?: string | null,
  options?: { width?: number; height?: number; quality?: number; format?: "webp" | "jpeg" },
) {
  const source = resolveMediaUrl(path);
  if (!source) return undefined;
  const origin = getApiOrigin();
  try {
    const sourceUrl = new URL(source);
    const originUrl = new URL(origin);
    // Only proxy through media-thumb for same-origin media files.
    // External hosts should be loaded directly.
    if (sourceUrl.origin !== originUrl.origin) {
      return source;
    }
  } catch {
    // If parsing fails, fall back to direct source.
    return source;
  }
  // Safety fallback: use direct source URL until thumbnail endpoint is confirmed live in deployment.
  // Keeps rendering reliable even when backend route is missing.
  return source;
}

export function resolveProductCardImageUrl(path?: string | null) {
  return resolveMediaThumbUrl(path, { width: 420, quality: 72, format: "webp" }) ?? resolveMediaUrl(path);
}

export function formatMoney(value?: string | number | null) {
  const amount = Number(value ?? 0);
  const naira = "\u20A6";
  if (Number.isNaN(amount)) return `${naira}0`;
  return `${naira} ${amount.toLocaleString()}`;
}

export async function getPublishedProducts() {
  return fetchAllPages<ApiProduct>("/api/products/", { product_status: "published" });
}

export async function getPublishedProductsPage(params?: {
  page?: number;
  nextUrl?: string | null;
}) {
  if (params?.nextUrl) {
    const response = await apiClient.get<PaginatedResponse<ApiProduct> | ApiProduct[]>(params.nextUrl);
    return unwrapPage(response.data);
  }
  const response = await apiClient.get<PaginatedResponse<ApiProduct> | ApiProduct[]>("/api/products/", {
    params: {
      product_status: "published",
      page: params?.page ?? 1,
    },
  });
  return unwrapPage(response.data);
}

export async function getPublishedProductsFiltered(params?: {
  categoryTitle?: string;
  categoryCid?: string;
  subcategoryTitle?: string;
  levelTwoTitle?: string;
  vendorName?: string;
  query?: string;
  ordering?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  minRating?: number | null;
  color?: string;
  inStock?: boolean;
  sort?: "relevance" | "top_sales" | "most_recent" | "popular" | "price_asc" | "price_desc";
}) {
  const query: Record<string, string> = {
    product_status: "published",
  };
  if (params?.categoryTitle) query.category_title = params.categoryTitle;
  if (params?.categoryCid) query.category_cid = params.categoryCid;
  if (params?.subcategoryTitle) query.subcategory_title = params.subcategoryTitle;
  if (params?.levelTwoTitle) query.leveltwo_title = params.levelTwoTitle;
  if (params?.vendorName) query.vendor_name = params.vendorName;
  if (params?.query) query.q = params.query;
  if (params?.ordering) query.ordering = params.ordering;
  if (typeof params?.minPrice === "number") query.min_price = String(params.minPrice);
  if (typeof params?.maxPrice === "number") query.max_price = String(params.maxPrice);
  if (typeof params?.minRating === "number") query.min_rating = String(params.minRating);
  if (params?.color) query.color = params.color;
  if (typeof params?.inStock === "boolean") query.in_stock = String(params.inStock);
  if (params?.sort && params.sort !== "relevance") query.sort = params.sort;
  return fetchAllPages<ApiProduct>("/api/products/", query);
}

export async function getRelatedProductsById(productId: number, limit = 12) {
  const response = await apiClient.get<PaginatedResponse<ApiProduct> | ApiProduct[]>(
    `/api/products/${productId}/related/`,
    {
      params: { limit },
    },
  );
  return unwrapResults(response.data);
}

function isPublishedProduct(product?: Partial<ApiProduct> | null) {
  if (!product) return false;
  const productStatus = String(product.product_status ?? "").toLowerCase();
  if (productStatus && productStatus !== "published") return false;
  if (typeof product.status === "boolean" && !product.status) return false;
  return true;
}

function filterPublishedProducts(products: ApiProduct[]) {
  return products.filter((product) => isPublishedProduct(product));
}

function filterPublishedFlashSaleProducts(items: ApiFlashSaleProduct[]) {
  return items.filter((item) => isPublishedProduct(item.product_details));
}

export async function getFeaturedProducts() {
  const response = await apiClient.get<PaginatedResponse<ApiProduct> | ApiProduct[]>(
    "/api/products/featured/",
    {
      params: {
        product_status: "published",
      },
    },
  );
  return filterPublishedProducts(unwrapResults(response.data));
}

export async function getFeaturedProductsPage(params?: {
  page?: number;
  nextUrl?: string | null;
}) {
  if (params?.nextUrl) {
    const response = await apiClient.get<PaginatedResponse<ApiProduct> | ApiProduct[]>(params.nextUrl);
    const page = unwrapPage(response.data);
    return { ...page, results: filterPublishedProducts(page.results) };
  }
  const response = await apiClient.get<PaginatedResponse<ApiProduct> | ApiProduct[]>(
    "/api/products/featured/",
    {
      params: {
        product_status: "published",
        page: params?.page ?? 1,
      },
    },
  );
  const page = unwrapPage(response.data);
  return { ...page, results: filterPublishedProducts(page.results) };
}

export async function getSaleProducts() {
  const response = await apiClient.get<PaginatedResponse<ApiProduct> | ApiProduct[]>(
    "/api/products/on_sale/",
  );
  return unwrapResults(response.data);
}

export async function getSliders() {
  const cacheKey = "public:sliders";
  const cached = getCached<ApiSlider[]>(cacheKey);
  if (cached) return cached;
  const data = await fetchAllPages<ApiSlider>("/api/sliders/");
  setCached(cacheKey, data, 60_000);
  return data;
}

export async function getFlashSales(params?: {
  active?: boolean;
  featured?: boolean;
}) {
  const cacheKey = `public:flash-sales:${String(params?.active)}:${String(params?.featured)}`;
  const cached = getCached<ApiFlashSale[]>(cacheKey);
  if (cached) return cached;
  const query: Record<string, string> = {};
  if (typeof params?.active === "boolean") query.is_active = String(params.active);
  if (typeof params?.featured === "boolean") query.featured = String(params.featured);
  const data = await fetchAllPages<ApiFlashSale>("/api/flash-sales/", query);
  setCached(cacheKey, data, 45_000);
  return data;
}

export async function getFlashSaleProducts(params?: {
  active?: boolean;
  flashSaleId?: number;
}) {
  const query: Record<string, string | number> = {};
  if (typeof params?.active === "boolean") query.active = String(params.active);
  if (typeof params?.flashSaleId === "number") query.flash_sale = params.flashSaleId;
  query.product_status = "published";
  const rows = await fetchAllPages<ApiFlashSaleProduct>("/api/flash-sale-products/", query);
  return filterPublishedFlashSaleProducts(rows);
}

export async function getFlashSaleProductsPage(params?: {
  active?: boolean;
  flashSaleId?: number;
  page?: number;
  nextUrl?: string | null;
}) {
  if (params?.nextUrl) {
    const response = await apiClient.get<PaginatedResponse<ApiFlashSaleProduct> | ApiFlashSaleProduct[]>(
      params.nextUrl,
    );
    const page = unwrapPage(response.data);
    return { ...page, results: filterPublishedFlashSaleProducts(page.results) };
  }
  const query: Record<string, string | number> = {};
  if (typeof params?.active === "boolean") query.active = String(params.active);
  if (typeof params?.flashSaleId === "number") query.flash_sale = params.flashSaleId;
  query.product_status = "published";
  query.page = params?.page ?? 1;
  const response = await apiClient.get<PaginatedResponse<ApiFlashSaleProduct> | ApiFlashSaleProduct[]>(
    "/api/flash-sale-products/",
    { params: query },
  );
  const page = unwrapPage(response.data);
  return { ...page, results: filterPublishedFlashSaleProducts(page.results) };
}

export async function getHeuristicFlashSaleProducts() {
  const products = await getPublishedProducts();
  const now = Date.now();

  const filtered = products.filter((product) => {
    const hasPromo = Boolean(product.promo);
    const hasCountdownValues =
      Number((product as { days?: number }).days ?? 0) > 0 ||
      Number((product as { hours?: number }).hours ?? 0) > 0 ||
      Number((product as { minutes?: number }).minutes ?? 0) > 0 ||
      Number((product as { seconds?: number }).seconds ?? 0) > 0;

    const countdownStart = (product as { countdown_start?: string | null }).countdown_start;
    const hasActiveCountdown = Boolean(countdownStart) && new Date(String(countdownStart)).getTime() <= now;

    return hasPromo || hasCountdownValues || hasActiveCountdown;
  });

  if (filtered.length > 0) return filtered;
  return getSaleProducts();
}

export async function getProductById(id: string | number) {
  const response = await apiClient.get<ApiProduct>(`/api/products/${id}/`);
  return response.data;
}

export async function getProductBySlug(slug: string) {
  const asNumber = Number(slug);
  if (!Number.isNaN(asNumber) && Number.isInteger(asNumber) && asNumber > 0) {
    return getProductById(asNumber);
  }

  const products = await getPublishedProducts();
  const matched = products.find((product) => product.pid === slug);
  if (!matched?.id) {
    throw new Error("Product not found");
  }

  return getProductById(matched.id);
}

export async function getProductImagesByPid(pid: string) {
  const response = await apiClient.get<PaginatedResponse<ApiProductImage> | ApiProductImage[]>(
    `/api/products/${pid}/images/`,
  );
  return unwrapResults(response.data);
}

export async function getVendors() {
  const cacheKey = "public:vendors";
  const cached = getCached<ApiVendor[]>(cacheKey);
  if (cached) return cached;
  const data = await fetchAllPages<ApiVendor>("/api/vendors/");
  setCached(cacheKey, data, 2 * 60_000);
  return data;
}

export async function getVendorByVid(vid: string) {
  const response = await apiClient.get<ApiVendor>(`/api/vendors/${vid}/`);
  return response.data;
}

export async function getProductReviews(productId: number) {
  return fetchAllPages<ApiProductReview>("/api/reviews/", { product: productId });
}

export async function toggleVendorFollow(vendorId: string) {
  const response = await apiClient.post<{
    success: boolean;
    is_following?: boolean;
    follower_count?: number;
    message?: string;
    error?: string;
  }>(`/api/vendors/${vendorId}/follow/`);
  return response.data;
}

export async function getCategories() {
  const cacheKey = "public:categories";
  const cached = getCached<ApiCategory[]>(cacheKey);
  if (cached) return cached;
  const data = await fetchAllPages<ApiCategory>("/api/categories/");
  setCached(cacheKey, data, 5 * 60_000);
  return data;
}

export async function getSubcategories(params?: {
  categoryTitle?: string;
  categoryCid?: string;
}) {
  const cacheKey = `public:subcategories:${params?.categoryTitle ?? ""}:${params?.categoryCid ?? ""}`;
  const cached = getCached<ApiSubCategory[]>(cacheKey);
  if (cached) return cached;
  const query: Record<string, string> = {};
  if (params?.categoryTitle) query.category_title = params.categoryTitle;
  if (params?.categoryCid) query.category_cid = params.categoryCid;
  const data = await fetchAllPages<ApiSubCategory>("/api/subcategories/", query);
  setCached(cacheKey, data, 5 * 60_000);
  return data;
}

export async function getLevelTwoCategories(params?: {
  categoryTitle?: string;
  categoryCid?: string;
  subcategoryTitle?: string;
}) {
  const cacheKey = `public:leveltwo-categories:${params?.categoryTitle ?? ""}:${params?.categoryCid ?? ""}:${params?.subcategoryTitle ?? ""}`;
  const cached = getCached<ApiLevelTwoCategory[]>(cacheKey);
  if (cached) return cached;
  const query: Record<string, string> = {};
  if (params?.categoryTitle) query.category_title = params.categoryTitle;
  if (params?.categoryCid) query.category_cid = params.categoryCid;
  if (params?.subcategoryTitle) query.subcategory_title = params.subcategoryTitle;
  const data = await fetchAllPages<ApiLevelTwoCategory>("/api/leveltwo-categories/", query);
  setCached(cacheKey, data, 5 * 60_000);
  return data;
}

export async function getCartItems() {
  const response = await apiClient.get<ApiCartItem[]>("/api/cart/");
  return response.data;
}

export async function getCartTotal() {
  const response = await apiClient.get<{ total_items: number; total_price: number }>("/api/cart/total/");
  return response.data;
}

export async function updateCartItemQty(id: number, qty: number) {
  const response = await apiClient.patch<ApiCartItem>(`/api/cart/${id}/`, { qty });
  return response.data;
}

export async function addCartItem(params: {
  productId: number;
  qty?: number;
  productColor?: string;
  productSize?: string;
}) {
  const response = await apiClient.post<ApiCartItem>("/api/cart/", {
    product: params.productId,
    qty: params.qty ?? 1,
    product_color: params.productColor ?? "Default",
    product_size: params.productSize ?? "Default",
  });
  return response.data;
}

export async function addOrIncrementCartItem(productId: number) {
  const items = await getCartItems();
  const existing = items.find((item) => item.product === productId);

  if (existing) {
    return updateCartItemQty(existing.id, (existing.qty ?? 1) + 1);
  }

  return addCartItem({ productId, qty: 1 });
}

export async function addOrIncrementCartItemWithOptions(params: {
  productId: number;
  qty?: number;
  productColor?: string;
  productSize?: string;
}) {
  const quantity = Math.max(1, Number(params.qty ?? 1));
  const targetColor = params.productColor ?? "Default";
  const targetSize = params.productSize ?? "Default";

  const items = await getCartItems();
  const existing = items.find(
    (item) =>
      item.product === params.productId &&
      (item.product_color ?? "Default") === targetColor &&
      (item.product_size ?? "Default") === targetSize,
  );

  if (existing) {
    return updateCartItemQty(existing.id, (existing.qty ?? 1) + quantity);
  }

  return addCartItem({
    productId: params.productId,
    qty: quantity,
    productColor: targetColor,
    productSize: targetSize,
  });
}

export async function removeCartItem(id: number) {
  await apiClient.delete(`/api/cart/${id}/`);
}

export async function getWishlistItems() {
  const response = await apiClient.get<ApiWishlistItem[]>("/api/wishlist/");
  return response.data;
}

export async function getAddresses() {
  return fetchAllPages<ApiAddress>("/api/addresses/");
}

export async function createAddress(payload: Partial<ApiAddress>) {
  const response = await apiClient.post<ApiAddress>("/api/addresses/", payload);
  return response.data;
}

export async function setDefaultAddress(addressId: number) {
  const response = await apiClient.post<{ success?: boolean; message?: string }>(
    `/api/addresses/${addressId}/set_default/`,
  );
  return response.data;
}

export async function getOrders() {
  return fetchAllPages<ApiOrder>("/api/orders/");
}

export async function getOrderByOid(oid: string) {
  const response = await apiClient.get<PaginatedResponse<ApiOrder> | ApiOrder[]>("/api/orders/", {
    params: { search: oid },
  });
  const rows = unwrapResults(response.data);
  return rows.find((row) => row.oid === oid) ?? rows[0] ?? null;
}

type CreateOrderPayload = {
  userId?: number;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  address?: string;
  apartmentFloor?: string;
  cityOrTown?: string;
  state?: string;
  postal?: string;
  phoneNumber?: string;
  emailAddress?: string;
  paymentMethod?: string;
  amount?: number;
  paidStatus?: boolean;
};

export async function createOrder(payload: CreateOrderPayload) {
  const response = await apiClient.post<ApiOrder>("/api/orders/", {
    user: payload.userId,
    first_name: payload.firstName ?? "",
    last_name: payload.lastName ?? "",
    company_name: payload.companyName ?? "",
    address: payload.address ?? "",
    apartment_floor: payload.apartmentFloor ?? "",
    town: payload.cityOrTown ?? "",
    city: payload.cityOrTown ?? "",
    state: payload.state ?? "",
    postal: payload.postal ?? "",
    phone_number: payload.phoneNumber ?? "",
    email_address: payload.emailAddress ?? "",
    payment_method: payload.paymentMethod ?? "card",
    price: Number(payload.amount ?? 0),
    paid_status: payload.paidStatus ?? true,
    product_status: "Placed",
  });
  return response.data;
}

export async function clearCart() {
  const response = await apiClient.post<{ success?: boolean; message?: string }>("/api/cart/clear/");
  return response.data;
}

export async function getWallets() {
  return fetchAllPages<ApiWallet>("/api/wallets/");
}

export async function getTransactions(params?: {
  transactionType?: "credit" | "debit";
  status?: string;
}) {
  const query: Record<string, string> = {};
  if (params?.transactionType) query.transaction_type = params.transactionType;
  if (params?.status) query.status = params.status;
  return fetchAllPages<ApiTransaction>("/api/transactions/", query);
}

export async function createContactForm(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const response = await apiClient.post<{
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
  }>("/api/contact-forms/", payload);
  return response.data;
}

export async function mobilePaystackInit(payload: MobilePaystackInitPayload) {
  const response = await apiClient.post<MobilePaystackInitResponse>("/api/payments/paystack/init/", {
    address_id: payload.addressId,
    delivery_method: payload.deliveryMethod ?? "Door Step Delivery",
    order_note: payload.orderNote ?? "Null",
    callback_url: payload.callbackUrl,
    coupon_code: payload.couponCode?.trim() || "",
    coupon_id: payload.couponId ?? null,
  });
  return response.data;
}

export async function mobilePaystackVerify(reference: string) {
  const response = await apiClient.post<MobilePaystackVerifyResponse>("/api/payments/paystack/verify/", {
    reference,
  });
  return response.data;
}

export async function mobileWalletCheckout(payload: MobileWalletCheckoutPayload) {
  const response = await apiClient.post<MobileWalletCheckoutResponse>("/api/payments/wallet/checkout/", {
    address_id: payload.addressId,
    delivery_method: payload.deliveryMethod ?? "Door Step Delivery",
    order_note: payload.orderNote ?? "Null",
    coupon_code: payload.couponCode?.trim() || "",
    coupon_id: payload.couponId ?? null,
  });
  return response.data;
}

export async function validateCouponCode(payload: { couponCode: string; email?: string }) {
  const response = await apiClient.post<CouponValidateResponse>("/api/coupons/validate/", {
    coupon_code: payload.couponCode.trim().toUpperCase(),
    email: payload.email,
  });
  return response.data;
}

export async function useCouponById(couponId: number, email?: string) {
  const response = await apiClient.post<{
    success: boolean;
    message?: string;
    discount?: string | number;
    error?: string;
  }>(`/api/coupons/${couponId}/use/`, {
    email,
  });
  return response.data;
}

export async function getCoupons() {
  return fetchAllPages<ApiCoupon>("/api/coupons/");
}

export async function removeWishlistItem(id: number) {
  await apiClient.delete(`/api/wishlist/${id}/`);
}

export async function addWishlistItem(productId: number) {
  const response = await apiClient.post<ApiWishlistItem>("/api/wishlist/", { product: productId });
  return response.data;
}

export async function toggleWishlistByProductId(productId: number) {
  const items = await getWishlistItems();
  const existing = items.find((item) => getWishlistProductId(item) === productId);

  if (existing) {
    await removeWishlistItem(existing.id);
    return { action: "removed" as const };
  }

  await addWishlistItem(productId);
  return { action: "added" as const };
}

export async function createProductReview(params: {
  productId: number;
  rating: number;
  review: string;
}) {
  const response = await apiClient.post("/api/reviews/", {
    product: params.productId,
    rating: params.rating,
    review: params.review,
  });
  return response.data;
}
