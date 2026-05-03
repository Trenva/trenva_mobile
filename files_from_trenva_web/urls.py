from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import (
    ProductListView, ProductDetailView, ProductSpecificImagesListView,
    ProductColorListView, ProductColorDetailView, ProductSizeListView,
    ProductSizeDetailView, ProductImagesListView, ProductImagesDetailView
)
from core import views
from django.contrib.auth.views import LogoutView
from .views import vendor_logout
from .views import (
    vendor_sell, vendor_settings, vendor_verify_email, vendor_transaction, 
    address_autocomplete, vendor_terms, settings_verify_account_numbers, 
    settings_get_bank_list, vendor_add_products, vendor_edit_products, 
    request_return, 
    check_vendor_status, vendor_orders_debug, vendor_orders, 
    vendor_reviews, vendor_delete_product, rating_reviews, 
    vendor_review_stats_api, mark_review_helpful, handle_failed_payment, 
    update_order_status, vendor_order_reject, admin_rejection_review, 
    
    # NEW VIEWS ADDED:
    vendor_order_hold, vendor_mark_order_seen, vendor_restock_item, 
    vendor_update_order_status_ajax, vendor_products, vendor_profile_setup,
    vendor_dashboard, vendor_approval_pending, vendor_signin, vendor_signup,
    vendor_logout, verify_account_number, get_bank_list,
    vendor_orders_details, vendor_dashboard as vendor_dashboard_view,
    place_order, send_vendor_order_notifications, send_admin_new_order_notification,
    flutterwave_verify, paystack_verify, wallet_view, initiate_topup,
    verify_topup, save_vendor_response_ajax, admin_fund_wallet, admin_fund_wallet_verify, my_returns, track_delivery, admin_credit_user_wallet, admin_wallet_stats, flash_sales, vendor_payouts, request_payout, admin_payout_approval, process_payout, trenva_policy, debug_virtual_account, test_paystack_connection_detailed, terms_of_use, be_affilate, cancelled_orders, vendor_password_reset, vendor_password_reset_done, vendor_password_reset_confirm, trenva_vendor_guide, vendor_store, paystack_webhook, transaction_history, get_cities, get_cities_json 
)
from .views import *

# ========== API ROUTER SETUP ==========
from core.views import (
    DashboardAPI, SalesAnalyticsAPI, UserViewSet, ProductViewSet, 
    ProductColorViewSet, ProductSizeViewSet, ProductImagesViewSet,
    BrandViewSet, CategoryViewSet, SubCategoryViewSet, LevelTwoCategoryViewSet,
    VendorViewSet, OrderViewSet, CartViewSet, WishlistViewSet,
    WalletViewSet, TransactionViewSet, ProductReviewViewSet,
    FlashSaleViewSet, FlashSaleProductViewSet,
    CouponViewSet, AddressViewSet, SliderViewSet, TestimonialViewSet,
    TeamViewSet, AdvertisementViewSet, BackgroundViewSet, AboutSiteViewSet,
    CurrencySwitchViewSet, SearchHistoryViewSet, CompareProductViewSet,
    ContactFormViewSet, NewsLetterViewSet, EmailTemplateViewSet,
    StateViewSet, LgasViewSet, WardViewSet, ChatMessageViewSet,
    SaveCustomerCartViewSet, SearchAPI, PublicProductListAPI,
    PublicCategoryListAPI, PublicVendorListAPI, MobileTokenObtainPairView,
    mobile_register
)

# Create separate router for API
api_router = DefaultRouter()
# Viewsets WITH .queryset attribute
api_router.register(r'products', ProductViewSet)
api_router.register(r'product-colors', ProductColorViewSet)
api_router.register(r'product-sizes', ProductSizeViewSet)
api_router.register(r'product-images', ProductImagesViewSet)
api_router.register(r'brands', BrandViewSet)
api_router.register(r'categories', CategoryViewSet)
api_router.register(r'subcategories', SubCategoryViewSet)
api_router.register(r'leveltwo-categories', LevelTwoCategoryViewSet)
api_router.register(r'vendors', VendorViewSet)
api_router.register(r'orders', OrderViewSet)
api_router.register(r'reviews', ProductReviewViewSet)
api_router.register(r'flash-sales', FlashSaleViewSet, basename='flashsale')
api_router.register(r'flash-sale-products', FlashSaleProductViewSet, basename='flashsaleproduct')
api_router.register(r'coupons', CouponViewSet)
api_router.register(r'sliders', SliderViewSet)
api_router.register(r'testimonials', TestimonialViewSet)
api_router.register(r'team', TeamViewSet)
api_router.register(r'advertisements', AdvertisementViewSet)
api_router.register(r'backgrounds', BackgroundViewSet)
api_router.register(r'about-site', AboutSiteViewSet)
api_router.register(r'currencies', CurrencySwitchViewSet)
api_router.register(r'contact-forms', ContactFormViewSet)
api_router.register(r'newsletters', NewsLetterViewSet)
api_router.register(r'email-templates', EmailTemplateViewSet)
api_router.register(r'states', StateViewSet)
api_router.register(r'lgas', LgasViewSet)
api_router.register(r'wards', WardViewSet)

# Viewsets WITHOUT .queryset attribute (basename required)
api_router.register(r'users', UserViewSet, basename='user')
api_router.register(r'cart', CartViewSet, basename='cart')
api_router.register(r'wishlist', WishlistViewSet, basename='wishlist')
api_router.register(r'wallets', WalletViewSet, basename='wallet')
api_router.register(r'transactions', TransactionViewSet, basename='transaction')
api_router.register(r'addresses', AddressViewSet, basename='address')
api_router.register(r'search-history', SearchHistoryViewSet, basename='searchhistory')
api_router.register(r'compare-products', CompareProductViewSet, basename='compare')
api_router.register(r'chat-messages', ChatMessageViewSet, basename='chatmessage')
api_router.register(r'saved-carts', SaveCustomerCartViewSet, basename='savedcart')

urlpatterns = [
    # ========== API ROUTES (Keep as they were) ==========
    # urls.py
    path('debug-va/', views.debug_virtual_account, name='debug_va'),
    path('test-paystack-detailed/', views.test_paystack_connection_detailed, name='test_paystack_detailed'),
    path('api/', include(api_router.urls)),
    path('api/auth/', include('userauths.urls')),
    path('api/dashboard/', DashboardAPI.as_view(), name='dashboard-api'),
    path('api/analytics/sales/', SalesAnalyticsAPI.as_view(), name='sales-analytics'),
    path('api/search/', SearchAPI.as_view(), name='search-api'),
    path('api/public/products/', PublicProductListAPI.as_view(), name='public-products'),
    path('api/public/categories/', PublicCategoryListAPI.as_view(), name='public-categories'),
    path('api/public/vendors/', PublicVendorListAPI.as_view(), name='public-vendors'),
    path('api/auth/token/', MobileTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/register/', mobile_register, name='mobile-register'),
    path('api/products/', ProductListView.as_view(), name='product-list'),
    path('api/products/<str:pid>/', ProductDetailView.as_view(), name='product-detail'),
    path('api/products/<str:pid>/images/', ProductSpecificImagesListView.as_view(), name='product-specific-images-list'),
    path('api/colors/', ProductColorListView.as_view(), name='productcolor-list'),
    path('api/colors/<int:pk>/', ProductColorDetailView.as_view(), name='productcolor-detail'), 
    path('api/sizes/', ProductSizeListView.as_view(), name='productsize-list'),
    path('api/sizes/<int:pk>/', ProductSizeDetailView.as_view(), name='productsize-detail'), 
    path('api/images/', ProductImagesListView.as_view(), name='productimages-list'),
    path('api/images/<int:pk>/', ProductImagesDetailView.as_view(), name='productimages-detail'),
    
    # ========== MAIN WEBSITE PAGES (Remove ng/ from beginning) ==========
    path('', views.home, name="index"),
    path('ng/', views.home, name="home-ng"),
    path('paystack-webhook/', views.paystack_webhook, name='paystack-webhook'),
    path('api/get-cities/', views.get_cities, name='get_cities'),
    path('api/get-cities-json/', views.get_cities_json, name='get_cities_json'),
    path('webhooks/trippa/', views.trippa_webhook, name='trippa_webhook'),
    path('be_affilate/', views.be_affilate, name='be_affilate'),
    path('order/<int:order_id>/track/', views.track_delivery, name='track_delivery'),
    path('flash/', views.update_flash_time, name="update_flash_time"),
    path('returns/', views.my_returns, name='my_returns'),
    path('flash-sale/<int:flash_sale_id>/', views.flash_sale_products, name='flash_sale_products'),
    path('shop/', views.shopgrid, name="shopgrid"),
    path('shopgrid/', views.shopgrid, name="shopgrid"),
    path('test/', views.thetest, name="test"),
    path('delete-account/', views.delete_account, name="delete_account"),
    path('category/', views.category, name="category"),
    path('product-cat/<cid>/', views.product_cat, name="product-cat"),
    path('sub-product-cat/<scid>/', views.sub_product_cat, name="subproduct"),
    path('lv2-product-cat/<l2cid>/', views.level_two_cat, name="leveltwo"),
    path('limited-sales/', views.limited_products, name="limited-sales"),
    path('product/<pid>/', views.product, name="product"),
    path('product/tag/<tag_slug>/', views.tag_show, name="tagshow"),
    path('vendors/', views.vendor, name="vendor"),
    path('vendors-details/<vid>/', views.vendor_details, name="vendors-details"),
    path('vendor-home/', views.vendor_sell, name='vendor-sell'),
    path('vendor-sign-in/', views.vendor_signin, name='vendor-signin'),
    path('vendor-sign-up/', views.vendor_signup, name='vendor-signup'),
    path('vendor-dashboard/', views.vendor_dashboard, name='vendor_dashboard'),
    path('vendor-profile-setup/', views.vendor_profile_setup, name='vendor_profile_setup'),
    path('vendor-approval-pending/', views.vendor_approval_pending, name='vendor-approval-pending'),
    path('vendor-settings/', views.vendor_settings, name='vendor_settings'),
    path('vendor-transaction/', views.vendor_transaction, name='vendor_transaction'),
    path('vendor-terms/', views.vendor_terms, name='vendor-terms'),
    path('vendor-orders/<str:vid>/<str:unique_id>/', views.vendor_orders_details, name='vendor_orders_details'),
    path('vendor-orders/', views.vendor_orders, name='vendor_orders'),
    path('check-vendor-status/', views.check_vendor_status, name='check_vendor_status'),
    path('vendor-orders-debug/', views.vendor_orders_debug, name='vendor_orders_debug'),
    path('vendor/delete-product/<str:pid>/', views.vendor_delete_product, name='vendor_delete_product'),
    # path('vendor-products/', views.vendor_products, name='vendor_product'),
    # path('vendor-add/', views.vendor_add_products, name='vendor_add'),
    # path('vendor-edit/', views.vendor_edit_products, name='vendor_edit'),
    path('vendor/payouts/', views.vendor_payouts, name='vendor_payouts'),
    path('vendor/payouts/request/', views.request_payout, name='request_payout'),
    
    # Admin payout URLs
    path('admin/payouts/', views.admin_payout_approval, name='admin_payout_approval'),
    path('admin/payouts/<str:payout_id>/process/', views.process_payout, name='process_payout'),
    path('vendor/products/', views.vendor_products, name='vendor_products'),
    path('vendor/products/add/', views.vendor_add_products, name='vendor_add_products'),
    path('get-subcategories/', views.get_subcategories_ajax, name='get_subcategories'),
    path('get-level2-categories/', views.get_level2_categories_ajax, name='get_level2_categories'),
    path('vendor/products/edit/<str:pid>/', views.vendor_edit_products, name='vendor_edit_products'),
    path('vendor/verify-email/<uidb64>/<token>/', views.vendor_verify_email, name='vendor_verify_email'),
    path('cart/', views.cart, name="cart"),
    path('sync-cart/', views.sync_cart, name="sync_cart"),
    path('slide-cart/', views.slide_cart, name="slide-cart"),
    path('add-to-cart/', views.add_to_cart, name="add-to-cart"),
    path('delete-from-cart/', views.delete_from_cart, name="delete-from-cart"),
    path('update-cart/', views.update_cart, name="update-cart"),
    path('checkout/', views.checkout, name="checkout"),
    path('checkout/<int:order_id>/', views.checkout, name='checkout'),
    path('place-order/', views.place_order, name='place_order'),
    path('paystack-verify/', views.paystack_verify, name="paystack_verify"),
    path('paystack-verify/<int:order_id>/', views.paystack_verify, name='paystack_verify'),
    path('flutterwave-verify/<int:order_id>/', views.flutterwave_verify, name='flutterwave_verify'),
    path('checkout/flutterwave_verify/', views.flutterwave_verify, name="flutterwave_verify"),
    path('payment-completed/', views.payment_completed, name="payment-completed"),
    path('payment-failed/', views.payment_failed, name="payment-failed"),
    path('order/', views.place_order, name="order"),
    path('invoice/<id>', views.order_invoice, name="invoice"),
    path('my-orders/', views.orders, name="orders"),
    path('order/<id>/', views.order_details, name="order-details"),
    path("track-order/", views.track_order, name="track-order"),
    path("dashboard/track-order/tracker/<tracking_id>/", views.track_order_ajax, name="track-order-ajax"),
    path('dashboard/', views.dashboard, name="dashboard"),
    path('my-account/', views.new_profile, name="my-profile"),
    path('dashboard/edit-profile/', views.edit_profile, name="edit-profile"),
    path('dashboard/my-products/', views.my_product, name="my-products"),
    path('dashboard/add-new-product/', views.create_product, name="add-new-product"),
    path('dashboard/edit-my-products/<pid>/', views.edit_my_product, name="edit-my-products"),
    path('address/', views.address, name="address"),
    path('add-new-address-ajax/', views.add_new_address_ajax, name="add-new-address-ajax"),
    path('add-new-address/', views.add_new_address, name="add-new-address"),
    path('new-address/', views.address_update_ajax, name="new-address"),
    path('edit-address/<id>/', views.edit_address, name="edit-address-book"),
    path('delete-address/<id>', views.delete_address, name="delete-address"),
    path('wishlist/', views.wishlist, name="wishlist"),
    path('add-to-wishlist/', views.add_to_wishlist, name="add-to-wishlist"),
    path('delete-wishlist/', views.delete_wishlist, name="delete-wishlist"),
    path('add-to-compare/', views.add_to_compare, name="add-to-compare"),
    path('remove-compare/', views.remove_compare, name="remove-compare"),
    path("compare/", views.compare_products, name="compare-products"),
    path('wallet/', views.wallet_view, name='wallet'),
    path('wallet/topup/', views.initiate_topup, name='initiate_topup'),
    path('wallet/verify-topup/', views.verify_topup, name='verify_topup'),
    path("add-review/<pid>/", views.add_review, name="add-review"),
    path('vendor-reviews/', views.vendor_reviews, name='vendor_reviews'),
    path('rating-reviews/', views.rating_reviews, name='rating_reviews'),
    path('vendor-reviews/stats/', views.vendor_review_stats_api, name='vendor_review_stats'),
    path('vendor-reviews/<int:review_id>/helpful/', views.mark_review_helpful, name='mark_review_helpful'),
    path("search/", views.search, name="search"),
    path("delete-search/", views.delete_search, name="delete-search"),
    path("filter-product/", views.filter_product, name="filter-product"),

    path("brands/", views.brands, name="brands"),
    path("brand/<brand>/", views.brand_details, name="brand-details"),
    
    path("grab-coupon/", views.grab_coupon, name="grab-coupon"),
    path("update-coupon/", views.update_coupon, name="update-coupon"),
    path('apply-coupon/',  views.apply_coupon,  name='apply-coupon'),
    path('remove-coupon/', views.remove_coupon, name='remove-coupon'),

    path("vouchers/", views.vouchers, name="vouchers"),
    path("add-to-newsletter/", views.newsletter, name="add-to-newsletter"),
    path("contact-us/", views.contact, name="contact-us"),
    path("about-us/", views.about_us, name="about-us"),
    path("faq/", views.faqs, name="faq"),
    path("calculate-distance/", views.calculate_distance, name="calculate-distance"),
    path("show-on-delivery/", views.show_on_delivery, name="show-on-delivery"),
    path('api/address-autocomplete/', views.address_autocomplete, name='address_autocomplete'),
    path('dashboard/vendor/', views.vendor_dashboard, name="vendor-dashboard"),
    # path('dashboard/<vid>/customer-orders/', views.vendor_orders, name="vendor-orders"),
    # path('dashboard/<vid>/customer-order/<unique_id>/', views.vendor_orders_details, name="vendor-order-details"),
    path('dashboard/create-vendor/', views.create_vender, name="create-vendor"),
    path('admin-chats/', views.admin_chats, name='admin_chats'),
    path('updates/', views.updates_disputes, name='updates_disputes'),
    path('api/verify-account/', views.verify_account_number, name='verify_account'),
    path('api/get-banks/', views.get_bank_list, name='get_banks'),
    path('verify-account/', views.settings_verify_account_numbers, name='verify_account_number'),
    path('banks/', views.settings_get_bank_list, name='get_bank_list'),
    path('user/signout/', vendor_logout, name='logout'),
    path('request-return/<int:order_id>/', views.request_return, name='request_return'),
    path('api/handle-failed-payment/', views.handle_failed_payment, name='handle_failed_payment'),
    path('vendor/update-order-status/<int:order_item_id>/', views.update_order_status, name='update_order_status'),
    path('vendor/save-response-ajax/', views.save_vendor_response_ajax, name='save_vendor_response_ajax'),
    path('admin/wallet/fund/', views.admin_fund_wallet, name='admin_fund_wallet'),
    path('admin/wallet/fund/verify/', views.admin_fund_wallet_verify, name='admin_fund_wallet_verify'),
    # path('admin/wallet/transactions/', views.admin_wallet_transactions, name='admin_wallet_transactions'),
    path('admin/wallet/credit-user/', views.admin_credit_user_wallet, name='admin_credit_user_wallet'),
    path('admin/wallet/stats/', views.admin_wallet_stats, name='admin_wallet_stats'),
    path('flash-sales/', views.flash_sales, name='flash_sales'),
    path('top-products/', views.top_products, name='top_products'),
    path('terms-of-use/', views.terms_of_use, name='terms-of-use'),
    path('cancellations/', views.cancelled_orders, name='cancelled_order'),
    path('vendor/password-reset/', views.vendor_password_reset, name='vendor_password_reset'),
    path('vendor/password-reset/done/', views.vendor_password_reset_done, name='vendor_password_reset_done'),
    path('vendor/create-password/<uidb64>/<token>/', views.vendor_password_reset_confirm, name='vendor_password_reset_confirm'),
    path('vendor/guide/', views.trenva_vendor_guide, name='trenva_vendor_guide'),
    path('<slug:store_slug>/', views.vendor_store, name='vendor_store'),
    path('wallet/transactions/', views.transaction_history, name='transaction_history'),
    path('trenva/policy/', views.trenva_policy, name='trenva-policy'),
    
    
    
    # Admin rejection review
    path('admin/rejections/', views.admin_rejection_review, name='admin_rejection_review'),
    
    path('track-share/', views.track_share, name='track_share'),
    
 

    path('vendor/order/reject/<str:unique_id>/', views.vendor_order_reject, name='vendor_order_reject'),
    path('vendor/order/hold/<str:unique_id>/', views.vendor_order_hold, name='vendor_order_hold'),
    path('vendor/order/mark-seen/<str:unique_id>/', views.vendor_mark_order_seen, name='vendor_mark_order_seen'),
    path('vendor/order/restock/<str:unique_id>/', views.vendor_restock_item, name='vendor_restock_item'),
    path('vendor/order/update-status/', views.vendor_update_order_status_ajax, name='vendor_update_status_ajax'),
    
    
    path('vendor/follow/<str:vid>/', views.toggle_vendor_follow, name='toggle-vendor-follow'),
    path('vendor/<str:vid>/followers/', views.vendor_followers_list, name='vendor-followers'),

    #mobile app api's
    path('api/payments/paystack/init/', views.mobile_paystack_init, name='mobile_paystack_init'),
    path('api/payments/paystack/verify/', views.mobile_paystack_verify, name='mobile_paystack_verify'),
    path('api/payments/wallet/checkout/', views.mobile_wallet_checkout, name='mobile_wallet_checkout'),

]
