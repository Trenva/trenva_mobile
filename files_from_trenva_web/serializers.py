from rest_framework import serializers
from taggit.serializers import (TagListSerializerField, TaggitSerializer)
from decimal import Decimal 
from django.utils.html import strip_tags

# ========== PROPER USER MODEL IMPORT ==========
from django.contrib.auth import get_user_model
User = get_user_model()

from django.db.models import Sum, Count, Avg
from core.models import (
    Product, ProductColor, ProductSize, ProductImages, Category, 
    SubCategory, LevelTwoCategory, Vendor, CartOrder, CartOrderItems,
    Address, Cart, Wishlist, Wallet, Transaction, Coupon, CouponEmail,
    ProductReview, Slider, Testimonial, Team, Advertisement, 
    SearchHistory, CompareProduct, Background, AboutSite, CurrencySwitch,
    Tags, ContactForm, NewsLetter, EmailTemplate, State, Lgas, Ward,
    ChatMessage, SaveCustomerCart, Brand, FlashSale, FlashSaleProduct
)


class ProductColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductColor
        fields = ['id', 'color_name', 'color_name_in_html']

class ProductSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = ['id', 'size']

class ProductImagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImages
        fields = ['id', 'images', 'product', 'date']

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['brand', 'title', 'description', 'image']


class ProductSerializer(TaggitSerializer, serializers.ModelSerializer):
    category = serializers.StringRelatedField()
    subcategory = serializers.StringRelatedField()
    leveltwocategory = serializers.StringRelatedField()
    brand = serializers.StringRelatedField()
    vendor = serializers.StringRelatedField()
    user = serializers.StringRelatedField()

    color = ProductColorSerializer(many=True, read_only=True)
    size = ProductSizeSerializer(many=True, read_only=True)
    p_images = ProductImagesSerializer(many=True, read_only=True)

    tag = TagListSerializerField()
    average_rating = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    remaining_time = serializers.CharField(source='get_remaining_time', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'pid', 'user', 'category', 'subcategory', 'leveltwocategory', 'brand', 'vendor',
            'title', 'image', 'description', 'vendor_price', 'price', 'old_price', 'promo',
            'specifications', 'tag', 'product_status', 'color', 'size', 'status', 'in_stock',
            'featured', 'digital', 'days', 'hours', 'minutes', 'seconds', 'countdown_start',
            'sku', 'date', 'updated', 'p_images', 'average_rating', 'discount_percentage', 
            'remaining_time',
        ]
        
    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if rep.get('description'):
            rep['description'] = strip_tags(rep['description'])
        return rep

    def get_average_rating(self, obj):
        try:
            return obj.average_rating()
        except Exception:
            return 0.00

    def get_discount_percentage(self, obj):
        try:
            return obj.get_percentage()
        except Exception:
            return 0.00


class SimpleProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'pid', 'title', 'image', 'price', 'old_price', 'promo', 'product_status']


class FlashSaleProductSerializer(serializers.ModelSerializer):
    product_details = SimpleProductSerializer(source='product', read_only=True)
    effective_price = serializers.SerializerMethodField()

    class Meta:
        model = FlashSaleProduct
        fields = [
            'id', 'flash_sale', 'product', 'product_details',
            'flash_sale_price', 'effective_price', 'added_at'
        ]

    def get_effective_price(self, obj):
        try:
            if obj.flash_sale_price is not None:
                return obj.flash_sale_price
            if obj.product and obj.product.price is not None:
                return obj.product.price
            return 0
        except Exception:
            return 0


class FlashSaleSerializer(serializers.ModelSerializer):
    remaining_time = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    products = FlashSaleProductSerializer(source='flash_sale_products', many=True, read_only=True)

    class Meta:
        model = FlashSale
        fields = [
            'id', 'fsid', 'title', 'description',
            'days', 'hours', 'minutes', 'seconds',
            'countdown_start', 'is_active', 'featured',
            'banner_image', 'created_at', 'updated_at',
            'remaining_time', 'product_count', 'products'
        ]

    def get_remaining_time(self, obj):
        try:
            return obj.get_remaining_time()
        except Exception:
            return {
                'days': 0, 'hours': 0, 'minutes': 0, 'seconds': 0,
                'formatted': "00:00:00:00", 'expired': True
            }

    def get_product_count(self, obj):
        try:
            return obj.get_product_count()
        except Exception:
            return 0

class CouponValidationSerializer(serializers.Serializer):
    coupon_code = serializers.CharField()
    email = serializers.EmailField(required=False)

class UserSerializer(serializers.ModelSerializer):
    total_orders = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                 'date_joined', 'is_active', 'is_staff', 'total_orders', 'total_spent']
    
    def get_total_orders(self, obj):
        try:
            return obj.cartorder_set.count()
        except Exception:
            return 0
    
    def get_total_spent(self, obj):
        try:
            total = obj.cartorder_set.filter(paid_status=True).aggregate(
                total=Sum('price')
            )['total'] or 0
            return total
        except Exception:
            return 0

class CustomerProfileSerializer(serializers.ModelSerializer):
    addresses = serializers.SerializerMethodField()
    wishlist_count = serializers.SerializerMethodField()
    cart_items_count = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 
            'is_active', 'addresses', 'wishlist_count', 'cart_items_count', 
            'total_orders', 'total_spent'
        ]
    
    def get_addresses(self, obj):
        try:
            addresses = Address.objects.filter(user=obj, delete=False)
            return AddressSerializer(addresses, many=True).data
        except Exception:
            return []
    
    def get_wishlist_count(self, obj):
        try:
            return Wishlist.objects.filter(user=obj).count()
        except Exception:
            return 0
    
    def get_cart_items_count(self, obj):
        try:
            return Cart.objects.filter(user=obj).count()
        except Exception:
            return 0
    
    def get_total_orders(self, obj):
        try:
            return obj.cartorder_set.count()
        except Exception:
            return 0
    
    def get_total_spent(self, obj):
        try:
            total = obj.cartorder_set.filter(paid_status=True).aggregate(
                total=Sum('price')
            )['total'] or 0
            return total
        except Exception:
            return 0

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['cid', 'title', 'image', 'date', 'product_count']
    
    def get_product_count(self, obj):
        try:
            return obj.product_set.count()
        except Exception:
            return 0

class SubCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.title', read_only=True)
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SubCategory
        fields = ['scid', 'title', 'image', 'category', 'category_name', 'product_count']
    
    def get_product_count(self, obj):
        try:
            return obj.product_set.count()
        except Exception:
            return 0

class LevelTwoCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.title', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.title', read_only=True)
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = LevelTwoCategory
        fields = ['l2cid', 'title', 'image', 'category', 'category_name', 
                 'subcategory', 'subcategory_name', 'product_count']
    
    def get_product_count(self, obj):
        try:
            return obj.product_set.count()
        except Exception:
            return 0

class VendorSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    total_products = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = [
            'vid', 'name', 'user', 'user_email', 'image', 'verified', 'description',
            'approval_status', 'approved_at', 'approved_by', 'store_name', 'business_name',
            'business_description', 'phone_number', 'business_registered', 
            'registration_certificate', 'tax_id_number', 'identification_document', 'tax_number',
            'physical_address', 'physical_latitude', 'physical_longitude', 'return_address',
            'return_latitude', 'return_longitude', 'facebook_url', 'instagram_url', 'twitter_url',
            'bank_name', 'account_name', 'account_number', 'address', 'contact', 'chat_resp_time',
            'shipping_on_time', 'authentic_rating', 'days_return', 'warranty_period', 'category',
            'total_products', 'total_orders', 'total_revenue', 'date'
        ]
    
    def get_total_products(self, obj):
        try:
            return obj.product_set.count()
        except Exception:
            return 0
    
    def get_total_orders(self, obj):
        try:
            return CartOrderItems.objects.filter(vendor_id=obj.vid).count()
        except Exception:
            return 0
    
    def get_total_revenue(self, obj):
        try:
            total = CartOrderItems.objects.filter(vendor_id=obj.vid).aggregate(
                total=Sum('total')
            )['total'] or 0
            return total
        except Exception:
            return 0

class VendorDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    products = serializers.SerializerMethodField()
    recent_orders = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = '__all__'
    
    def get_products(self, obj):
        try:
            products = obj.product_set.all()[:10]
            return SimpleProductSerializer(products, many=True).data
        except Exception:
            return []
    
    def get_recent_orders(self, obj):
        try:
            orders = CartOrderItems.objects.filter(vendor_id=obj.vid).order_by('-order_date')[:10]
            return CartOrderItemSerializer(orders, many=True).data
        except Exception:
            return []

class CartOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='item', read_only=True)
    vendor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CartOrderItems
        fields = [
            'id', 'unique_id', 'order', 'user', 'vendor', 'vendor_name', 'vendor_id',
            'invoice_no', 'product_status', 'vendor_delivery_method', 'product_name',
            'image', 'product_color', 'product_size', 'qty', 'price', 'total',
            'order_date', 'vendor_seen'
        ]
    
    def get_vendor_name(self, obj):
        return obj.vendor

class CartOrderSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    items = CartOrderItemSerializer(many=True, read_only=True, source='cartorderitems_set')
    items_count = serializers.SerializerMethodField()
    total_amount = serializers.DecimalField(source='price', max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartOrder
        fields = [
            'oid', 'tracking_id', 'user', 'user_email', 'user_name', 'first_name', 'last_name',
            'company_name', 'address', 'apartment_floor', 'city', 'postal', 'phone_number',
            'email_address', 'order_note', 'payment_method', 'price', 'total_amount', 'paid_status',
            'order_date', 'product_status', 'delivery_method', 'coupon_used', 'session_token',
            'items', 'items_count'
        ]
    
    def get_user_name(self, obj):
        try:
            return f"{obj.first_name} {obj.last_name}"
        except Exception:
            return "Unknown User"
    
    def get_items_count(self, obj):
        try:
            return obj.cartorderitems_set.count()
        except Exception:
            return 0

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            'id', 'user', 'first_name', 'last_name', 'phone', 'address', 'country',
            'city', 'company', 'apartment', 'state', 'postal', 'status', 'delete'
        ]

class CartSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.title', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=12, decimal_places=2, read_only=True)
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = [
            'id', 'user', 'product', 'product_name', 'product_image', 'product_price',
            'product_color', 'product_size', 'qty', 'total_price', 'date'
        ]
    
    def get_total_price(self, obj):
        try:
            if hasattr(obj, 'total_price') and callable(getattr(obj, 'total_price')):
                return obj.total_price()
            if obj.product and hasattr(obj.product, 'price') and obj.qty:
                return float(obj.product.price) * float(obj.qty)
            return 0.00
        except Exception:
            return 0.00

class WishlistSerializer(serializers.ModelSerializer):
    product_details = SimpleProductSerializer(source='product', read_only=True)
    
    class Meta:
        model = Wishlist
        fields = ['id', 'user', 'product', 'product_details', 'date']

class TransactionSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='wallet.user.email', read_only=True)
    formatted_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'wallet', 'user_name', 'user_email', 'amount', 'balance_after',
            'transaction_type', 'status', 'reference', 'description', 'created_at', 'formatted_date'
        ]
    
    def get_user_name(self, obj):
        try:
            user = obj.wallet.user
            return f"{user.first_name} {user.last_name}" if user.first_name else user.username
        except Exception:
            return "Unknown User"
    
    def get_formatted_date(self, obj):
        try:
            return obj.created_at.strftime("%d %b, %Y %I:%M %p")
        except Exception:
            return "Unknown Date"

class WalletSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    total_transactions = serializers.SerializerMethodField()
    recent_transactions = serializers.SerializerMethodField()
    
    class Meta:
        model = Wallet
        fields = [
            'id', 'user', 'user_email', 'user_name', 'balance', 'total_transactions',
            'recent_transactions', 'created_at', 'updated_at'
        ]
    
    def get_user_name(self, obj):
        try:
            user = obj.user
            return f"{user.first_name} {user.last_name}" if user.first_name else user.username
        except Exception:
            return "Unknown User"
    
    def get_total_transactions(self, obj):
        try:
            return obj.transaction_set.count()
        except Exception:
            return 0
    
    def get_recent_transactions(self, obj):
        try:
            transactions = obj.transaction_set.all().order_by('-created_at')[:5]
            return TransactionSerializer(transactions, many=True).data
        except Exception:
            return []

class CouponSerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()
    used_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Coupon
        fields = [
            "id",
            "coupon_code",
            "discount_type",
            "discount",
            "active",
            "usage_limit",
            "usage_count",
            "minimum_order",
            "expiry_date",
            "products_count",
            "used_count",
        ]
    
    def get_products_count(self, obj):
        try:
            return obj.product.count()
        except Exception:
            return 0
    
    def get_used_count(self, obj):
        try:
            return obj.couponemail_set.count()
        except Exception:
            return 0

class CouponDetailSerializer(serializers.ModelSerializer):
    products = serializers.SerializerMethodField()
    used_by = serializers.SerializerMethodField()
    
    class Meta:
        model = Coupon
        fields = [
            "id",
            "coupon_code",
            "discount_type",
            "discount",
            "active",
            "usage_limit",
            "usage_count",
            "minimum_order",
            "expiry_date",
            "products",
            "used_by",
        ]
     
    def get_products(self, obj):
        try:
            products = obj.product.all()
            return SimpleProductSerializer(products, many=True).data
        except Exception:
            return []
    
    def get_used_by(self, obj):
        try:
            return list(obj.couponemail_set.values_list('user_email', flat=True))
        except Exception:
            return []

class CouponEmailSerializer(serializers.ModelSerializer):
    coupon_code = serializers.CharField(source='coupon.coupon_code', read_only=True)
    
    class Meta:
        model = CouponEmail
        fields = ['id', 'coupon', 'coupon_code', 'user_email']

class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    product_name = serializers.CharField(source='product.title', read_only=True)
    formatted_date = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductReview
        fields = [
            'id', 'user', 'user_name', 'user_email', 'product', 'product_name',
            'review', 'rating', 'formatted_date'
        ]
    
    def get_user_name(self, obj):
        try:
            if obj.user:
                return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
            return "Anonymous"
        except Exception:
            return "Anonymous"
    
    def get_formatted_date(self, obj):
        try:
            return obj.date.strftime("%d %b, %Y")
        except Exception:
            return "Unknown Date"

# ========== CONTENT MANAGEMENT SERIALIZERS ==========
class SliderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slider
        fields = ['id', 'title', 'update', 'discount_info', 'action', 'action_button', 'image', 'icon', 'date']

class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ['id', 'review', 'image', 'name']

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name', 'role', 'image', 'twitter', 'instagram', 'linkedin', 'x']

class AdvertisementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Advertisement
        fields = ['id', 'title', 'info', 'action_button', 'action']

class BackgroundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Background
        fields = ['id', 'title', 'image', 'date']

class AboutSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutSite
        fields = ['id', 'title', 'maintenance', 'description', 'phone_number', 'email', 'image', 'date']

class CurrencySwitchSerializer(serializers.ModelSerializer):
    class Meta:
        model = CurrencySwitch
        fields = ['id', 'currency_sign', 'currency_name', 'rate']

# ========== OTHER MODEL SERIALIZERS ==========
class SearchHistorySerializer(serializers.ModelSerializer):
    formatted_date = serializers.SerializerMethodField()
    
    class Meta:
        model = SearchHistory
        fields = ['id', 'user', 'search_text', 'date', 'formatted_date']
    
    def get_formatted_date(self, obj):
        try:
            return obj.date.strftime("%d %b, %Y %I:%M %p")
        except Exception:
            return "Unknown Date"

class CompareProductSerializer(serializers.ModelSerializer):
    product_details = SimpleProductSerializer(source='product', read_only=True)
    
    class Meta:
        model = CompareProduct
        fields = ['id', 'user', 'product', 'product_details']

class ContactFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactForm
        fields = ['id', 'name', 'email', 'subject', 'message']

class NewsLetterSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsLetter
        fields = ['id', 'email', 'date']

class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = ['id', 'name', 'subject', 'body', 'is_active', 'created_at', 'updated_at']

class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = ['id', 'name']

class LgasSerializer(serializers.ModelSerializer):
    state_name = serializers.CharField(source='state.name', read_only=True)
    
    class Meta:
        model = Lgas
        fields = ['id', 'name', 'state', 'state_name']

class WardSerializer(serializers.ModelSerializer):
    lga_name = serializers.CharField(source='lga.name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True)
    
    class Meta:
        model = Ward
        fields = ['id', 'name', 'latitude', 'longitude', 'lga', 'lga_name', 'state', 'state_name']

class ChatMessageSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    formatted_timestamp = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'vendor', 'vendor_name', 'message', 'sender_type', 'is_read', 'timestamp', 'formatted_timestamp']
    
    def get_formatted_timestamp(self, obj):
        try:
            return obj.timestamp.strftime("%d %b, %Y %I:%M %p")
        except Exception:
            return "Unknown Date"

class SaveCustomerCartSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaveCustomerCart
        fields = ['id', 'user', 'items']

# ========== DASHBOARD SERIALIZERS ==========
class DashboardStatsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_vendors = serializers.IntegerField()
    total_products = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_orders = serializers.IntegerField()
    pending_vendors = serializers.IntegerField()
    new_customers_today = serializers.IntegerField()
    new_orders_today = serializers.IntegerField()
    revenue_today = serializers.DecimalField(max_digits=12, decimal_places=2)
    revenue_30_days = serializers.DecimalField(max_digits=12, decimal_places=2)

class SalesAnalyticsSerializer(serializers.Serializer):
    date = serializers.DateField()
    total_sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    order_count = serializers.IntegerField()
    average_order_value = serializers.DecimalField(max_digits=12, decimal_places=2)
