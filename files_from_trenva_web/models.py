from django.db import models
from shortuuid.django_fields import ShortUUIDField
from django.utils.html import mark_safe
from userauths.models import User
from taggit.managers import TaggableManager
from ckeditor_uploader.fields import RichTextUploadingField
from datetime import timedelta, datetime
from django.db.models import Avg
from django.utils import timezone

STATUS_CHOICE = (
    ("Canceled", "Canceled"),
    ("Placed", "Placed"),
    ("Paid", "Paid"),
    ("Processing", "Processing"),
    ("Confirmed", "Confirmed"),
    ("Shipped", "Shipped"),
    ("Delivered", "Delivered"),
    ("Refunded", "Refunded"),
)

VENDOR_STATUS_CHOICE = (
    ("Canceled", "Canceled"),
    ("Placed", "Placed"),
    ("Processing", "Processing"),
    ("Shipped", "Shipped"),
    ("Delivered", "Delivered"),
)

DELIVERY_CHOICE = (
    ("pickup", "Pickup"),
    ("door_delivery", "Door Delivery"),
)

VENDOR_DELIVERY_CHOICE = (
    ("Trenva", "Trenva Official Dispatch Rider"),
    ("Own", "My Dispatch Rider"),
)

STATUS = (
    ("draft", "Draft"),
    ("disabled", "Disabled"),
    ("rejected", "Rejected"),
    ("in_review", "In Review"),
    ("published", "Published"),
)

RATING = (
    (1, "ðŸŒŸ"),
    (2, "ðŸŒŸðŸŒŸ"),
    (3, "ðŸŒŸðŸŒŸðŸŒŸ"),
    (4, "ðŸŒŸðŸŒŸðŸŒŸðŸŒŸ"),
    (5, "ðŸŒŸðŸŒŸðŸŒŸðŸŒŸðŸŒŸ"),
)

ADDRESS_STATUS = (
    ("Yes", "Yes"),
    ("No", "No"),
)

def user_directory_path(instance, filename):
    return 'user_{0}/{1}'.format(instance.user.id, filename)

class Category(models.Model):
    cid = ShortUUIDField(unique=True, length=10, max_length=20, prefix="cat", alphabet="abcdefgTrenva")
    title = models.CharField(max_length=100)
    image = models.ImageField(upload_to="category")
    date = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        verbose_name_plural = "Categories"

    def category_image(self):
        return mark_safe('<img src="%s" width="50" height="50" >' % (self.image.url))
    
    def __str__(self):
        return self.title
    
class SubCategory(models.Model):
    scid = ShortUUIDField(unique=True, length=10, max_length=20, prefix="sub-cat", alphabet="abcdefgTrenva")
    title = models.CharField(max_length=100)
    image = models.ImageField(upload_to="category")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="sub_category")

    class Meta:
        verbose_name_plural = "Sub Categories"

    def sub_category_image(self):
        return mark_safe('<img src="%s" width="50" height="50" >' % (self.image.url))
    
    def __str__(self):
        return self.title

class LevelTwoCategory(models.Model):
    l2cid = ShortUUIDField(unique=True, length=10, max_length=20, prefix="lv2-cat", alphabet="abcdefgTrenva")
    title = models.CharField(max_length=100)
    image = models.ImageField(upload_to="category")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="level_two_category")
    subcategory = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, related_name="sublevel_two_category")

    class Meta:
        verbose_name_plural = "Level Two Categories"

    def lv2_category_image(self):
        return mark_safe('<img src="%s" width="50" height="50" >' % (self.image.url))
    
    def __str__(self):
        return self.title
    
class Tags(models.Model):
    pass

class CurrencySwitch(models.Model):
    currency_sign = models.CharField(max_length=50, help_text="Kindly Enter the Currency Sign")
    currency_name = models.CharField(max_length=100, help_text="Kindly Enter the Currency Name")
    rate = models.CharField(max_length=50, help_text="Rate per $")

    class Meta:
        verbose_name_plural = "Currency Switch"

    def __str__(self):
        return self.currency_name

class Brand(models.Model):
    brand = ShortUUIDField(unique=True, length=10, max_length=20, prefix="brand", alphabet="abcd1234")
    title = models.CharField(max_length=100)
    description = models.CharField(max_length=100, default="Official Store")
    image = models.ImageField(upload_to="brand")

    class Meta:
        verbose_name_plural = "Brands"

    def brand_image(self):
        return mark_safe('<img src="%s" width="50" height="50" >' % (self.image.url))
    
    def __str__(self):
        return self.title
        

    
from django.db import models
from shortuuid.django_fields import ShortUUIDField
from django.utils.safestring import mark_safe
from django.utils.text import slugify
from django.conf import settings
from django.db.models import Sum, F

class Vendor(models.Model):
    
    CATEGORY_CHOICES = (
        ('electronics', 'Electronics'),
        ('computing', 'Computing'),
        ('phones_tablets', 'Phones & Tablets'),
        ('fashion', 'Fashion'),
        ('health_beauty', 'Health & Beauty'),
        ('home_kitchen', 'Home, Kitchen & Appliances'),
        ('baby_products', 'Baby Products'),
        ('sporting_items', 'Sporting Items'),
        ('gaming', 'Gaming'),
        ('hardcover_books', 'Hardcover Books'),
        
    )
    
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, null=True, blank=True)
    vid = ShortUUIDField(unique=True, length=10, max_length=20, prefix="ven", alphabet="abcdefgTrenva")
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to="user_directory_path", blank=True, null=True)  # Fixed
    verified = models.BooleanField(default=False)
    description = models.TextField(null=True, blank=True)
    rejection_count = models.IntegerField(default=0)
    last_rejection_date = models.DateTimeField(null=True, blank=True)
    
    APPROVAL_STATUS = (
        ('incomplete', 'Incomplete'),
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('needs_revision', 'Needs Revision'),
    )
    
    approval_status = models.CharField(
        max_length=20, 
        choices=APPROVAL_STATUS, 
        default='pending'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='approved_vendors'
    )
    
    # Location field - make it NOT blankable
    LOCATION_CHOICES = (
        ('', 'Select your location in Lagos'),  # Empty default
        ('lagos_island', 'Lagos Island'),
        ('lagos_mainland', 'Lagos Mainland'),
    )
    
    location = models.CharField(
        max_length=20,
        choices=LOCATION_CHOICES,
        default='',
        null=False,  # Changed from null=True to null=False
        blank=False,  # Changed from blank=True to blank=False
        help_text="Location in Lagos"
    )
    
    home_address = models.TextField(
        max_length=500,
        null=True,
        blank=True,
        help_text="Vendor's home address"
    )

   
    store_name = models.CharField(max_length=255, null=True, blank=True)
    business_name = models.CharField(max_length=255, null=True, blank=True)
    business_description = models.TextField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    business_registered = models.BooleanField(default=False)
    registration_certificate = models.FileField(upload_to="vendor/certificates/", null=True, blank=True)
    tax_id_number = models.CharField(max_length=100, null=True, blank=True)  # DAC Number
    identification_document = models.FileField(upload_to="vendor/identification/", null=True, blank=True)
    tax_number = models.CharField(max_length=100, null=True, blank=True)  # FXX Number (Optional)
    
    # NEW FIELD: Store slug for vendor store URL
    store_slug = models.SlugField(
        max_length=255, 
        unique=True, 
        null=True, 
        blank=True,
        help_text="Unique URL slug for vendor's store (e.g., 'the-cloud')"
    )
    
    # Address & Logistics
    physical_address = models.TextField(default="Address not provided")
    physical_latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    physical_longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    
    return_address = models.TextField(default="Address not provided")
    return_latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    return_longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    
    # Social Media
    facebook_url = models.URLField(null=True, blank=True)
    instagram_url = models.URLField(null=True, blank=True)
    twitter_url = models.URLField(null=True, blank=True)
    
    # Banking Details
    bank_name = models.CharField(max_length=255, null=True, blank=True)
    account_name = models.CharField(max_length=255, null=True, blank=True)
    account_number = models.CharField(max_length=20, null=True, blank=True)
    
    # Existing fields
    address = models.CharField(max_length=100, default="Lagos")
    contact = models.CharField(max_length=100, default="+2348164064452")
    chat_resp_time = models.CharField(max_length=100, default="100")
    shipping_on_time = models.CharField(max_length=100, default="100")
    authentic_rating = models.CharField(max_length=100, default="100")
    days_return = models.CharField(max_length=100, default="100")
    warranty_period = models.CharField(max_length=100, default="100")
    
    avg_delivery_time = models.CharField(
        max_length=100,
        default="3-5 days",
        help_text="Average delivery time (e.g., '3-5 days', '24 hours', '1 week')"
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    date = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    
    class Meta:
        verbose_name_plural = "Vendors"
    
    
    
    # Add these fields for payout tracking
    payout_method = models.CharField(
        max_length=20, 
        choices=[
            ('bank_transfer', 'Bank Transfer'),
            ('wallet', 'Wallet Credit'),
            ('paystack', 'Paystack Payout'),
        ], 
        default='bank_transfer',
        blank=True
    )
    
    payout_threshold = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=5000.00,
        help_text="Minimum amount before payout is allowed"
    )
    
    commission_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=10.00,
        help_text="Platform commission percentage"
    )
    
    
    
    def get_available_for_payout(self):
        """Calculate total amount available for payout"""
        from django.db.models import Sum, F
        from django.utils import timezone
        
        # Get all delivered orders that haven't been paid out
        unpaid_orders = CartOrderItems.objects.filter(
            vendor_id=self.vid,
            product_status='Delivered',
            payout__isnull=True  # Not included in any payout
        )
        
        total_sales = unpaid_orders.aggregate(
            total=Sum(F('price') * F('qty'))
        )['total'] or 0
        
        commission = (total_sales * self.commission_rate) / 100
        available_amount = total_sales - commission
        
        return {
            'total_sales': total_sales,
            'commission': commission,
            'available_amount': available_amount,
            'order_count': unpaid_orders.count()
        }
    
    def create_payout_request(self, amount, notes=""):
        """Create a new payout request"""
        from decimal import Decimal
        
        available = self.get_available_for_payout()
        
        if amount > available['available_amount']:
            raise ValueError(f"Requested amount exceeds available balance")
        
        if amount < self.payout_threshold:
            raise ValueError(f"Minimum payout amount is ₦{self.payout_threshold}")
        
        # Calculate fee (2% or minimum 100)
        fee = max(amount * Decimal('0.02'), Decimal('100'))
        net_amount = amount - fee
        
        # Get unpaid orders to include
        unpaid_orders = CartOrderItems.objects.filter(
            vendor_id=self.vid,
            product_status='Delivered',
            payout__isnull=True
        ).order_by('order_date')[:100]  # Limit to 100 orders
        
        # Create payout
        payout = VendorPayout.objects.create(
            vendor=self,
            amount=amount,
            fee=fee,
            net_amount=net_amount,
            payout_method=self.payout_method,
            vendor_notes=notes,
            period_start=timezone.now().date() - timezone.timedelta(days=30),  # Last 30 days
            period_end=timezone.now().date(),
            requested_by=self.user
        )
        
        # Add orders to payout
        total_included = Decimal('0')
        for order_item in unpaid_orders:
            order_total = order_item.price * order_item.qty
            commission_amount = (order_total * self.commission_rate) / 100
            vendor_amount = order_total - commission_amount
            
            # Stop if we've included enough orders
            if total_included + vendor_amount > amount:
                break
            
            PayoutOrder.objects.create(
                payout=payout,
                order_item=order_item,
                order_amount=order_total,
                commission_rate=self.commission_rate,
                commission_amount=commission_amount,
                vendor_amount=vendor_amount
            )
            
            total_included += vendor_amount
        
        return payout
    
    def get_payout_history(self):
        """Get all payouts for this vendor"""
        return self.payouts.all().order_by('-requested_at')
    
    def get_total_earnings(self):
        """Get total earnings (all time)"""
        from django.db.models import Sum
        total = self.payouts.filter(status='completed').aggregate(
            total=Sum('net_amount')
        )['total'] or 0
        return total
    
    def get_pending_payouts(self):
        """Get pending payout requests"""
        return self.payouts.filter(status__in=['pending', 'approved', 'processing'])

    def save(self, *args, **kwargs):
        # Generate store slug if not exists
        if not self.store_slug and self.business_name:
            # Create base slug from business name
            base_slug = slugify(self.business_name)
            slug = base_slug
            counter = 1
            
            # Ensure uniqueness
            while Vendor.objects.filter(store_slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.store_slug = slug
        elif not self.store_slug and self.store_name:
            # Fallback to store_name if business_name is empty
            base_slug = slugify(self.store_name)
            slug = base_slug
            counter = 1
            
            while Vendor.objects.filter(store_slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.store_slug = slug
            
        super().save(*args, **kwargs)
    
    def get_store_url(self):
        """Return the full store URL path"""
        if self.store_slug:
            # Format: /ng/{store_slug}/
            return f"/ng/{self.store_slug}/"
        return None
    
    def get_full_store_url(self):
        """Return the complete URL with domain"""
        from django.contrib.sites.models import Site
        
        store_url = self.get_store_url()
        if store_url:
            try:
                # Get the current site domain
                current_site = Site.objects.get_current()
                return f"https://{current_site.domain}{store_url}"
            except:
                # Fallback if Site is not configured
                return f"https://trenva.store{store_url}"
        return None

    def vendor_image(self):
        if self.image and hasattr(self.image, 'url'):
            try:
                return mark_safe(f'<img src="{self.image.url}" width="50" height="50" />')
            except:
                return "No Image"
        return "No Image"
    
    def get_follower_count(self):
        """Returns the total number of followers for this vendor"""
        return self.followers.count()
    
    def is_followed_by(self, user):
        """Check if a specific user follows this vendor"""
        if user.is_authenticated:
            return self.followers.filter(user=user).exists()
        return False
        
    def get_total_sales(self):
        """Get total number of delivered orders for this vendor"""
        from core.models import CartOrderItems  # Adjust import path as needed
        
        total_sales = CartOrderItems.objects.filter(
            vendor=self,
            product_status='Delivered'
        ).count()
        
        return total_sales
    
    def get_total_revenue(self):
        """Get total revenue from delivered orders"""
        from core.models import CartOrderItems
        from django.db.models import Sum, F
        
        revenue = CartOrderItems.objects.filter(
            vendor=self,
            product_status='Delivered'
        ).aggregate(
            total=Sum(F('price') * F('qty'))
        )['total'] or Decimal('0.00')
        
        return revenue
    
    def get_average_rating(self):
        """Get average rating across all vendor products"""
        from core.models import ProductReview  # Adjust import path as needed
        
        avg_rating = ProductReview.objects.filter(
            product__vendor=self
        ).aggregate(
            avg=Avg('rating')
        )['avg']
        
        # Return formatted rating or 0 if no reviews
        if avg_rating:
            return round(avg_rating, 1)
        return 0
    
    def get_total_reviews(self):
        """Get total number of reviews across all vendor products"""
        from core.models import ProductReview
        
        return ProductReview.objects.filter(
            product__vendor=self
        ).count()
    
    def get_rating_distribution(self):
        """Get count of each star rating (1-5 stars)"""
        from core.models import ProductReview
        from django.db.models import Sum, Count
        
        distribution = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        }
        
        reviews = ProductReview.objects.filter(
            product__vendor=self
        ).values('rating').annotate(count=Count('rating'))
        
        for review in reviews:
            distribution[review['rating']] = review['count']
        
        return distribution
    
    def get_response_rate(self):
        """Calculate percentage of reviews that have vendor replies"""
        from core.models import ProductReview
        
        total_reviews = ProductReview.objects.filter(
            product__vendor=self
        ).count()
        
        if total_reviews == 0:
            return 0
        
        replied_reviews = ProductReview.objects.filter(
            product__vendor=self,
            vendor_reply__isnull=False
        ).exclude(vendor_reply='').count()
        
        response_rate = (replied_reviews / total_reviews) * 100
        return round(response_rate)
    
    def get_positive_rating_percentage(self):
        """Get percentage of 4 and 5 star ratings"""
        from core.models import ProductReview
        
        total_reviews = ProductReview.objects.filter(
            product__vendor=self
        ).count()
        
        if total_reviews == 0:
            return 0
        
        positive_reviews = ProductReview.objects.filter(
            product__vendor=self,
            rating__gte=4
        ).count()
        
        percentage = (positive_reviews / total_reviews) * 100
        return round(percentage)

    def __str__(self):
        return self.name
        
    
   
class VendorFollow(models.Model):
    """Model to track vendor followers"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='following_vendors'
    )
    vendor = models.ForeignKey(
        'Vendor',  # Replace with your actual Vendor model path if different
        on_delete=models.CASCADE,
        related_name='followers' 
    )
    followed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'vendor')  # Prevent duplicate follows
        verbose_name = 'Vendor Follow'
        verbose_name_plural = 'Vendor Follows'
        ordering = ['-followed_at']
    
    def __str__(self):
        return f"{self.user.username} follows {self.vendor.name}"
    

class Background(models.Model):
        title = models.CharField(max_length=50, null=True)
        image = models.ImageField(upload_to="bg")
        date = models.DateTimeField(auto_now_add=True)

        class Meta:
            verbose_name_plural = "Background Images"

        def background_image(self):
            return mark_safe('<img src="%s" width="50" height="50" >' % (self.image.url))
        
        def __str__(self):
            return self.title

class Slider(models.Model):
        title = models.CharField(max_length=50, null=True)
        update = models.CharField(max_length=500, null=True)
        discount_info = models.CharField(max_length=500, null=True)
        # excerpt = models.CharField(max_length=500, null=True, blank=True)
        # price = models.CharField(max_length=500, null=True, blank=True)
        action = models.CharField(max_length=500, null=True)
        action_button = models.CharField(max_length=50, null=True, default="SHOP NOW")
        image = models.ImageField(upload_to="slider")
        icon = models.ImageField(upload_to="slider", null=True, blank=True)
        date = models.DateTimeField(auto_now_add=True)

        class Meta:
            verbose_name_plural = "Sliders"

        def slider_image(self):
            return mark_safe('<img src="%s" width="50" height="50" >' % (self.image.url))
        
        def __str__(self):
            return self.title

class AboutSite(models.Model):
        title = models.CharField(max_length=50, null=True)
        maintenance = models.BooleanField(default=False)
        description = models.TextField(default="Trenva Marketplace")
        phone_number = models.CharField(max_length=50, null=True)
        email = models.EmailField(null=True)
        image = models.ImageField(upload_to="asset")
        date = models.DateTimeField(auto_now_add=True)

        class Meta:
            verbose_name_plural = "About Site"

        def aboutsite_image(self):
            return mark_safe('<img src="%s" width="50" height="50" >' % (self.image.url))
        
        def __str__(self):
            return self.title
        
class ProductColor(models.Model):
    color_name = models.CharField(max_length=100)
    color_name_in_html = models.CharField(max_length=100, null=True)
    stock = models.IntegerField(default=0)  # ADD THIS LINE

    class Meta:
        verbose_name_plural = "Product Color"
    
    def __str__(self):
        return self.color_name
        
class ProductSize(models.Model):
        size = models.CharField(max_length=100)
        stock = models.IntegerField(default=0)  # ADD THIS

        class Meta:
            verbose_name_plural = "Product Size"
        
        def __str__(self):
            return self.size
    







from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg
from django.utils.safestring import mark_safe
import shortuuid
from shortuuid.django_fields import ShortUUIDField
from ckeditor.fields import RichTextField
from ckeditor_uploader.fields import RichTextUploadingField
from django_ckeditor_5.fields import CKEditor5Field
from taggit.managers import TaggableManager

class Product(models.Model):
    STATUS = (
        ("draft", "Draft"),
        ("disabled", "Disabled"),
        ("in_review", "In Review"),
        ("published", "Published"),
        ("pending_edit_review", "Pending Edit Review"),
    )
    
    # Simplified weight categories - just the size descriptions
    WEIGHT_CATEGORIES = (
        ('small', mark_safe('Small items <br><span class="text-muted small">Clothes, shoes, laptops, PS5, accessories, small electronics</span>')),
        ('large', mark_safe('Large items <br><span class="text-muted small">TVs, fridges, furniture, big appliances</span>')),
    )
    
    pid = ShortUUIDField(unique=True, length=10, max_length=20, alphabet="abcdefgTrenva")

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="category")
    subcategory = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="subcategory")
    leveltwocategory = models.ForeignKey(LevelTwoCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="leveltwocategory")
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name="brands")
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, related_name="vendor")

    title = models.CharField(max_length=100, default="Keyboard Light")
    image = models.ImageField(upload_to="user_directory_path", default="product.jpg")
    description = RichTextUploadingField(null=True, blank=True, default="Test Product")
    
    vendor_price = models.DecimalField(max_digits=99999999999999, decimal_places=2, default="1.99")
    price = models.DecimalField(max_digits=99999999999999, decimal_places=2, default="1.99")
    old_price = models.DecimalField(max_digits=99999999999999, blank=True, null=True, decimal_places=2, default="2.99")
    promo = models.BooleanField(default=False)

    specifications = RichTextUploadingField(null=True, blank=True)
    
    tag = TaggableManager(blank=True)

    product_status = models.CharField(choices=STATUS, max_length=30, default="in_review")

    color = models.ManyToManyField(ProductColor, blank=True)
    size = models.ManyToManyField(ProductSize, blank=True)

    status = models.BooleanField(default=True)
    in_stock = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)
    digital = models.BooleanField(default=False)
    
    # Stock Management - AUTOMATIC ONLY (stock_managed field REMOVED)
    stock_count = models.PositiveIntegerField(default=0, editable=False, help_text="Current quantity available (automatically managed)")
    
    days = models.IntegerField(default=0, null=True)
    hours = models.IntegerField(default=0, null=True)
    minutes = models.IntegerField(default=0, null=True)
    seconds = models.IntegerField(default=0, null=True)
    countdown_start = models.DateTimeField(auto_now_add=True, null=True)

    sku = ShortUUIDField(unique=True, length=4, max_length=10, prefix="sku", alphabet="1234567890")

    date = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(null=True, blank=True)
   
    is_edited_after_publish = models.BooleanField(default=False, help_text="True if product was edited after being published")
    last_published_data = models.JSONField(null=True, blank=True, help_text="Stores snapshot of last published version")
    edit_submitted_at = models.DateTimeField(null=True, blank=True, help_text="When vendor submitted edited version for review")
    edit_reviewed_at = models.DateTimeField(null=True, blank=True, help_text="When admin reviewed the edited version")
    edit_reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_product_edits', help_text="Admin who reviewed the edit")
    previous_status = models.CharField(max_length=20, null=True, blank=True, help_text="Status before edit submission")
    
    # Stock alert tracking
    last_stock_alert = models.DateTimeField(null=True, blank=True, help_text="Last time low stock alert was sent")
    last_critical_alert = models.DateTimeField(null=True, blank=True, help_text="Last time critical stock alert was sent")
    
    # Simplified size category field - weight fields removed as requested
    size_category = models.CharField(
        max_length=20,
        choices=WEIGHT_CATEGORIES,
        default='small',
        help_text="Select the size category for shipping"
    )
    
    # Admin approval tracking
    requires_approval = models.BooleanField(default=False)
    approval_status = models.CharField(
        max_length=20,
        choices=[
            ('approved', 'Approved'),
            ('pending', 'Pending Approval'),
            ('rejected', 'Rejected'),
        ],
        default='approved'
    )
    last_edited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='edited_products')
    last_edited_at = models.DateTimeField(null=True)
    approval_notes = models.TextField(blank=True)
    
    # Make product visible only if approved
    def is_visible_in_store(self):
        return (self.product_status == 'published' and 
                self.approval_status == 'approved' and 
                self.in_stock)
    
    class Meta:
        verbose_name_plural = "Products"

    def product_image(self):
        return mark_safe('<img src="%s" width="50" height="50" >' % (self.image.url))
    
    def __str__(self):
        return self.title
    
    def get_percentage(self):
        if self.old_price:
            new_price = ((self.old_price - self.price) / self.old_price) * 100
            return new_price
        else:
            return 0

    def average_rating(self):
        avg_rating = self.reviews.aggregate(Avg('rating'))['rating__avg']
        return avg_rating if avg_rating is not None else 0
    
    def get_size_category_description(self):
        """Get the full description of the size category"""
        descriptions = {
            'small': 'Small items: Clothes, shoes, laptops, PS5, accessories, small electronics',
            'medium': 'Medium items: Multiple small items combined, medium-sized packages',
            'large': 'Large items: TVs, fridges, furniture, big appliances',
        }
        return descriptions.get(self.size_category, '')
    
    def save(self, *args, **kwargs):
        """Override save to automatically update in_stock status"""
        
        # Auto-update in_stock based on stock_count (ALWAYS - stock_managed removed)
        self.in_stock = self.stock_count > 0
        
        # Store old stock count before saving for comparison
        if self.pk:
            try:
                old_product = Product.objects.get(pk=self.pk)
                old_stock = old_product.stock_count
                old_in_stock = old_product.in_stock
            except Product.DoesNotExist:
                old_stock = None
                old_in_stock = None
        else:
            old_stock = None
            old_in_stock = None
        
        super().save(*args, **kwargs)
        
        # Import here to avoid circular imports
        from core.views import send_low_stock_alert, send_stock_critical_alert
        
        # Check stock levels and send alerts if stock decreased or became low (ALWAYS - stock_managed removed)
        # Check if we should send low stock alert
        if self.stock_count < 5 and self.stock_count > 0:
            one_day_ago = timezone.now() - timedelta(days=1)
            should_alert = (
                self.last_stock_alert is None or 
                self.last_stock_alert < one_day_ago
            )
            
            if should_alert:
                send_low_stock_alert(self)
                self.last_stock_alert = timezone.now()
                # Save again to update alert timestamp
                super().save(update_fields=['last_stock_alert'])
            
            # Send critical alert if stock is very low
            if self.stock_count <= 3:
                twelve_hours_ago = timezone.now() - timedelta(hours=12)
                should_critical_alert = (
                    self.last_critical_alert is None or 
                    self.last_critical_alert < twelve_hours_ago
                )
                
                if should_critical_alert:
                    send_stock_critical_alert(self)
                    self.last_critical_alert = timezone.now()
                    super().save(update_fields=['last_critical_alert'])
    
    def reduce_stock(self, quantity=1):
        """Reduce stock count when product is sold and update in_stock status"""
        if self.stock_count >= quantity:
            self.stock_count -= quantity
            # Auto-update in_stock status
            self.in_stock = self.stock_count > 0
            self.save()
            return True
        return False
    
    def increase_stock(self, quantity=1):
        """Increase stock count (for restocking/purchases)"""
        self.stock_count += quantity
        self.in_stock = True  # Always in stock when restocking
        self.save()
        return True
    
    def get_stock_status(self):
        """Get human-readable stock status"""
        if self.stock_count > 5:
            return "In Stock"
        elif self.stock_count > 0:
            return f"Only {self.stock_count} left"
        else:
            return "Out of Stock"
    
    def get_stock_status_class(self):
        """Get CSS class for stock status"""
        if not self.in_stock:
            return "out-of-stock"
        elif self.stock_count <= 10:
            return "low-stock"
        else:
            return "in-stock"
    
    def can_add_to_cart(self, quantity=1):
        """Check if product can be added to cart"""
        quantity = int(quantity)
        return self.in_stock and self.stock_count >= quantity
    
    def get_available_quantity(self):
        """Get maximum available quantity for purchase"""
        return self.stock_count
    
    def check_stock_and_alert(self):
        """
        Manually check stock level and send alerts if needed
        Can be called from views or scheduled tasks
        """
        from .views import send_low_stock_alert, send_stock_critical_alert
        
        # Check if we should send low stock alert
        if self.stock_count < 5 and self.stock_count > 0:
            one_day_ago = timezone.now() - timedelta(days=1)
            should_alert = (
                self.last_stock_alert is None or 
                self.last_stock_alert < one_day_ago
            )
            
            if should_alert:
                send_low_stock_alert(self)
                self.last_stock_alert = timezone.now()
                self.save(update_fields=['last_stock_alert'])
            
            # Send critical alert if stock is very low
            if self.stock_count <= 3:
                twelve_hours_ago = timezone.now() - timedelta(hours=12)
                should_critical_alert = (
                    self.last_critical_alert is None or 
                    self.last_critical_alert < twelve_hours_ago
                )
                
                if should_critical_alert:
                    send_stock_critical_alert(self)
                    self.last_critical_alert = timezone.now()
                    self.save(update_fields=['last_critical_alert'])
                    
                    

class FlashSale(models.Model):
    """Flash Sale Event Model"""
    fsid = ShortUUIDField(unique=True, length=10, max_length=20, prefix="fs", alphabet="abcdefgTrenva")
    title = models.CharField(max_length=200, help_text="Flash Sale Event Title")
    description = models.TextField(blank=True, null=True, help_text="Description of the flash sale")
    
    # Countdown Timer
    days = models.IntegerField(default=0)
    hours = models.IntegerField(default=0)
    minutes = models.IntegerField(default=0)
    seconds = models.IntegerField(default=0)
    countdown_start = models.DateTimeField(auto_now_add=True)
    
    # Status
    is_active = models.BooleanField(default=True, help_text="Whether this flash sale is currently active")
    featured = models.BooleanField(default=False, help_text="Featured flash sales appear on homepage")
    
    # Banner/Image
    banner_image = models.ImageField(upload_to="flash-sales/", blank=True, null=True, help_text="Banner image for the flash sale")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_flash_sales')
    
    class Meta:
        verbose_name_plural = "Flash Sales"
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def get_remaining_time(self):
        """Calculate remaining countdown time dynamically"""
        from datetime import timedelta
        from django.utils import timezone
        
        total_seconds = (self.days * 86400) + (self.hours * 3600) + (self.minutes * 60) + self.seconds
        end_time = self.countdown_start + timedelta(seconds=total_seconds)
        
        now = timezone.now()
        remaining_time = end_time - now
        
        if remaining_time.total_seconds() > 0:
            days, remainder = divmod(int(remaining_time.total_seconds()), 86400)
            hours, remainder = divmod(remainder, 3600)
            minutes, seconds = divmod(remainder, 60)
            return {
                'days': days,
                'hours': hours,
                'minutes': minutes,
                'seconds': seconds,
                'formatted': f"{days:02}:{hours:02}:{minutes:02}:{seconds:02}",
                'expired': False
            }
        else:
            # Time expired
            return {
                'days': 0,
                'hours': 0,
                'minutes': 0,
                'seconds': 0,
                'formatted': "00:00:00:00",
                'expired': True
            }
    
    def is_expired(self):
        """Check if flash sale has expired"""
        return self.get_remaining_time()['expired']
    
    def get_product_count(self):
        """Get number of products in this flash sale"""
        return self.flash_sale_products.count()


class FlashSaleProduct(models.Model):
    """Products belonging to a Flash Sale"""
    flash_sale = models.ForeignKey(FlashSale, on_delete=models.CASCADE, related_name='flash_sale_products')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='flash_sales')
    
    # Optional: Flash sale specific pricing
    flash_sale_price = models.DecimalField(
        max_digits=99999999999999, 
        decimal_places=2, 
        blank=True, 
        null=True,
        help_text="Special price for this flash sale (optional - uses product price if not set)"
    )
    
    # Metadata
    added_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        verbose_name_plural = "Flash Sale Products"
        unique_together = ('flash_sale', 'product')  # A product can only be in a flash sale once
        ordering = ['-added_at']
    
    def __str__(self):
        return f"{self.product.title} in {self.flash_sale.title}"
    
    def get_display_price(self):
        """Get the price to display (flash sale price or regular price)"""
        if self.flash_sale_price:
            return self.flash_sale_price
        return self.product.price
    
class DeletedProduct(models.Model):
    """Track products deleted/disabled by vendors"""
    
    DELETION_REASONS = (
        ('vendor_request', 'Vendor Requested Deletion'),
        ('out_of_stock', 'Permanently Out of Stock'),
        ('discontinued', 'Product Discontinued'),
        ('policy_violation', 'Policy Violation'),
        ('poor_performance', 'Poor Sales Performance'),
        ('other', 'Other Reason'),
    )
    
    # Product Information (snapshot before deletion)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='deletion_records')
    product_pid = models.CharField(max_length=50, help_text="Product PID for reference")
    product_title = models.CharField(max_length=200)
    product_sku = models.CharField(max_length=50)
    product_image = models.ImageField(upload_to="deleted-products/", null=True, blank=True)
    product_price = models.DecimalField(max_digits=12, decimal_places=2)
    product_vendor_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Vendor Information
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='deleted_products')
    vendor_name = models.CharField(max_length=200)
    
    # Deletion Details
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='deleted_products')
    deleted_at = models.DateTimeField(auto_now_add=True)
    deletion_reason = models.CharField(max_length=50, choices=DELETION_REASONS, default='vendor_request')
    deletion_notes = models.TextField(blank=True, null=True, help_text="Additional notes about deletion")
    
    # Sales Statistics (before deletion)
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_orders = models.IntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.IntegerField(default=0)
    
    # Active Orders at Time of Deletion
    had_active_orders = models.BooleanField(default=False)
    active_orders_count = models.IntegerField(default=0)
    
    # Product Status Before Deletion
    was_published = models.BooleanField(default=False)
    was_featured = models.BooleanField(default=False)
    stock_count_at_deletion = models.IntegerField(default=0)
    
    # Admin Actions
    reviewed_by_admin = models.BooleanField(default=False)
    admin_reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True, null=True)
    
    # Restoration
    can_restore = models.BooleanField(default=True, help_text="Whether this product can be restored")
    restored = models.BooleanField(default=False)
    restored_at = models.DateTimeField(null=True, blank=True)
    restored_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='restored_products')
    
    class Meta:
        verbose_name_plural = "Deleted Products"
        ordering = ['-deleted_at']
    
    def __str__(self):
        return f"{self.product_title} - Deleted by {self.vendor_name}"
    
    @classmethod
    def create_deletion_record(cls, product, deleted_by, reason='vendor_request', notes=''):
        """Create a deletion record when a product is deleted"""
        from django.db.models import Sum, Count, Avg
        
        # Calculate sales statistics
        order_items = CartOrderItems.objects.filter(item=product.title)
        total_sales = order_items.aggregate(total=Sum('total'))['total'] or 0
        total_orders = order_items.count()
        
        # Get review statistics
        reviews = ProductReview.objects.filter(product=product)
        avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or 0
        total_reviews = reviews.count()
        
        # Check for active orders
        active_orders = CartOrderItems.objects.filter(
            item=product.title,
            product_status__in=['Placed', 'Confirmed', 'Processing', 'Shipped']
        )
        has_active_orders = active_orders.exists()
        active_count = active_orders.count()
        
        # Copy product image if exists
        image_copy = None
        if product.image:
            try:
                from django.core.files.base import ContentFile
                from django.core.files.storage import default_storage
                import os
                
                # Read the image file
                if hasattr(product.image, 'read'):
                    # Reset file pointer to beginning
                    product.image.seek(0)
                    image_content = product.image.read()
                    product.image.seek(0)  # Reset again for future use
                    
                    # Create new file
                    image_copy = ContentFile(image_content)
                    # Generate unique filename
                    ext = os.path.splitext(product.image.name)[1]
                    image_copy.name = f"deleted_{product.pid}{ext}"
            except Exception as e:
                print(f"Error copying image: {e}")
                image_copy = None
        
        # Create deletion record with product reference
        deletion_record = cls.objects.create(
            product=product,  # Keep the reference to the product
            product_pid=product.pid,
            product_title=product.title,
            product_sku=product.sku,
            product_image=image_copy,
            product_price=product.price,
            product_vendor_price=product.vendor_price,
            vendor=product.vendor,
            vendor_name=product.vendor.name if product.vendor else "Unknown",
            deleted_by=deleted_by,
            deletion_reason=reason,
            deletion_notes=notes,
            total_sales=total_sales,
            total_orders=total_orders,
            average_rating=avg_rating,
            total_reviews=total_reviews,
            had_active_orders=has_active_orders,
            active_orders_count=active_count,
            was_published=(product.product_status == 'published'),
            was_featured=product.featured,
            stock_count_at_deletion=product.stock_count,
            can_restore=not has_active_orders,  # Can't restore if there were active orders
        )
        
        return deletion_record
    
    def restore_product(self, restored_by):
        """Restore a deleted product"""
        if not self.can_restore:
            raise ValueError("This product cannot be restored due to active orders at deletion time")
        
        if self.restored:
            raise ValueError("This product has already been restored")
        
        # Try to find the product by PID
        try:
            product = Product.objects.get(pid=self.product_pid)
        except Product.DoesNotExist:
            # If product was hard-deleted, we can't restore it
            raise ValueError("Original product no longer exists in database. It may have been permanently deleted.")
        
        # Re-enable the product
        product.in_stock = True
        product.stock_count = self.stock_count_at_deletion  # Restore original stock
        product.product_status = 'draft'  # Set to draft for review
        product.save()
        
        # Update the deletion record reference
        self.product = product
        
        # Mark as restored
        self.restored = True
        self.restored_at = timezone.now()
        self.restored_by = restored_by
        self.save()
        
        return product
    
    def get_time_since_deletion(self):
        """Get human-readable time since deletion"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - self.deleted_at
        
        if diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff < timedelta(days=30):
            days = diff.days
            return f"{days} day{'s' if days > 1 else ''} ago"
        elif diff < timedelta(days=365):
            months = diff.days // 30
            return f"{months} month{'s' if months > 1 else ''} ago"
        else:
            years = diff.days // 365
            return f"{years} year{'s' if years > 1 else ''} ago"
            
class ProductImages(models.Model):
    images = models.ImageField(upload_to="product-images", default="product.jpg")
    product = models.ForeignKey(Product, related_name="p_images", on_delete=models.SET_NULL, null=True)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Products Images"

class Address(models.Model):
    COUNTRY_CHOICES = [
        ("Afghanistan", "Afghanistan"),
        ("Albania", "Albania"),
        ("Algeria", "Algeria"),
        ("American Samoa", "American Samoa"),
        ("Andorra", "Andorra"),
        ("Angola", "Angola"),
        ("Anguilla", "Anguilla"),
        ("Antarctica", "Antarctica"),
        ("Antigua and Barbuda", "Antigua and Barbuda"),
        ("Argentina", "Argentina"),
        ("Armenia", "Armenia"),
        ("Aruba", "Aruba"),
        ("Australia", "Australia"),
        ("Austria", "Austria"),
        ("Azerbaijan", "Azerbaijan"),
        ("Bahamas", "Bahamas"),
        ("Bahrain", "Bahrain"),
        ("Bangladesh", "Bangladesh"),
        ("Barbados", "Barbados"),
        ("Belarus", "Belarus"),
        ("Belgium", "Belgium"),
        ("Belize", "Belize"),
        ("Benin", "Benin"),
        ("Bermuda", "Bermuda"),
        ("Bhutan", "Bhutan"),
        ("Bolivia", "Bolivia"),
        ("Bosnia and Herzegovina", "Bosnia and Herzegovina"),
        ("Botswana", "Botswana"),
        ("Brazil", "Brazil"),
        ("Brunei Darussalam", "Brunei Darussalam"),
        ("Bulgaria", "Bulgaria"),
        ("Burkina Faso", "Burkina Faso"),
        ("Burundi", "Burundi"),
        ("Cabo Verde", "Cabo Verde"),
        ("Cambodia", "Cambodia"),
        ("Cameroon", "Cameroon"),
        ("Canada", "Canada"),
        ("Central African Republic", "Central African Republic"),
        ("Chad", "Chad"),
        ("Chile", "Chile"),
        ("China", "China"),
        ("Colombia", "Colombia"),
        ("Comoros", "Comoros"),
        ("Congo", "Congo"),
        ("Congo, Democratic Republic of the", "Congo, Democratic Republic of the"),
        ("Cook Islands", "Cook Islands"),
        ("Costa Rica", "Costa Rica"),
        ("Croatia", "Croatia"),
        ("Cuba", "Cuba"),
        ("Cyprus", "Cyprus"),
        ("Czech Republic", "Czech Republic"),
        ("Denmark", "Denmark"),
        ("Djibouti", "Djibouti"),
        ("Dominica", "Dominica"),
        ("Dominican Republic", "Dominican Republic"),
        ("Ecuador", "Ecuador"),
        ("Egypt", "Egypt"),
        ("El Salvador", "El Salvador"),
        ("Equatorial Guinea", "Equatorial Guinea"),
        ("Eritrea", "Eritrea"),
        ("Estonia", "Estonia"),
        ("Eswatini", "Eswatini"),
        ("Ethiopia", "Ethiopia"),
        ("Fiji", "Fiji"),
        ("Finland", "Finland"),
        ("France", "France"),
        ("Gabon", "Gabon"),
        ("Gambia", "Gambia"),
        ("Georgia", "Georgia"),
        ("Germany", "Germany"),
        ("Ghana", "Ghana"),
        ("Greece", "Greece"),
        ("Grenada", "Grenada"),
        ("Guatemala", "Guatemala"),
        ("Guinea", "Guinea"),
        ("Guinea-Bissau", "Guinea-Bissau"),
        ("Guyana", "Guyana"),
        ("Haiti", "Haiti"),
        ("Honduras", "Honduras"),
        ("Hungary", "Hungary"),
        ("Iceland", "Iceland"),
        ("India", "India"),
        ("Indonesia", "Indonesia"),
        ("Iran", "Iran"),
        ("Iraq", "Iraq"),
        ("Ireland", "Ireland"),
        ("Israel", "Israel"),
        ("Italy", "Italy"),
        ("Jamaica", "Jamaica"),
        ("Japan", "Japan"),
        ("Jordan", "Jordan"),
        ("Kazakhstan", "Kazakhstan"),
        ("Kenya", "Kenya"),
        ("Kiribati", "Kiribati"),
        ("Korea, Democratic People's Republic of", "Korea, Democratic People's Republic of"),
        ("Korea, Republic of", "Korea, Republic of"),
        ("Kuwait", "Kuwait"),
        ("Kyrgyzstan", "Kyrgyzstan"),
        ("Lao People's Democratic Republic", "Lao People's Democratic Republic"),
        ("Latvia", "Latvia"),
        ("Lebanon", "Lebanon"),
        ("Lesotho", "Lesotho"),
        ("Liberia", "Liberia"),
        ("Libya", "Libya"),
        ("Liechtenstein", "Liechtenstein"),
        ("Lithuania", "Lithuania"),
        ("Luxembourg", "Luxembourg"),
        ("Madagascar", "Madagascar"),
        ("Malawi", "Malawi"),
        ("Malaysia", "Malaysia"),
        ("Maldives", "Maldives"),
        ("Mali", "Mali"),
        ("Malta", "Malta"),
        ("Marshall Islands", "Marshall Islands"),
        ("Mauritania", "Mauritania"),
        ("Mauritius", "Mauritius"),
        ("Mexico", "Mexico"),
        ("Micronesia", "Micronesia"),
        ("Moldova", "Moldova"),
        ("Monaco", "Monaco"),
        ("Mongolia", "Mongolia"),
        ("Montenegro", "Montenegro"),
        ("Morocco", "Morocco"),
        ("Mozambique", "Mozambique"),
        ("Myanmar", "Myanmar"),
        ("Namibia", "Namibia"),
        ("Nauru", "Nauru"),
        ("Nepal", "Nepal"),
        ("Netherlands", "Netherlands"),
        ("New Zealand", "New Zealand"),
        ("Nicaragua", "Nicaragua"),
        ("Niger", "Niger"),
        ("Nigeria", "Nigeria"),
        ("North Macedonia", "North Macedonia"),
        ("Norway", "Norway"),
        ("Oman", "Oman"),
        ("Pakistan", "Pakistan"),
        ("Palau", "Palau"),
        ("Panama", "Panama"),
        ("Papua New Guinea", "Papua New Guinea"),
        ("Paraguay", "Paraguay"),
        ("Peru", "Peru"),
        ("Philippines", "Philippines"),
        ("Poland", "Poland"),
        ("Portugal", "Portugal"),
        ("Qatar", "Qatar"),
        ("Romania", "Romania"),
        ("Russian Federation", "Russian Federation"),
        ("Rwanda", "Rwanda"),
        ("Saint Kitts and Nevis", "Saint Kitts and Nevis"),
        ("Saint Lucia", "Saint Lucia"),
        ("Saint Vincent and the Grenadines", "Saint Vincent and the Grenadines"),
        ("Samoa", "Samoa"),
        ("San Marino", "San Marino"),
        ("Sao Tome and Principe", "Sao Tome and Principe"),
        ("Saudi Arabia", "Saudi Arabia"),
        ("Senegal", "Senegal"),
        ("Serbia", "Serbia"),
        ("Seychelles", "Seychelles"),
        ("Sierra Leone", "Sierra Leone"),
        ("Singapore", "Singapore"),
        ("Slovakia", "Slovakia"),
        ("Slovenia", "Slovenia"),
        ("Solomon Islands", "Solomon Islands"),
        ("Somalia", "Somalia"),
        ("South Africa", "South Africa"),
        ("South Sudan", "South Sudan"),
        ("Spain", "Spain"),
        ("Sri Lanka", "Sri Lanka"),
        ("Sudan", "Sudan"),
        ("Suriname", "Suriname"),
        ("Sweden", "Sweden"),
        ("Switzerland", "Switzerland"),
        ("Syrian Arab Republic", "Syrian Arab Republic"),
        ("Tajikistan", "Tajikistan"),
        ("Tanzania", "Tanzania"),
        ("Thailand", "Thailand"),
        ("Timor-Leste", "Timor-Leste"),
        ("Togo", "Togo"),
        ("Tonga", "Tonga"),
        ("Trinidad and Tobago", "Trinidad and Tobago"),
        ("Tunisia", "Tunisia"),
        ("Turkey", "Turkey"),
        ("Turkmenistan", "Turkmenistan"),
        ("Tuvalu", "Tuvalu"),
        ("Uganda", "Uganda"),
        ("Ukraine", "Ukraine"),
        ("United Arab Emirates", "United Arab Emirates"),
        ("United Kingdom of Great Britain and Northern Ireland", "United Kingdom of Great Britain and Northern Ireland"),
        ("United States of America", "United States of America"),
        ("Uruguay", "Uruguay"),
        ("Uzbekistan", "Uzbekistan"),
        ("Vanuatu", "Vanuatu"),
        ("Venezuela", "Venezuela"),
        ("Viet Nam", "Viet Nam"),
        ("Yemen", "Yemen"),
        ("Zambia", "Zambia"),
        ("Zimbabwe", "Zimbabwe"),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    first_name = models.CharField(max_length=200, null=True)
    last_name = models.CharField(max_length=200, null=True)
    phone = models.CharField(max_length=20, null=True)
    address = models.CharField(max_length=100, null=True)
    country = models.CharField(choices=COUNTRY_CHOICES, max_length=60, default="Nigeria")
    city = models.CharField(max_length=100, null=True)
    company = models.CharField(max_length=200, null=True, blank=True)
    apartment = models.CharField(max_length=200, null=True, blank=True)
    state = models.CharField(max_length=100, null=True)
    postal = models.CharField(max_length=100, null=True)
    status = models.CharField(choices=ADDRESS_STATUS, null=True, max_length=5, default="No")
    delete = models.BooleanField(default=False)
    
    @property
    def state_display(self):
        if self.state:
            return self.state.replace('_', ' ').title()
        return ""

    class Meta:
        verbose_name_plural = "Address"

    def __str__(self):
        return self.address

class ReturnImage(models.Model):
    return_request = models.ForeignKey('CartOrder', on_delete=models.CASCADE, related_name='return_images')
    image = models.ImageField(upload_to='return-images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Return image for order #{self.return_request.oid}"

    class Meta:
        verbose_name_plural = "Return Images"
        
        
# class CartOrder(models.Model):
    
#     TOWN_CHOICES = [
#         ('ikorodu', 'Ikorodu'),
#     ]
    
#     # City choices - only Lagos
#     CITY_CHOICES = [
#         ('lagos', 'Lagos'),
#     ]
    
#     oid = ShortUUIDField(unique=True, length=10, null=True, prefix="order", max_length=20, alphabet="12345")
#     tracking_id = ShortUUIDField(unique=True, length=10, null=True, max_length=15, alphabet="12QW3FHJ45")
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     first_name = models.CharField(max_length=500, null=True)
#     last_name = models.CharField(max_length=500, null=True)
#     company_name = models.CharField(max_length=500, null=True)
#     # address = models.ForeignKey(Address, null=True, on_delete=models.SET_NULL)
#     address = models.TextField(null=True)
#     apartment_floor = models.CharField(max_length=500, null=True)
#     town = models.CharField(
#         max_length=50, 
#         choices=TOWN_CHOICES, 
#         default='ikorodu',
#         null=True
#     )
#     city = models.CharField(
#         max_length=50, 
#         choices=CITY_CHOICES, 
#         default='lagos',
#         null=True
#     )
#     postal = models.CharField(max_length=100, null=True)
#     phone_number = models.CharField(max_length=500, null=True)
#     email_address = models.CharField(max_length=500, null=True)
#     order_note = models.TextField(null=True)
#     payment_method = models.CharField(max_length=100, null=True)
#     price = models.DecimalField(max_digits=99999999999999, decimal_places=2, default="1.99")
#     paid_status = models.BooleanField(default=False)
#     order_date = models.DateTimeField(auto_now_add=True)
#     product_status = models.CharField(choices=STATUS_CHOICE, max_length=30, default="Placed")
#     delivery_method = models.CharField(max_length=200, null=True)
#     coupon_used = models.BooleanField(default=False)
#     session_token = models.CharField(max_length=100, unique=True, null=True, blank=True)
#     return_reason = models.TextField(blank=True, null=True, verbose_name="Return Reason")
#     refund_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name="Refund Amount")
#     refund_date = models.DateTimeField(blank=True, null=True, verbose_name="Refund Date")
#     is_refund_processed = models.BooleanField(default=False, verbose_name="Refund Processed")
    
#     # Optional: Add choices for common return reasons
#     RETURN_REASON_CHOICES = [
#         ('defective', 'Product Defective/Damaged'),
#         ('wrong_item', 'Wrong Item Received'),
#         ('not_as_described', 'Not as Described'),
#         ('size_issue', 'Size Issue'),
#         ('quality_issue', 'Quality Not Satisfactory'),
#         ('changed_mind', 'Changed Mind'),
#         ('other', 'Other'),
#     ]
#     return_reason_category = models.CharField(
#         max_length=50, 
#         choices=RETURN_REASON_CHOICES, 
#         blank=True, 
#         null=True,
#         verbose_name="Return Reason Category"
#     )
    
    
    
#     # VENDOR ACCEPTANCE SYSTEM - ADD THESE
#     VENDOR_ACCEPTANCE_CHOICES = [
#         (None, 'Not Responded'),
#         (True, 'Yes - Accept Order'),
#         (False, 'No - Reject Order'),
#     ]
    
#     vendor_acceptance = models.BooleanField(
#         choices=VENDOR_ACCEPTANCE_CHOICES,
#         null=True,
#         blank=True,
#         default=None,
#         verbose_name="Vendor's Response"
#     )
    
#     vendor_acceptance_date = models.DateTimeField(null=True, blank=True)
    
#     # REASON FIELD - When vendor selects "No"
#     VENDOR_REJECTION_REASONS = [
#         ('out_of_stock', 'Product is out of stock'),
#         ('damaged', 'Product is damaged/not sellable'),
#         ('pricing_error', 'Pricing error in listing'),
#         ('unavailable', 'Temporarily unavailable'),
#         ('shipping_issue', 'Cannot ship to this location'),
#         ('other', 'Other reason'),
#     ]
    
#     vendor_rejection_reason = models.CharField(
#         max_length=50,
#         choices=VENDOR_REJECTION_REASONS,
#         null=True,
#         blank=True,
#         verbose_name="Reason for Rejection"
#     )
    
#     vendor_rejection_notes = models.TextField(
#         blank=True,
#         verbose_name="Additional Notes (Optional)"
#     )
    
#     # REMOVE admin_action choices - use product_status instead
#     admin_action_date = models.DateTimeField(null=True, blank=True)
#     admin_notes = models.TextField(blank=True)
    
    
    
#     # In models.py - Add this to CartOrder model
#     @property
#     def can_return(self):
#         if self.product_status != "Delivered":
#             return False
#         # Check if delivery was within last 2 days
#         from django.utils import timezone
#         from datetime import timedelta
#         if self.order_date:
#             return timezone.now() - self.order_date <= timedelta(days=2)
#         return False
        
#     @property
#     def has_return_images(self):
#         """Check if return has images"""
#         return hasattr(self, 'return_images') and self.return_images.exists()
        
#     @property
#     def full_name(self):
#         """Combine first_name and last_name"""
#         if self.first_name and self.last_name:
#             return f"{self.first_name} {self.last_name}"
#         elif self.first_name:
#             return self.first_name
#         elif self.last_name:
#             return self.last_name
#         else:
#             return "Customer"

#     class Meta:
#         verbose_name_plural = "Cart Order"  


class CartOrder(models.Model):
    
    # First, create STATE_CHOICES from the master list (top-level regions)
    STATE_CHOICES = [
        ('abia', 'Abia'),
        ('adamawa', 'Adamawa'),
        ('akwa_ibom', 'Akwa Ibom'),
        ('anambra', 'Anambra'),
        ('abuja', 'Abuja / FCT'),
        ('bauchi', 'Bauchi'),
        ('bayelsa', 'Bayelsa'),
        ('benue', 'Benue'),
        ('borno', 'Borno'),
        ('cross_river', 'Cross River'),
        ('delta', 'Delta'),
        ('ebonyi', 'Ebonyi'),
        ('edo', 'Edo'),
        ('ekiti', 'Ekiti'),
        ('enugu', 'Enugu'),
        ('gombe', 'Gombe'),
        ('imo', 'Imo'),
        ('jigawa', 'Jigawa'),
        ('kaduna', 'Kaduna'),
        ('kano', 'Kano'),
        ('katsina', 'Katsina'),
        ('kebbi', 'Kebbi'),
        ('kogi', 'Kogi'),
        ('kwara', 'Kwara'),
        ('lagos', 'Lagos'),
        ('nasarawa', 'Nasarawa'),
        ('niger', 'Niger'),
        ('ogun', 'Ogun'),
        ('ondo', 'Ondo'),
        ('osun', 'Osun'),
        ('oyo', 'Oyo'),
        ('plateau', 'Plateau'),
        ('rivers', 'Rivers'),
        ('sokoto', 'Sokoto'),
        ('taraba', 'Taraba'),
        ('yobe', 'Yobe'),
        ('zamfara', 'Zamfara'),
    ]
    
    # We'll need to create CITY_CHOICES dynamically or define them statically
    # For now, I'll create a sample of Lagos cities - you'll need to add all
    LAGOS_CITY_CHOICES = [
        ('abraham_adadesanya', 'Abraham Adesanya'),
        ('abule_egba', 'Abule Egba'),
        ('agege', 'Agege'),
        ('ajah', 'Ajah'),
        ('ajegunle', 'Ajegunle'),
        ('akowonjo', 'Akowonjo'),
        ('alagbado', 'Alagbado'),
        ('alakuko', 'Alakuko'),
        ('allen_avenue', 'Allen Avenue'),
        ('alausa', 'Alausa'),
        ('amuwo_odofin', 'Amuwo Odofin'),
        ('anthony_village', 'Anthony Village'),
        ('apapa', 'Apapa'),
        ('ayobo', 'Ayobo'),
        ('badagry', 'Badagry Town'),
        ('badore', 'Badore'),
        ('banana_island', 'Banana Island'),
        ('bariga', 'Bariga'),
        ('berger', 'Berger'),
        ('chevron', 'Chevron'),
        ('dolphin_estate', 'Dolphin Estate'),
        ('dopemu', 'Dopemu'),
        ('ebute_metta', 'Ebute Metta'),
        ('egbeda', 'Egbeda'),
        ('ejigbo', 'Ejigbo'),
        ('epe', 'Epe'),
        ('festac', 'Festac'),
        ('gbagada', 'Gbagada'),
        ('iba', 'Iba'),
        ('ibeju', 'Ibeju'),
        ('idimu', 'Idimu'),
        ('ifako', 'Ifako'),
        ('igando', 'Igando'),
        ('igbogbo', 'Igbogbo'),
        ('iju_ishaga', 'Iju-Ishaga'),
        ('ikeja_gra', 'Ikeja GRA'),
        ('ikorodu', 'Ikorodu'),
        ('ikoyi', 'Ikoyi'),
        ('ilasamaja', 'Ilasamaja'),
        ('ilupeju', 'Ilupeju'),
        ('isheri', 'Isheri'),
        ('isolo', 'Isolo'),
        ('jakande', 'Jakande (Lekki)'),
        ('ketu', 'Ketu'),
        ('kirikiri', 'Kirikiri'),
        ('lagos_island', 'Lagos Island'),
        ('lagos_mainland', 'Lagos Mainland'),
        ('lekki', 'Lekki'),
        ('magodo', 'Magodo'),
        ('maryland', 'Maryland'),
        ('meiran', 'Meiran'),
        ('mile_2', 'Mile 2'),
        ('mushin', 'Mushin'),
        ('ogba', 'Ogba'),
        ('ogudu', 'Ogudu'),
        ('ojo', 'Ojo'),
        ('okota', 'Okota'),
        ('omole', 'Omole'),
        ('oniru', 'Oniru'),
        ('opebi', 'Opebi'),
        ('oreguns', 'Oregun'),
        ('osapa_london', 'Osapa London'),
        ('oshodi', 'Oshodi'),
        ('oworonshoki', 'Oworonshoki'),
        ('palmgrove', 'Palmgrove'),
        ('sangotedo', 'Sangotedo'),
        ('satellite_town', 'Satellite Town'),
        ('shomolu', 'Shomolu'),
        ('victoria_island', 'Victoria Island'),
        ('yaba', 'Yaba'),
    ]
    
    # You'll need to create similar choices for each state
    # For example:
    ABUJA_CITY_CHOICES = [
        ('airport_road_chika', 'Airport Road – Chika'),
        ('airport_road_gosa', 'Airport Road – Gosa / Sabon Lugbe'),
        ('apo_central', 'Apo Central'),
        ('asokoro', 'Asokoro'),
        ('bwari', 'Bwari'),
        ('central_business_district', 'Central Business District (CBD)'),
        ('dawaki', 'Dawaki'),
        ('dei_dei', 'Dei-Dei'),
        ('durumi', 'Durumi'),
        ('dutse', 'Dutse'),
        ('galadimawa', 'Galadimawa'),
        ('garki', 'Garki'),
        ('guzape', 'Guzape'),
        ('gudu', 'Gudu'),
        ('gwarinpa', 'Gwarinpa'),
        ('jabi', 'Jabi'),
        ('jahi', 'Jahi'),
        ('karu', 'Karu'),
        ('katampe', 'Katampe Extension'),
        ('kuje', 'Kuje'),
        ('kubwa', 'Kubwa'),
        ('life_camp', 'Life Camp Extension'),
        ('lokogoma', 'Lokogoma'),
        ('lugbe', 'Lugbe'),
        ('mabushi', 'Mabushi'),
        ('maitama', 'Maitama'),
        ('mpape', 'Mpape'),
        ('nyanya', 'Nyanya'),
        ('utako', 'Utako'),
        ('wuse', 'Wuse'),
        ('wuye', 'Wuye'),
    ]
    
    # For dynamic city choices based on selected state, you might want to
    # create a helper function or use a JSON field instead
    
    oid = ShortUUIDField(unique=True, length=10, null=True, prefix="order", max_length=20, alphabet="12345")
    tracking_id = ShortUUIDField(unique=True, length=10, null=True, max_length=15, alphabet="12QW3FHJ45")
    trippa_tracking_id = models.CharField(max_length=100, null=True, blank=True, verbose_name="Trippa Tracking ID")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=500, null=True)
    last_name = models.CharField(max_length=500, null=True)
    company_name = models.CharField(max_length=500, null=True)
    address = models.TextField(null=True)
    apartment_floor = models.CharField(max_length=500, null=True)
    
    
    # In your CartOrder model, change the city field to:
    city = models.CharField(
        max_length=100, 
        # Remove the choices parameter
        default='ikorodu',
        null=True,
        verbose_name="City/Town"
    )
    
    # Renamed city to state (this now represents the state/territory)
    state = models.CharField(
        max_length=50, 
        choices=STATE_CHOICES, 
        default='lagos',
        null=True,
        verbose_name="State"
    )
    
    postal = models.CharField(max_length=100, null=True)
    phone_number = models.CharField(max_length=500, null=True)
    email_address = models.CharField(max_length=500, null=True)
    order_note = models.TextField(null=True)
    payment_method = models.CharField(max_length=100, null=True)
    price = models.DecimalField(max_digits=99999999999999, decimal_places=2, default="1.99")
    paid_status = models.BooleanField(default=False)
    order_date = models.DateTimeField(auto_now_add=True)
    product_status = models.CharField(choices=STATUS_CHOICE, max_length=30, default="Placed")
    delivery_method = models.CharField(max_length=200, null=True)
    coupon_used = models.BooleanField(default=False)
    session_token = models.CharField(max_length=100, unique=True, null=True, blank=True)
    return_reason = models.TextField(blank=True, null=True, verbose_name="Return Reason")
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name="Refund Amount")
    refund_date = models.DateTimeField(blank=True, null=True, verbose_name="Refund Date")
    is_refund_processed = models.BooleanField(default=False, verbose_name="Refund Processed")
    
    # Return reason choices
    RETURN_REASON_CHOICES = [
        ('defective', 'Product Defective/Damaged'),
        ('wrong_item', 'Wrong Item Received'),
        ('not_as_described', 'Not as Described'),
        ('size_issue', 'Size Issue'),
        ('quality_issue', 'Quality Not Satisfactory'),
        ('changed_mind', 'Changed Mind'),
        ('other', 'Other'),
    ]
    return_reason_category = models.CharField(
        max_length=50, 
        choices=RETURN_REASON_CHOICES, 
        blank=True, 
        null=True,
        verbose_name="Return Reason Category"
    )
    
    # VENDOR ACCEPTANCE SYSTEM
    VENDOR_ACCEPTANCE_CHOICES = [
        (None, 'Not Responded'),
        (True, 'Yes - Accept Order'),
        (False, 'No - Reject Order'),
    ]
    
    vendor_acceptance = models.BooleanField(
        choices=VENDOR_ACCEPTANCE_CHOICES,
        null=True,
        blank=True,
        default=None,
        verbose_name="Vendor's Response"
    )
    
    vendor_acceptance_date = models.DateTimeField(null=True, blank=True)
    
    # REASON FIELD - When vendor selects "No"
    VENDOR_REJECTION_REASONS = [
        ('out_of_stock', 'Product is out of stock'),
        ('damaged', 'Product is damaged/not sellable'),
        ('pricing_error', 'Pricing error in listing'),
        ('unavailable', 'Temporarily unavailable'),
        ('shipping_issue', 'Cannot ship to this location'),
        ('other', 'Other reason'),
    ]
    
    vendor_rejection_reason = models.CharField(
        max_length=50,
        choices=VENDOR_REJECTION_REASONS,
        null=True,
        blank=True,
        verbose_name="Reason for Rejection"
    )
    
    vendor_rejection_notes = models.TextField(
        blank=True,
        verbose_name="Additional Notes (Optional)"
    )
    
    admin_action_date = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    
    @property
    def can_return(self):
        if self.product_status != "Delivered":
            return False
        # Check if delivery was within last 2 days
        from django.utils import timezone
        from datetime import timedelta
        if self.order_date:
            return timezone.now() - self.order_date <= timedelta(days=2)
        return False
        
    @property
    def has_return_images(self):
        """Check if return has images"""
        return hasattr(self, 'return_images') and self.return_images.exists()
        
    @property
    def full_name(self):
        """Combine first_name and last_name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        else:
            return "Customer"
            
    
    
    @property
    def formatted_delivery_method(self):
        """Return readable delivery method name"""
        if not self.delivery_method:
            return "Door Step Delivery"
        
        # Replace underscore with space and capitalize
        method = self.delivery_method.replace('_', ' ')
        return method.title()

    class Meta:
        verbose_name_plural = "Cart Order" 
        

    
   

class CartOrderItems(models.Model):
    order = models.ForeignKey(CartOrder, on_delete=models.CASCADE) 
    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE)
    unique_id = ShortUUIDField(unique=True, length=10, max_length=20, null=True, alphabet="abcdefgTrenva")
    vendor = models.CharField(max_length=200, null=True)
    vendor_id = models.CharField(max_length=1000, null=True)
    invoice_no = models.CharField(max_length=200)
    product_status = models.CharField(choices=VENDOR_STATUS_CHOICE, max_length=200, default="Placed", null=True)
    vendor_delivery_method = models.CharField(choices=VENDOR_DELIVERY_CHOICE, max_length=200, null=True)
    item = models.CharField(max_length=200)
    product_ref = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='order_items')
    # image = models.CharField(max_length=200)
    image = models.ImageField(upload_to="cart-order-images", default="product.jpg")
    product_color = models.CharField(max_length=200, null=True, blank=True)
    product_size = models.CharField(max_length=200, null=True, blank=True)
    qty = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=99999999999999, decimal_places=2, default="1.99")
    total = models.DecimalField(max_digits=99999999999999, decimal_places=2, default="1.99")
    order_date = models.DateTimeField(auto_now_add=True, null=True)
    vendor_seen = models.BooleanField(null=True, default=False)
    
    commission_processed = models.BooleanField(default=False)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    cancellation_processed = models.BooleanField(default=False)
    

    class Meta:
        verbose_name_plural = "Cart Order Items"
        
    def calculate_commission(self):
        """
        Calculate commission for this order item
        """
        try:
            if not self.commission_processed:
                # Find the product
                product = Product.objects.filter(
                    title=self.item
                ).first()
                
                if product and product.vendor:
                    # Get commission rate based on category
                    from django.utils.functional import SimpleLazyObject
                    
                    def get_rate():
                        from decimal import Decimal
                        # Commission rates
                        commission_rates = {
                            'Fashion': 15.0,
                            'Phones & Tablets': 10.0,
                            'Computing': 12.0,
                            'Health & Beauty': 18.0,
                            'Sound System': 10.0,
                            'Games': 15.0,
                            'default': 12.0,
                        }
                        
                        if product.category:
                            category_title = product.category.title
                            for key, rate in commission_rates.items():
                                if key.lower() in category_title.lower():
                                    return Decimal(str(rate))
                        
                        return Decimal(str(commission_rates['default']))
                    
                    commission_rate = get_rate()
                    item_total = self.price * self.qty
                    commission = (item_total * commission_rate) / Decimal('100.00')
                    
                    self.commission_amount = commission
                    self.commission_processed = True
                    self.save()
                    
                    return commission
        except Exception as e:
            print(f"Error calculating commission: {str(e)}")
        
        return Decimal('0.00')

    def order_img(self):
        return mark_safe('<img src="%s" width="50" height="50" >' % (self.image.url))
    def get_total_price(self):
        return self.total
        
    def __str__(self):
        return f"{self.item} - #{self.invoice_no} - {self.product_status}"  # ADD THIS LINE



    



class ProductReview(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name="reviews")
    review = models.TextField()
    rating = models.IntegerField(choices=RATING, default=None)
    date = models.DateTimeField(auto_now_add=True)
    # ADD THESE FIELDS FOR VENDOR REPLIES
    vendor_reply = models.TextField(blank=True, null=True, verbose_name="Vendor Reply")
    vendor_reply_date = models.DateTimeField(blank=True, null=True, verbose_name="Vendor Reply Date")

    class Meta:
        verbose_name_plural = "Product Reviews"
    
    def __str__(self):
        return self.product.title
    
    def get_rating(self):
        return self.rating
    

class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Wishlists"
    
    def __str__(self):
        if self.product:
            return self.product.title
        # Handle case where product is None
        if self.user:
            return f"Wishlist for {self.user.username} (product deleted)"
        return "Wishlist (product deleted)"
    
class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_color = models.TextField(null=True, default="Default")
    product_size = models.TextField(null=True, default="Default")
    qty = models.PositiveIntegerField(null=True, default=1)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Carts"
    
    def __str__(self):
        return self.product.title
    
    def total_price(self):
        # Always use price (with markup) for cart calculations
        amount = self.product.price  # This is the final price with markup
        q = self.qty
        toge = float(amount) * float(q)
        return toge



    

class CompareProduct(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name_plural = "Compare Products"

class SaveCustomerCart(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    items = models.JSONField()

    class Meta:
        verbose_name_plural = "Save Customer Cart"

class SearchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    search_text = models.CharField(max_length=3000)
    date = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        verbose_name_plural = "Search History"

class NewsLetter(models.Model):
    email = models.EmailField()
    date = models.DateField(auto_now_add=True, null=True)

# =========================================================
# models.py  — Replace your existing Coupon model with this
# =========================================================
# Adjust the ForeignKey / ManyToManyField paths below to
# match your actual app name, e.g. 'store.Product'
# =========================================================

from django.db import models
from django.contrib.auth import get_user_model
from shortuuid.django_fields import ShortUUIDField   # same lib you already use

User = get_user_model()


class Coupon(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Percentage (%)'),
        ('fixed',      'Fixed Amount (₵)'),
    ]

    # ── Core ────────────────────────────────────────────────
    coupon_code = ShortUUIDField(
        unique=True, length=10, max_length=20, editable=True
    )
    discount_type = models.CharField(
        max_length=20,
        choices=DISCOUNT_TYPE_CHOICES,
        default='percentage',
    )
    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Percentage value (e.g. 20 for 20%) OR fixed amount (e.g. 10 for ₦10)",
    )

    # ── Rules ────────────────────────────────────────────────
    expiry_date = models.DateTimeField(
        null=True, blank=True,
        help_text="Leave blank for no expiry.",
    )
    usage_limit = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Max total uses. Leave blank for unlimited.",
    )
    usage_count = models.PositiveIntegerField(
        default=0,
        help_text="Auto-incremented each time the coupon is applied.",
    )
    minimum_order = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        help_text="Minimum cart total required. Leave blank for no minimum.",
    )

    # ── Targeting ────────────────────────────────────────────
    specific_users = models.ManyToManyField(
        User,
        blank=True,
        related_name='specific_coupons',
        help_text="Restrict to these users. Leave empty for all users.",
    )
    # ↓ adjust app label to match your project
    specific_vendors = models.ManyToManyField(
        Vendor,
        blank=True,
        related_name='vendor_coupons',
        help_text="Restrict to these vendors. Leave empty for all vendors.",
    )
    product = models.ManyToManyField(
        Product,
        blank=True,
    )

    # ── Status ───────────────────────────────────────────────
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Coupons"
        ordering = ['-created_at']

    def __str__(self):
        return self.coupon_code

    # ── Computed helpers ─────────────────────────────────────
    @property
    def is_expired(self):
        from django.utils import timezone
        return bool(self.expiry_date and timezone.now() > self.expiry_date)

    @property
    def is_usage_limit_reached(self):
        return bool(
            self.usage_limit is not None and self.usage_count >= self.usage_limit
        )

    @property
    def status(self):
        if not self.active:
            return 'inactive'
        if self.is_expired:
            return 'expired'
        if self.is_usage_limit_reached:
            return 'exhausted'
        return 'active'

    def discount_display(self):
        if self.discount_type == 'percentage':
            return f"{self.discount}%"
        return f"₦{self.discount}"
        
class CouponEmail(models.Model):
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True)
    user_email = models.EmailField(null=True)

    class Meta:
        verbose_name_plural = "Coupon Emails"

class ContactForm(models.Model):
    name = models.CharField(max_length=500, null=True)
    email = models.EmailField(null=True)
    subject = models.CharField(max_length=1000, null=True)
    message = models.TextField(null=True)

    def __str__(self):
        return self.subject
    
class Testimonial(models.Model):
    review = models.TextField()
    image = models.ImageField(upload_to="testimonials", default="testimony.png")
    name = models.CharField(max_length=200)

    class Meta:
        verbose_name_plural = "Testimonials"

    def testimonial_image(self):
        return mark_safe('<img src="%s" width="50" height="50" >' % (self.image.url))

    def __str__(self):
        return self.review
    
class Team(models.Model):
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    image = models.ImageField(upload_to="our-team")
    twitter = models.CharField(max_length=1000, null=True, blank=True)
    instagram = models.CharField(max_length=1000, null=True, blank=True)
    linkedin = models.CharField(max_length=1000, null=True, blank=True)
    x = models.CharField(max_length=1000, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Team"

    def team_image(self):
        return mark_safe('<img src="%s" width="50" height="50" >' % (self.image.url))

    def __str__(self):
        return self.name
    
class Advertisement(models.Model): 
    title = models.CharField(max_length=100)
    info = models.TextField()
    action_button = models.CharField(max_length=100)
    action = models.TextField()
    
    class Meta:
        verbose_name_plural = "Ads"
    
    def __str__(self):
        return self.title
        
class EmailTemplate(models.Model):
    EMAIL_TYPE_CHOICES = [
        ('order_confirmation', 'Order Confirmation'),
        ('shipping_confirmation', 'Shipping Confirmation'),
        ('order_delivered', 'Order Delivered'),
        ('password_reset', 'Password Reset'),
        ('account_registration', 'Account Registration'),
        ('promo_offer', 'Promotional Offer'),
    ]

    name = models.CharField(max_length=100, choices=EMAIL_TYPE_CHOICES, unique=True)
    subject = models.CharField(max_length=200)
    body = RichTextUploadingField(null=True, help_text="You can use variables like {{ customer_name }}, {{ order_number }}, etc.")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Email Templates"
        
    def __str__(self):
        return self.name
        
class State(models.Model):
    name = models.CharField(max_length=100)
    
    class Meta:
        verbose_name_plural = "States"
        
    def __str__(self):
        return self.name

class Lgas(models.Model):
    name = models.CharField(max_length=100)
    state = models.ForeignKey(State, on_delete=models.CASCADE)
    
    class Meta:
        verbose_name_plural = "Local Govt"
        
    def __str__(self):
        return self.name
        
class Ward(models.Model):
    name = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    lga = models.ForeignKey(Lgas, on_delete=models.CASCADE)
    state = models.ForeignKey(State, on_delete=models.CASCADE, null=True)
    
    class Meta:
        verbose_name_plural = "Wards"
        
    def __str__(self):
        return self.name
        
        


# from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# class Wallet(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
#     account_number = models.CharField(max_length=10, blank=True, null=True, unique=True)
#     bank_name = models.CharField(max_length=100, blank=True, null=True)
#     paystack_customer_code = models.CharField(max_length=100, blank=True, null=True)
#     virtual_account_id = models.CharField(max_length=100, blank=True, null=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         unique_together = ['user']  # This is the simple fix

#     def __str__(self):
#         return f"{self.user.username}'s Wallet - ₦{self.balance}"

#     def get_or_create_paystack_customer(self):
#         """Get or create Paystack customer for this user"""
#         if self.paystack_customer_code:
#             return self.paystack_customer_code
            
#         try:
#             url = "https://api.paystack.co/customer"
#             headers = {
#                 "Authorization": f"Bearer {settings.PAYSTACK_SECRET}",
#                 "Content-Type": "application/json"
#             }
            
#             # Use email as unique identifier
#             payload = {
#                 "email": self.user.email,
#                 "first_name": self.user.first_name or "Customer",
#                 "last_name": self.user.last_name or str(self.user.id),
#                 "phone": self.user.phone or "",
#             }
            
#             print(f"DEBUG: Creating Paystack customer for {self.user.email}")
#             response = requests.post(url, json=payload, headers=headers)
#             response_data = response.json()
            
#             print(f"DEBUG: Customer creation response: {response_data}")
            
#             if response_data.get('status'):
#                 customer_code = response_data['data']['customer_code']
#                 self.paystack_customer_code = customer_code
#                 self.save()
#                 return customer_code
#             else:
#                 print(f"DEBUG: Customer creation failed: {response_data.get('message')}")
#                 return None
                    
#         except Exception as e:
#             print(f"DEBUG: Error creating Paystack customer: {str(e)}")
#             return None
    

#     def create_paystack_virtual_account(self):
#         """Create real Paystack virtual account for user"""
#         if self.account_number:
#             print(f"DEBUG: Account already exists: {self.account_number}")
#             return True
    
#         try:
#             print(f"DEBUG: Starting virtual account creation for {self.user.email}")
#             print(f"DEBUG: Using Paystack secret key length: {len(settings.PAYSTACK_SECRET) if settings.PAYSTACK_SECRET else 'NOT SET'}")
    
#             # STEP 1: Create or get the Paystack customer
#             customer_code = self.get_or_create_paystack_customer()
#             if not customer_code:
#                 print("DEBUG: FAILED - Could not get or create a customer.")
#                 return False
    
#             print(f"DEBUG: Customer created/fetched with code: {customer_code}")
    
#             # STEP 2: Create the dedicated virtual account
#             url = "https://api.paystack.co/dedicated_account"
#             headers = {
#                 "Authorization": f"Bearer {settings.PAYSTACK_SECRET}",
#                 "Content-Type": "application/json"
#             }
    
#             # For Nigeria - try without preferred bank first
#             payload = {
#                 "customer": customer_code,
#                 # Remove preferred_bank to let Paystack choose
#             }
    
#             print(f"DEBUG: Creating VA for customer {customer_code}...")
#             response = requests.post(url, json=payload, headers=headers, timeout=30)
#             response_data = response.json()
    
#             # Log the full response
#             print("="*50)
#             print("PAYSTACK VIRTUAL ACCOUNT RESPONSE:")
#             print(f"Status: {response_data.get('status')}")
#             print(f"Message: {response_data.get('message')}")
#             if 'data' in response_data:
#                 print(f"Account Number: {response_data['data'].get('account_number')}")
#                 print(f"Bank: {response_data['data'].get('bank', {}).get('name')}")
#             print("Full Response:", json.dumps(response_data, indent=2))
#             print("="*50)
    
#             if response_data.get('status'):
#                 # Success! Save the account details
#                 account_data = response_data['data']
#                 self.account_number = account_data['account_number']
#                 self.bank_name = account_data['bank']['name']
#                 self.virtual_account_id = account_data['id']
#                 self.save()
#                 print(f"DEBUG: SUCCESS! Virtual account created: {self.account_number}")
#                 return True
#             else:
#                 # Try with specific bank if first attempt fails
#                 error_msg = response_data.get('message', 'Unknown error')
#                 print(f"DEBUG: First attempt failed: {error_msg}")
                
#                 # Try with Wema Bank (supports virtual accounts in Nigeria)
#                 payload['preferred_bank'] = 'wema-bank'
#                 print(f"DEBUG: Trying with Wema Bank...")
#                 response = requests.post(url, json=payload, headers=headers, timeout=30)
#                 response_data = response.json()
                
#                 if response_data.get('status'):
#                     account_data = response_data['data']
#                     self.account_number = account_data['account_number']
#                     self.bank_name = account_data['bank']['name']
#                     self.virtual_account_id = account_data['id']
#                     self.save()
#                     print(f"DEBUG: SUCCESS with Wema Bank! Account: {self.account_number}")
#                     return True
                
#                 print(f"DEBUG: Final failure: {response_data.get('message')}")
#                 return False
    
#         except requests.exceptions.RequestException as e:
#             print(f"DEBUG: Network error: {str(e)}")
#             return False
#         except Exception as e:
#             print(f"DEBUG: Exception: {str(e)}")
#             import traceback
#             traceback.print_exc()
#             return False

# # class Wallet(models.Model):
# #     user = models.ForeignKey(User, on_delete=models.CASCADE)
# #     balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
# #     # Paystack Virtual Account Fields
# #     account_number = models.CharField(max_length=10, blank=True, null=True, unique=True)
# #     bank_name = models.CharField(max_length=100, blank=True, null=True)
# #     paystack_customer_code = models.CharField(max_length=100, blank=True, null=True)
# #     virtual_account_id = models.CharField(max_length=100, blank=True, null=True)
    
# #     created_at = models.DateTimeField(auto_now_add=True)
# #     updated_at = models.DateTimeField(auto_now=True)

# #     def __str__(self):
# #         return f"{self.user.username}'s Wallet - ₦{self.balance}"

# #     import json # Add this import

# #     def create_paystack_virtual_account(self):
# #         """Create real Paystack virtual account for user"""
# #         if self.account_number:
# #             return True
    
# #         try:
# #             print(f"DEBUG: Starting virtual account creation for {self.user.email}")
    
# #             # STEP 1: Create the Paystack customer FIRST
# #             customer_code = self.get_or_create_paystack_customer()
# #             if not customer_code:
# #                 print("DEBUG: FAILED - Could not get or create a customer.")
# #                 return False
    
# #             # STEP 2: Wait a moment (optional, good for debugging)
# #             import time
# #             time.sleep(1)
# #             print(f"DEBUG: Customer created/fetched with code: {customer_code}")
    
# #             # STEP 3: Now create the dedicated virtual account
# #             url = "https://api.paystack.co/dedicated_account"
# #             headers = {
# #                 "Authorization": f"Bearer {settings.PAYSTACK_SECRET}",
# #                 "Content-Type": "application/json"
# #             }
    
# #             # For TEST MODE: Use 'test-bank'
# #             # For LIVE MODE: Use 'wema-bank' or 'titan-paystack'
# #             payload = {
# #                 "customer": customer_code,
# #                 "preferred_bank": "titan-paystack",  # <-- CHANGE THIS for live mode
# #             }
    
# #             print(f"DEBUG: Creating VA for customer {customer_code}...")
# #             response = requests.post(url, json=payload, headers=headers)
# #             response_data = response.json()
    
# #             # Log the full response
# #             print("="*50)
# #             print("PAYSTACK VIRTUAL ACCOUNT RESPONSE:")
# #             print(f"Status: {response_data.get('status')}")
# #             print(f"Message: {response_data.get('message')}")
# #             if 'data' in response_data:
# #                 print(f"Account Number: {response_data['data'].get('account_number')}")
# #             print("="*50)
    
# #             if response_data.get('status'):
# #                 # Success! Save the account details
# #                 account_data = response_data['data']
# #                 self.account_number = account_data['account_number']
# #                 self.bank_name = account_data['bank']['name']
# #                 self.virtual_account_id = account_data['id']
# #                 self.save()
# #                 print(f"DEBUG: SUCCESS! Virtual account created: {self.account_number}")
# #                 return True
# #             else:
# #                 # The error message will tell you exactly what's wrong
# #                 error_msg = response_data.get('message', 'Unknown error')
# #                 print(f"DEBUG: Virtual account creation failed: {error_msg}")
# #                 return False
    
# #         except Exception as e:
# #             print(f"DEBUG: Exception: {str(e)}")
# #             import traceback
# #             traceback.print_exc()
# #             return False
    
# #         def get_or_create_paystack_customer(self):
# #             """Get or create Paystack customer for this user"""
# #             if self.paystack_customer_code:
# #                 return self.paystack_customer_code
                
# #             try:
# #                 url = "https://api.paystack.co/customer"
# #                 headers = {
# #                     "Authorization": f"Bearer {settings.PAYSTACK_SECRET}",
# #                     "Content-Type": "application/json"
# #                 }
                
# #                 payload = {
# #                     "email": self.user.email,
# #                     "first_name": self.user.first_name or "Customer",
# #                     "last_name": self.user.last_name or str(self.user.id),
# #                     "phone": self.user.phone or "",
# #                 }
                
# #                 response = requests.post(url, json=payload, headers=headers)
# #                 response_data = response.json()
                
# #                 if response_data.get('status'):
# #                     customer_code = response_data['data']['customer_code']
# #                     self.paystack_customer_code = customer_code
# #                     self.save()
# #                     return customer_code
# #                 return None
                    
# #             except Exception as e:
# #                 print(f"Error creating Paystack customer: {str(e)}")
# #                 return None

# @receiver(post_save, sender=User)
# def create_user_wallet(sender, instance, created, **kwargs):
#     if created:
#         wallet = Wallet.objects.create(user=instance)
#         # Create virtual account in background for new users
#         import threading
#         def create_account_background():
#             try:
#                 wallet.create_paystack_virtual_account()
#             except Exception as e:
#                 print(f"Background account creation failed: {e}")
        
#         thread = threading.Thread(target=create_account_background)
#         thread.daemon = True
#         thread.start()


import json
import requests
import threading
import time
import random
import re
from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

User = get_user_model()

class Wallet(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    account_number = models.CharField(max_length=10, blank=True, null=True, unique=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    paystack_customer_code = models.CharField(max_length=100, blank=True, null=True)
    virtual_account_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user']

    def __str__(self):
        return f"{self.user.username}'s Wallet - ₦{self.balance}"

    def get_or_create_paystack_customer(self):
        """Get or create Paystack customer for this user"""
        if self.paystack_customer_code:
            return self.paystack_customer_code
            
        try:
            # Ensure user has a valid phone
            if not self.user.phone:
                prefixes = ['080', '081', '090', '091', '070', '071']
                prefix = random.choice(prefixes)
                suffix = ''.join([str(random.randint(0, 9)) for _ in range(8)])
                self.user.phone = f"{prefix}{suffix}"
                self.user.save()
                print(f"DEBUG: Generated phone number: {self.user.phone}")
            
            # Clean phone number
            clean_phone = re.sub(r'\D', '', str(self.user.phone))
            if len(clean_phone) == 11 and clean_phone.startswith('0'):
                pass  # Already good
            elif len(clean_phone) == 10:
                clean_phone = f"0{clean_phone}"
            elif len(clean_phone) == 13 and clean_phone.startswith('234'):
                clean_phone = f"0{clean_phone[3:]}"
            elif len(clean_phone) == 14 and clean_phone.startswith('234'):
                clean_phone = f"0{clean_phone[4:]}"
            else:
                # Fallback
                clean_phone = f"080{random.randint(10000000, 99999999)}"
            
            url = "https://api.paystack.co/customer"
            headers = {
                "Authorization": f"Bearer {settings.PAYSTACK_SECRET}",
                "Content-Type": "application/json"
            }
            
            # FIXED: Don't use "Customer" as last_name - use empty string or username
            # This prevents "CUSTOMER" from appearing in the account name
            last_name_value = ""
            if self.user.last_name and self.user.last_name != "Customer":
                last_name_value = self.user.last_name
            
            payload = {
                "email": self.user.email,
                "first_name": self.user.first_name or self.user.username,
                "last_name": last_name_value,  # ← FIXED: No more "Customer"
                "phone": clean_phone,
            }
            
            print(f"DEBUG: Creating Paystack customer for {self.user.email} with phone: {clean_phone}")
            response = requests.post(url, json=payload, headers=headers)
            response_data = response.json()
            
            print(f"DEBUG: Customer creation response: {response_data}")
            
            if response_data.get('status'):
                customer_code = response_data['data']['customer_code']
                self.paystack_customer_code = customer_code
                self.save(update_fields=['paystack_customer_code'])
                print(f"DEBUG: Customer created successfully: {customer_code}")
                return customer_code
            else:
                print(f"DEBUG: Customer creation failed: {response_data.get('message')}")
                return None
                    
        except Exception as e:
            print(f"DEBUG: Error creating Paystack customer: {str(e)}")
            return None

    def create_paystack_virtual_account(self):
        """Create real Paystack virtual account for user"""
        # Check if account already exists
        if self.account_number:
            print(f"DEBUG: Account already exists: {self.account_number}")
            return True

        try:
            print(f"\n{'='*50}")
            print(f"DEBUG: Starting virtual account creation for {self.user.email}")
            print(f"{'='*50}")
            
            # Ensure user has a valid phone number
            if not self.user.phone or len(str(self.user.phone)) < 11:
                prefixes = ['080', '081', '090', '091', '070', '071']
                prefix = random.choice(prefixes)
                suffix = ''.join([str(random.randint(0, 9)) for _ in range(8)])
                self.user.phone = f"{prefix}{suffix}"
                self.user.save()
                print(f"DEBUG: Generated phone number: {self.user.phone}")
            
            # Clean phone number (remove any non-digits)
            clean_phone = re.sub(r'\D', '', str(self.user.phone))
            if len(clean_phone) == 11 and clean_phone.startswith('0'):
                pass  # Already good
            elif len(clean_phone) == 10:
                clean_phone = f"0{clean_phone}"
            elif len(clean_phone) == 13 and clean_phone.startswith('234'):
                clean_phone = f"0{clean_phone[3:]}"
            elif len(clean_phone) == 14 and clean_phone.startswith('234'):
                clean_phone = f"0{clean_phone[4:]}"
            else:
                # Fallback
                clean_phone = f"080{random.randint(10000000, 99999999)}"
            
            print(f"DEBUG: Using cleaned phone: {clean_phone}")
            
            # STEP 1: Create or get the Paystack customer
            customer_code = self.get_or_create_paystack_customer()
            if not customer_code:
                print("DEBUG: ❌ FAILED - Could not get or create a customer.")
                return False

            print(f"DEBUG: ✅ Customer created/fetched with code: {customer_code}")

            # STEP 2: Create the dedicated virtual account with ALL required parameters
            url = "https://api.paystack.co/dedicated_account"
            headers = {
                "Authorization": f"Bearer {settings.PAYSTACK_SECRET}",
                "Content-Type": "application/json"
            }

            # List of banks that support virtual accounts in Nigeria
            banks = [
                "titan-paystack",  # Paystack's partner bank (most reliable)
                "wema-bank",       # Wema Bank (ALAT)
            ]
            
            account_created = False
            last_error = None
            
            # FIXED: Don't use "Customer" as last_name here either
            last_name_value = ""
            if self.user.last_name and self.user.last_name != "Customer":
                last_name_value = self.user.last_name
            
            # Try each bank until one works
            for bank in banks:
                # CRITICAL: Include ALL required parameters
                payload = {
                    "customer": customer_code,
                    "preferred_bank": bank,
                    "phone": clean_phone,  # Phone is required!
                    "first_name": self.user.first_name or self.user.username,
                    "last_name": last_name_value,  # ← FIXED: No more "Customer"
                }
                
                print(f"DEBUG: Trying bank: {bank}")
                print(f"DEBUG: Payload: {payload}")
                
                try:
                    response = requests.post(url, json=payload, headers=headers, timeout=30)
                    response_data = response.json()
                    
                    print(f"DEBUG: Response from {bank}:")
                    print(f"  Status: {response_data.get('status')}")
                    print(f"  Message: {response_data.get('message')}")
                    
                    if response_data.get('status'):
                        # Success! Save the account details
                        account_data = response_data['data']
                        self.account_number = account_data['account_number']
                        self.bank_name = account_data['bank']['name']
                        self.virtual_account_id = account_data.get('id', '')
                        self.save(update_fields=['account_number', 'bank_name', 'virtual_account_id'])
                        
                        print(f"\n{'✅'*10} SUCCESS {'✅'*10}")
                        print(f"Bank: {self.bank_name}")
                        print(f"Account Number: {self.account_number}")
                        print(f"{'✅'*25}\n")
                        
                        account_created = True
                        break
                    else:
                        last_error = response_data.get('message', 'Unknown error')
                        print(f"DEBUG: {bank} failed: {last_error}")
                        
                except requests.exceptions.RequestException as e:
                    last_error = str(e)
                    print(f"DEBUG: Network error with {bank}: {last_error}")
                    continue
            
            if not account_created:
                print(f"DEBUG: ❌ All banks failed. Last error: {last_error}")
                return False
            
            return True

        except Exception as e:
            print(f"DEBUG: ❌ Exception in create_paystack_virtual_account: {str(e)}")
            import traceback
            traceback.print_exc()
            return False


# Signal to create wallet for new users
@receiver(post_save, sender=User)
def create_user_wallet(sender, instance, created, **kwargs):
    if created:
        print(f"\n{'='*50}")
        print(f"DEBUG: New user created: {instance.email}")
        print(f"{'='*50}")
        
        wallet = Wallet.objects.create(user=instance)
        
        # Create virtual account in background for new users
        def create_account_background():
            try:
                # Wait a moment for everything to settle
                time.sleep(2)
                print(f"DEBUG: Starting background account creation for {instance.email}")
                result = wallet.create_paystack_virtual_account()
                if result:
                    print(f"DEBUG: ✅ Background account creation successful for {instance.email}")
                else:
                    print(f"DEBUG: ❌ Background account creation failed for {instance.email}")
            except Exception as e:
                print(f"DEBUG: Background account creation error: {e}")
        
        thread = threading.Thread(target=create_account_background)
        thread.daemon = True
        thread.start()


class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('credit', 'Credit'),
        ('debit', 'Debit'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    )
    
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    balance_after = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    reference = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.transaction_type} - ₦{self.amount} - {self.status}"

    def save(self, *args, **kwargs):
        # Update balance_after based on the transaction type
        if self.balance_after is None:
            if self.transaction_type == 'credit':
                self.balance_after = self.wallet.balance + self.amount
            elif self.transaction_type == 'debit':
                self.balance_after = self.wallet.balance - self.amount
        super().save(*args, **kwargs)
        
        
# # Create wallet automatically when user is created
# @receiver(post_save, sender=User)
# def create_user_wallet(sender, instance, created, **kwargs):
#     if created:
#         Wallet.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_wallet(sender, instance, **kwargs):
    if hasattr(instance, 'wallet'):
        instance.wallet.save()
        
        

class ChatMessage(models.Model):
    """Model for storing chat messages between vendors and admins"""
    SENDER_TYPES = (
        ('vendor', 'Vendor'),
        ('admin', 'Admin'),
    )

    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='chat_messages')
    message = models.TextField()
    sender_type = models.CharField(max_length=10, choices=SENDER_TYPES)
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'

    def __str__(self):
        return f"{self.sender_type} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

    def get_sender_display_name(self):
        if self.sender_type == 'vendor':
            return self.vendor.name
        return 'Admin Support'
        
        
class AdminWallet(models.Model):
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_credits_given = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_refunds_given = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Admin Wallet"
        
        
    
    
    def add_from_cancelled_order(self, amount, vendor, order, description=""):
        """Add money from cancelled order to admin wallet"""
        self.balance += amount
        self.save()
        
        AdminTransaction.objects.create(
            admin_wallet=self,
            amount=amount,
            balance_after=self.balance,
            transaction_type='cancelled_order',
            status='success',
            description=description,
            vendor=vendor,
            order=order
        )
    
    
    def process_vendor_payout(self, payout, admin_user=None):
        """Process vendor payout from admin wallet"""
        from decimal import Decimal
        from django.db import transaction as db_transaction
        
        with db_transaction.atomic():
            # Check if admin has sufficient balance
            if not self.can_afford(payout.amount):
                raise ValueError("Insufficient balance in admin wallet")
            
            # Update payout status
            payout.status = 'processing'
            payout.processed_by = admin_user
            payout.processed_at = timezone.now()
            payout.save()
            
            # Debit admin wallet
            self.balance -= payout.amount
            self.save()
            
            # Create admin transaction record
            admin_transaction = AdminTransaction.objects.create(
                admin_wallet=self,
                amount=payout.amount,
                balance_after=self.balance,
                transaction_type='vendor_payout',
                status='processing',
                description=f"Payout to {payout.vendor.name} - {payout.payout_id}",
                vendor=payout.vendor,
                vendor_payout=payout,
                created_by=admin_user
            )
            
            # Update payout with transaction
            payout.admin_transactions.add(admin_transaction)
            
            # Process payment based on method
            if payout.payout_method == 'wallet':
                success = self._process_wallet_payout(payout)
            elif payout.payout_method == 'bank_transfer':
                success = self._process_bank_transfer(payout)
            else:
                success = False
            
            # Update status based on success
            if success:
                payout.status = 'completed'
                payout.payment_date = timezone.now()
                payout.payment_reference = f"PAYOUT_{payout.payout_id}"
                
                # Mark daily earnings as paid
                payout.daily_earnings.update(is_paid=True)
                
                # Update admin transaction
                admin_transaction.status = 'success'
                admin_transaction.save()
            else:
                payout.status = 'failed'
                payout.admin_notes = "Payment processing failed"
                
                # Refund admin wallet
                self.balance += payout.amount
                self.save()
                
                # Update admin transaction
                admin_transaction.status = 'failed'
                admin_transaction.save()
            
            payout.save()
            
            return success
    
    def _process_wallet_payout(self, payout):
        """Process payout to vendor's wallet"""
        try:
            # Get or create vendor's wallet
            vendor_wallet, created = Wallet.objects.get_or_create(user=payout.vendor.user)
            
            # Credit vendor's wallet
            vendor_wallet.balance += payout.net_amount
            vendor_wallet.save()
            
            # Create vendor transaction
            import shortuuid
            Transaction.objects.create(
                wallet=vendor_wallet,
                amount=payout.net_amount,
                balance_after=vendor_wallet.balance,
                transaction_type='credit',
                status='success',
                reference=f"PAYOUT_{payout.payout_id}",
                description=f"Payout from {payout.period_start} to {payout.period_end}"
            )
            
            return True
        except Exception as e:
            print(f"Wallet payout failed: {str(e)}")
            return False
    
    def _process_bank_transfer(self, payout):
        """Process bank transfer payout (simulated)"""
        try:
            # In real implementation, integrate with payment gateway
            # For now, simulate successful bank transfer
            # You would integrate with Paystack, Flutterwave, etc.
            
            # Generate payment reference
            payout.payment_reference = f"BANK_{payout.payout_id}_{timezone.now().strftime('%Y%m%d')}"
            payout.admin_notes = f"Bank transfer initiated to {payout.bank_name} - {payout.account_number}"
            
            # In production, call payment gateway API here
            # Example with Paystack:
            # success = paystack_initiate_transfer(
            #     amount=payout.net_amount * 100,  # Convert to kobo
            #     recipient_code=payout.vendor.paystack_recipient_code,
            #     reference=payout.payment_reference
            # )
            
            # For now, return True (simulate success)
            return True
            
        except Exception as e:
            print(f"Bank transfer failed: {str(e)}")
            return False
    
    def __str__(self):
        return f"Admin Wallet - ₦{self.balance}"
    
    @classmethod
    def get_wallet(cls):
        """Get or create the admin wallet singleton"""
        wallet, created = cls.objects.get_or_create(id=1)
        return wallet
    
    def can_afford(self, amount):
        """Check if wallet has sufficient balance"""
        from decimal import Decimal
        return self.balance >= Decimal(amount)
    
    def initialize_paystack_funding(self, amount, email, created_by=None):
        """Initialize Paystack payment for funding admin wallet"""
        import requests
        import shortuuid
        from django.conf import settings
        from decimal import Decimal  # ADD THIS
        
        # Ensure amount is Decimal
        if not isinstance(amount, Decimal):
            amount = Decimal(str(amount))
        
        # Use Paystack secret key from settings
        secret_key = settings.PAYSTACK_SECRET
        
        headers = {
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json"
        }
        
        # Generate unique reference
        reference = f"ADM_FUND_{shortuuid.uuid()[:8]}"
        
        # Get base URL
        base_url = settings.BASE_URL
        callback_url = f"{base_url}/ng/admin/wallet/fund/verify/"
        
        # Convert Decimal to integer kobo
        amount_kobo = int(amount * 100)
        
        payload = {
            "email": email,
            "amount": amount_kobo,  # Already converted to int
            "reference": reference,
            "callback_url": callback_url,
            "metadata": {
                "purpose": "admin_wallet_funding",
                "admin_id": created_by.id if created_by else None,
                "admin_email": created_by.email if created_by else None,
                "wallet_type": "admin",
            }
        }
        
        print(f"DEBUG: Paystack payload - Amount (kobo): {amount_kobo}")
        print(f"DEBUG: Original amount (Decimal): {amount}")
        
        try:
            response = requests.post(
                "https://api.paystack.co/transaction/initialize",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            print(f"DEBUG: Paystack init response status: {response.status_code}")
            
            response.raise_for_status()
            data = response.json()
            
            if data.get('status'):
                # Create pending transaction record with Decimal amount
                admin_transaction = AdminTransaction.objects.create(
                    admin_wallet=self,
                    amount=amount,  # Store as Decimal
                    transaction_type='funding',
                    status='pending',
                    reference=reference,
                    description=f"Paystack funding initiated - {email}",
                    created_by=created_by
                )
                
                print(f"DEBUG: Created pending transaction: {admin_transaction.id}")
                print(f"DEBUG: Transaction reference: {reference}")
                print(f"DEBUG: Authorization URL: {data['data']['authorization_url']}")
                
                return {
                    'success': True,
                    'authorization_url': data['data']['authorization_url'],
                    'reference': reference,
                    'transaction': admin_transaction
                }
            else:
                error_msg = data.get('message', 'Unknown error')
                print(f"DEBUG: Paystack init error: {error_msg}")
                return {
                    'success': False,
                    'error': f"Paystack error: {error_msg}"
                }
                
        except requests.exceptions.RequestException as e:
            print(f"DEBUG: RequestException in init: {str(e)}")
            return {
                'success': False,
                'error': f"Connection error: {str(e)}"
            }
        except Exception as e:
            print(f"DEBUG: Exception in init: {str(e)}")
            import traceback
            print(f"DEBUG: Traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': f"Unexpected error: {str(e)}"
            }
        
    def verify_paystack_payment(self, reference):
        """Verify Paystack payment and fund wallet if successful"""
        import requests
        from django.conf import settings
        from django.db import transaction as db_transaction
        from decimal import Decimal  # ADD THIS IMPORT
        
        print(f"DEBUG: Starting Paystack verification for reference: {reference}")
        
        secret_key = settings.PAYSTACK_SECRET
        headers = {
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json"
        }
        
        try:
            print(f"DEBUG: Calling Paystack API: https://api.paystack.co/transaction/verify/{reference}")
            response = requests.get(
                f"https://api.paystack.co/transaction/verify/{reference}",
                headers=headers,
                timeout=30
            )
            
            print(f"DEBUG: Paystack API response status: {response.status_code}")
            
            response.raise_for_status()
            data = response.json()
            
            print(f"DEBUG: Paystack data status: {data.get('status')}")
            print(f"DEBUG: Transaction status: {data.get('data', {}).get('status')}")
            
            # Check if the API call was successful
            if data.get('status'):
                # Check the transaction status
                if data['data']['status'] == 'success':
                    # FIX: Convert float to Decimal
                    amount_float = data['data']['amount'] / 100  # Convert from kobo to float
                    amount = Decimal(str(amount_float))  # Convert float to Decimal
                    
                    print(f"DEBUG: Payment successful! Amount: {amount} (Type: {type(amount)})")
                    
                    # Use database transaction to ensure atomicity
                    with db_transaction.atomic():
                        # Update admin wallet balance
                        old_balance = self.balance
                        self.balance += amount  # Now both are Decimals
                        self.save()
                        
                        print(f"DEBUG: Wallet balance updated: {old_balance} -> {self.balance}")
                        
                        # Try to find existing transaction first
                        try:
                            transaction = AdminTransaction.objects.get(reference=reference)
                            print(f"DEBUG: Found existing transaction: {transaction.id}")
                            
                            # Update transaction
                            transaction.status = 'success'
                            transaction.balance_after = self.balance
                            transaction.description = f"Paystack funding completed - {data['data']['customer']['email']}"
                            transaction.save()
                            
                            print(f"DEBUG: Transaction updated to success")
                            
                        except AdminTransaction.DoesNotExist:
                            print(f"DEBUG: No existing transaction found, creating new one")
                            # Create new transaction
                            transaction = AdminTransaction.objects.create(
                                admin_wallet=self,
                                amount=amount,
                                balance_after=self.balance,
                                transaction_type='funding',
                                status='success',
                                reference=reference,
                                description=f"Paystack funding - {data['data']['customer']['email']}"
                            )
                            print(f"DEBUG: New transaction created: {transaction.id}")
                        
                        # Refresh from database
                        self.refresh_from_db()
                        
                        return {
                            'success': True,
                            'amount': float(amount),  # Return as float for display
                            'email': data['data']['customer']['email'],
                            'transaction_id': transaction.id
                        }
                else:
                    print(f"DEBUG: Payment not successful. Status: {data['data']['status']}")
                    
                    # Update existing transaction to failed
                    try:
                        transaction = AdminTransaction.objects.get(reference=reference)
                        transaction.status = 'failed'
                        transaction.save()
                        print(f"DEBUG: Transaction updated to failed")
                    except AdminTransaction.DoesNotExist:
                        print(f"DEBUG: No transaction to update to failed")
                    
                    error_msg = data['data'].get('gateway_response', 'Payment failed')
                    return {
                        'success': False,
                        'error': error_msg
                    }
            else:
                print(f"DEBUG: Paystack API returned error: {data.get('message')}")
                return {
                    'success': False,
                    'error': data.get('message', 'Unknown error')
                }
                
        except requests.exceptions.RequestException as e:
            print(f"DEBUG: RequestException: {str(e)}")
            return {
                'success': False,
                'error': f"Connection error: {str(e)}"
            }
        except Exception as e:
            print(f"DEBUG: Exception: {str(e)}")
            import traceback
            print(f"DEBUG: Traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': f"Verification error: {str(e)}"
            }
    
    def fund_wallet(self, amount, description="", created_by=None):
        """Manual funding method"""
        from decimal import Decimal
        from django.db import transaction as db_transaction
        
        with db_transaction.atomic():
            # Add funds to admin wallet
            self.balance += Decimal(amount)
            self.save()
            
            # Create admin transaction record
            admin_transaction = AdminTransaction.objects.create(
                admin_wallet=self,
                amount=amount,
                balance_after=self.balance,
                transaction_type='funding',
                status='success',
                description=description,
                created_by=created_by
            )
            
            return admin_transaction 
            
    
    def add_commission(self, amount, vendor, order_item, product, description=""):
        """
        Add commission to admin wallet
        """
        try:
            # Add to admin wallet balance
            self.balance += amount
            self.save()
            
            # Create transaction record
            AdminTransaction.objects.create(
                admin_wallet=self,
                amount=amount,
                balance_after=self.balance,
                transaction_type='commission',
                status='success',
                reference=f"COMM_{order_item.unique_id}",
                description=description,
                vendor=vendor,
                order_item=order_item,
                product=product
            )
            
            return True
        except Exception as e:
            print(f"Error adding commission to admin wallet: {str(e)}")
            return False
    
    def deduct_refund_commission(self, amount, vendor, order_item, description=""):
        """
        Deduct commission from admin wallet for refunds
        """
        try:
            # Check if enough balance
            if self.balance < amount:
                raise ValueError("Insufficient balance in admin wallet for refund commission deduction")
            
            # Deduct from admin wallet
            self.balance -= amount
            self.save()
            
            # Create transaction record
            AdminTransaction.objects.create(
                admin_wallet=self,
                amount=amount,
                balance_after=self.balance,
                transaction_type='refund_commission',
                status='success',
                reference=f"REFUND_COMM_{order_item.unique_id}",
                description=description,
                vendor=vendor,
                order_item=order_item
            )
            
            return True
        except Exception as e:
            print(f"Error deducting refund commission: {str(e)}")
            return False
    
    def credit_user_wallet(self, user, amount, description="", created_by=None):
        """Credit user wallet from admin wallet"""
        from decimal import Decimal
        from django.db import transaction as db_transaction
        import shortuuid  # ADD THIS IMPORT
        
        with db_transaction.atomic():
            # Check if admin has sufficient balance
            if not self.can_afford(amount):
                raise ValueError("Insufficient balance in admin wallet")
            
            # Get or create user wallet
            user_wallet, created = Wallet.objects.get_or_create(user=user)
            
            # Debit admin wallet
            self.balance -= Decimal(amount)
            self.total_credits_given += Decimal(amount)
            self.save()
            
            # Credit user wallet
            user_wallet.balance += Decimal(amount)
            user_wallet.save()
            
            # Create admin transaction record
            admin_transaction = AdminTransaction.objects.create(
                admin_wallet=self,
                amount=amount,
                balance_after=self.balance,
                transaction_type='user_credit',
                status='success',
                description=description,
                user=user,
                user_wallet=user_wallet,
                created_by=created_by
            )
            
            # Create user transaction record - FIXED: Use shortuuid.uuid()
            user_transaction = Transaction.objects.create(
                wallet=user_wallet,
                amount=amount,
                balance_after=user_wallet.balance,
                transaction_type='credit',
                status='success',
                reference=f"ADM_CR{shortuuid.uuid()[:8]}",  # FIXED
                description=f"Credit from admin: {description}"
            )
            
            return admin_transaction, user_transaction

class AdminTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('funding', 'Wallet Funding'),
        ('user_credit', 'User Credit'),
        ('refund', 'Refund'),
        ('withdrawal', 'Withdrawal'),
        ('vendor_payout', 'Vendor Payout')
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    )
    
    admin_wallet = models.ForeignKey(AdminWallet, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    reference = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    # For user credit transactions
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    user_wallet = models.ForeignKey(Wallet, on_delete=models.SET_NULL, null=True, blank=True)
    
    # For refund transactions
    order = models.ForeignKey(CartOrder, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='admin_transactions')
    created_at = models.DateTimeField(auto_now_add=True)
    # Add this field for vendor payouts
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True, related_name='payout_transactions')
    vendor_payout = models.ForeignKey('VendorPayout', on_delete=models.SET_NULL, null=True, blank=True, related_name='admin_transactions')
    
    class Meta:
        verbose_name_plural = "Admin Transactions"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.transaction_type} - ₦{self.amount} - {self.status}"
    
    def save(self, *args, **kwargs):
        # Only generate reference if it doesn't exist
        if not self.reference:
            import shortuuid
            self.reference = f"ADM{shortuuid.uuid()[:8]}"
        
        # Don't override status if it's already set
        super().save(*args, **kwargs)
        
        
        
# Add these to your existing models.py

class OrderRejection(models.Model):
    """Model for vendor order rejections"""
    REASON_CHOICES = (
        ('out_of_stock', 'Product is out of stock'),
        ('damaged', 'Product is damaged or not in sellable condition'),
        ('incorrect_listing', 'Product listed was incorrect or misleading'),
        ('fulfillment_issue', 'Cannot fulfill due to unexpected issues'),
        ('other', 'Other reasons'),
    )
    
    order_item = models.ForeignKey(CartOrderItems, on_delete=models.CASCADE, related_name='rejections')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='order_rejections')
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    rejected_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_rejections')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-rejected_at']
        verbose_name_plural = "Order Rejections"
    
    def __str__(self):
        return f"Rejection for Order #{self.order_item.order.oid}"  # This should work
    
    def save(self, *args, **kwargs):
        # Update vendor's rejection count when created
        if self.pk is None:  # Only on creation
            self.vendor.rejection_count += 1
            self.vendor.last_rejection_date = timezone.now()
            self.vendor.save()
        super().save(*args, **kwargs)

class Notification(models.Model):
    """Model for system notifications"""
    NOTIFICATION_TYPES = (
        ('order_rejected', 'Order Rejected by Vendor'),
        ('refund_approved', 'Refund Approved'),
        ('account_warning', 'Account Warning'),
        ('order_update', 'Order Status Update'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    order = models.ForeignKey(CartOrder, on_delete=models.SET_NULL, null=True, blank=True)
    order_item = models.ForeignKey(CartOrderItems, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Notifications"
    
    def __str__(self):
        return f"{self.notification_type} - {self.user.email}"
        
        
        
        
class VendorPayout(models.Model):
    PAYOUT_STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved - Processing'),
        ('processing', 'Processing Payment'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('rejected', 'Rejected'),
    )
    
    PAYOUT_METHOD_CHOICES = (
        ('bank_transfer', 'Bank Transfer'),
        ('wallet', 'Wallet Credit'),
        ('paystack', 'Paystack Payout'),
        ('other', 'Other'),
    )
    
    # Basic info
    payout_id = ShortUUIDField(unique=True, length=10, prefix="PAY", alphabet="1234567890")
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='payouts')
    
    # Amount details
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    fee = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Transaction fee")
    net_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Amount after fees")
    
    # Status and method
    status = models.CharField(max_length=20, choices=PAYOUT_STATUS_CHOICES, default='pending')
    payout_method = models.CharField(max_length=20, choices=PAYOUT_METHOD_CHOICES, default='bank_transfer')
    
    # Payment details
    payment_reference = models.CharField(max_length=100, blank=True, null=True)
    payment_date = models.DateTimeField(blank=True, null=True)
    
    # Bank details (if applicable)
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    account_name = models.CharField(max_length=255, blank=True, null=True)
    account_number = models.CharField(max_length=20, blank=True, null=True)
    
    # Tracking
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='requested_payouts')
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_payouts')
    approved_at = models.DateTimeField(blank=True, null=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_payouts')
    processed_at = models.DateTimeField(blank=True, null=True)
    
    # Notes
    vendor_notes = models.TextField(blank=True, null=True, help_text="Notes from vendor")
    admin_notes = models.TextField(blank=True, null=True, help_text="Notes from admin")
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Order period
    period_start = models.DateField(help_text="Start date for orders included")
    period_end = models.DateField(help_text="End date for orders included")
    
    # Orders included in this payout
    orders = models.ManyToManyField(CartOrderItems, through='PayoutOrder', related_name='payouts')
    
    # Auto-generated
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Vendor Payouts"
        ordering = ['-requested_at']
    
    def __str__(self):
        return f"Payout {self.payout_id} - {self.vendor.name} - ₦{self.net_amount}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate net amount
        if not self.net_amount:
            self.net_amount = self.amount - self.fee
        super().save(*args, **kwargs)
    
    def get_status_color(self):
        """Return CSS color class for status"""
        colors = {
            'pending': 'warning',
            'approved': 'info',
            'processing': 'primary',
            'completed': 'success',
            'failed': 'danger',
            'rejected': 'secondary',
        }
        return colors.get(self.status, 'secondary')
    
    def can_approve(self):
        """Check if payout can be approved"""
        return self.status == 'pending'
    
    def can_process(self):
        """Check if payout can be processed"""
        return self.status == 'approved'
    
    def can_reject(self):
        """Check if payout can be rejected"""
        return self.status in ['pending', 'approved']
        
        

class PayoutOrder(models.Model):
    """Intermediate model for orders included in payout"""
    payout = models.ForeignKey(VendorPayout, on_delete=models.CASCADE)
    order_item = models.ForeignKey(CartOrderItems, on_delete=models.CASCADE)
    order_amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.00, help_text="Platform commission %")
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    vendor_amount = models.DecimalField(max_digits=10, decimal_places=2)
    included_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['payout', 'order_item']
        verbose_name_plural = "Payout Orders"
    
    def __str__(self):
        return f"{self.payout.payout_id} - {self.order_item.item}"
        
        

class VendorEarning(models.Model):
    """Tracks daily vendor earnings for payout calculation"""
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='earnings')
    date = models.DateField()
    
    # Earnings breakdown
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_orders = models.IntegerField(default=0)
    platform_commission = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    vendor_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Payout status
    is_paid = models.BooleanField(default=False)
    payout = models.ForeignKey(VendorPayout, on_delete=models.SET_NULL, null=True, blank=True, related_name='daily_earnings')
    
    # Auto fields
    calculated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Vendor Earnings"
        unique_together = ['vendor', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.vendor.name} - {self.date} - ₦{self.vendor_earnings}"
    
    def calculate_earnings(self, commission_rate=10.0):
        """Calculate earnings from orders for this date"""
        from django.db.models import Sum, Count
        
        # Get orders for this vendor on this date
        orders = CartOrderItems.objects.filter(
            vendor_id=self.vendor.vid,
            order_date__date=self.date,
            product_status='Delivered'  # Only count delivered orders
        )
        
        # Calculate totals
        total_sales = orders.aggregate(
            total=Sum(F('price') * F('qty'))
        )['total'] or 0
        
        total_orders = orders.count()
        
        # Calculate commission and earnings
        platform_commission = (total_sales * commission_rate) / 100
        vendor_earnings = total_sales - platform_commission
        
        # Update fields
        self.total_sales = total_sales
        self.total_orders = total_orders
        self.platform_commission = platform_commission
        self.vendor_earnings = vendor_earnings
        
        self.save()
        
# Add this to your models.py

class AdminNotification(models.Model):
    """Model for admin notifications"""
    NOTIFICATION_TYPES = (
        ('new_order', 'New Order Placed'),
        ('new_vendor', 'New Vendor Registration'),
        ('vendor_response', 'Vendor Response to Order'),
        ('return_request', 'Return Request'),
        ('low_stock', 'Low Stock Alert'),
        ('critical_stock', 'Critical Stock Alert'),
        ('product_review', 'New Product Review'),
        ('pending_product', 'Product Pending Approval'),
        ('edited_product', 'Product Edit Pending Review'),
        ('order_rejection', 'Vendor Rejected Order'),
        ('payout_request', 'Vendor Payout Request'),
    )
    
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Related objects (optional - for linking to specific items)
    order = models.ForeignKey(CartOrder, on_delete=models.CASCADE, null=True, blank=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    # Action URL (where clicking the notification should take the admin)
    action_url = models.CharField(max_length=500, blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Admin Notifications"
    
    def __str__(self):
        return f"{self.notification_type} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        self.save()
    
    def get_icon_class(self):
        """Return appropriate icon class based on notification type"""
        icons = {
            'new_order': 'bx-shopping-bag',
            'new_vendor': 'bx-store',
            'vendor_response': 'bx-message-square-check',
            'return_request': 'bx-revision',
            'low_stock': 'bx-error-circle',
            'critical_stock': 'bx-error',
            'product_review': 'bx-star',
            'pending_product': 'bx-package',
            'edited_product': 'bx-edit',
            'order_rejection': 'bx-x-circle',
            'payout_request': 'bx-wallet',
        }
        return icons.get(self.notification_type, 'bx-bell')
    
    def get_color_class(self):
        """Return appropriate color class based on notification type"""
        colors = {
            'new_order': 'success',
            'new_vendor': 'info',
            'vendor_response': 'primary',
            'return_request': 'warning',
            'low_stock': 'warning',
            'critical_stock': 'danger',
            'product_review': 'info',
            'pending_product': 'secondary',
            'edited_product': 'primary',
            'order_rejection': 'danger',
            'payout_request': 'success',
        }
        return colors.get(self.notification_type, 'secondary')
        
# In your models.py (add this to your existing models)

class VisitSource(models.Model):
    SOURCE_CHOICES = [
        ('direct', 'Direct'),
        ('facebook', 'Facebook'),
        ('whatsapp', 'WhatsApp'),
        ('instagram', 'Instagram'),
        ('youtube', 'YouTube'),
        ('twitter', 'Twitter'),
        ('google', 'Google'),
        ('referral', 'Referral'),
        ('email', 'Email'),
        ('other', 'Other'),
    ]
    
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, default='direct')
    referrer_url = models.URLField(max_length=500, null=True, blank=True)
    landing_page = models.CharField(max_length=500, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True)
    session_key = models.CharField(max_length=100, null=True, blank=True)
    utm_source = models.CharField(max_length=100, null=True, blank=True)
    utm_medium = models.CharField(max_length=100, null=True, blank=True)
    utm_campaign = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Visit Sources"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.source} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
        
class SocialShare(models.Model):
    PLATFORM_CHOICES = [
        ('facebook', 'Facebook'),
        ('twitter', 'Twitter'),
        ('whatsapp', 'WhatsApp'),
        ('telegram', 'Telegram'),
        ('linkedin', 'LinkedIn'),
        ('pinterest', 'Pinterest'),
        ('email', 'Email'),
        ('copy_link', 'Copy Link'),
    ]
    
    platform = models.CharField(max_length=50, choices=PLATFORM_CHOICES)
    title = models.CharField(max_length=500)
    url = models.URLField(max_length=500)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    product = models.ForeignKey('Product', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Social Shares"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.platform} - {self.title[:50]}"
        
        
        
# In your core/models.py

class Delivery(models.Model):
    """
    Track multiple deliveries per order (one per vendor)
    """
    DELIVERY_STATUS = (
        ('pending', 'Pending'),
        ('quote_requested', 'Quote Requested'),
        ('quote_received', 'Quote Received'),
        ('order_created', 'Order Created'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )
    
    order = models.ForeignKey(CartOrder, on_delete=models.CASCADE, related_name='deliveries')
    
    # Use vendor_identifier instead of vendor_id to avoid clash
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True)
    vendor_identifier = models.CharField(max_length=1000, null=True, blank=True, help_text="Vendor ID from CartOrderItems")
    vendor_name = models.CharField(max_length=200, null=True, blank=True)
    
    # Trippa tracking
    tracking_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=20, choices=DELIVERY_STATUS, default='pending')
    
    # Delivery details
    pickup_address = models.JSONField(default=dict)
    delivery_address = models.JSONField(default=dict)
    item_details = models.JSONField(default=dict)
    
    # API responses
    quote_response = models.JSONField(null=True, blank=True)
    order_response = models.JSONField(null=True, blank=True)
    tracking_response = models.JSONField(null=True, blank=True)
    
    # Metadata
    partner = models.CharField(max_length=50, default='dhl')
    partner_id = models.CharField(max_length=50, default='6')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Deliveries"
    
    def __str__(self):
        return f"Delivery for Order {self.order.oid} - {self.tracking_id or 'Pending'}"
    
    def get_tracking_url(self):
        """Get Trippa tracking URL"""
        if self.tracking_id:
            return f"/ng/track-delivery/{self.tracking_id}/"
        return None
        
class DeliveryZone(models.Model):
    STATUS_CHOICES = [
        ('active',   'Active'),
        ('limited',  'Limited Service'),
        ('inactive', 'Inactive'),
    ]
 
    state_slug  = models.CharField(max_length=100)          # e.g. 'lagos'
    state_name  = models.CharField(max_length=100)          # e.g. 'Lagos'
    city_id     = models.CharField(max_length=100)          # e.g. 'ikeja'
    city_name   = models.CharField(max_length=200)          # e.g. 'Ikeja'
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    base_fee    = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    est_days    = models.PositiveIntegerField(default=1, help_text="Estimated delivery days")
    notes       = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    created_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
 
    class Meta:
        verbose_name        = "Delivery Zone"
        verbose_name_plural = "Delivery Zones"
        ordering            = ['state_name', 'city_name']
        unique_together     = ('state_slug', 'city_id')
 
    def __str__(self):
        return f"{self.city_name}, {self.state_name}"
 
    @property
    def status_color(self):
        return {'active': 'success', 'limited': 'warning', 'inactive': 'danger'}.get(self.status, 'secondary')
 
 
class DeliveryZoneLog(models.Model):
    ACTION_CHOICES = [
        ('added',   'Zone Added'),
        ('updated', 'Zone Updated'),
        ('deleted', 'Zone Deleted'),
    ]
    zone_name   = models.CharField(max_length=300)   # keep even after zone deleted
    action      = models.CharField(max_length=20, choices=ACTION_CHOICES)
    performed_by= models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        ordering = ['-created_at']
 
    def __str__(self):
        return f"{self.action} — {self.zone_name}"
 
    @property
    def action_icon(self):
        return {'added': 'ri-add-line', 'updated': 'ri-edit-line', 'deleted': 'ri-delete-bin-line'}.get(self.action, 'ri-information-line')
 
    @property
    def action_color(self):
        return {'added': 'success', 'updated': 'info', 'deleted': 'danger'}.get(self.action, 'secondary')
 
class DeliveryTown(models.Model):
    zone       = models.ForeignKey(DeliveryZone, on_delete=models.CASCADE, related_name='towns')
    name       = models.CharField(max_length=200)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering        = ['name']
        unique_together = ('zone', 'name')

    def __str__(self):
        return f"{self.name} — {self.zone}"
        
        
        

class ProductColorSizeStock(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='color_size_stocks')
    color = models.ForeignKey(ProductColor, on_delete=models.CASCADE)
    size = models.ForeignKey(ProductSize, on_delete=models.CASCADE)
    stock = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['product', 'color', 'size']
    
    def __str__(self):
        return f"{self.product.title} - {self.color.color_name} / {self.size.size}: {self.stock}"
