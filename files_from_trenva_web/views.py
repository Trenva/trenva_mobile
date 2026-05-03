import json
from django.shortcuts import render, get_object_or_404, redirect
from core import signals  
from django.shortcuts import HttpResponse
from django.http import JsonResponse
from django.db.models import Avg
from taggit.models import Tag
from django.contrib import messages
from core.models import Product, Category, Vendor, CartOrderItems, CartOrder, ProductImages, ProductReview, FlashSale, Wishlist, Address, SubCategory, LevelTwoCategory, Background, Brand, Slider, ProductColor, ProductSize, CompareProduct, SaveCustomerCart, SearchHistory, NewsLetter, Coupon, CouponEmail, ContactForm, AboutSite, Testimonial, Cart, State, Lgas, Ward, AdminTransaction, AdminWallet
from userauths.models import User
from core.forms import ProductReviewForm
from core.forms import AddressCountryList 
from core.forms import CategoryList
from core.forms import ProductPics
from core.services.trippa import TrippaDelivery
from django.db.models import Count
from django.core.paginator import Paginator
from core.forms import VendorOptionList
from django.template.loader import render_to_string
from django.contrib.humanize.templatetags.humanize import intcomma
from django.contrib.auth.decorators import login_required
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics, viewsets, status, filters
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from datetime import datetime, timedelta
# from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.template.loader import render_to_string
from django.dispatch import receiver
import json
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
import uuid
from django.db.models import Sum, F
import shortuuid
from django.core.files.storage import FileSystemStorage
import os, re
import json
import threading
import requests
from decimal import Decimal  # Import Decimal for type conversion
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.conf import settings
from django.contrib import messages
from django.urls import reverse
from core.models import Wallet, Transaction
from django.shortcuts import render, redirect
from django.db.models import Sum, F
from .models import Cart, Address, Coupon, CouponEmail, CartOrder, CartOrderItems, SaveCustomerCart, Wishlist
import uuid
from core.models import *
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
import requests
from django.db.models import Min, Max
from trenva import settings
from rest_framework import generics
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum, F
from decimal import Decimal
import requests
from django.core.mail import EmailMessage
import uuid
import shortuuid
import logging
from django.conf import settings
from django.urls import reverse
from .models import Cart, Address, Coupon, CartOrder, CartOrderItems
from core.models import Product, ProductColor, ProductSize, ProductImages
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from userauths.models import User  
from django.contrib import messages
from core.models import Vendor
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
# from core.forms import VendorProfileForm
from django.contrib.auth.decorators import login_required
from rest_framework.renderers import JSONRenderer
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from datetime import datetime
from core.models import Coupon, CouponEmail
from django.db import transaction
from django.contrib import messages
import requests
from django.views.decorators.http import require_POST
from django.conf import settings
from django.shortcuts import redirect
from .models import Cart, SaveCustomerCart
from core.serializers import *
from django.contrib.auth.decorators import login_required

def home(request):
    category = Category.objects.prefetch_related('sub_category__sublevel_two_category')
    
    # Get active flash sales with products
    active_flash_sales = FlashSale.objects.filter(
        is_active=True,
        featured=True  # Only featured flash sales on homepage
    ).prefetch_related('flash_sale_products__product').order_by('-created_at')[:3]  # Get top 3
    
    # For each flash sale, get its products
    flash_sales_with_products = []
    for flash_sale in active_flash_sales:
        # Check if not expired
        if not flash_sale.is_expired():
            products = []
            for fs_product in flash_sale.flash_sale_products.all()[:8]:  # Limit to 8 products per flash sale
                if fs_product.product.in_stock and fs_product.product.product_status == 'published':
                    products.append({
                        'product': fs_product.product,
                        'flash_price': fs_product.flash_sale_price or fs_product.product.price,
                        'original_price': fs_product.product.price,
                        'has_discount': fs_product.flash_sale_price is not None
                    })
            
            if products:  # Only add if there are products
                flash_sales_with_products.append({
                    'flash_sale': flash_sale,
                    'products': products,
                    'time_remaining': flash_sale.get_remaining_time()
                })
    
    # ADD in_stock=True to ALL product queries
    product = Product.objects.filter(
        product_status="published", 
        promo=True,
        in_stock=True
    ).order_by('-date')[:40]
    
    product_time = product.first()
    verified = Product.objects.filter(
        vendor="2", 
        product_status="published",
        in_stock=True
    ).order_by('-date')[:2]
    
    awoof = Product.objects.filter(
        promo=True, 
        product_status="published",
        in_stock=True
    ).order_by('-date')[:3]
    
    new = Product.objects.filter(
        product_status="published",
        in_stock=True
    ).order_by('-date')[:8]
    
    # SECTION 1: Random products from ALL categories - For "Explore Our Products"
    plore = Product.objects.filter(
        product_status="published",
        in_stock=True
    ).order_by('?')[:8]
    
    # SECTION 2: BEST-SELLING PRODUCTS
    best_selling = Product.objects.filter(
        product_status="published",
        in_stock=True,
        promo=True
    ).order_by('-date')[:8]
    
    # If not enough promo products, fill with featured or newest
    if best_selling.count() < 8:
        featured_products = Product.objects.filter(
            product_status="published",
            in_stock=True,
            featured=True
        ).exclude(id__in=[p.id for p in best_selling])[:8 - best_selling.count()]
        
        best_selling = list(best_selling)
        best_selling.extend(list(featured_products))
        
        if len(best_selling) < 8:
            newest_products = Product.objects.filter(
                product_status="published",
                in_stock=True
            ).exclude(id__in=[p.id for p in best_selling]).order_by('-date')[:8 - len(best_selling)]
            best_selling.extend(list(newest_products))
    
    # Get THREE DIFFERENT random categories
    all_categories = list(Category.objects.all())
    
    if len(all_categories) >= 3:
        import random
        random_categories = random.sample(all_categories, 3)
        cat1 = random_categories[0]
        cat2 = random_categories[1]
        cat3 = random_categories[2]
    elif len(all_categories) == 2:
        cat1 = all_categories[0]
        cat2 = all_categories[1]
        cat3 = all_categories[0]
    elif len(all_categories) == 1:
        cat1 = cat2 = cat3 = all_categories[0]
    else:
        cat1 = cat2 = cat3 = None
    
    cat1_products = Product.objects.filter(
        category=cat1, 
        product_status="published",
        in_stock=True
    ).order_by('?')[:8] if cat1 else []
    
    cat2_products = Product.objects.filter(
        category=cat2, 
        product_status="published",
        in_stock=True
    ).order_by('?')[:8] if cat2 else []
    
    cat3_products = Product.objects.filter(
        category=cat3, 
        product_status="published",
        in_stock=True
    ).order_by('?')[:8] if cat3 else []
    
    limited_products = Product.objects.filter(
        product_status="published",
        in_stock=True,
        stock_count__gt = 0,
        stock_count__lt = 20
    ).order_by("-date")[:15]
    
    background = Background.objects.all().order_by('date')
    sliders = Slider.objects.all()
    large = Category.objects.all().order_by("-date")[:1]
    
    ran_product = Product.objects.filter(
        product_status="published",
        in_stock=True
    ).order_by("-date").first()
    
    latest_cat = Category.objects.all().order_by("-date").first()
    ch_cat = Category.objects.order_by("?").last()
    pch_cat = Category.objects.exclude(id=ch_cat.id).order_by("?").first()
    
    sc = Product.objects.filter(
        product_status="published", 
        category=ch_cat,
        in_stock=True
    ).order_by("?").first()
    
    pc = Product.objects.filter(
        product_status="published", 
        category=pch_cat,
        in_stock=True
    ).order_by("?").first()
    
    ele = Product.objects.filter(
        product_status="published", 
        promo=True,
        in_stock=True
    ).order_by("?")[:1]
    
    arrivals = Product.objects.filter(
        product_status="published",
        in_stock=True
    ).order_by('-date')[:100] 

    context = {
        "cat": category,
        "fea": product,
        "fea_time": product_time,
        "elect": product,
        "trenva": verified,
        "awoof": awoof,
        "bg": background,
        "slider": sliders,
        "plore": plore,
        
        # NEW: Flash Sales
        "flash_sales_data": flash_sales_with_products,
        "limited_products": limited_products,
        "best_selling": best_selling,
        
        "cat1": cat1,
        "cat1_products": cat1_products,
        
        "cat2": cat2,
        "cat2_products": cat2_products,
        
        "cat3": cat3,
        "cat3_products": cat3_products,
        
        "nplore_cat": cat2,
        "nplore": cat2_products,
        "dplore_cat": cat1,
        "dplore": cat1_products,
        
        "new": new,
        "large": large,
        "ele": ele,
        "dom": ran_product,
        "lt": latest_cat,
        "sc": sc,
        "pc": pc,
        "w": arrivals,
    }
    return render(request, "core/home.html", context)
    
def flash_sale_products(request, flash_sale_id):
    """Customer view for all products in a flash sale"""
    flash_sale = get_object_or_404(FlashSale, id=flash_sale_id, is_active=True)
    
    # Check if flash sale is expired
    if flash_sale.is_expired():
        messages.warning(request, 'This flash sale has ended.')
        return redirect('home')
    
    # Get search and filter parameters
    search_query = request.GET.get('search', '')
    category_filter = request.GET.get('category', '')
    sort_by = request.GET.get('sort', 'default')
    
    # Get all products in this flash sale
    flash_sale_products = FlashSaleProduct.objects.filter(
        flash_sale=flash_sale,
        product__in_stock=True,
        product__product_status='published'
    ).select_related('product', 'product__category', 'product__vendor')
    
    # Apply search
    if search_query:
        flash_sale_products = flash_sale_products.filter(
            Q(product__title__icontains=search_query) |
            Q(product__sku__icontains=search_query)
        )
    
    # Apply category filter
    if category_filter:
        flash_sale_products = flash_sale_products.filter(product__category_id=category_filter)
    
    # Apply sorting
    if sort_by == 'price_low':
        flash_sale_products = flash_sale_products.order_by('product__price')
    elif sort_by == 'price_high':
        flash_sale_products = flash_sale_products.order_by('-product__price')
    elif sort_by == 'name':
        flash_sale_products = flash_sale_products.order_by('product__title')
    elif sort_by == 'discount':
        # Sort by discount percentage (products with flash_sale_price first)
        flash_sale_products = sorted(
            flash_sale_products,
            key=lambda x: (
                ((x.product.price - (x.flash_sale_price or x.product.price)) / x.product.price * 100) 
                if x.flash_sale_price else 0
            ),
            reverse=True
        )
    else:
        flash_sale_products = flash_sale_products.order_by('-added_at')
    
    # Pagination
    paginator = Paginator(flash_sale_products, 30)  # 20 products per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Get categories for filter
    categories_in_sale = Category.objects.filter(
        category__in=[fp.product for fp in flash_sale_products if fp.product.category]
    ).distinct()
    
    # Get time remaining
    time_remaining = flash_sale.get_remaining_time()
    
    # Calculate statistics
    total_products = flash_sale_products.count() if isinstance(flash_sale_products, list) else flash_sale_products.count()
    
    context = {
        'flash_sale': flash_sale,
        'flash_sale_products': page_obj,
        'page_obj': page_obj,
        'time_remaining': time_remaining,
        'categories': categories_in_sale,
        'search_query': search_query,
        'category_filter': category_filter,
        'sort_by': sort_by,
        'total_products': total_products,
    }
    
    return render(request, 'core/flash-sale-products.html', context)

def index(request):
    category = Category.objects.all()[:10]
    product = Product.objects.filter(product_status="published").order_by('-date')[:40]
    verified = Product.objects.filter(vendor="2", product_status="published").order_by('-date')[:2]
    awoof = Product.objects.filter(promo=True, product_status="published").order_by('-date')[:3]
    new = Product.objects.filter(product_status="published").order_by('-date')[:8]
    plore = Product.objects.filter(product_status="published").order_by('?')[:8]
    background = Background.objects.all().order_by('date')
    sliders = Slider.objects.all()
    large = Category.objects.all().order_by("-date")[:1]
    ran_product = Product.objects.filter(product_status="published").order_by("-date").first()
    latest_cat = Category.objects.all().order_by("-date").first()
    ch_cat = Category.objects.all().order_by("?").first()
    pch_cat = Category.objects.all().order_by("?").first()
    sc = Product.objects.filter(product_status="published", category=ch_cat).order_by("?").first()
    pc = Product.objects.filter(product_status="published", category=pch_cat).order_by("?").first()
    ele = Product.objects.filter(product_status="published").order_by("?").first()

    context = {
        "cat": category,
        "fea": product,
        "elect": product,
        "trenva": verified,
        "awoof": awoof,
        "bg": background,
        "slider": sliders,
        "plore": plore,
        "new": new,
        "large": large,
        "ele": ele,
        "dom": ran_product,
        "lt": latest_cat,
        "sc": sc,
        "pc": pc,
    }

    return render(request, "core/index.html", context)

def shopgrid(request):
    categories = Category.objects.all()
    products = Product.objects.filter(product_status="published")

    # --- FILTERS ---
    sort_by = request.GET.get('sort_by')
    category = request.GET.get('category')
    brand = request.GET.get('brand')
    colour = request.GET.get('colour')
    location = request.GET.get('location')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    shipping = request.GET.get('shipping')

    if category:
        products = products.filter(category__id=category)

    if brand:
        products = products.filter(brand__id=brand)

    if colour:
        products = products.filter(colour__iexact=colour)

    if location:
        products = products.filter(location__id=location)

    if min_price:
        products = products.filter(price__gte=min_price)

    if max_price:
        products = products.filter(price__lte=max_price)

    if shipping == "free":
        products = products.filter(free_shipping=True)
    elif shipping == "discount":
        products = products.filter(discount_shipping=True)

    if sort_by == "new":
        products = products.order_by("-date")
    elif sort_by == "top":
        products = products.order_by("-rating")
    elif sort_by == "discount":
        products = products.filter(promo=True)
    else:
        products = products.order_by("-date")  # default relevance

    context = {
        "fea": Product.objects.filter(featured=True),
        "product": products,
        "topthree": Product.objects.filter(product_status="published", featured=True).order_by('-date')[:10],
        "categories": categories,
        "awoof": Product.objects.filter(promo=True, product_status="published").order_by('-date')[:10],
        "verified": Product.objects.filter(vendor="2", product_status="published").order_by('-date')[:10],
        "quick": Product.objects.all(),
        "ven": Vendor.objects.all(),
    }
    return render(request, "core/shop.html", context)


@user_required
def cart(request):
    cart_items = Cart.objects.filter(user=request.user).select_related('product')
    
    # Calculate total using product price
    total = Decimal("0.00")
    for item in cart_items:
        price = item.product.price
        total += price * item.qty
    
    # Prepare cart items with color/size details
    cart_items_with_details = []
    for item in cart_items:
        price = item.product.price
        
        # Get stock info from color if selected
        stock_available = item.product.stock_count
        if item.product_color and item.product_color != "Default":
            color_obj = ProductColor.objects.filter(
                color_name=item.product_color,
                product=item.product
            ).first()
            if color_obj:
                stock_available = color_obj.stock
        
        if item.product_size and item.product_size != "Default":
            size_obj = ProductSize.objects.filter(
                size=item.product_size,
                product=item.product
            ).first()
            if size_obj:
                stock_available = min(stock_available, size_obj.stock)
        
        cart_items_with_details.append({
            'id': item.id,
            'product': item.product,
            'qty': item.qty,
            'price': price,
            'total_price': price * item.qty,
            'product_color': item.product_color,
            'product_size': item.product_size,
            'stock_available': stock_available,
            'image': item.product.image,
        })
    
    # Pull coupon data from session
    coupon_code = request.session.get('coupon_code', '')
    discount_amount = Decimal(str(request.session.get('discount_amount', 0)))
    final_total = Decimal(str(request.session.get('final_total', total)))
    
    if not coupon_code:
        discount_amount = Decimal("0.00")
        final_total = total
    
    context = {
        'cart': cart_items_with_details,
        'total': total,
        'discount': discount_amount,
        'final_total': final_total,
        'coupon_code': coupon_code,
    }
    return render(request, "core/cart.html", context)



    
def sync_cart(request):
    # Your existing cart logic here...
    cart_items = Cart.objects.filter(user=request.user)   # adjust to your model
    # total = sum(item.total_price for item in cart_items)
    total = cart_items.aggregate(
        total=Sum(F('product__price') * F('qty'))
    )['total'] or 0
 
    # ── Pull coupon data from session ────────────────────────
    coupon_code     = request.session.get('coupon_code', '')
    discount_amount = request.session.get('discount_amount', 0)
    final_total     = request.session.get('final_total', total)
 
    # If no coupon in session, final_total = total
    if not coupon_code:
        discount_amount = 0
        final_total     = total
 
    context = {
        'cart':         cart_items,
        'total':        total,
        'discount':     discount_amount,
        'final_total':  final_total,
        'coupon_code':  coupon_code,
    }
    return render(request, "core/sync-cart.html", context)

from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def apply_coupon(request):
    
    coupon_code = request.POST.get('coupon_code', '').strip().upper()

    if not coupon_code:
        return JsonResponse({'success': False, 'message': 'Please enter a coupon code.'})

    try:
        coupon = Coupon.objects.get(coupon_code__iexact=coupon_code, active=True)
    except Coupon.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Invalid coupon code. Please check and try again.'})

    # ── Expiry check ────────────────────────────────────────
    if coupon.expiry_date and timezone.now() > coupon.expiry_date:
        return JsonResponse({'success': False, 'message': 'This coupon has expired.'})

    # ── Usage limit check ───────────────────────────────────
    if coupon.usage_limit is not None and coupon.usage_count >= coupon.usage_limit:
        return JsonResponse({'success': False, 'message': 'This coupon has reached its usage limit.'})

    # ── Specific users check ────────────────────────────────
    if coupon.specific_users.exists():
        if not coupon.specific_users.filter(id=request.user.id).exists():
            return JsonResponse({'success': False, 'message': 'This coupon is not valid for your account.'})

    # ── Cart total & minimum order check ────────────────────
    cart = CartOrder.objects.filter(user=request.user, paid_status=False)  # adjust to your cart model
    # Calculate cart total
    cart_total = sum(item.total_price() for item in Cart.objects.filter(user=request.user))
    if coupon.minimum_order and cart_total < coupon.minimum_order:
        return JsonResponse({
            'success': False,
            'message': f'Minimum order of ₦{coupon.minimum_order:,.2f} required to use this coupon.'
        })

    # ── Calculate discount ───────────────────────────────────
    if coupon.discount_type == 'percentage':
        discount_amount = (cart_total * float(coupon.discount)) / 100
    else:
        discount_amount = min(float(coupon.discount), cart_total)

    final_total = cart_total - discount_amount

    # ── Store in session ─────────────────────────────────────
    request.session['new_price_after_coupon'] = float(final_total)   # checkout looks for this
    request.session['thecoupon']              = coupon.coupon_code    # checkout looks for this
    request.session['coupon_id']        = coupon.id
    request.session['coupon_code']      = coupon.coupon_code
    request.session['discount_amount']  = float(discount_amount)
    request.session['cart_total']       = float(cart_total)
    request.session['final_total']      = float(final_total)
    request.session.modified            = True

    return JsonResponse({
        'success':         True,
        'message':         f'Coupon applied! You saved ₦{discount_amount:,.2f}',
        'coupon_code':     coupon.coupon_code,
        'discount_type':   coupon.discount_type,
        'discount_value':  float(coupon.discount),
        'discount_amount': float(discount_amount),
        'cart_total':      float(cart_total),
        'final_total':     float(final_total),
    })

@csrf_exempt
def remove_coupon(request):
    """Remove applied coupon from session."""
    request.session.pop('coupon_id',       None)
    request.session.pop('coupon_code',     None)
    request.session.pop('discount_amount', None)
    request.session.pop('cart_total',      None)
    request.session.pop('final_total',     None)
    request.session.modified = True

    # Recalculate original total
    cart_total = sum(item.total_price() for item in Cart.objects.filter(user=request.user))

    return JsonResponse({
        'success':    True,
        'cart_total': float(cart_total),
        'final_total': float(cart_total),
    })



def slide_cart(request):
    cart_total_amount = 0
    total = 0
    if 'cart_data_obj' in request.session:
        for p_id, item in request.session['cart_data_obj'].items():
            change = item['price']
            without_comma = change.replace(',', '')
            cart_total_amount += int(item['qty']) * float(without_comma)
            total = int(item['qty']) * float(without_comma)
    return render(request, "core/update-cart-slide.html", {"cart_data": request.session['cart_data_obj'], "total": total, 'totalcartitems': len(request.session['cart_data_obj']), 'cart_total_amount':cart_total_amount})


def category(request):
    cat = Category.objects.all()
    cate = Category.objects.all()[:1]
    
    # ADD in_stock=True filter
    list = Product.objects.filter(
        product_status="published",
        in_stock=True  # ADD THIS
    )[:10]
    
    topthree = Product.objects.filter(
        product_status="published", 
        featured=True,
        in_stock=True  # ADD THIS
    ).order_by('-date')[:3]

    context = {
        "cat": cat,
        "cate": cate,
        "list": list,
        "topthree": topthree,
    }
    return render(request, "core/product-category.html", context)

from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

def limited_products(request):
    """Limited products page with subcategories and pagination"""
    categories = Category.objects.all()
    
    # Get all limited products (stock < 30 and > 0)
    all_limited_products = Product.objects.filter(
        product_status="published",
        in_stock=True,
        stock_count__lt=30,  # Less than 30
        stock_count__gt=0     # Greater than 0
    ).order_by('-date')
    
    # Pagination - 20 products per page
    paginator = Paginator(all_limited_products, 20)
    page_number = request.GET.get('page')
    
    try:
        products = paginator.page(page_number)
    except PageNotAnInteger:
        products = paginator.page(1)
    except EmptyPage:
        products = paginator.page(paginator.num_pages)
    
    # Get price range for filters
    prices = all_limited_products.values_list('price', flat=True)
    lowest = min(prices) if prices else 0
    highest = max(prices) if prices else 100000
    
    context = {
        "categories": categories,
        "products": products,  # ✅ FIXED: Use paginated products
        "all_products": all_limited_products,
        "total_products": all_limited_products.count(),
        "lowest": lowest,
        "highest": highest,
    }
    return render(request, "core/limited_products.html", context)

def product_cat(request, cid):
    """Category page with subcategories and pagination"""
    category = Category.objects.get(cid=cid)
    
    # Get all products in this category
    all_products = Product.objects.filter(
        product_status="published", 
        category=category,
        in_stock=True
    ).order_by('-date')
    
    # Pagination - 20 products per page
    paginator = Paginator(all_products, 30)
    page_number = request.GET.get('page')
    
    try:
        products = paginator.page(page_number)
    except PageNotAnInteger:
        products = paginator.page(1)
    except EmptyPage:
        products = paginator.page(paginator.num_pages)
    
    # Get price range for filters
    prices = all_products.values_list('price', flat=True)
    lowest = min(prices) if prices else 0
    highest = max(prices) if prices else 100000
    
    # Get subcategories for this category
    subcategories = SubCategory.objects.filter(category=category).order_by('title')
    
    cat = Category.objects.all()[:10]
    topthree = Product.objects.filter(
        product_status="published", 
        featured=True,
        in_stock=True
    ).order_by('-date')[:3]

    context = {
        "category": category,
        "products": products,
        "subcategories": subcategories,
        "cat": cat,
        "lowest": lowest,
        "highest": highest,
        "topthree": topthree,
        "total_products": all_products.count(),
    }
    return render(request, "core/product-cat.html", context)


def sub_product_cat(request, scid):
    """Subcategory page with level two categories and pagination"""
    subcategory = SubCategory.objects.get(scid=scid)
    
    # Get all products in this subcategory
    all_products = Product.objects.filter(
        product_status="published", 
        subcategory=subcategory,
        in_stock=True
    ).order_by('-date')
    
    # Pagination - 20 products per page
    paginator = Paginator(all_products, 30)
    page_number = request.GET.get('page')
    
    try:
        products = paginator.page(page_number)
    except PageNotAnInteger:
        products = paginator.page(1)
    except EmptyPage:
        products = paginator.page(paginator.num_pages)
    
    # Get price range for filters
    prices = all_products.values_list('price', flat=True)
    lowest = min(prices) if prices else 0
    highest = max(prices) if prices else 100000
    
    # Get level two categories for this subcategory
    level_two_categories = LevelTwoCategory.objects.filter(
        subcategory=subcategory
    ).order_by('title')
    
    cat = Category.objects.all()[:10]
    topthree = Product.objects.filter(
        product_status="published", 
        featured=True,
        in_stock=True
    ).order_by('-date')[:3]

    context = {
        "category": subcategory,
        "subcategory": subcategory,
        "products": products,
        "level_two_categories": level_two_categories,
        "parent_category": subcategory.category,
        "cat": cat,
        "lowest": lowest,
        "highest": highest,
        "topthree": topthree,
        "total_products": all_products.count(),
    }
    return render(request, "core/sub-product-cat.html", context)


def level_two_cat(request, l2cid):
    """Level two category page with pagination"""
    level_two_category = LevelTwoCategory.objects.get(l2cid=l2cid)
    
    # Get all products in this level two category
    all_products = Product.objects.filter(
        product_status="published", 
        leveltwocategory=level_two_category,
        in_stock=True
    ).order_by('-date')
    
    # Pagination - 20 products per page
    paginator = Paginator(all_products, 30)
    page_number = request.GET.get('page')
    
    try:
        products = paginator.page(page_number)
    except PageNotAnInteger:
        products = paginator.page(1)
    except EmptyPage:
        products = paginator.page(paginator.num_pages)
    
    # Get price range for filters
    prices = all_products.values_list('price', flat=True)
    lowest = min(prices) if prices else 0
    highest = max(prices) if prices else 100000
    
    # Get sibling level two categories
    sibling_categories = LevelTwoCategory.objects.filter(
        subcategory=level_two_category.subcategory
    ).order_by('title')
    
    cat = Category.objects.all()[:10]
    topthree = Product.objects.filter(
        product_status="published", 
        featured=True,
        in_stock=True
    ).order_by('-date')[:3]

    context = {
        "category": level_two_category,
        "level_two_category": level_two_category,
        "products": products,
        "sibling_categories": sibling_categories,
        "parent_subcategory": level_two_category.subcategory,
        "parent_category": level_two_category.subcategory.category,
        "cat": cat,
        "lowest": lowest,
        "highest": highest,
        "topthree": topthree,
        "total_products": all_products.count(),
    }
    return render(request, "core/lv2-product-cat.html", context)

def vendor_details(request, vid):
    vendor = Vendor.objects.get(vid=vid)
    vendorproduct = Vendor.objects.all()
    products = Product.objects.filter(product_status="published", vendor=vendor)
    cat = Category.objects.all()[:10]
    topthree = Product.objects.filter(product_status="published", featured=True).order_by('-date')[:3]
    related = Product.objects.filter(product_status="featured")

    context = {
        "vendor": vendor,
        "vendorproduct": vendorproduct,
        "products": products,
        "cat": cat,
        "topthree": topthree,
        "related": related,
    }
    return render(request, "core/vendor-show.html", context)
def vendor(request):
    vendor = Vendor.objects.all()
    topthree = Product.objects.filter(product_status="published", featured=True).order_by('-date')[:3]
    cat = Category.objects.all()[:10]

    context = {
        "vendor": vendor,
        "cat": cat,
        "topthree": topthree,
    }
    return render(request, "core/vendor.html", context)
    
from django.shortcuts import get_object_or_404, redirect
from django.http import Http404
from django.contrib import messages

def product(request, pid):
    # Get the product with proper error handling
    product = get_object_or_404(Product, pid=pid)
    
    # CHECK 1: Only show published products
    if product.product_status != 'published':
        raise Http404("Product not found")
    
    # CHECK 2: Only show if vendor is approved
    try:
        vendor = product.vendor
        if vendor.approval_status != 'approved':
            raise Http404("Product not found")
    except Vendor.DoesNotExist:
        raise Http404("Product not found")
    
    # NEW: Check if product has color-size combinations
    from core.models import ProductColorSizeStock
    combinations = ProductColorSizeStock.objects.filter(product=product, stock__gt=0).select_related('color', 'size')
    
    has_combinations = combinations.exists()
    
    # Get colors with stock for this product (only if no combinations)
    colors_with_stock = []
    if not has_combinations:
        for color in product.color.all():
            if color.stock > 0:
                colors_with_stock.append({
                    'id': color.id,
                    'name': color.color_name,
                    'stock': color.stock
                })
    
    # Get sizes with stock for this product (only if no combinations)
    sizes_with_stock = []
    if not has_combinations:
        for size in product.size.all():
            if size.stock > 0:
                sizes_with_stock.append({
                    'id': size.id,
                    'name': size.size,
                    'stock': size.stock
                })
    
    # NEW: Prepare combinations data for template
    combinations_data = []
    for combo in combinations:
        combinations_data.append({
            'color_id': combo.color.id,
            'color_name': combo.color.color_name,
            'size_id': combo.size.id,
            'size_name': combo.size.size,
            'stock': combo.stock
        })
    
    # Updated to include vendor information for replies
    product_review = ProductReview.objects.filter(product=product).select_related(
        'user', 'product__vendor'
    ).order_by("-date")
    
    # Get related products
    topthree = Product.objects.filter(
        product_status="published", 
        featured=True,
        in_stock=True
    ).order_by('-date')[:3]
    
    cat = Category.objects.all()[:10]
    re5 = ProductReview.objects.filter(product=product, rating=5)
    re4 = ProductReview.objects.filter(product=product, rating=4)
    re3 = ProductReview.objects.filter(product=product, rating=3)
    re2 = ProductReview.objects.filter(product=product, rating=2)
    re1 = ProductReview.objects.filter(product=product, rating=1)
    p_images = product.p_images.all()        
    
    pro = Product.objects.filter(product_status="published", in_stock=True)
    
    related = Product.objects.filter(
        category=product.category, 
        product_status="published",
        in_stock=True
    ).exclude(pid=pid)
    
    reviews = ProductReview.objects.filter(product=product)
    avg = ProductReview.objects.filter(product=product).aggregate(rating=Avg('rating'))
    avg5 = min(ProductReview.objects.filter(product=product, rating=5).count(), 100)
    avg4 = min(ProductReview.objects.filter(product=product, rating=4).count(), 100)
    avg3 = min(ProductReview.objects.filter(product=product, rating=3).count(), 100)
    avg2 = min(ProductReview.objects.filter(product=product, rating=2).count(), 100)
    avg1 = min(ProductReview.objects.filter(product=product, rating=1).count(), 100)
    review_form = ProductReviewForm
    onetimeform = True
    vendor_obj = Vendor.objects.filter(vendor=product)
    user = request.user

    if request.user.is_authenticated:
        show_form = ProductReview.objects.filter(user=request.user, product=product).count()
        c_cart = Cart.objects.filter(user=request.user, product=product).count()
        c_wishlist = Wishlist.objects.filter(user=request.user, product=product).count()

        if show_form > 0:
            onetimeform = False
    else:
        c_cart = None
        c_wishlist = None

    if request.method == 'POST':
        wishlist = request.POST.get('pid')
        create = Wishlist.objects.create(
            user=user,
            product=wishlist,
        ) 
        return redirect('product', pid=pid)
        
    is_following_vendor = False
    if request.user.is_authenticated:
        is_following_vendor = product.vendor.is_followed_by(request.user)
    
    vendor_follower_count = product.vendor.get_follower_count()

    context = {
        "p": product,
        "colors_with_stock": colors_with_stock,
        "sizes_with_stock": sizes_with_stock,
        "sizes": sizes_with_stock,
        "combinations_data": combinations_data,
        "has_combinations": has_combinations,
        "cw": c_wishlist,
        "cc": c_cart,
        "cat": cat,
        "topthree": topthree,
        "pimage": p_images,
        "pro": pro,
        "related": related,
        "reviews": reviews,
        "avg": avg,
        "avg5": avg5,
        "avg4": avg4,
        "avg3": avg3,
        "avg2": avg2,
        "avg1": avg1,
        "form": review_form,
        "showform": onetimeform,
        "ven": vendor_obj,
        "review": product_review,
        "re5": re5,
        "re4": re4,
        "re3": re3,
        "re2": re2,
        "re1": re1,
        "is_following_vendor": is_following_vendor,
        "vendor_follower_count": vendor_follower_count,
    }
    return render(request, "core/product.html", context)


# def product(request, pid):
#     # Get the product with proper error handling
#     product = get_object_or_404(Product, pid=pid)
    
#     # CHECK 1: Only show published products
#     if product.product_status != 'published':
#         raise Http404("Product not found")
    
#     # CHECK 2: Only show if vendor is approved
#     try:
#         vendor = product.vendor
#         if vendor.approval_status != 'approved':
#             raise Http404("Product not found")
#     except Vendor.DoesNotExist:
#         raise Http404("Product not found")
    
#     # Get colors with stock for this product
#     colors_with_stock = []
#     for color in product.color.all():
#         if color.stock > 0:
#             colors_with_stock.append({
#                 'id': color.id,
#                 'name': color.color_name,
#                 'stock': color.stock
#             })
    
#     # Get sizes with stock for this product (UPDATED)
#     sizes_with_stock = []
#     for size in product.size.all():
#         if size.stock > 0:
#             sizes_with_stock.append({
#                 'id': size.id,
#                 'name': size.size,
#                 'stock': size.stock
#             })
    
#     # Updated to include vendor information for replies
#     product_review = ProductReview.objects.filter(product=product).select_related(
#         'user', 'product__vendor'
#     ).order_by("-date")
    
#     # Get related products
#     topthree = Product.objects.filter(
#         product_status="published", 
#         featured=True,
#         in_stock=True
#     ).order_by('-date')[:3]
    
#     cat = Category.objects.all()[:10]
#     re5 = ProductReview.objects.filter(product=product, rating=5)
#     re4 = ProductReview.objects.filter(product=product, rating=4)
#     re3 = ProductReview.objects.filter(product=product, rating=3)
#     re2 = ProductReview.objects.filter(product=product, rating=2)
#     re1 = ProductReview.objects.filter(product=product, rating=1)
#     p_images = product.p_images.all()        
    
#     pro = Product.objects.filter(product_status="published", in_stock=True)
    
#     related = Product.objects.filter(
#         category=product.category, 
#         product_status="published",
#         in_stock=True
#     ).exclude(pid=pid)
    
#     reviews = ProductReview.objects.filter(product=product)
#     avg = ProductReview.objects.filter(product=product).aggregate(rating=Avg('rating'))
#     avg5 = min(ProductReview.objects.filter(product=product, rating=5).count(), 100)
#     avg4 = min(ProductReview.objects.filter(product=product, rating=4).count(), 100)
#     avg3 = min(ProductReview.objects.filter(product=product, rating=3).count(), 100)
#     avg2 = min(ProductReview.objects.filter(product=product, rating=2).count(), 100)
#     avg1 = min(ProductReview.objects.filter(product=product, rating=1).count(), 100)
#     review_form = ProductReviewForm
#     onetimeform = True
#     vendor_obj = Vendor.objects.filter(vendor=product)
#     user = request.user

#     if request.user.is_authenticated:
#         show_form = ProductReview.objects.filter(user=request.user, product=product).count()
#         c_cart = Cart.objects.filter(user=request.user, product=product).count()
#         c_wishlist = Wishlist.objects.filter(user=request.user, product=product).count()

#         if show_form > 0:
#             onetimeform = False
#     else:
#         c_cart = None
#         c_wishlist = None

#     if request.method == 'POST':
#         wishlist = request.POST.get('pid')
#         create = Wishlist.objects.create(
#             user=user,
#             product=wishlist,
#         ) 
#         return redirect('product', pid=pid)
        
#     is_following_vendor = False
#     if request.user.is_authenticated:
#         is_following_vendor = product.vendor.is_followed_by(request.user)
    
#     vendor_follower_count = product.vendor.get_follower_count()

#     context = {
#         "p": product,
#         "colors_with_stock": colors_with_stock,
#         "sizes_with_stock": sizes_with_stock,  # UPDATED
#         "sizes": sizes_with_stock,  # For backward compatibility
#         "cw": c_wishlist,
#         "cc": c_cart,
#         "cat": cat,
#         "topthree": topthree,
#         "pimage": p_images,
#         "pro": pro,
#         "related": related,
#         "reviews": reviews,
#         "avg": avg,
#         "avg5": avg5,
#         "avg4": avg4,
#         "avg3": avg3,
#         "avg2": avg2,
#         "avg1": avg1,
#         "form": review_form,
#         "showform": onetimeform,
#         "ven": vendor_obj,
#         "review": product_review,
#         "re5": re5,
#         "re4": re4,
#         "re3": re3,
#         "re2": re2,
#         "re1": re1,
#         "is_following_vendor": is_following_vendor,
#         "vendor_follower_count": vendor_follower_count,
#     }
#     return render(request, "core/product.html", context)
    
@user_required
def toggle_vendor_follow(request, vid):
    """
    Toggle follow/unfollow for a vendor
    Returns JSON response with success status and new follower count
    """
    vendor = get_object_or_404(Vendor, vid=vid)
    
    # Check if user already follows this vendor
    follow_instance = VendorFollow.objects.filter(user=request.user, vendor=vendor).first()
    
    if follow_instance:
        # User is already following - unfollow
        follow_instance.delete()
        is_following = False
        message = f"You unfollowed {vendor.business_name or vendor.store_name}"
    else:
        # User is not following - follow
        VendorFollow.objects.create(user=request.user, vendor=vendor)
        is_following = True
        message = f"You are now following {vendor.business_name or vendor.store_name}"
     
    # Get updated follower count
    follower_count = vendor.get_follower_count()
    
    return JsonResponse({
        'success': True,
        'is_following': is_following,
        'follower_count': follower_count,
        'message': message
    })


@user_required
def vendor_followers_list(request, vid):
    """
    View to display all followers of a vendor (optional)
    """
    vendor = get_object_or_404(Vendor, vid=vid)
    followers = VendorFollow.objects.filter(vendor=vendor).select_related('user')
    
    context = {
        'vendor': vendor,
        'followers': followers,
        'follower_count': followers.count()
    }
    
    return render(request, 'core/vendor_followers.html', context)

    
def tag_show(request, tag_slug=None):
    cat = Category.objects.all()[:5]
    topthree = Product.objects.filter(product_status="published", featured=True).order_by('-date')[:10]
    product = Product.objects.filter(product_status="published").order_by('-date')

    tag = None
    if tag_slug:
        tag = get_object_or_404(Tag, slug=tag_slug)
        products = product.filter(tag__in=[tag])

    context = {
        "showtag": products,
        "tag": tag,
        "cat": cat,
        "topthree": topthree,
    }
    return render(request, "core/tag.html", context)



from django.shortcuts import redirect
from django.contrib import messages

def add_review(request, pid):
    if request.user.is_authenticated:
        product = Product.objects.get(pid=pid)
        user = request.user
        
        ProductReview.objects.create(
            user=user,
            product=product,
            review=request.POST.get('review', ''),
            rating=request.POST.get('rating', 5),
        )
        
        messages.success(request, 'Review added successfully!')
        return redirect('product', pid=pid)
    else:
        messages.error(request, 'Please login to leave a review')
        return redirect('product', pid=pid)

def search(request):
    query = request.GET.get("q")

    if request.user.is_authenticated:
        check_history = SearchHistory.objects.filter(user=request.user, search_text=query).count()

        if check_history > 0:
            pass
        else:
            save_the_search = SearchHistory.objects.create(
                user=request.user,
                search_text=query,
            )
    else:
        pass

    # ADD in_stock=True filter
    product = Product.objects.filter(
        title__icontains=query, 
        product_status="published",
        in_stock=True
    ).order_by("-date")
    
    contain = product.count()  # Use the same queryset
    fea = Category.objects.all()
    cat = Category.objects.all()[:10]

    context = {
        "product": product,
        "query": query,
        "fea": fea,
        "cat": cat,
        "empty": contain,
    }

    return render(request, "core/search.html", context)


def filter_product(request):
    try:
        # Get filter parameters
        categories = request.GET.getlist("category[]")
        subcategories = request.GET.getlist("subcategory[]")
        level_two_categories = request.GET.getlist("level_two[]")
        min_price = request.GET.get('min', 0)
        max_price = request.GET.get('max', 999999999)
        colors = request.GET.get('color', '')
        shipping = request.GET.get('shipping', '')
        sort_by = request.GET.get('sortby', 'random')
        filter_type = request.GET.get('type', 'category')  # category, subcategory, level_two, limited
        
        # Start with base queryset
        products = Product.objects.filter(
            product_status="published",
            in_stock=True
        )
        
        # ✅ Apply appropriate category filter based on type
        if filter_type == 'category' and len(categories) > 0:
            products = products.filter(category__cid__in=categories)
        
        elif filter_type == 'subcategory' and len(subcategories) > 0:
            products = products.filter(subcategory__scid__in=subcategories)
        
        elif filter_type == 'level_two' and len(level_two_categories) > 0:
            products = products.filter(leveltwocategory__l2cid__in=level_two_categories)
        
        elif filter_type == 'limited':
            # For limited products page
            products = products.filter(
                stock_count__lt=30,
                stock_count__gt=0
            )
        else:
            products = products
        
        # Apply price filter
        if min_price and min_price != '0':
            products = products.filter(price__gte=min_price)
        if max_price and max_price != '999999999':
            products = products.filter(price__lte=max_price)
        
        # Apply color filter
        if colors:
            color_list = [c.strip() for c in colors.split(',') if c.strip()]
            if color_list:
                color_query = Q()
                for color in color_list:
                    color_query |= Q(color__color_name__icontains=color)
                products = products.filter(color_query)
        
        # Apply sorting
        if sort_by == 'price_asc':
            products = products.order_by('price')
        elif sort_by == 'price_desc':
            products = products.order_by('-price')
        elif sort_by == 'new':
            products = products.order_by('-date')
        elif sort_by == 'top':
            products = products.annotate(
                avg_rating=Avg('reviews__rating')
            ).order_by('-avg_rating')
        elif sort_by == 'discount':
            products = products.filter(old_price__isnull=False).order_by('-date')
        else:
            products = products.order_by('-date')
        
        products = products.distinct()
        
        # Render products to HTML
        context = {'products': products}
        
        # Choose template based on filter type
        if filter_type == 'limited':
            template = 'core/async/limited-product-list.html'
        else:
            template = 'core/async/product-list.html'
        
        data = render_to_string(template, context)
        
        return JsonResponse({
            'data': data,
            'count': products.count(),
            'success': True
        })
        
    except Exception as e:
        import traceback
        print("FILTER ERROR:", traceback.format_exc())
        
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)





def add_to_cart(request):
    user = request.user
    id = request.GET.get("id")
    if not id:
        return JsonResponse({"status": "error", "message": "No product id provided"})
    
    qty = int(request.GET.get("qty", 1))
    size = request.GET.get("size", "Default")
    color = request.GET.get("color", "Default")
    get_product = Product.objects.get(id=id)
    
    if request.user.is_authenticated:
        # Check if product is out of stock
        if get_product.stock_count < 1 or not get_product.in_stock:
            return JsonResponse({
                "status": "out_of_stock",
                "message": "This product is out of stock"
            })
        
        # Check if requested qty exceeds available stock
        if not get_product.can_add_to_cart(qty):
            return JsonResponse({
                "status": "insufficient_stock",
                "message": f"Only {get_product.get_available_quantity()} units available"
            })
        
        check_cart = Cart.objects.filter(user=request.user, product=get_product).count()
        
        if check_cart:
            # Product already in cart — return specific status
            return JsonResponse({
                "status": "already_in_cart",
                "message": "Product is already in your cart"
            })
        else:
            # Create new cart item
            Cart.objects.create(
                user=request.user,
                product=get_product,
                qty=qty,
                product_size=size,
                product_color=color,
            )
            
            # Update cart total
            old = user.cart_total
            am = get_product.price
            toge = float(am) * float(qty)
            tog = float(old) + toge
            user.cart_total = tog
            user.save()
            
            return JsonResponse({
                "status": "added",
                "message": "Product added to cart!"
            })
    else:
        return JsonResponse({
            "status": "not_logged_in",
            "message": "Please log in to add items to your cart"
        })

from django.db.models import Sum, F



def delete_from_cart(request):
    user = request.user
    id = request.GET["id"]
    
    get_cart = Cart.objects.get(id=id)
    get_cart.delete()
    
    # Change cart total
    old = user.cart_total
    am = get_cart.product.price            
    toge = float(am) * float(get_cart.qty)
    tog = float(old) - toge
    user.cart_total = tog
    user.save()
    
    if request.session.get('new_price_after_coupon'):        
        del request.session['new_price_after_coupon']
    bool = True
    
    
    context = {
        "bool": bool,
    }
    return JsonResponse(context)




def update_cart(request):
    import json
    cart_data = request.GET["data"]
    try:
        # Parse the JSON data from the request body
        # data = cart_data.json()
        data = json.loads(cart_data)

        # Ensure the input is in the correct format
        # if not isinstance(data, list):
        #     return JsonResponse({"status": "error", "message": "Invalid data format"}, status=400)

        # Loop through the list of product updates
        for item in data:
            product_id = item.get("id")
            product_qty = item.get("qty")

            if not product_id or not product_qty:
                return JsonResponse({"status": "error", "message": "Missing product ID or quantity"}, status=400)

            # Find the specific cart item for the user
            try:
                cart_item = Cart.objects.get(user=request.user, id=product_id)
                cart_item.qty = product_qty
                cart_item.save()
            except Cart.DoesNotExist:
                return JsonResponse({"status": "error", "message": f"Product with ID {product_id} not found in cart"}, status=404)

        return JsonResponse({"status": "success", "message": "Cart updated successfully"})
    except json.JSONDecodeError:
        return JsonResponse({"status": "error", "message": "Invalid JSON data"}, status=400)    









logger = logging.getLogger(__name__)

@user_required
def checkout(request, order_id=None):
    user = request.user
    
    # Get user's wallet
    try:
        wallet = Wallet.objects.get(user=user)
    except Wallet.DoesNotExist:
        wallet = Wallet.objects.create(user=user, balance=Decimal('0.00'))
        
    
    # ✅ ADD THIS LINE - Get delivery method from session (default to Door Step Delivery)
    delivery_method = request.session.get('delivery_method', 'Door Step Delivery')
    
    # Get saved addresses
    book = Address.objects.filter(user=user, delete=False).order_by("-id")[:5]
    total = Decimal("0.00")
    discount = Decimal("0.00")
    coupon_used = False
    cart = None
    order = None
    order_items = None

    try:
        # Handle order-based checkout
        if order_id:
            request.session['order_id'] = order_id
            order = get_object_or_404(CartOrder, id=order_id, user=user, paid_status=False)
            order_items = CartOrderItems.objects.filter(order=order)
            if not order_items:
                logger.warning(f"No items found for order {order_id}")
                messages.warning(request, "This order has no items.")
                return redirect("index")
            total = sum(item.total for item in order_items)
            if hasattr(order, 'coupon_used') and order.coupon_used:
                try:
                    thecode = Coupon.objects.get(coupon_code=order.coupon_code)
                    coupon_used = True
                    discount = thecode.discount
                    total -= discount
                except Coupon.DoesNotExist:
                    logger.warning(f"Coupon not found for order {order_id}")
                    messages.error(request, "Invalid or expired coupon.")
                    coupon_used = False
        else:
            # Clear order_id from session for cart-based checkout
            if 'order_id' in request.session:
                del request.session['order_id']
            cart = Cart.objects.filter(user=user)
            if not cart:
                messages.warning(request, "Your cart is empty.")
                return redirect("index")
            total = Cart.objects.filter(user=user).aggregate(
                total=Sum(F('product__price') * F('qty'))
            )['total'] or Decimal("0.00")
            if request.session.get('coupon_code'):
                thecod = request.session.get('coupon_code')
                try:
                    thecode = Coupon.objects.get(coupon_code=thecod, active=True)
                    # Check it's still valid
                    if not thecode.is_expired and not thecode.is_usage_limit_reached:
                        coupon_used   = True
                        discount      = Decimal(str(request.session.get('discount_amount', 0)))
                        total        -= discount
                    else:
                        # Coupon became invalid between cart and checkout — clear it
                        for k in ['coupon_id','coupon_code','discount_amount','cart_total','final_total']:
                            request.session.pop(k, None)
                        messages.warning(request, "Your coupon is no longer valid and has been removed.")
                except Coupon.DoesNotExist:
                    for k in ['coupon_id','coupon_code','discount_amount','cart_total','final_total']:
                        request.session.pop(k, None)

        final_total = total

        if request.method == "POST":
            request.session['from_checkout'] = True
            request.session['order_note'] = request.POST.get("order_note", "Null")
            request.session['delivery_method'] = request.POST.get("delivery_method", "Door Step Delivery")
            request.session['payment'] = request.POST.get("gateway")
            request.session['email'] = request.POST.get("email", user.email)

            # Handle address selection
            address_id = request.POST.get("address_id")
            
            if not address_id:
                messages.error(request, "Please select a shipping address.")
                context = {
                    "cart": cart,
                    "order": order,
                    "order_items": order_items,
                    "total": total,
                    "book": book,
                    "discount": discount,
                    "coupon_used": coupon_used,
                    "final_total": final_total,
                    "wallet_balance": wallet.balance,
                }
                return render(request, "core/checkout.html", context)
            
            try:
                selected_address = Address.objects.get(id=address_id, user=user, delete=False)
                request.session['address'] = address_id
            except Address.DoesNotExist:
                messages.error(request, "Invalid address selected.")
                context = {
                    "cart": cart,
                    "order": order,
                    "order_items": order_items,
                    "total": total,
                    "book": book,
                    "discount": discount,
                    "coupon_used": coupon_used,
                    "final_total": final_total,
                    "wallet_balance": wallet.balance,
                }
                return render(request, "core/checkout.html", context)

            # Prepare cart data
            if order_id:
                cart_data = {}
                for item in order_items:
                    cart_data[str(item.id)] = {
                        'title': item.item,
                        'image': item.image,
                        'qty': item.qty,
                        'price': str(item.price),
                        'vendor': item.vendor,
                        'vendor_id': item.vendor_id,
                        'product_color': item.product_color,
                        'product_size': item.product_size
                    }
            else:
                cart_data = {}
                for c in cart:
                    cart_data[str(c.product.id)] = {
                        'title': c.product.title,
                        'image': c.product.image.url,
                        'qty': c.qty,
                        'price': str(c.product.price),
                        'vendor': "Trenva",
                        'vendor_id': "1",
                        'product_color': c.product_color,
                        'product_size': c.product_size
                    }
            request.session['cart_data_obj'] = cart_data

            # Payment gateway handling - EXACTLY AS YOUR ORIGINAL
            gateway = request.POST.get("gateway")
            
            if gateway == "TrenvaWallet":
                if wallet.balance >= final_total:
                    with transaction.atomic():
                        wallet.balance -= final_total
                        wallet.save()
                        special_key = shortuuid.uuid()
                        Transaction.objects.create(
                            wallet=wallet,
                            amount=final_total,
                            transaction_type='debit',
                            status='success',
                            reference=f"ORDER_{special_key}",
                            description=f'Payment for order #{special_key}'
                        )
                        request.session['wallet_paid'] = True
                        if order_id:
                            order.paid_status = True
                            order.save()
                            messages.success(request, 'Order completed successfully using your TRENVA wallet!')
                            return redirect('orders')
                        else:
                            return redirect("place_order")
                else:
                    messages.error(request, "Insufficient balance in your TRENVA wallet.")
                    context = {
                        "cart": cart,
                        "order": order,
                        "order_items": order_items,
                        "total": total,
                        "book": book,
                        "discount": discount,
                        "coupon_used": coupon_used,
                        "final_total": final_total,
                        "wallet_balance": wallet.balance,
                    }
                    return render(request, "core/checkout.html", context)
            
            elif gateway == "Paystack":
                email = request.session['email']
                amount = int(final_total * 100)
                url = "https://api.paystack.co/transaction/initialize"
                headers = {
                    "Authorization": f"Bearer {settings.PAYSTACK_SECRET}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "email": email,
                    "amount": amount,
                    "callback_url": f"https://trenva.store/ng/paystack-verify/?order={shortuuid.uuid()}"
                }
                try:
                    response = requests.post(url, json=payload, headers=headers)
                    response.raise_for_status()
                    result = response.json()
                    if result['status']:
                        payment_url = result['data']['authorization_url']
                        return redirect(payment_url)
                    else:
                        messages.error(request, "Paystack initialization failed.")
                except requests.RequestException as e:
                    logger.error(f"Paystack API error: {e}")
                    messages.error(request, "Paystack initialization failed due to an API error.")
            
            elif gateway == "Flutterwave":
                amount = str(final_total)
                email = request.session['email']
                currency = "NGN"
                tx_ref = str(uuid.uuid4())
                request.session['flutterwave_tx_ref'] = tx_ref
                request.session['flutterwave_amount'] = amount
                url = "https://api.flutterwave.com/v3/payments"
                headers = {
                    "Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "tx_ref": tx_ref,
                    "amount": amount,
                    "currency": currency,
                    "redirect_url": request.build_absolute_uri(reverse('flutterwave_verify')),
                    "customer": {"email": email, "name": f"{user.first_name} {user.last_name}"},
                    "meta": {"user_id": user.id}
                }
                try:
                    response = requests.post(url, json=payload, headers=headers)
                    response.raise_for_status()
                    res_data = response.json()
                    if res_data.get("status") == "success":
                        payment_link = res_data["data"]["link"]
                        return redirect(payment_link)
                    else:
                        logger.error(f"Flutterwave initialization failed: {res_data}")
                        messages.error(request, "Flutterwave initialization failed.")
                except requests.RequestException as e:
                    logger.error(f"Flutterwave API error: {e}")
                    messages.error(request, "Flutterwave initialization failed due to an API error.")

            else:
                # For Pay on Delivery or any other method
                return redirect("place_order")

        context = {
            "cart": cart,
            "order": order,
            "order_items": order_items,
            "total": total,
            "book": book,
            "discount": discount,
            "coupon_used": coupon_used,
            "coupon_code":     request.session.get('coupon_code', ''),
            "discount_amount": request.session.get('discount_amount', 0),
            "delivery_method": delivery_method, 
            "final_total": final_total,
            "wallet_balance": wallet.balance,
        }
        return render(request, "core/checkout.html", context)

    except Exception as e:
        logger.error(f"Checkout error for user {user.id}, order_id {order_id}: {str(e)}", exc_info=True)
        messages.error(request, "An unexpected error occurred. Please try again.")
        return redirect("index")



from django.http import JsonResponse
from .cities_data import STATE_CITIES

def get_cities(request):
    """API endpoint to get cities for a selected state"""
    state = request.GET.get('state')
    
    if not state:
        return JsonResponse({'error': 'State parameter is required'}, status=400)
    
    # Get cities for the selected state
    cities = STATE_CITIES.get(state.lower(), [])
    
    return JsonResponse({
        'status': 'success',
        'state': state,
        'cities': cities
    })

def get_cities_json(request):
    """API endpoint to get cities for a selected state"""
    state = request.GET.get('state')
    
    if not state:
        return JsonResponse({'error': 'State parameter is required'}, status=400)
    
    # Get cities for the selected state
    # cities = STATE_CITIES.get(state.lower(), [])
    cities = list(DeliveryZone.objects.filter(state_name=state.capitalize()).values('city_name', 'id'))
    
    return JsonResponse({
        'status': 'success',
        'state': state,
        'cities': cities
    })






def send_admin_new_order_notification(order, order_items, address, customer):
    """Send new order notification to admin"""
    try:
        admin_users = User.objects.filter(is_superuser=True, is_active=True)
        admin_emails = [admin.email for admin in admin_users if admin.email]
        
        if admin_emails:
            # Get vendor and product info from first order item
            first_item = order_items[0] if order_items else None
            vendor_name = first_item.vendor if first_item else "Unknown Vendor"
            product_name = first_item.item if first_item else "Unknown Product"
            quantity = sum(item.qty for item in order_items)
            
            context = {
                'order': order,
                'order_items': order_items,
                'customer_name': f"{customer.first_name} {customer.last_name}".strip() or customer.username,
                'customer_email': customer.email,
                'order_total': order.price,
                'order_date': order.order_date,
                'payment_method': order.payment_method,
                'vendor_name': vendor_name,
                'product_name': product_name,
                'quantity': quantity,
                'shipping_address': address,
            }
            
            email_template = render_to_string('emails/new_order_admin.html', context)
            subject = f"ðŸ”” New Order Received â€“ Order #{order.id}"
            
            email = EmailMessage(
                subject=subject,
                body=email_template,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=admin_emails,
            )
            email.content_subtype = "html"
            email.send()
            
            logger.info(f"New order notification sent to admin for order #{order.id}")
            
    except Exception as e:
        logger.error(f"Failed to send new order email to admin: {str(e)}")
        
        
from django.db.models import F



@user_required
def place_order(request):
    if not request.session.get('from_checkout'):
        logger.warning(f"Unauthorized access to place_order by user {request.user.id}")
        return redirect('shopgrid')
        
    user = request.user
    order_note = request.session.get('order_note', 'Null')
    address_id = request.session.get('address')
    payment_method = request.session.get('payment')
    delivery_method = request.session.get('delivery_method', 'Door Step Delivery')
    cart_data = request.session.get('cart_data_obj', {})
    email = request.session.get('email', request.user.email)

    try:
        # Validate address
        try:
            filladdress = Address.objects.get(id=address_id, user=user)
        except Address.DoesNotExist:
            logger.error(f"Invalid address_id {address_id} for user {user.id}")
            messages.error(request, "Invalid address selected.")
            return redirect("checkout")

        # Calculate total - For cart-based checkout
        if not cart_data:
            logger.error(f"No cart data in session for user {user.id}")
            messages.error(request, "Your cart is empty.")
            return redirect("cart")
            
        # Calculate total from cart_data
        total = Decimal("0.00")
        for item_id, item in cart_data.items():
            price = Decimal(str(item['price']).replace(',', ''))
            qty = int(item['qty'])
            total += price * qty
        
        # Apply coupon if used
        coupon_used = False
        if request.session.get('new_price_after_coupon'):
            try:
                new_price = Decimal(str(request.session.get('new_price_after_coupon')))
                thecode = request.session.get('thecoupon')
                try:
                    Coupon.objects.get(coupon_code=thecode)
                    coupon_used = True
                    total = new_price
                except Coupon.DoesNotExist:
                    logger.warning(f"Invalid coupon code {thecode} for user {user.id}")
                    request.session.pop('new_price_after_coupon', None)
                    request.session.pop('thecoupon', None)
            except (ValueError, TypeError):
                logger.error(f"Invalid new_price_after_coupon for user {user.id}")
                request.session.pop('new_price_after_coupon', None)
                request.session.pop('thecoupon', None)
    
        # Check payment status
        thepayment = bool(
            request.session.get('flutterwave_paid') or 
            request.session.get('paystack_paid') or 
            request.session.get('wallet_paid')
        )
        
        # For Pay on Delivery, set paid_status to False
        if payment_method == "Pay on Delivery":
            thepayment = False
            
        logger.info(f"Processing order for user {user.id}, payment_method={payment_method}, paid_status={thepayment}")
        
        # Create order with all address fields from the Address model
        order = CartOrder.objects.create(
            user=user,
            price=total,
            order_note=order_note,
            address=filladdress.address,
            apartment_floor=filladdress.apartment,
            city=filladdress.city,
            state=filladdress.state,
            postal=filladdress.postal,
            first_name=filladdress.first_name,
            last_name=filladdress.last_name,
            phone_number=filladdress.phone,
            delivery_method=delivery_method,
            payment_method=payment_method,
            email_address=email,
            session_token=str(uuid.uuid4()),
            coupon_used=coupon_used,
            paid_status=thepayment,
            product_status="Placed",
        )

        # Create order items with PROPER VENDOR INFORMATION
        vendor_orders = {}
        all_order_items = []
        stock_reduction_failures = []
        
        for p_id, item in cart_data.items():
            product = None
            actual_vendor = None
            vendor_name = "Trenva"
            vendor_id = "1"
            qty = int(item['qty'])
            
            try:
                # Get the actual product
                product = Product.objects.get(id=p_id)
                actual_vendor = product.vendor
                vendor_name = actual_vendor.name if actual_vendor else "Trenva"
                vendor_id = actual_vendor.vid if actual_vendor else "1"
                
                # Reduce main product stock - Only if payment was successful
                if thepayment:
                    if not product.reduce_stock(qty):
                        stock_reduction_failures.append(product.title)
                        logger.warning(f"Failed to reduce stock for {product.title}. Requested: {qty}, Available: {product.stock_count}")
                        
            except Product.DoesNotExist:
                # Fallback to cart data if product not found
                vendor_name = item.get('vendor', 'Trenva')
                vendor_id = item.get('vendor_id', '1')
                product = None
            
            # Clean price string (remove commas)
            price_str = str(item['price']).replace(',', '')
            price = float(price_str)
            
            # Get color and size IDs for combination products
            color_id = item.get('color_id', None)
            size_id = item.get('size_id', None)
            
            # Create order item
            order_item = CartOrderItems.objects.create(
                order=order,
                user=user,
                invoice_no="#" + str(order.id),
                item=item['title'],
                image=item['image'],
                qty=qty,
                price=price,
                product_ref=product,
                vendor=vendor_name,
                vendor_id=vendor_id,
                product_color=item.get('product_color', ''),
                product_size=item.get('product_size', ''),
                total=price * qty,
            )
            
            all_order_items.append(order_item)
            
            # ========== NEW: REDUCE COLOR-SIZE COMBINATION STOCK ==========
            if color_id and size_id and product:
                try:
                    from core.models import ProductColorSizeStock
                    combination = ProductColorSizeStock.objects.filter(
                        product=product,
                        color_id=int(color_id),
                        size_id=int(size_id)
                    ).first()
                    
                    if combination:
                        combination.stock -= qty
                        combination.save()
                        logger.info(f"Reduced combination stock for color_id {color_id}, size_id {size_id} by {qty}. New stock: {combination.stock}")
                    else:
                        logger.warning(f"Combination not found for product {product.id}, color_id {color_id}, size_id {size_id}")
                except Exception as e:
                    logger.error(f"Error reducing combination stock: {str(e)}")
            # ========== END COMBINATION STOCK REDUCTION ==========
            
            # ========== REDUCE COLOR STOCK (for simple color-only products) ==========
            selected_color = item.get('product_color', '')
            if selected_color and selected_color != "Default" and product and not color_id:
                try:
                    color = ProductColor.objects.filter(
                        color_name=selected_color,
                        product=product
                    ).first()
                    
                    if color:
                        color.stock -= qty
                        color.save()
                        logger.info(f"Reduced {selected_color} stock by {qty}. New stock: {color.stock}")
                    else:
                        logger.warning(f"Color '{selected_color}' not found for product {product.title}")
                except Exception as e:
                    logger.error(f"Error reducing color stock for {selected_color}: {str(e)}")
            # ========== END COLOR STOCK REDUCTION ==========
            
            # ========== REDUCE SIZE STOCK (for simple size-only products) ==========
            selected_size = item.get('product_size', '')
            if selected_size and selected_size != "Default" and product and not size_id:
                try:
                    size_obj = ProductSize.objects.filter(
                        size=selected_size,
                        product=product
                    ).first()
                    
                    if size_obj:
                        size_obj.stock -= qty
                        size_obj.save()
                        logger.info(f"Reduced {selected_size} stock by {qty}. New stock: {size_obj.stock}")
                    else:
                        logger.warning(f"Size '{selected_size}' not found for product {product.title}")
                except Exception as e:
                    logger.error(f"Error reducing size stock for {selected_size}: {str(e)}")
            # ========== END SIZE STOCK REDUCTION ==========
            
            # Group order items by vendor for email notifications
            if vendor_id not in vendor_orders:
                vendor_orders[vendor_id] = {
                    'vendor_name': vendor_name,
                    'vendor_email': getattr(actual_vendor.user, 'email', None) if actual_vendor and hasattr(actual_vendor, 'user') else None,
                    'items': []
                }
            
            vendor_orders[vendor_id]['items'].append(order_item)
        
        # Show warning if any products couldn't reduce stock
        if stock_reduction_failures:
            messages.warning(request, f"Note: Some items had limited stock: {', '.join(stock_reduction_failures)}")
    
        # 🔥 Create Trippa deliveries ONLY if delivery_method is 'trippa_delivery' AND payment successful
        if delivery_method == "trippa_delivery" and thepayment:
            try:
                from core.services.trippa import TrippaDelivery
                
                trippa = TrippaDelivery()
                result = trippa.create_delivery_from_order(order, all_order_items)
                
                if result.get("success") and result.get("deliveries"):
                    tracking_id = result['deliveries'][0]['tracking_number']
                    order.trippa_tracking_id = tracking_id
                    order.save()
                    messages.info(request, f"Tracking number: {tracking_id}")
                else:
                    messages.warning(request, "Tracking number will be available soon.")
                    
            except Exception as e:
                logger.error(f"Trippa delivery creation failed: {str(e)}")
                messages.warning(request, "Delivery creation pending.")
                
        # Send vendor order notifications
        try:
            send_vendor_order_notifications(vendor_orders, order, filladdress)
        except Exception as e:
            logger.error(f"Failed to send vendor notifications: {str(e)}")
        
        # Send admin new order notification
        try:
            send_admin_new_order_notification(order, all_order_items, filladdress, user)
        except Exception as e:
            logger.error(f"Failed to send admin notification: {str(e)}")
        
        # Handle coupon — increment usage count, clear session keys
        if coupon_used:
            thecode = request.session.get('coupon_code') or request.session.get('thecoupon')
            try:
                check_coupon = Coupon.objects.get(coupon_code=thecode)
                Coupon.objects.filter(coupon_code=thecode).update(
                    usage_count=F('usage_count') + 1
                )
                CouponEmail.objects.create(coupon=check_coupon, user_email=email)
                logger.info(f"Coupon {thecode} usage incremented for order {order.id}")
            except Coupon.DoesNotExist:
                logger.warning(f"Coupon {thecode} not found during order processing for user {user.id}")

        # Clear cart
        cart = Cart.objects.filter(user=user)
        if cart.exists():
            cart.delete()
        
        # Clear saved customer cart if exists
        try:
            SaveCustomerCart.objects.filter(user=user).delete()
        except:
            pass

        # Clear session
        session_keys = [
            'cart_data_obj', 'from_checkout', 'order_note', 'address', 'payment',
            'delivery_method', 'new_price_after_coupon', 'thecoupon', 'email',
            'flutterwave_paid', 'paystack_paid', 'wallet_paid', 'order_id',
            'coupon_id', 'coupon_code', 'discount_amount', 'cart_total', 'final_total',
        ]
        
        for key in session_keys:
            if key in request.session:
                request.session.pop(key, None)
            
        messages.success(request, 'Order placed successfully!')     
        return redirect("orders")   

    except Exception as e:
        logger.error(f"Place order error for user {user.id}: {str(e)}", exc_info=True)   
        messages.error(request, "An error occurred while placing your order. Please try again.")
        return redirect("checkout")






        
        
def send_vendor_order_notifications(vendor_orders, order, address):
    """
    Send immediate email notifications to vendors when they receive new orders
    """
    from django.core.mail import EmailMessage
    from django.template.loader import render_to_string
    from django.conf import settings
    
    for vendor_id, vendor_data in vendor_orders.items():
        vendor_email = vendor_data['vendor_email']
        vendor_name = vendor_data['vendor_name']
        items = vendor_data['items']
        
        if vendor_email:  # Only send if vendor has an email
            try:
                # Prepare context for vendor email template
                context = {
                    'vendor_name': vendor_name,
                    'order': order,
                    'order_items': items,
                    'customer_name': f"{order.user.first_name} {order.user.last_name}".strip() or order.user.username,
                    'customer_email': order.user.email,
                    'shipping_address': address,
                    'order_total': sum(item.total for item in items),
                    'order_date': order.order_date,
                }
                
                # Render the vendor order email template
                email_template = render_to_string('emails/vendor-order.html', context)
                
                # Create and send email
                subject = f"New Order Received - #{order.id}"
                email = EmailMessage(
                    subject=subject,
                    body=email_template,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[vendor_email],
                    # You can also add bcc for admin notifications
                    # bcc=['admin@trenva.store']
                )
                email.content_subtype = "html"
                email.send()
                
                logger.info(f"Vendor order notification sent to {vendor_email} for order #{order.id}")
                
            except Exception as e:
                logger.error(f"Failed to send vendor notification to {vendor_email}: {str(e)}")
                # Don't raise the exception to prevent order placement from failing
                continue
    
def flutterwave_verify(request):
    # Extract query parameters
    tx_ref = request.GET.get('tx_ref')
    status = request.GET.get('status')
    transaction_id = request.GET.get('transaction_id')

    # Log incoming parameters for debugging
    logger.info(f"Flutterwave redirect received: status={status}, tx_ref={tx_ref}, transaction_id={transaction_id}")

    # Check if required parameters are present
    if not all([tx_ref, status, transaction_id]):
        logger.error(f"Missing query parameters: tx_ref={tx_ref}, status={status}, transaction_id={transaction_id}")
        messages.error(request, "Payment verification failed: Incomplete data from Flutterwave.")
        return redirect("checkout")

    # Allow both 'successful' and 'completed' statuses to proceed to API verification
    if status not in ['successful', 'completed']:
        logger.error(f"Payment not successful: status={status}")
        messages.error(request, f"Payment was not successful (status: {status}). Please try again.")
        return redirect("checkout")

    # Verify session data
    stored_tx_ref = request.session.get('flutterwave_tx_ref')
    stored_amount = request.session.get('flutterwave_amount')
    if not stored_tx_ref or not stored_amount:
        logger.error(f"Session data missing: stored_tx_ref={stored_tx_ref}, stored_amount={stored_amount}")
        messages.error(request, "Payment session expired. Please try again.")
        return redirect("checkout")

    if tx_ref != stored_tx_ref:
        logger.error(f"Transaction reference mismatch: received={tx_ref}, stored={stored_tx_ref}")
        messages.error(request, "Invalid transaction reference. Please contact support.")
        return redirect("checkout")

    # Verify transaction with Flutterwave API
    url = f"https://api.flutterwave.com/v3/transactions/{transaction_id}/verify"
    headers = {
        "Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        result = response.json()
        logger.debug(f"Flutterwave API response: {result}")

        # Check if transaction is successful via API
        if (result.get('status') == 'success' and result.get('data') and 
            (result['data'].get('status') == 'successful' or result['data'].get('chargeResponseCode') in ['00', '0'])):
            verified_amount = result['data']['amount']
            if float(verified_amount) == float(stored_amount):
                # Clear cart and session data
                # Cart.objects.filter(user=request.user).delete()
                SaveCustomerCart.objects.filter(user=request.user).delete()
                # session_keys = [
                #     'cart_data_obj', 'from_checkout', 'order_note', 'address', 'payment',
                #     'delivery_method', 'new_price_after_coupon', 'thecoupon', 'email',
                #     'flutterwave_tx_ref', 'flutterwave_amount'
                # ]
                # for key in session_keys:
                #     if key in request.session:
                #         del request.session[key]
                logger.info(f"Cart and session cleared for user {request.user.id} after successful Flutterwave verification")
                messages.success(request, "Payment successful!")
                request.session['flutterwave_paid'] = True
                return redirect("place_order")
            else:
                logger.error(f"Amount mismatch: verified={verified_amount}, stored={stored_amount}")
                messages.error(request, "Transaction amount mismatch. Please contact support.")
        else:
            logger.error(f"Flutterwave verification failed: {result}")
            messages.error(request, "Payment verification failed. Please try again.")
    except requests.exceptions.RequestException as e:
        logger.error(f"Flutterwave API call failed: {e}")
        messages.error(request, "Payment verification failed due to an API error. Please try again.")
    except (KeyError, ValueError) as e:
        logger.error(f"Error parsing Flutterwave API response: {e}")
        messages.error(request, "An unexpected error occurred during payment verification.")
    
    return redirect("checkout")



logger = logging.getLogger(__name__)

def paystack_verify(request):
    # Extract reference parameter
    reference = request.GET.get('reference')
    if not reference:
        logger.error("Paystack verification failed: No reference provided")
        messages.error(request, "Payment verification failed: No reference provided")
        return redirect('checkout')

    # Ensure user is authenticated
    if not request.user.is_authenticated:
        logger.error("Paystack verification failed: User not authenticated")
        messages.error(request, "You must be logged in to complete payment")
        return redirect('login')

    # Verify transaction with Paystack API
    url = f"https://api.paystack.co/transaction/verify/{reference}"
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        result = response.json()
        logger.debug(f"Paystack API response: {result}")
    except requests.RequestException as e:
        logger.error(f"Paystack verification failed: API error - {str(e)}")
        messages.error(request, "Payment verification failed: API error")
        return redirect('checkout')

    # Check if transaction is successful
    if (result.get('status') and result['data'].get('status') in ['success', 'completed']):
        # Set payment status in session for place_order to process
        request.session['paystack_paid'] = True  
        messages.success(request, "Payment successful!")
        return redirect('place_order')
    else:
        logger.error(f"Paystack verification failed: {result}")
        messages.error(request, f"Payment verification failed: {result.get('message', 'Unknown error')}")
        return redirect('checkout')



@user_required
def payment_completed(request):
    # Get the latest order for the user
    try:
        latest_order = CartOrder.objects.filter(user=request.user).latest('id')
        order_items = CartOrderItems.objects.filter(order=latest_order)
        addresses = Address.objects.filter(user=request.user)
        
        # Calculate total from order items
        cart_total_amount = sum(item.total for item in order_items)
        
        # Prepare cart data for template
        cart_data = {
            str(item.id): {
                'title': item.item,
                'image': item.image,
                'qty': item.qty,
                'price': str(item.price),
                'vendor': item.vendor,
                'vendor_id': item.vendor_id,
                'product_color': item.product_color,
                'product_size': item.product_size,
            } for item in order_items
        }
        
        context = {
            "cart_data": cart_data,
            "total": cart_total_amount,
            "totalcartitems": len(cart_data),
            "cart_total_amount": cart_total_amount,
            "address": addresses,
            "order": latest_order,  # Optional: pass order details to template
        }
        return render(request, "core/payment-completed.html", context)
    except CartOrder.DoesNotExist:
        messages.error(request, "No completed orders found.")
        return redirect('index')

def payment_failed(request):
    logger.info(f"Payment failed for user {request.user.id if request.user.is_authenticated else 'anonymous'}")
    messages.error(request, "Payment failed. Please try again.")
    return render(request, "core/payment-failed.html")

@user_required
def dashboard(request):
    orders = CartOrder.objects.filter(user=request.user)
    address = Address.objects.filter(user=request.user, status="Yes")
    user = request.user
    cancelled_orders = CartOrder.objects.filter(user=request.user, product_status="Canceled").count()
    wishlist = Wishlist.objects.filter(user=request.user).count()
    count_vendor = Vendor.objects.filter(user=request.user).count()
    
    if count_vendor > 0:
        vendor = Vendor.objects.get(user=request.user)
        vid = vendor.vid
    else:
        vid = 0

    context = {
        "orders": orders,
        "address": address,
        "users": user,
        "cancelled": cancelled_orders,
        "wishlist": wishlist,
        "vid": vid,
    }
    return render(request, "core/dashboard.html", context)



from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from decimal import Decimal
from django.db.models import Sum, F, Q
import json



# @login_required
# def vendor_dashboard(request):
#     """
#     Enhanced vendor dashboard with commission-based revenue tracking and refund handling
#     """
#     print(f"DEBUG: Dashboard accessed by user: {request.user.username}")
    
#     try:
#         vendor = Vendor.objects.get(user=request.user)
#         print(f"DEBUG: Vendor found: {vendor.name}, VID: {vendor.vid}")
        
#         if vendor.approval_status != 'approved':
#             messages.error(request, 'Your vendor account is not approved yet.')
#             return redirect('vendor_profile_setup')
            
#     except Vendor.DoesNotExist:
#         messages.error(request, 'Vendor profile not found.')
#         return redirect('vendor_profile_setup')
    
#     # ============ FIND ORDERS FOR THIS VENDOR ============
#     print(f"\n=== DEBUG: CHECKING ORDER MAPPING ===")
#     print(f"Vendor VID: {vendor.vid}")
#     print(f"Vendor Name: {vendor.name}")
    
#     # Get ALL CartOrderItems to see what's stored
#     all_order_items = CartOrderItems.objects.all()[:5]
#     print(f"First 5 order items in system:")
#     for item in all_order_items:
#         print(f"  - Item: {item.item[:30]}, Vendor: '{item.vendor}', Vendor ID: '{item.vendor_id}'")
    
#     # Try different ways to find orders
#     order_items = None
    
#     # Option 1: Try vendor_id field
#     order_items_vendor_id = CartOrderItems.objects.filter(vendor_id=vendor.vid)
#     print(f"\nOrders with vendor_id='{vendor.vid}': {order_items_vendor_id.count()}")
    
#     # Option 2: Try vendor field (if it stores vid or name)
#     order_items_vendor_field = CartOrderItems.objects.filter(vendor=vendor.vid)
#     print(f"Orders with vendor='{vendor.vid}': {order_items_vendor_field.count()}")
    
#     # Option 3: Try vendor name in vendor field
#     order_items_vendor_name = CartOrderItems.objects.filter(vendor=vendor.name)
#     print(f"Orders with vendor='{vendor.name}': {order_items_vendor_name.count()}")
    
#     # Option 4: Try any order with vendor field containing vendor name
#     order_items_like_name = CartOrderItems.objects.filter(vendor__icontains=vendor.name)
#     print(f"Orders with vendor containing '{vendor.name}': {order_items_like_name.count()}")
    
#     # Option 5: Check if vendor field matches business name
#     if vendor.business_name:
#         order_items_business = CartOrderItems.objects.filter(vendor__icontains=vendor.business_name)
#         print(f"Orders with vendor containing '{vendor.business_name}': {order_items_business.count()}")
    
#     # ============ USE WHICHEVER WORKS ============
#     if order_items_vendor_id.exists():
#         order_items = order_items_vendor_id
#         print(f"Using vendor_id='{vendor.vid}'")
#     elif order_items_vendor_name.exists():
#         order_items = order_items_vendor_name
#         print(f"Using vendor='{vendor.name}'")
#     elif order_items_like_name.exists():
#         order_items = order_items_like_name
#         print(f"Using vendor__icontains='{vendor.name}'")
#     else:
#         # Last resort: Get ALL orders and filter manually
#         store_name = vendor.store_name or vendor.business_name or vendor.name
#         order_items = CartOrderItems.objects.filter(vendor__icontains=store_name)
#         print(f"Trying vendor__icontains='{store_name}': {order_items.count()}")
    
#     print(f"\nFinal order_items count: {order_items.count()}")
    
#     if order_items.exists():
#         print(f"Sample order: {order_items.first().item} - Vendor: '{order_items.first().vendor}' - Vendor ID: '{order_items.first().vendor_id}'")
    
#     # ============ CALCULATE REVENUE WITH COMMISSION ============
    
#     today = timezone.now().date()
#     thirty_days_ago = today - timezone.timedelta(days=30)
    
#     # Get vendor's products
#     products = Product.objects.filter(vendor=vendor, user=request.user)
#     total_products = products.count()
    
#     # Calculate totals
#     total_orders = order_items.count()
    
#     # TODAY'S REVENUE WITH COMMISSION BREAKDOWN
#     today_orders = order_items.filter(
#         order_date__date=today,
#         order__is_refund_processed=False  # EXCLUDE REFUNDED ORDERS
#     )
    
#     # MONTHLY REVENUE WITH COMMISSION BREAKDOWN
#     monthly_orders = order_items.filter(
#         order_date__date__gte=thirty_days_ago,
#         order__is_refund_processed=False  # EXCLUDE REFUNDED ORDERS
#     )
    
#     # TOTAL REVENUE WITH COMMISSION BREAKDOWN
#     total_orders = order_items.filter(
#         order__is_refund_processed=False  # EXCLUDE REFUNDED ORDERS
#     )
    
#     # Calculate today's initial revenue (before commission)
#     today_initial_revenue = today_orders.aggregate(
#         total=Sum(F('price') * F('qty'))
#     )['total'] or Decimal('0.00')
    
#     # Calculate today's commission
#     today_commission_total = Decimal('0.00')
#     for order_item in today_orders:
#         try:
#             # Try to find the product to get its category
#             product = Product.objects.filter(
#                 title=order_item.item,
#                 vendor=vendor
#             ).first()
            
#             if product:
#                 # Get commission rate based on category
#                 commission_rate = get_commission_rate(product.category)
#                 item_total = order_item.price * order_item.qty
#                 commission = (item_total * commission_rate) / Decimal('100.00')
#                 today_commission_total += commission
                
#                 # Create AdminWallet transaction for commission
#                 if not hasattr(order_item, 'commission_processed') or not order_item.commission_processed:
#                     try:
#                         admin_wallet = AdminWallet.get_wallet()
#                         admin_wallet.add_commission(
#                             amount=commission,
#                             vendor=vendor,
#                             order_item=order_item,
#                             product=product,
#                             description=f"Commission for {product.category.title if product.category else 'Unknown'} - {order_item.item}"
#                         )
#                         # Mark as processed
#                         if hasattr(order_item, 'commission_processed'):
#                             order_item.commission_processed = True
#                             order_item.save()
#                     except Exception as e:
#                         print(f"Error creating commission transaction: {str(e)}")
                        
#         except Exception as e:
#             print(f"Error processing commission for order item {order_item.id}: {str(e)}")
    
#     # Today's final revenue (initial price minus commission)
#     today_final_revenue = today_initial_revenue - today_commission_total
    
#     # MONTHLY REVENUE WITH COMMISSION BREAKDOWN (last 30 days)
#     monthly_orders = order_items.filter(order_date__date__gte=thirty_days_ago)
    
#     # Calculate monthly initial revenue
#     monthly_initial_revenue = monthly_orders.aggregate(
#         total=Sum(F('price') * F('qty'))
#     )['total'] or Decimal('0.00')
    
#     # Calculate monthly commission
#     monthly_commission_total = Decimal('0.00')
#     for order_item in monthly_orders:
#         if not hasattr(order_item, 'commission_processed') or not order_item.commission_processed:
#             try:
#                 product = Product.objects.filter(
#                     title=order_item.item,
#                     vendor=vendor
#                 ).first()
                
#                 if product:
#                     commission_rate = get_commission_rate(product.category)
#                     item_total = order_item.price * order_item.qty
#                     commission = (item_total * commission_rate) / Decimal('100.00')
#                     monthly_commission_total += commission
                    
#                     # Process commission
#                     try:
#                         admin_wallet = AdminWallet.get_wallet()
#                         admin_wallet.add_commission(
#                             amount=commission,
#                             vendor=vendor,
#                             order_item=order_item,
#                             product=product,
#                             description=f"Commission for {product.category.title if product.category else 'Unknown'} - {order_item.item}"
#                         )
#                         if hasattr(order_item, 'commission_processed'):
#                             order_item.commission_processed = True
#                             order_item.save()
#                     except Exception as e:
#                         print(f"Error processing monthly commission: {str(e)}")
                        
#             except Exception as e:
#                 print(f"Error calculating monthly commission: {str(e)}")
    
#     monthly_final_revenue = monthly_initial_revenue - monthly_commission_total
    
#     # TOTAL REVENUE WITH COMMISSION BREAKDOWN (ALL TIME)
#     total_initial_revenue = order_items.aggregate(
#         total=Sum(F('price') * F('qty'))
#     )['total'] or Decimal('0.00')
    
#     # Calculate total commission
#     total_commission = Decimal('0.00')
#     for order_item in order_items:
#         if hasattr(order_item, 'commission_processed') and order_item.commission_processed:
#             try:
#                 product = Product.objects.filter(
#                     title=order_item.item,
#                     vendor=vendor
#                 ).first()
                
#                 if product:
#                     commission_rate = get_commission_rate(product.category)
#                     item_total = order_item.price * order_item.qty
#                     commission = (item_total * commission_rate) / Decimal('100.00')
#                     total_commission += commission
                    
#             except Exception as e:
#                 print(f"Error calculating total commission: {str(e)}")
    
#     total_final_revenue = total_initial_revenue - total_commission
    
#     # ============ HANDLE REFUNDS ============
    
#     # Get refunded orders
#     refunded_orders = CartOrderItems.objects.filter(
#         vendor_id=vendor.vid,
#         product_status='Refunded'
#     )
    
#     # Calculate refund impact
#     refund_today = refunded_orders.filter(order_date__date=today).aggregate(
#         total=Sum(F('price') * F('qty'))
#     )['total'] or Decimal('0.00')
    
#     refund_monthly = refunded_orders.filter(
#         order_date__date__gte=thirty_days_ago
#     ).aggregate(
#         total=Sum(F('price') * F('qty'))
#     )['total'] or Decimal('0.00')
    
#     refund_total = refunded_orders.aggregate(
#         total=Sum(F('price') * F('qty'))
#     )['total'] or Decimal('0.00')
    
#     # Calculate commission refund for admin wallet
#     refund_commission_today = Decimal('0.00')
#     for refund_item in refunded_orders.filter(order_date__date=today):
#         if hasattr(refund_item, 'commission_processed') and refund_item.commission_processed:
#             try:
#                 product = Product.objects.filter(
#                     title=refund_item.item,
#                     vendor=vendor
#                 ).first()
                
#                 if product:
#                     commission_rate = get_commission_rate(product.category)
#                     item_total = refund_item.price * refund_item.qty
#                     commission = (item_total * commission_rate) / Decimal('100.00')
#                     refund_commission_today += commission
                    
#                     # Deduct commission from admin wallet
#                     try:
#                         admin_wallet = AdminWallet.get_wallet()
#                         admin_wallet.deduct_refund_commission(
#                             amount=commission,
#                             vendor=vendor,
#                             order_item=refund_item,
#                             description=f"Refund commission deduction - {refund_item.item}"
#                         )
#                     except Exception as e:
#                         print(f"Error deducting refund commission: {str(e)}")
                    
#             except Exception as e:
#                 print(f"Error processing refund commission: {str(e)}")
    
#     # Adjust final revenues with refunds
#     today_final_revenue -= refund_today
#     monthly_final_revenue -= refund_monthly
#     total_final_revenue -= refund_total
    
#     # Pending vs completed orders
#     pending_orders = order_items.exclude(product_status='Delivered').count()
#     completed_orders = order_items.filter(product_status='Delivered').count()
    
#     # Recent orders
#     recent_orders = order_items.select_related('order').order_by('-order_date')[:10]
    
#     # Best selling product - ENHANCED VERSION
#     best_selling_data = order_items.values('item').annotate(
#         total_sold=Sum('qty'),
#         total_revenue=Sum(F('price') * F('qty'))
#     ).order_by('-total_sold').first()
    
#     # Initialize best_selling with default values
#     best_selling = {
#         'item': 'No sales yet',
#         'total_sold': 0,
#         'product_image': None,
#         'product_id': None
#     }
    
#     # If we have best-selling data, try to find the actual product
#     if best_selling_data:
#         best_selling['item'] = best_selling_data['item']
#         best_selling['total_sold'] = best_selling_data['total_sold']
#         best_selling['total_revenue'] = best_selling_data['total_revenue']
        
#         # Try to find the actual product by name
#         try:
#             # First try exact match
#             product = Product.objects.filter(
#                 title__iexact=best_selling_data['item'],
#                 vendor=vendor
#             ).first()
            
#             # If not found, try partial match
#             if not product:
#                 product = Product.objects.filter(
#                     title__icontains=best_selling_data['item'],
#                     vendor=vendor
#                 ).first()
            
#             # If we found the product, add its image
#             if product:
#                 best_selling['product'] = product
#                 best_selling['product_image'] = product.image
#                 best_selling['product_id'] = product.pid
#                 best_selling['product_url'] = product.get_absolute_url()
#         except Exception as e:
#             print(f"Error finding product for best seller: {e}")
    
#     # Hit rate
#     good_statuses = ['Delivered', 'Shipped', 'Processing']
#     successful_orders = order_items.filter(product_status__in=good_statuses).count()
#     # hit_rate = (successful_orders / total_orders * 100) if total_orders > 0 else 0
    
#     # Visitor stats (simulated)
#     visitor_count = 10254
#     visitor_growth = 1.5
    
#     # Sales data for chart
#     sales_data = []
#     if order_items.exists():
#         for i in range(6, 0, -1):
#             month_date = today - timezone.timedelta(days=30*i)
#             month_start = month_date.replace(day=1)
            
#             if i > 1:
#                 next_month = (month_date + timezone.timedelta(days=32)).replace(day=1)
#                 month_end = next_month - timezone.timedelta(days=1)
#             else:
#                 month_end = today
            
#             month_orders = order_items.filter(
#                 order_date__date__gte=month_start,
#                 order_date__date__lte=month_end
#             )
            
#             month_revenue = month_orders.aggregate(
#                 total=Sum(F('price') * F('qty'))
#             )['total'] or Decimal('0.00')
            
#             sales_data.append({
#                 'month': month_start.strftime('%b'),
#                 'revenue': float(month_revenue)
#             })
#     else:
#         # Empty chart data if no orders
#         for i in range(6, 0, -1):
#             month_date = today - timezone.timedelta(days=30*i)
#             sales_data.append({
#                 'month': month_date.strftime('%b'),
#                 'revenue': 0.0
#             })
    
#     # Vendor products for display
#     vendor_products = products.order_by('-date')[:5]
    
#     # ============ PREPARE CONTEXT ============
    
#     # For backward compatibility, we'll still provide the old revenue variables
#     # but also provide the new breakdown
#     context = {
#         'vendor': vendor,
#         'total_products': total_products,
#         'total_orders': total_orders,
        
#         # NEW: Commission-based revenue breakdown
#         'today_initial_revenue': float(today_initial_revenue),
#         'today_commission_total': float(today_commission_total),
#         'today_final_revenue': float(today_final_revenue),
        
#         'monthly_initial_revenue': float(monthly_initial_revenue),
#         'monthly_commission_total': float(monthly_commission_total),
#         'monthly_final_revenue': float(monthly_final_revenue),
        
#         'total_initial_revenue': float(total_initial_revenue),
#         'total_commission': float(total_commission),
#         'total_final_revenue': float(total_final_revenue),
        
#         # Refund information
#         'refund_today': float(refund_today),
#         'refund_monthly': float(refund_monthly),
#         'refund_total': float(refund_total),
        
#         # Backward compatibility - will show final revenue (after commission)
#         'today_revenue': float(today_final_revenue),           # For your template
#         'monthly_revenue': float(monthly_final_revenue),       # For your template
#         'total_revenue': float(total_final_revenue),           # For your template
        
#         'pending_orders': pending_orders,
#         'completed_orders': completed_orders,
#         'recent_orders': recent_orders,
#         'best_selling': best_selling,
#         # 'hit_rate': round(hit_rate, 1),
#         'visitor_count': visitor_count,
#         'visitor_growth': visitor_growth,
#         'sales_data': json.dumps(sales_data),
#         'vendor_products': vendor_products,
#         'today': today,
#     }
    
#     print(f"\n=== DEBUG: REVENUE BREAKDOWN ===")
#     print(f"Total Initial Revenue: {total_initial_revenue}")
#     print(f"Total Commission: {total_commission}")
#     print(f"Total Final Revenue: {total_final_revenue}")
    
#     return render(request, 'user/dashboard.html', context)

@vendor_required
def vendor_dashboard(request):
    """
    Enhanced vendor dashboard with commission-based revenue tracking and refund handling
    """
    print(f"DEBUG: Dashboard accessed by user: {request.user.username}")
    
    try:
        vendor = Vendor.objects.get(user=request.user)
        print(f"DEBUG: Vendor found: {vendor.name}, VID: {vendor.vid}")
        
        if vendor.approval_status != 'approved':
            messages.error(request, 'Your vendor account is not approved yet.')
            return redirect('vendor_profile_setup')
            
    except Vendor.DoesNotExist:
        messages.error(request, 'Vendor profile not found.')
        return redirect('vendor_profile_setup')
    
    # ============ FIND ORDERS FOR THIS VENDOR ============
    print(f"\n=== DEBUG: CHECKING ORDER MAPPING ===")
    print(f"Vendor VID: {vendor.vid}")
    print(f"Vendor Name: {vendor.name}")
    
    # Try different ways to find orders
    order_items = None
    
    # Option 1: Try vendor_id field
    order_items_vendor_id = CartOrderItems.objects.filter(vendor_id=vendor.vid)
    print(f"\nOrders with vendor_id='{vendor.vid}': {order_items_vendor_id.count()}")
    
    # Option 2: Try vendor field (if it stores vid or name)
    order_items_vendor_field = CartOrderItems.objects.filter(vendor=vendor.vid)
    print(f"Orders with vendor='{vendor.vid}': {order_items_vendor_field.count()}")
    
    # Option 3: Try vendor name in vendor field
    order_items_vendor_name = CartOrderItems.objects.filter(vendor=vendor.name)
    print(f"Orders with vendor='{vendor.name}': {order_items_vendor_name.count()}")
    
    # Option 4: Try any order with vendor field containing vendor name
    order_items_like_name = CartOrderItems.objects.filter(vendor__icontains=vendor.name)
    print(f"Orders with vendor containing '{vendor.name}': {order_items_like_name.count()}")
    
    # Option 5: Check if vendor field matches business name
    if vendor.business_name:
        order_items_business = CartOrderItems.objects.filter(vendor__icontains=vendor.business_name)
        print(f"Orders with vendor containing '{vendor.business_name}': {order_items_business.count()}")
    
    # ============ USE WHICHEVER WORKS ============
    if order_items_vendor_id.exists():
        order_items = order_items_vendor_id
        print(f"Using vendor_id='{vendor.vid}'")
    elif order_items_vendor_name.exists():
        order_items = order_items_vendor_name
        print(f"Using vendor='{vendor.name}'")
    elif order_items_like_name.exists():
        order_items = order_items_like_name
        print(f"Using vendor__icontains='{vendor.name}'")
    else:
        # Last resort: Get ALL orders and filter manually
        store_name = vendor.store_name or vendor.business_name or vendor.name
        order_items = CartOrderItems.objects.filter(vendor__icontains=store_name)
        print(f"Trying vendor__icontains='{store_name}': {order_items.count()}")
    
    print(f"\nFinal order_items count: {order_items.count()}")
    
    if order_items.exists():
        print(f"Sample order: {order_items.first().item} - Vendor: '{order_items.first().vendor}' - Vendor ID: '{order_items.first().vendor_id}'")
    
    # ============ GET REFUNDED/CANCELED ITEMS ============
    
    # Get today's date for filtering
    today = timezone.now().date()
    thirty_days_ago = today - timezone.timedelta(days=30)
    
    # Get refunded/canceled items (these should be excluded from vendor revenue)
    # Note: Using 'Canceled' (single 'l') as requested
    refunded_items = CartOrderItems.objects.filter(
        vendor_id=vendor.vid,
        product_status__in=['Refunded', 'Canceled', 'canceled', 'refunded']
    )
    
    print(f"\n=== DEBUG: REFUNDED/CANCELED ITEMS ===")
    print(f"Total refunded/canceled items found: {refunded_items.count()}")
    if refunded_items.exists():
        for item in refunded_items[:3]:
            print(f"  - Item: {item.item[:30]}, Status: '{item.product_status}', Amount: ${item.price * item.qty}")
    
    # ============ PROCESS REFUNDED ITEMS FOR ADMIN WALLET ============
    
    # Process any new refunds that haven't been processed yet
    # Using 'cancellation_processed' field instead of 'refund_processed_to_admin'
    new_refunds = refunded_items.filter(cancellation_processed=False)
    
    for refund_item in new_refunds:
        try:
            # Calculate the total amount to move to admin wallet
            refund_amount = refund_item.price * refund_item.qty
            
            # Calculate commission that needs to be returned to admin
            try:
                product = Product.objects.filter(
                    title=refund_item.item,
                    vendor=vendor
                ).first()
                
                if product:
                    commission_rate = get_commission_rate(product.category)
                    item_total = refund_item.price * refund_item.qty
                    commission_amount = (item_total * commission_rate) / Decimal('100.00')
                    
                    # Net amount to move to admin wallet (vendor price - commission)
                    net_refund_amount = refund_amount - commission_amount
                    
                    # Move vendor's revenue to admin wallet for refund
                    admin_wallet = AdminWallet.get_wallet()
                    admin_wallet.add_fund(
                        amount=net_refund_amount,
                        vendor=vendor,
                        order_item=refund_item,
                        transaction_type='refund_hold',
                        description=f"Refund hold for {refund_item.item} - Order {refund_item.oid}"
                    )
                    
                    # Mark refund as processed using the correct field name
                    refund_item.cancellation_processed = True
                    refund_item.save()
                    
                    print(f"DEBUG: Moved ${net_refund_amount} to admin wallet for refund of {refund_item.item}")
                    
            except Exception as e:
                print(f"Error processing commission for refund: {str(e)}")
                
        except Exception as e:
            print(f"Error processing refund to admin wallet: {str(e)}")
    
    # ============ CALCULATE REVENUE ============
    
    # Get vendor's products
    products = Product.objects.filter(vendor=vendor, user=request.user)
    total_products = products.count()
    
    # ============ CALCULATE TODAY'S REVENUE ============
    
    # TODAY'S ORDERS (including ALL orders placed today, even if later refunded)
    today_orders = order_items.filter(order_date__date=today)
    
    # TODAY'S REFUNDED AMOUNT
    today_refunds = refunded_items.filter(order_date__date=today)
    today_refund_amount = today_refunds.aggregate(
        total=Sum(F('price') * F('qty'))
    )['total'] or Decimal('0.00')
    
    # TODAY'S INITIAL REVENUE (before commission and refunds)
    today_initial_revenue = today_orders.aggregate(
        total=Sum(F('price') * F('qty'))
    )['total'] or Decimal('0.00')
    
    # Calculate today's commission
    today_commission_total = Decimal('0.00')
    today_valid_orders = today_orders.exclude(
        product_status__in=['Refunded', 'Canceled', 'canceled', 'refunded']
    )
    
    for order_item in today_valid_orders:
        try:
            product = Product.objects.filter(
                title=order_item.item,
                vendor=vendor
            ).first()
            
            if product:
                commission_rate = get_commission_rate(product.category)
                item_total = order_item.price * order_item.qty
                commission = (item_total * commission_rate) / Decimal('100.00')
                today_commission_total += commission
                
                # Create AdminWallet transaction for commission
                if not hasattr(order_item, 'commission_processed') or not order_item.commission_processed:
                    try:
                        admin_wallet = AdminWallet.get_wallet()
                        admin_wallet.add_commission(
                            amount=commission,
                            vendor=vendor,
                            order_item=order_item,
                            product=product,
                            description=f"Commission for {product.category.title if product.category else 'Unknown'} - {order_item.item}"
                        )
                        # Mark as processed
                        if hasattr(order_item, 'commission_processed'):
                            order_item.commission_processed = True
                            order_item.save()
                    except Exception as e:
                        print(f"Error creating commission transaction: {str(e)}")
                        
        except Exception as e:
            print(f"Error processing commission for order item {order_item.id}: {str(e)}")
    
    # Today's final revenue (initial price minus commission minus refunds)
    today_final_revenue = today_initial_revenue - today_commission_total - today_refund_amount
    
    # Ensure today's revenue doesn't go negative
    if today_final_revenue < Decimal('0.00'):
        today_final_revenue = Decimal('0.00')
    
    # ============ CALCULATE MONTHLY REVENUE ============
    
    # MONTHLY ORDERS (last 30 days, including ALL orders, even if later refunded)
    monthly_orders = order_items.filter(order_date__date__gte=thirty_days_ago)
    
    # MONTHLY REFUNDED AMOUNT
    monthly_refunds = refunded_items.filter(order_date__date__gte=thirty_days_ago)
    monthly_refund_amount = monthly_refunds.aggregate(
        total=Sum(F('price') * F('qty'))
    )['total'] or Decimal('0.00')
    
    # MONTHLY INITIAL REVENUE (before commission and refunds)
    monthly_initial_revenue = monthly_orders.aggregate(
        total=Sum(F('price') * F('qty'))
    )['total'] or Decimal('0.00')
    
    # Calculate monthly commission
    monthly_commission_total = Decimal('0.00')
    monthly_valid_orders = monthly_orders.exclude(
        product_status__in=['Refunded', 'Canceled', 'canceled', 'refunded']
    )
    
    for order_item in monthly_valid_orders:
        if not hasattr(order_item, 'commission_processed') or not order_item.commission_processed:
            try:
                product = Product.objects.filter(
                    title=order_item.item,
                    vendor=vendor
                ).first()
                
                if product:
                    commission_rate = get_commission_rate(product.category)
                    item_total = order_item.price * order_item.qty
                    commission = (item_total * commission_rate) / Decimal('100.00')
                    monthly_commission_total += commission
                    
                    # Process commission
                    try:
                        admin_wallet = AdminWallet.get_wallet()
                        admin_wallet.add_commission(
                            amount=commission,
                            vendor=vendor,
                            order_item=order_item,
                            product=product,
                            description=f"Commission for {product.category.title if product.category else 'Unknown'} - {order_item.item}"
                        )
                        if hasattr(order_item, 'commission_processed'):
                            order_item.commission_processed = True
                            order_item.save()
                    except Exception as e:
                        print(f"Error processing monthly commission: {str(e)}")
                        
            except Exception as e:
                print(f"Error calculating monthly commission: {str(e)}")
    
    # Monthly final revenue (initial price minus commission minus refunds)
    monthly_final_revenue = monthly_initial_revenue - monthly_commission_total - monthly_refund_amount
    
    # Ensure monthly revenue doesn't go negative
    if monthly_final_revenue < Decimal('0.00'):
        monthly_final_revenue = Decimal('0.00')
    
    # ============ CALCULATE TOTAL REVENUE ============
    
    # TOTAL INITIAL REVENUE (before commission and refunds)
    total_initial_revenue = order_items.aggregate(
        total=Sum(F('price') * F('qty'))
    )['total'] or Decimal('0.00')
    
    # TOTAL REFUNDED AMOUNT
    total_refund_amount = refunded_items.aggregate(
        total=Sum(F('price') * F('qty'))
    )['total'] or Decimal('0.00')
    
    # Calculate total commission
    total_commission = Decimal('0.00')
    total_valid_orders = order_items.exclude(
        product_status__in=['Refunded', 'Canceled', 'canceled', 'refunded']
    )
    
    for order_item in total_valid_orders:
        if hasattr(order_item, 'commission_processed') and order_item.commission_processed:
            try:
                product = Product.objects.filter(
                    title=order_item.item,
                    vendor=vendor
                ).first()
                
                if product:
                    commission_rate = get_commission_rate(product.category)
                    item_total = order_item.price * order_item.qty
                    commission = (item_total * commission_rate) / Decimal('100.00')
                    total_commission += commission
                    
            except Exception as e:
                print(f"Error calculating total commission: {str(e)}")
    
    # Total final revenue (initial price minus commission minus refunds)
    total_final_revenue = total_initial_revenue - total_commission - total_refund_amount
    
    # Ensure total revenue doesn't go negative
    if total_final_revenue < Decimal('0.00'):
        total_final_revenue = Decimal('0.00')
    
    # Calculate commission returned from refunds
    refund_commission_returned = Decimal('0.00')
    for refund_item in refunded_items:
        if hasattr(refund_item, 'commission_processed') and refund_item.commission_processed:
            try:
                product = Product.objects.filter(
                    title=refund_item.item,
                    vendor=vendor
                ).first()
                
                if product:
                    commission_rate = get_commission_rate(product.category)
                    item_total = refund_item.price * refund_item.qty
                    commission = (item_total * commission_rate) / Decimal('100.00')
                    refund_commission_returned += commission
                    
            except Exception as e:
                print(f"Error calculating refund commission: {str(e)}")
    
    # ============ ORDER STATUS COUNTS ============
    
    # Valid orders (excluding refunded items)
    valid_order_items = order_items.exclude(
        product_status__in=['Refunded', 'Canceled', 'canceled', 'refunded']
    )
    total_orders = valid_order_items.count()
    
    # Pending vs completed orders (excluding refunded)
    pending_orders = valid_order_items.exclude(product_status='Delivered').count()
    completed_orders = valid_order_items.filter(product_status='Delivered').count()
    
    # Count refunded orders
    refunded_orders_count = refunded_items.count()
    
    # Recent orders (excluding refunded)
    recent_orders = valid_order_items.select_related('order').order_by('-order_date')[:10]
    
    # Recent refunds
    recent_refunds = refunded_items.select_related('order').order_by('-order_date')[:5]
    
    # ============ BEST SELLING PRODUCT ============
    
    # Best selling product - from valid orders only
    best_selling_data = valid_order_items.values('item').annotate(
        total_sold=Sum('qty'),
        total_revenue=Sum(F('price') * F('qty'))
    ).order_by('-total_sold').first()
    
    # Initialize best_selling with default values
    best_selling = {
        'item': 'No sales yet',
        'total_sold': 0,
        'product_image': None,
        'product_id': None
    }
    
    # If we have best-selling data, try to find the actual product
    if best_selling_data:
        best_selling['item'] = best_selling_data['item']
        best_selling['total_sold'] = best_selling_data['total_sold']
        best_selling['total_revenue'] = best_selling_data['total_revenue']
        
        # Try to find the actual product by name
        try:
            product = Product.objects.filter(
                title__iexact=best_selling_data['item'],
                vendor=vendor
            ).first()
            
            if not product:
                product = Product.objects.filter(
                    title__icontains=best_selling_data['item'],
                    vendor=vendor
                ).first()
            
            if product:
                best_selling['product'] = product
                best_selling['product_image'] = product.image
                best_selling['product_id'] = product.pid
                best_selling['product_url'] = product.get_absolute_url()
        except Exception as e:
            print(f"Error finding product for best seller: {e}")
    
    # ============ SALES DATA FOR CHARTS ============
    
    # Sales data for chart (excluding refunds)
    sales_data = []
    if valid_order_items.exists():
        for i in range(6, 0, -1):
            month_date = today - timezone.timedelta(days=30*i)
            month_start = month_date.replace(day=1)
            
            if i > 1:
                next_month = (month_date + timezone.timedelta(days=32)).replace(day=1)
                month_end = next_month - timezone.timedelta(days=1)
            else:
                month_end = today
            
            month_orders = valid_order_items.filter(
                order_date__date__gte=month_start,
                order_date__date__lte=month_end
            )
            
            month_revenue = month_orders.aggregate(
                total=Sum(F('price') * F('qty'))
            )['total'] or Decimal('0.00')
            
            sales_data.append({
                'month': month_start.strftime('%b'),
                'revenue': float(month_revenue)
            })
    else:
        # Empty chart data if no orders
        for i in range(6, 0, -1):
            month_date = today - timezone.timedelta(days=30*i)
            sales_data.append({
                'month': month_date.strftime('%b'),
                'revenue': 0.0
            })
    
    # Refund data for chart
    refund_data = []
    if refunded_items.exists():
        for i in range(6, 0, -1):
            month_date = today - timezone.timedelta(days=30*i)
            month_start = month_date.replace(day=1)
            
            if i > 1:
                next_month = (month_date + timezone.timedelta(days=32)).replace(day=1)
                month_end = next_month - timezone.timedelta(days=1)
            else:
                month_end = today
            
            month_refunds = refunded_items.filter(
                order_date__date__gte=month_start,
                order_date__date__lte=month_end
            )
            
            month_refund_amount = month_refunds.aggregate(
                total=Sum(F('price') * F('qty'))
            )['total'] or Decimal('0.00')
            
            refund_data.append({
                'month': month_start.strftime('%b'),
                'refund': float(month_refund_amount)
            })
    
    # Vendor products for display
    vendor_products = products.order_by('-date')[:5]
    
    # ============ PREPARE CONTEXT ============
    
    context = {
        'vendor': vendor,
        'total_products': total_products,
        'total_orders': total_orders,
        'refunded_orders_count': refunded_orders_count,
        
        # Revenue breakdown - IMPORTANT: Refunds are SUBTRACTED
        'today_initial_revenue': float(today_initial_revenue),
        'today_commission_total': float(today_commission_total),
        'today_refund_amount': float(today_refund_amount),
        'today_final_revenue': float(today_final_revenue),
        
        'monthly_initial_revenue': float(monthly_initial_revenue),
        'monthly_commission_total': float(monthly_commission_total),
        'monthly_refund_amount': float(monthly_refund_amount),
        'monthly_final_revenue': float(monthly_final_revenue),
        
        'total_initial_revenue': float(total_initial_revenue),
        'total_commission': float(total_commission),
        'total_refund_amount': float(total_refund_amount),
        'total_final_revenue': float(total_final_revenue),
        'refund_commission_returned': float(refund_commission_returned),
        
        # Backward compatibility
        'today_revenue': float(today_final_revenue),
        'monthly_revenue': float(monthly_final_revenue),
        'total_revenue': float(total_final_revenue),
        
        # Order status
        'pending_orders': pending_orders,
        'completed_orders': completed_orders,
        
        # Recent data
        'recent_orders': recent_orders,
        'recent_refunds': recent_refunds,
        
        # Analytics
        'best_selling': best_selling,
        'visitor_count': 10254,  # Simulated
        'visitor_growth': 1.5,   # Simulated
        
        # Chart data
        'sales_data': json.dumps(sales_data),
        'refund_data': json.dumps(refund_data),
        
        # Products
        'vendor_products': vendor_products,
        'today': today,
    }
    
    print(f"\n=== DEBUG: REVENUE BREAKDOWN ===")
    print(f"Today's Initial Revenue: {today_initial_revenue}")
    print(f"Today's Commission: {today_commission_total}")
    print(f"Today's Refund Amount: {today_refund_amount}")
    print(f"Today's Final Revenue: {today_final_revenue} (after subtracting refunds)")
    
    print(f"\nMonthly Initial Revenue: {monthly_initial_revenue}")
    print(f"Monthly Commission: {monthly_commission_total}")
    print(f"Monthly Refund Amount: {monthly_refund_amount}")
    print(f"Monthly Final Revenue: {monthly_final_revenue} (after subtracting refunds)")
    
    print(f"\nTotal Initial Revenue: {total_initial_revenue}")
    print(f"Total Commission: {total_commission}")
    print(f"Total Refund Amount: {total_refund_amount}")
    print(f"Total Final Revenue: {total_final_revenue} (after subtracting refunds)")
    print(f"Refund Commission Returned: {refund_commission_returned}")
    
    return render(request, 'user/dashboard.html', context)




def get_commission_rate(category):
    """
    Get commission rate based on product category
    """
    # Default commission rates by category
    commission_rates = {
        'Fashion': 25.0,           # 25% markup for fashion
        'Phones & Tablets': 20.0,  # 20% markup for phones & tablets
        'Computing': 15.0,         # 15% markup for computing
        'Health & Beauty': 30.0,   # 30% markup for health & beauty
        'Sound System': 18.0,      # 18% markup for sound systems
        'Games': 22.0,             # 22% markup for games
        'default': 20.0,           # Default markup for other categories
    }
    
    
    if not category:
        return Decimal(str(commission_rates['default']))
    
    category_title = category.title
    
    # Check exact match
    if category_title in commission_rates:
        return Decimal(str(commission_rates[category_title]))
    
    # Check partial matches
    for key, rate in commission_rates.items():
        if key.lower() in category_title.lower():
            return Decimal(str(rate))
    
    # Return default if no match
    return Decimal(str(commission_rates['default']))
    
    
@user_required
def orders(request):
    orders = CartOrder.objects.filter(user=request.user).order_by("-id")
    address = Address.objects.filter(user=request.user)
    user = request.user
    wishlist = Wishlist.objects.filter(user=request.user).count()

    context = {
        "orders": orders,
        "address": address,
        "users": user,
        "wishlist": wishlist,
    }
    return render(request, "core/my-orders.html", context)

# def order_details(request, id):
#     address = Address.objects.filter(user=request.user, status="Yes")
#     orders = CartOrder.objects.filter(user=request.user)
#     cancelled_orders = CartOrder.objects.filter(user=request.user, product_status="Canceled").count()
#     order = CartOrder.objects.get(user=request.user, id=id)
#     order_items = CartOrderItems.objects.filter(order=order)
    
#     # Get products with original product information - FIXED VERSION
#     products_with_details = []
#     for item in order_items:
#         try:
#             # Try to find the original product by title
#             # Use filter().first() instead of get() to handle multiple matches
#             products = Product.objects.filter(title=item.item)
            
#             if products.exists():
#                 # If multiple products found, get the first one
#                 # You might want to add additional filtering logic here
#                 product = products.first()
                
#                 # Try to find the specific product by vendor if available
#                 if hasattr(item, 'vendor_id') and item.vendor_id:
#                     try:
#                         vendor = Vendor.objects.get(vid=item.vendor_id)
#                         product = products.filter(vendor=vendor).first() or product
#                     except Vendor.DoesNotExist:
#                         pass
                
#                 products_with_details.append({
#                     'order_item': item,
#                     'product': product,
#                     'item': item.item,
#                     'invoice_no': item.invoice_no,
#                     'qty': item.qty,
#                     'price': item.price,
#                     'total': item.total,
#                     'image_url': product.image.url if product.image else None
#                 })
#             else:
#                 # Fallback to order item data if product not found
#                 products_with_details.append({
#                     'order_item': item,
#                     'product': None,
#                     'item': item.item,
#                     'invoice_no': item.invoice_no,
#                     'qty': item.qty,
#                     'price': item.price,
#                     'total': item.total,
#                     'image_url': item.image.url if item.image else None
#                 })
                
#         except Exception as e:
#             # Fallback to order item data if any error occurs
#             print(f"Error processing order item {item.id}: {str(e)}")
#             products_with_details.append({
#                 'order_item': item,
#                 'product': None,
#                 'item': item.item,
#                 'invoice_no': item.invoice_no,
#                 'qty': item.qty,
#                 'price': item.price,
#                 'total': item.total,
#                 'image_url': item.image.url if item.image else None
#             })
    
#     user = request.user
#     intotal = CartOrderItems.objects.values_list('total', flat=True).filter(order=order)
#     total = sum(intotal)
#     wishlist = Wishlist.objects.filter(user=request.user).count()

#     context = {
#         "order": order,
#         "orders": orders,
#         "products": products_with_details,
#         "user": user,
#         "wishlist": wishlist,
#         "total": total,
#         "intotal": intotal,
#         "address": address,
#         "cancel_orders": cancelled_orders,
#     }
#     return render(request, "core/order-details.html", context)


def order_details(request, id):
    address = Address.objects.filter(user=request.user, status="Yes")
    orders = CartOrder.objects.filter(user=request.user)
    cancelled_orders = CartOrder.objects.filter(user=request.user, product_status="Canceled").count()
    order = CartOrder.objects.get(user=request.user, id=id)
    order_items = CartOrderItems.objects.filter(order=order)
    
    # Get products with original product AND VENDOR information
    products_with_details = []
    for item in order_items:
        try:
            # Try to find the original product by title
            products = Product.objects.filter(title=item.item)
            
            if products.exists():
                product = products.first()
                
                # Get vendor information FROM VENDOR MODEL
                vendor_info = None
                if item.vendor_id:
                    try:
                        vendor = Vendor.objects.get(vid=item.vendor_id)
                        vendor_info = {
                            'name': vendor.name,
                            'store_name': vendor.store_name if vendor.store_name else vendor.name,
                            'business_name': vendor.business_name if vendor.business_name else vendor.name,
                            'id': vendor.vid,
                        }
                    except Vendor.DoesNotExist:
                        vendor_info = {
                            'name': item.vendor if hasattr(item, 'vendor') else 'Unknown',
                            'store_name': item.vendor if hasattr(item, 'vendor') else 'Unknown',
                            'business_name': item.vendor if hasattr(item, 'vendor') else 'Unknown',
                            'id': item.vendor_id,
                        }
                
                products_with_details.append({
                    'order_item': item,
                    'product': product,
                    'item': item.item,
                    'invoice_no': item.invoice_no,
                    'qty': item.qty,
                    'price': item.price,
                    'total': item.total,
                    'image_url': product.image.url if product.image else None,
                    'vendor': vendor_info,
                })
            else:
                # Fallback to order item data if product not found
                vendor_info = {
                    'name': item.vendor if hasattr(item, 'vendor') else 'Unknown',
                    'store_name': item.vendor if hasattr(item, 'vendor') else 'Unknown',
                    'id': item.vendor_id if hasattr(item, 'vendor_id') else '',
                }
                
                products_with_details.append({
                    'order_item': item,
                    'product': None,
                    'item': item.item,
                    'invoice_no': item.invoice_no,
                    'qty': item.qty,
                    'price': item.price,
                    'total': item.total,
                    'image_url': item.image.url if item.image else None,
                    'vendor': vendor_info,
                })
                
        except Exception as e:
            print(f"Error processing order item {item.id}: {str(e)}")
            vendor_info = {
                'name': item.vendor if hasattr(item, 'vendor') else 'Unknown',
                'store_name': item.vendor if hasattr(item, 'vendor') else 'Unknown',
                'id': item.vendor_id if hasattr(item, 'vendor_id') else '',
            }
            
            products_with_details.append({
                'order_item': item,
                'product': None,
                'item': item.item,
                'invoice_no': item.invoice_no,
                'qty': item.qty,
                'price': item.price,
                'total': item.total,
                'image_url': item.image.url if item.image else None,
                'vendor': vendor_info,
            })
    
    user = request.user
    intotal = CartOrderItems.objects.values_list('total', flat=True).filter(order=order)
    total = sum(intotal)
    wishlist = Wishlist.objects.filter(user=request.user).count()
    
    # ✅ ADD delivery_method here
    delivery_method = order.delivery_method if hasattr(order, 'delivery_method') else 'Door Step Delivery'
    
    context = {
        "order": order,
        "orders": orders,
        "products": products_with_details,
        "user": user,
        "wishlist": wishlist,
        "total": total,
        "intotal": intotal,
        "address": address,
        "cancel_orders": cancelled_orders,
        "order_note": order.order_note,
        "delivery_method_display": order.formatted_delivery_method,
    }
    return render(request, "core/order-details.html", context)

def order_invoice(request, id):
    address = Address.objects.filter(user=request.user)[:1]
    order = CartOrder.objects.get(user=request.user, id=id)
    products = CartOrderItems.objects.filter(order=order)
    intotal = CartOrderItems.objects.values_list('total', flat=True).filter(order=order)
    total = sum(intotal)
    user = request.user

    context = {
        "address": address,
        "order": order,
        "products": products,
        "user": user,
        "total": total,
        "intotal": intotal,
    }
    return render(request, "core/order-invoice.html", context)

def profile(request):
    orders = CartOrder.objects.filter(user=request.user)
    address = Address.objects.filter(user=request.user)
    user = request.user
    cancelled_orders = CartOrder.objects.filter(user=request.user, product_status="Canceled").count()
    vendorprofile = Vendor.objects.filter(user=request.user)
    wishlist = Wishlist.objects.filter(user=request.user).count()

    context = {
        "orders": orders,
        "address": address,
        "users": user,
        "wishlist": wishlist,
        "cancelled": cancelled_orders,
        "cvendor": vendorprofile,
    }
    return render(request, "core/profile.html", context)


def delete_address(request, id):
    address = Address.objects.get(id=id)
    
    address.delete = True
    address.save()
    
    return redirect("address")

def new_profile(request):   
    user = request.user 
    if request.method == "POST":
        first = request.POST.get("first")
        last = request.POST.get("last")
        # email = request.POST.get("email")
        phone = request.POST.get("phone")
        
        # Update User Details                
        
        user.first_name = first
        user.last_name = last
        # user.email = email
        user.phone = phone
        user.save()
        
    context = {
        "user": user,
    }
        
    return render(request, "core/account.html", context)

def address(request):
    address = Address.objects.filter(user=request.user, delete=False)
    
    context = {
        "add": address,
    }
    return render(request, "core/address.html", context)

def edit_profile(request):
    orders = CartOrder.objects.filter(user=request.user)
    address = Address.objects.filter(user=request.user)
    user = request.user
    cancelled_orders = CartOrder.objects.filter(user=request.user, product_status="Canceled").count()
    vendorprofile = Vendor.objects.filter(user=request.user)
    wishlist = Wishlist.objects.filter(user=request.user).count()

    if request.method == 'POST':
        user.first_name = request.POST.get('first_name')
        user.last_name = request.POST.get('last_name')
        user.phone = request.POST.get('phone')
        user.save()

        messages.success(request, 'Profile Successfully Edited')
        return redirect('my-profile')

    context = {
        "orders": orders,
        "address": address,
        "users": user,
        "cancelled": cancelled_orders,
        "wishlist": wishlist,
        "cvendor": vendorprofile,
    }
    return render(request, "core/edit-profile.html", context)

def edit_address(request, id):
    orders = CartOrder.objects.filter(user=request.user)
    country = Address.COUNTRY_CHOICES
    address = Address.objects.get(user=request.user, id=id)
    current = Address.objects.filter(address=address)
    user = request.user    
    cancelled_orders = CartOrder.objects.filter(user=request.user, product_status="Canceled").count()
    wishlist = Wishlist.objects.filter(user=request.user).count()

    if request.method == 'POST':
        if 'delete' in request.POST:
            address.delete = True
            address.save()
            messages.success(request, 'Address Deleted Successfully')
            return redirect('address')
        
        # Get latitude and longitude if available
        address_latitude = request.POST.get('address_latitude')
        address_longitude = request.POST.get('address_longitude')
        
        address.first_name = request.POST.get('first')
        address.last_name = request.POST.get('last')
        address.phone = request.POST.get('phone')
        address.address = request.POST.get('address')
        address.country = request.POST.get('country')
        address.state = request.POST.get('state')
        address.city = request.POST.get('city')
        
        # Make postal code optional - if empty, set to None
        postal = request.POST.get('postal', '').strip()
        address.postal = postal if postal else None
        
        # Save latitude and longitude if your Address model has these fields
        # If your Address model doesn't have these fields, comment these lines
        if address_latitude:
            address.latitude = address_latitude
        if address_longitude:
            address.longitude = address_longitude
        
        status = request.POST.get('status')
        if status == 'Yes':
            Address.objects.exclude(id=id).update(status='No')
        address.status = status
        address.save()
        messages.success(request, 'Address Updated Successfully')
        return redirect('address')

    context = {
        "orders": orders,
        "address": address,
        "users": user,
        "current": current,
        "cancelled": cancelled_orders,
        "wishlist": wishlist,
        "country": country,
    }
    return render(request, "core/edit-address.html", context)

def add_new_address(request):
    orders = CartOrder.objects.filter(user=request.user)
    fcountry = Address.COUNTRY_CHOICES
    user = request.user
    cancelled_orders = CartOrder.objects.filter(user=request.user, product_status="Canceled").count()
    wishlist = Wishlist.objects.filter(user=request.user).count()

    if request.method == 'POST':
        first = request.POST.get('first')
        last = request.POST.get('last')
        phone = request.POST.get('phone')
        address = request.POST.get('address')
        country = request.POST.get('country')
        state = request.POST.get('state')
        city = request.POST.get('city')
        postal = request.POST.get('postal')  # This can now be empty
        status = request.POST.get('status')
        
        if status == 'Yes':
            Address.objects.exclude().update(status='No')
        status = status

        # Create address - postal is optional
        create = Address.objects.create(
            user=user,
            first_name=first,
            last_name=last,
            phone=phone,
            address=address,
            country=country,
            state=state,
            city=city,
            postal=postal if postal else None,  # If empty, save as None
            status=status
        )
        
        messages.success(request, 'Address Successfully Created')
        return redirect('address')

    context = {
        "orders": orders,
        "users": user,
        "cancelled": cancelled_orders,
        "country": fcountry,
        "wishlist": wishlist,
    }
    return render(request, "core/add-new-address.html", context)

def create_product(request):
    the_vendor = Vendor.objects.get(user=request.user)
    orders = CartOrder.objects.filter(user=request.user)
    user = request.user
    cancelled_orders = CartOrder.objects.filter(user=request.user, product_status="Canceled").count()
    wishlist = Wishlist.objects.filter(user=request.user).count()
    list = CategoryList
    productpics = ProductPics
    current_vendor = Vendor.objects.get(user=request.user)

    if request.method == 'POST':
        form = CategoryList(request.POST, request.FILES)

        if form.is_valid():
            new_form = form.save(commit=False)
            new_form.user = request.user
            new_form.vendor = current_vendor
            new_form.save()
            messages.success(request, 'Product Created Successfully')
            return redirect('my-products')
    else:
        form = CategoryList()           
    context = {
        "list": form,
        "orders": orders,
        "wishlist": wishlist,
        "users": user,
        "cancelled": cancelled_orders,
        "p_pic": productpics,
        "myproducts": the_vendor,
    }
    return render(request, "core/add-product.html", context)

def my_product(request):
    myproducts = Product.objects.filter(user=request.user)
    orders = CartOrder.objects.filter(user=request.user)
    user = request.user
    cancelled_orders = CartOrder.objects.filter(user=request.user, product_status="Canceled").count()
    count_vendor = Vendor.objects.filter(user=request.user).count()
    
    if count_vendor > 0:
        vendor = Vendor.objects.get(user=request.user)
        vid = vendor.vid
    else:
        vid = 0
        vendor = 0


    context = {
        "myproducts": myproducts,
        "orders": orders,
        "users": user,
        "wishlist": wishlist,
        "cancelled": cancelled_orders,
        "vid": vid,
        "vendor_name": vendor,
    }

    

    return render(request, "core/my-products.html", context)

def edit_my_product(request, pid):
    myproducts = Product.objects.get(user=request.user, pid=pid)
    orders = CartOrder.objects.filter(user=request.user)
    user = request.user
    cancelled_orders = CartOrder.objects.filter(user=request.user, product_status="Canceled").count()
    wishlist = Wishlist.objects.filter(user=request.user).count()
    list = CategoryList
    productpics = ProductPics

    if request.method == 'POST':
        form = CategoryList(request.POST, request.FILES, instance=myproducts)

        if form.is_valid():
            new_form = form.save(commit=False)
            new_form.user = request.user
            new_form.save()
            form.save_m2m()
            messages.success(request, 'Product Updated Successfully')
            return redirect('my-products')
    else:
        form = CategoryList(instance=myproducts)
           
    context = {
        "myproducts": myproducts,
        "orders": orders,
        "wishlist": wishlist,
        "users": user,
        "cancelled": cancelled_orders,
        "list": form,
        "p_pic": productpics,
    }

    return render(request, "core/edit-my-products.html", context)

@user_required
def wishlist(request):
    # Get wishlist items where product exists
    wishlist = Wishlist.objects.filter(user=request.user, product__isnull=False)
    
    # Filter to only include products with pid
    valid_wishlist = []
    for item in wishlist:
        if hasattr(item, 'product') and item.product and hasattr(item.product, 'pid') and item.product.pid:
            valid_wishlist.append(item)
        else:
            # Delete invalid wishlist items
            item.delete()
    
    for_you = Product.objects.filter(product_status="published", pid__isnull=False).order_by("?")[:4]

    if request.method == 'POST':
        if 'delete' in request.POST:
            wishlist.delete()
            messages.success(request, 'Product Deleted from Wishlist Successfully')
            return redirect('wishlist')

    context = {
        "wl": valid_wishlist,
        "for": for_you,
    }
    return render(request, "core/wishlist.html", context)

@user_required
def delete_wishlist(request):
    id = request.GET["id"]
    delete_wishlist = Wishlist.objects.filter(user=request.user, id=id)
    delete_wishlist.delete()
    
    bool = True
        
    context = {
        "bool": bool,
    }    
    
    return JsonResponse(context)



def payment_completed(request):
    return render(request, "core/payment-completed.html")

def payment_failed(request):
    return render(request, "core/payment-failed.html")

def add_to_wishlist(request):
    product_id = request.GET['id']
    product = Product.objects.get(id=product_id)

    context = {}

    if request.user.is_authenticated:
        wishlist_count = Wishlist.objects.filter(product=product, user=request.user).count()
        print(wishlist_count)
        if wishlist_count > 0:
            context = {
                "bool": False
            }
        else:
            new_wishlist = Wishlist.objects.create(
                product=product,
                user=request.user
            )
            context = {
                "bool": True
            }
    else:
        context = {
            "bool": None
        }

    return JsonResponse(context)

def brands(request):
    brands = Brand.objects.all()

    context = {
        "brands": brands
    }
    return render(request, "core/brands.html", context)

def brand_details(request, brand):
    return render(request, "core/brand-details.html")

def create_vender(request):
    orders = CartOrder.objects.filter(user=request.user)
    address = Address.objects.filter(user=request.user)
    user = request.user
    cancelled_orders = CartOrder.objects.filter(user=request.user, product_status="Canceled").count()
    wishlist = Wishlist.objects.filter(user=request.user).count()

    try:
        vendorprofile = Vendor.objects.get(user=request.user)
        vendorprofile == vendorprofile
        return redirect('vendor-dashboard')
    
    except:

        if request.method == 'POST' and 'image' in request.FILES and 'cover' in request.FILES:
            image = request.FILES['image']
            cover = request.FILES['cover']
            fss = os.path.join(settings.MEDIA_ROOT, 'user_directory_path')
            file = os.path.join(fss, image.name)
            with open(file, 'wb+') as destination:
                for chunk in image.chunks():
                    destination.write(chunk)
            image_url = file
            fss = os.path.join(settings.MEDIA_ROOT, 'user_directory_path')
            file = os.path.join(fss, cover.name)
            with open(file, 'wb+') as destination:
                for chunk in cover.chunks():
                    destination.write(chunk)
            cover_url = file
            store_name = request.POST.get('store_name')
            description = request.POST.get('description')
            vaddress = request.POST.get('address')
            chat_res = request.POST.get('chat_res')
            shipping_time = request.POST.get('shipping_time')
            rating = request.POST.get('rating')
            days_return = request.POST.get('days_return')
            warranty = request.POST.get('warranty')
            phone = request.POST.get('phone')

            create_vendor = Vendor.objects.create(
                name=store_name,
                image=image_url,
                cover_image=cover_url,
                description=description,
                address=vaddress,
                contact=phone,
                chat_resp_time=chat_res,
                shipping_on_time=shipping_time,
                authentic_rating=rating,
                days_return=days_return,
                warranty_period=warranty,
                user=user
            )

            messages.success(request, 'Vendor Profile Successfully Created')
            return redirect('vendor-dashboard')

        context = {
            "orders": orders,
            "address": address,
            "users": user,
            "cancelled": cancelled_orders,
            "wishlist": wishlist,
        }
        return render(request, "core/create-new-vendor.html", context)








@vendor_required
def vendor_orders_details(request, vid, unique_id):
    """
    Vendor order details view - SIMPLE FIXED VERSION
    """
    from admin_dashboard.signals import notify_vendor_response
    try:
        # Get vendor and verify ownership
        vendor = Vendor.objects.get(vid=vid)
        if vendor.user != request.user:
            messages.error(request, "You don't have permission to view this order.")
            return redirect('vendor_orders')
        
        # Get order item
        order_item = CartOrderItems.objects.get(unique_id=unique_id, vendor_id=vid)
        order = order_item.order  # Get the main CartOrder
        
        # Mark as seen by vendor
        if not order_item.vendor_seen:
            order_item.vendor_seen = True
            order_item.save()
        
        # Handle form submissions
        if request.method == 'POST':
            # Handle vendor response submission (ACCEPT/REJECT)
            if 'save_vendor_response' in request.POST:
                vendor_acceptance = request.POST.get('vendor_acceptance', '').strip()
                
                if vendor_acceptance == 'yes':
                    # Vendor accepts
                    order.vendor_acceptance = True
                    order.vendor_acceptance_date = timezone.now()
                    order.vendor_rejection_reason = ''
                    order.vendor_rejection_notes = ''
                    
                    # DO NOT change product_status here - keep it as 'Placed'
                    # Admin will change it to 'Confirmed' later
                    
                    order.save()
                    
                    # Also update order_item for consistency
                    order_item.vendor_acceptance = True
                    order_item.vendor_acceptance_date = timezone.now()
                    order_item.save()
                    
                    notify_vendor_reaponse(order)
                    messages.success(request, 'Order accepted! Admin will review and confirm.')
                    
                    # Send notification to admin
                    send_vendor_response_notification(order, vendor, True)
                    
                elif vendor_acceptance == 'no':
                    rejection_reason = request.POST.get('vendor_rejection_reason', '').strip()
                    rejection_notes = request.POST.get('vendor_rejection_notes', '').strip()
                    
                    if not rejection_reason:
                        messages.error(request, "Please provide a reason for rejecting the order.")
                        return redirect('vendor_orders_details', vid=vid, unique_id=unique_id)
                    
                    order.vendor_acceptance = False
                    order.vendor_acceptance_date = timezone.now()
                    order.vendor_rejection_reason = rejection_reason
                    order.vendor_rejection_notes = rejection_notes
                    
                    # When vendor rejects, still keep status as 'Placed'
                    # Admin will review and decide whether to cancel
                    # DO NOT auto-cancel
                    
                    order.save()
                    
                    # Also update order_item for consistency
                    order_item.vendor_acceptance = False
                    order_item.vendor_acceptance_date = timezone.now()
                    order_item.vendor_rejection_reason = rejection_reason
                    order_item.save()
                    
                    notify_vendor_reaponse(order)
                    messages.warning(request, 'Order rejected. Admin has been notified.')
                    
                    # Send notification to admin
                    send_vendor_response_notification(order, vendor, False, rejection_reason)
                    
                else:
                    messages.error(request, "Please select whether you accept or reject this order.")
                
                return redirect('vendor_orders_details', vid=vid, unique_id=unique_id)
            
            # Handle order status update (shipping updates)
            elif 'product_status' in request.POST:
                # Vendor can only update status if:
                # 1. Vendor has accepted the order
                # 2. Admin has confirmed the order (status is 'Confirmed')
                if order.vendor_acceptance and order.product_status == 'Confirmed':
                    form = VendorOptionList(request.POST, instance=order_item)
                    if form.is_valid():
                        form.save()
                        messages.success(request, 'Order status updated successfully!')
                else:
                    messages.error(request, 'Cannot update status until admin confirms the order.')
                
                return redirect('vendor_orders_details', vid=vid, unique_id=unique_id)
        
        # Get the form for status updates
        form = VendorOptionList(instance=order_item)
        
        # Get related data
        address = Address.objects.filter(user=request.user, status="Yes")
        cancelled_orders = CartOrder.objects.filter(user=request.user, product_status="Canceled").count()
        orders_placed = CartOrder.objects.filter(user=request.user).count()
        wishlist = Wishlist.objects.filter(user=request.user).count()
        
        # Try to get product
        try:
            product = Product.objects.filter(title__icontains=order_item.item, vendor=vendor).first()
        except:
            product = None
        
        # Get rejection reasons
        try:
            rejection_reasons = order.VENDOR_REJECTION_REASONS
        except AttributeError:
            rejection_reasons = [
                ('out_of_stock', 'Out of Stock'),
                ('damaged', 'Damaged Product'),
                ('incorrect_listing', 'Incorrect Listing'),
                ('manufacturing_delay', 'Manufacturing Delay'),
                ('price_error', 'Price Error'),
                ('other', 'Other Reasons'),
            ]
        
        context = {
            "vendor": vendor,
            "vid": vendor.vid,
            "order_item": order_item,
            "order": order,
            "product": product,
            "address": address,
            "cancelled": cancelled_orders,
            "wishlist": wishlist,
            "placed": orders_placed,
            "form": form,
            "rejection_reasons": rejection_reasons,
            "can_update_status": order.vendor_acceptance and order.product_status == 'Confirmed',
            "order_note": order.order_note,
        }
        return render(request, "user/vendor-orders-details.html", context)
        
    except Exception as e:
        print(f"ERROR in vendor_orders_details: {str(e)}")
        messages.error(request, f"Error loading order details: {str(e)}")
        return redirect('vendor_orders')



 

def send_vendor_response_notification(order, vendor, accepted=True, rejection_reason=''):
    """
    Send notification to admin about vendor response
    """
    try:
        admin_users = User.objects.filter(is_staff=True, is_active=True)
        
        if accepted:
            title = f'Vendor Accepted Order #{order.oid}'
            message = f'Vendor {vendor.name} has accepted order #{order.oid}. Order is now confirmed and ready for processing.'
        else:
            title = f'Vendor Rejected Order #{order.oid}'
            message = f'Vendor {vendor.name} has rejected order #{order.oid}. Reason: {rejection_reason}. Order has been canceled.'
        
        for admin_user in admin_users:
            Notification.objects.create(
                user=admin_user,
                notification_type='order_update',
                title=title,
                message=message,
                order=order,
            )
            
        print(f"Notification sent to admin for vendor response on order #{order.oid}")
        
    except Exception as e:
        print(f"Error sending vendor response notification: {str(e)}")
    
    
    
@vendor_required
def save_vendor_response_ajax(request):
    """
    SIMPLE AJAX endpoint to test vendor response saving
    """
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            order_id = request.POST.get('order_id')
            response_type = request.POST.get('response_type')  # 'accept' or 'reject'
            
            print(f"AJAX DEBUG: Saving response for order {order_id}: {response_type}")
            
            order = CartOrder.objects.get(id=order_id)
            
            if response_type == 'accept':
                order.vendor_acceptance = True
                order.vendor_acceptance_date = timezone.now()
                message = "Order accepted!"
            elif response_type == 'reject':
                order.vendor_acceptance = False
                order.vendor_acceptance_date = timezone.now()
                order.vendor_rejection_reason = request.POST.get('rejection_reason', 'other')
                message = "Order rejected!"
            
            order.save()
            
            # Verify save
            order.refresh_from_db()
            print(f"AJAX DEBUG: After save - acceptance={order.vendor_acceptance}, date={order.vendor_acceptance_date}")
            
            return JsonResponse({
                'success': True,
                'message': message,
                'vendor_acceptance': order.vendor_acceptance,
                'vendor_acceptance_date': order.vendor_acceptance_date.strftime('%Y-%m-%d %H:%M:%S') if order.vendor_acceptance_date else None,
            })
            
        except Exception as e:
            print(f"AJAX ERROR: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})
    
@vendor_required
def check_vendor_status(request):
    """Diagnostic view to check vendor status"""
    try:
        vendor = Vendor.objects.get(user=request.user)
        return JsonResponse({
            'status': 'success',
            'vendor_id': vendor.vid,
            'vendor_name': vendor.name,
            'user_email': request.user.email,
            'approval_status': vendor.approval_status,
            'has_products': Product.objects.filter(vendor=vendor).exists()
        })
    except Vendor.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'No vendor profile found for this user',
            'user_email': request.user.email
        })
        

@vendor_required
def vendor_orders_debug(request):
    """Enhanced debug view to find vendor orders"""
    vendor = Vendor.objects.get(user=request.user)
    
    debug_data = {
        'vendor_info': {
            'id': vendor.vid,
            'name': vendor.name,
            'email': request.user.email,
            'approval_status': vendor.approval_status
        },
        'order_search_methods': {}
    }
    
    # METHOD 1: Search by vendor name in CartOrderItems
    orders_by_name = CartOrderItems.objects.filter(vendor=vendor.name)
    debug_data['order_search_methods']['by_vendor_name'] = {
        'criteria': f"vendor='{vendor.name}'",
        'count': orders_by_name.count(),
        'sample': list(orders_by_name.values('item', 'vendor', 'vendor_id', 'invoice_no')[:3])
    }
    
    # METHOD 2: Search by vendor ID in CartOrderItems
    orders_by_id = CartOrderItems.objects.filter(vendor_id=str(vendor.vid))
    debug_data['order_search_methods']['by_vendor_id'] = {
        'criteria': f"vendor_id='{vendor.vid}'",
        'count': orders_by_id.count(),
        'sample': list(orders_by_id.values('item', 'vendor', 'vendor_id', 'invoice_no')[:3])
    }
    
    # METHOD 3: Search by product association
    vendor_products = Product.objects.filter(vendor=vendor)
    product_titles = [product.title for product in vendor_products]
    orders_by_products = CartOrderItems.objects.filter(item__in=product_titles)
    debug_data['order_search_methods']['by_product_titles'] = {
        'criteria': f"item in {len(product_titles)} vendor products",
        'count': orders_by_products.count(),
        'sample': list(orders_by_products.values('item', 'vendor', 'vendor_id', 'invoice_no')[:3])
    }
    
    # METHOD 4: Check ALL orders in system to see vendor data format
    all_orders_sample = CartOrderItems.objects.all()[:10]
    debug_data['all_orders_sample'] = {
        'count': CartOrderItems.objects.count(),
        'sample': list(all_orders_sample.values('item', 'vendor', 'vendor_id', 'invoice_no'))
    }
    
    # METHOD 5: Check if vendor name matches exactly
    vendor_names_in_orders = CartOrderItems.objects.values_list('vendor', flat=True).distinct()
    debug_data['vendor_names_in_system'] = list(vendor_names_in_orders)
    
    return JsonResponse(debug_data)

def compare_products(request):
    compare = CompareProduct.objects.filter(user=request.user)

    context = {
        "compare": compare,
    }

    return render(request, "core/compare-products.html", context)

def add_to_compare(request):
    product_id = request.GET['id']
    product = Product.objects.get(id=product_id)

    context = {}


    if request.user.is_authenticated:
        compare_count = CompareProduct.objects.filter(product=product, user=request.user).count()
        print(compare_count)
        if compare_count > 0:
            context = {
                "bool": True
            }
        else:
            new_compare = CompareProduct.objects.create(
                product=product,
                user=request.user
            )
            context = {
                "bool": True
            }
    else:
        context = {
            "bool": False
        }

    return JsonResponse(context)

def remove_compare(request):
    product_id = request.GET['id']
    product = CompareProduct.objects.get(id=product_id)

    context = {}

    product.delete()

    context = {
        "bool": True
    }
    
    return JsonResponse(context)

def add_new_address_ajax(request):
    address = request.GET['address']
    city = request.GET['city']
    state = request.GET['state']
    country = request.GET['country']
    phone = request.GET['phone']
    postal = request.GET['postal']

    if address and city and state and country and phone and postal:
        Address.objects.create(
        user=request.user,
        address=address,
        postal=postal,
        phone=phone,
        country=country,
        city=city,
        state=state,
        )

        context = {
            "bool": True
        }

    else:
        return HttpResponse("Some Fields Are Empty...")

    return JsonResponse(context)

def delete_search(request):
    s_text = request.GET['id']

    delete_search = SearchHistory.objects.get(user=request.user, id=s_text)

    delete_search.delete()


    context = {
        "bool": True
    }

    return JsonResponse(context)

def newsletter(request):
    email = request.GET['id']
    pattern = r'^[a-zA-Z0-9._%+=]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if re.match(pattern, email):
        check_emails = NewsLetter.objects.filter(email=email).count()

        if check_emails == 0:
            NewsLetter.objects.create(
            email=email
            )

            context = {
                "bool": True
            }   

        else:
            context = {
                "bool": False   
            }
    else:
        context = {
            "bool": None
        }
    return JsonResponse(context)

def address_update_ajax(request):
    if request.method == 'POST':
        order_note = request.POST.get('order_note')
        address_radio = request.POST.get('address')
        payment_method = request.POST.get('payment')
        delivery_method = request.POST.get('delivery_method')

        request.session['order_note'] = order_note
        request.session['address'] = address_radio
        request.session['payment'] = payment_method
        request.session['delivery_method'] = delivery_method

        return redirect('order')
    address = Address.objects.filter(user=request.user, delete=False, status="No").order_by("-id")
    default = Address.objects.filter(user=request.user, delete=False, status="Yes")
    may_like = Product.objects.filter(product_status="published", featured=True)
    country = AddressCountryList
    user = request.user
    cart_total_amount = 0
    total = 0
    discount_price = 0
    old_price = 0
    token = str(uuid.uuid4())
    request.session['from_checkout'] = True
    if 'cart_data_obj' in request.session:
        for p_id, item in request.session['cart_data_obj'].items():
            change = item['price']
            without_comma = change.replace(',', '')
            total += int(item['qty']) * float(without_comma)
            cart_total_amount += int(item['qty']) * float(without_comma)
            old_price += int(item['qty']) * float(without_comma)
    if 'new_price_after_coupon' in request.session:
        discount_amount = request.session.get('new_price_after_coupon')
        discount_price = float(old_price) - float(discount_amount)
        cart_total_amount = discount_amount
        print(cart_total_amount)
        print(discount_amount)
        print("Coupon Price is:", discount_price)
        thecode = request.session.get('thecoupon')
        print("This is the coupon code:", thecode)
    else:
        pass

            
    return render(request, "core/address-update-ajax.html", {"cart_data": request.session['cart_data_obj'], "old": old_price, "discount": discount_price, "country": country, "may_like": may_like, "total": total, "user": user, 'default_address': default, "address": address, 'totalcartitems': len(request.session['cart_data_obj']), 'cart_total_amount':cart_total_amount})

            

def grab_coupon(request):
    check_coupon = request.GET['coupon']
    email = request.user.email
    # current_price = request.GET['current_price']
    current_price = Cart.objects.filter(user=request.user).aggregate(total=Sum(F('product__price') * F('qty')))['total'] or 0
    grab_coupon = Coupon.objects.get(coupon_code=check_coupon)
    used = CouponEmail.objects.filter(coupon=grab_coupon, user_email=email).count()
    dis = grab_coupon.discount

    if grab_coupon:
        context = {
            "coupon": True
        }
        if used == 0:
                if '%' in dis:
                    request.session['thecoupon'] = check_coupon
                    remove_percentage = int(dis.rstrip('%'))
                    print("This is the percentage without %:", remove_percentage)
                    remove_amount_in_percentege = float(current_price) * (float(remove_percentage) / 100)
                    new_price_after_coupon = float(current_price) - float(remove_amount_in_percentege)
                    change_to_string = str(new_price_after_coupon)
                    request.session['new_price_after_coupon'] = change_to_string
                    coupon_session = request.session.get('new_price_after_coupon')
                    # cr_used = CouponEmail.objects.create(coupon=grab_coupon, user_email=email)
                    context = {
                        "bool": True,
                        "new_price": new_price_after_coupon,
                        "session": coupon_session,
                    }
                else:
                    if float(dis) > float(current_price):
                        context = {
                            "price": False
                        }
                    else:
                        request.session['thecoupon'] = check_coupon
                        new_price_after_coupon = float(current_price) - float(grab_coupon.discount)
                        change_to_string = str(new_price_after_coupon)
                        request.session['new_price_after_coupon'] = change_to_string
                        coupon_session = request.session.get('new_price_after_coupon')
                        # cr_used = CouponEmail.objects.create(coupon=grab_coupon, user_email=email)
                        context = {
                            "bool": True,
                            "new_price": new_price_after_coupon,
                            "session": coupon_session,
                        }
        else:
            context = {
                "bool": False
            }
    else:
        context = {
            "coupon": False
        }
    return JsonResponse(context)

def update_coupon(request):
    if request.method == 'POST':
        order_note = request.POST.get('order_note')
        address_radio = request.POST.get('address')
        payment_method = request.POST.get('payment')
        delivery_method = request.POST.get('delivery_method')

        request.session['order_note'] = order_note
        request.session['address'] = address_radio
        request.session['payment'] = payment_method
        request.session['delivery_method'] = delivery_method

        return redirect('order')
    address = Address.objects.filter(user=request.user, status="No")
    default = Address.objects.filter(user=request.user, status="Yes")
    may_like = Product.objects.filter(product_status="published", featured=True)
    country = AddressCountryList
    user = request.user
    cart_total_amount = 0
    total = 0
    discount_price = 0
    old_price = 0
    token = str(uuid.uuid4())
    request.session['from_checkout'] = True
    if 'cart_data_obj' in request.session:
        for p_id, item in request.session['cart_data_obj'].items():
            change = item['price']
            without_comma = change.replace(',', '')
            total += int(item['qty']) * float(without_comma)
            cart_total_amount += int(item['qty']) * float(without_comma)
            old_price += int(item['qty']) * float(without_comma)
    if 'new_price_after_coupon' in request.session:
        discount_amount = request.session.get('new_price_after_coupon')
        discount_price = float(old_price) - float(discount_amount)
        cart_total_amount = discount_amount
        print(cart_total_amount)
        print(discount_amount)
        print("Coupon Price is:", discount_price)
        thecode = request.session.get('thecoupon')
        print("This is the coupon code:", thecode)
    else:
        pass

            
    return render(request, "core/update-coupon.html", {"cart_data": request.session['cart_data_obj'], "old": old_price, "discount": discount_price, "country": country, "may_like": may_like, "total": total, "user": user, 'default_address': default, "address": address, 'totalcartitems': len(request.session['cart_data_obj']), 'cart_total_amount':cart_total_amount})

def contact(request):
    if request.method == "POST":
        name = request.POST.get("name")
        email = request.POST.get("email")
        subject = request.POST.get("phone")
        message = request.POST.get("message")

        ContactForm.objects.create(
            name=name,
            email=email,
            subject=subject,
            message=message,
        )
        messages.success(request, "Form Submitted Successfully. Trenva Support will get back to you.")
        return redirect('contact-us')  
    return render(request, "core/contact.html")




# def track_order(request):
#     orders = CartOrder.objects.filter(user=request.user)
#     address = Address.objects.filter(user=request.user, status="Yes")
#     user = request.user
#     cancelled_orders = CartOrder.objects.filter(user=request.user, product_status="Canceled").count()
#     wishlist = Wishlist.objects.filter(user=request.user).count()
#     count_vendor = Vendor.objects.filter(user=request.user).count()
#     get_user_email = User    
#     which = None
#     get = None
#     if count_vendor > 0:
#         vendor = Vendor.objects.get(user=request.user)
#         vid = vendor.vid
#     else:
#         vid = 0
        
#     if request.method == "POST":
#         tracking_id = request.POST.get("id")
        
#         # Try to find by tracking_id in CartOrder (legacy)
#         check = CartOrder.objects.filter(tracking_id=tracking_id)
        
#         # Also check in Delivery model
#         from core.models import Delivery
#         delivery = Delivery.objects.filter(tracking_id=tracking_id).first()
        
#         if check.exists():
#             which = True
#             get = CartOrder.objects.get(tracking_id=tracking_id)
#         elif delivery:
#             which = True
#             get = delivery.order  # Get the order from delivery
#             messages.info(request, f"Tracking delivery #{tracking_id} for Order #{delivery.order.oid}")
#         else:
#             get = False
#             messages.error(request, f"Order with Tracking ID {tracking_id} does not exist")
    
#     # Get all deliveries for user's orders
#     from core.models import Delivery
#     user_orders = CartOrder.objects.filter(user=request.user)
#     deliveries = Delivery.objects.filter(order__in=user_orders).order_by('-created_at')

#     context = {
#         "orders": orders,
#         "address": address,
#         "users": user,
#         "cancelled": cancelled_orders,
#         "wishlist": wishlist,
#         "vid": vid,
#         "bool": which,
#         "tracked": get,
#         "deliveries": deliveries[:10],  # Last 10 deliveries
#     }
    
#     return render(request, "core/track-order.html", context)


def track_order(request):
    orders = CartOrder.objects.filter(user=request.user)
    address = Address.objects.filter(user=request.user, status="Yes")
    user = request.user
    cancelled_orders = CartOrder.objects.filter(user=request.user, product_status="Canceled").count()
    wishlist = Wishlist.objects.filter(user=request.user).count()
    count_vendor = Vendor.objects.filter(user=request.user).count()
    get_user_email = User    
    which = None
    get = None
    if count_vendor > 0:
        vendor = Vendor.objects.get(user=request.user)
        vid = vendor.vid
    else:
        vid = 0
        
    if request.method == "POST":
        tracking_id = request.POST.get("id")
        
        # Try to find by tracking_id in CartOrder (legacy)
        check = CartOrder.objects.filter(tracking_id=tracking_id)
        
        # Also check in Delivery model
        delivery = Delivery.objects.filter(tracking_id=tracking_id).first()
        
        if check.exists():
            which = True
            get = CartOrder.objects.get(tracking_id=tracking_id)
        elif delivery:
            which = True
            get = delivery.order
            messages.info(request, f"Tracking delivery #{tracking_id} for Order #{delivery.order.oid}")
        else:
            get = False
            messages.error(request, f"Order with Tracking ID {tracking_id} does not exist")
    
    # Get all deliveries for user's orders
    user_orders = CartOrder.objects.filter(user=request.user)
    deliveries = Delivery.objects.filter(order__in=user_orders).order_by('-created_at')

    context = {
        "orders": orders,
        "address": address,
        "users": user,
        "cancelled": cancelled_orders,
        "wishlist": wishlist,
        "vid": vid,
        "bool": which,
        "tracked": get,
        "deliveries": deliveries[:10],  # Last 10 deliveries
    }
    
    return render(request, "core/track-order.html", context)
    
    
# def track_delivery_detail(request, tracking_id):
#     """
#     View to track a specific delivery by Trippa tracking ID
#     """
#     from core.models import Delivery, CartOrder
#     from .services.trippa import TrippaDelivery
    
#     delivery = None
#     order = None
    
#     try:
#         # Try to get from Delivery model
#         delivery = Delivery.objects.get(tracking_id=tracking_id)
#         order = delivery.order
        
#     except Delivery.DoesNotExist:
#         # Try to get from CartOrder
#         try:
#             order = CartOrder.objects.get(tracking_id=tracking_id)
            
#             # Create delivery record with vendor info from order
#             # Try to get vendor from order items if possible, otherwise use generic name
#             vendor_name = "Trenva Vendor"
            
#             # Safely try to get vendor info from order items
#             try:
#                 from core.models import CartOrderItem
#                 order_items = CartOrderItem.objects.filter(order=order).select_related('product__vendor')
                
#                 vendor_names = []
#                 for item in order_items:
#                     if item.product and item.product.vendor:
#                         vendor_name_val = item.product.vendor.name or item.product.vendor.user.get_full_name()
#                         if vendor_name_val and vendor_name_val not in vendor_names:
#                             vendor_names.append(vendor_name_val)
                
#                 if vendor_names:
#                     vendor_name = ", ".join(vendor_names)
#             except (ImportError, AttributeError):
#                 # If CartOrderItem doesn't exist or can't be accessed, use generic name
#                 pass
            
#             # Create delivery record
#             delivery = Delivery.objects.create(
#                 order=order,
#                 tracking_id=tracking_id,
#                 vendor_name=vendor_name,
#                 status='pending',
#                 pickup_address={},
#                 delivery_address={
#                     'address': order.address or '',
#                     'city': order.city or '',
#                     'state': order.state or '',
#                     'customerName': f"{order.first_name or ''} {order.last_name or ''}".strip(),
#                     'customerPhone': order.phone_number or ''
#                 },
#                 item_details={
#                     'description': f"Order #{order.oid}",
#                     'weight': 1.0,
#                     'value': float(order.price) if order.price else 0
#                 }
#             )
#             messages.info(request, f"Delivery tracking created for order {order.oid}")
            
#         except CartOrder.DoesNotExist:
#             messages.error(request, f"Delivery with Tracking ID {tracking_id} not found.")
#             return redirect('track-order')
    
#     # Check permissions
#     if order and order.user != request.user and not request.user.is_staff:
#         messages.error(request, "You don't have permission to view this delivery.")
#         return redirect('track-order')
    
#     if not delivery:
#         messages.error(request, "No delivery information available.")
#         return redirect('track-order')
    
#     # Get tracking from Trippa
#     trippa = TrippaDelivery()
#     tracking_result = trippa.track_delivery(tracking_id) 
    
#     tracking_data = None
#     tracking_status = None
    
#     if tracking_result.get("success"):
#         if "raw_response" in tracking_result:
#             tracking_data = tracking_result["raw_response"]
#         elif "data" in tracking_result:
#             tracking_data = tracking_result["data"]
#         elif "response" in tracking_result:
#             tracking_data = tracking_result["response"]
#         else:
#             tracking_data = tracking_result
        
#         tracking_status = tracking_result.get("status")
        
#         delivery.tracking_response = tracking_data
#         if tracking_status:
#             delivery.status = tracking_status
#         delivery.save(update_fields=['tracking_response', 'status'])
#     else:
#         messages.info(request, "Real-time tracking information is currently unavailable.")
    
#     context = {
#         "delivery": delivery,
#         "tracking": tracking_data,
#         "tracking_status": tracking_status,
#         "tracking_success": tracking_result.get("success", False),
#         "order": order
#     }
#     return render(request, "core/track-delivery-detail.html", context)

def track_order_ajax(request, tracking_id):
    show = CartOrder.objects.get(tracking_id=tracking_id, user=request.user)

    context = {
        "show": show
    }
    return render(request, "core/track-order-ajax.html", context)

def calculate_distance(request):

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        address = request.GET['address']
        city = request.GET['city']
        state = request.GET['state']
        country = request.GET['country']
        phone = request.GET['phone']
        postal = request.GET['postal']

        if address and city and state and postal and country and phone:
            context = {
                "bool": True
            }
            print("This is the full address:", address, city, state, postal, country)

            full_address = address, city, state, postal, country
            print(full_address)
            api_key = 'q16TYqyDcox7anAOMf3jES9DwktlbdwF9K7qaLnJJgk'

            def get_coordinates(address):
                
                url = f"https://geocode.search.hereapi.com/v1/geocode?q={address}&apiKey={api_key}"
                response = requests.get(url)
                data = response.json()
                if data['items']:
                    position = data['items'][0]['position']
                    return (position['lat'], position['lng'])
                return None

            def get_distance(address1, address2):
                coords1 = get_coordinates(address1)
                coords2 = get_coordinates(address2)

                if coords1 and coords2:
                    url = f"https://router.hereapi.com/v8/routes?transportMode=car&origin={coords1[0]},{coords1[1]}&destination={coords2[0]},{coords2[1]}&return=summary&apiKey={api_key}"
                    response = requests.get(url)
                    data = response.json()
                    if 'routes' in data and len(data['routes']) > 0:
                        distance = data['routes'][0]['sections'][0]['summary']['length']
                        return distance / 1000
                return None

            # Addresses
            address1 = 'New York, NY'
            address2 = 'Los Angeles, CA'

            distance = get_distance(address1, address2)
            if distance:
                print(f"Distance: {distance:.2f} km")
            else:
                print("Distance calculation failed.")

        else:
            context = {
                "bool": False
            }

        return JsonResponse(context)
    else:
        return render(request, "core/calculate-distance.html")

def show_on_delivery(request):
    address = Address.objects.filter(user=request.user, delete=False, status="No")
    default = Address.objects.filter(user=request.user, delete=False, status="Yes")
    country = AddressCountryList

    context = {
        "default_address": default,
        "address": address,
        "country": country,
    }
    return render(request, "core/show-on-delivery.html", context)

def about_us(request):
    about = AboutSite.objects.all()
    testimonials = Testimonial.objects.all()
    team = Team.objects.all()

    context = {
        "about": about,
        "tes": testimonials,
        "team": team,
    }
    return render(request, "core/about-us.html", context)

def faqs (request):
    return render(request, "core/faq.html")



# --- Product Views ---
class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    renderer_classes = [JSONRenderer]

class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'pid' 
    renderer_classes = [JSONRenderer]

# --- ProductColor Views ---
class ProductColorListView(generics.ListAPIView):
    queryset = ProductColor.objects.all()
    serializer_class = ProductColorSerializer
    renderer_classes = [JSONRenderer]

class ProductColorDetailView(generics.RetrieveAPIView):
    queryset = ProductColor.objects.all()
    serializer_class = ProductColorSerializer
    renderer_classes = [JSONRenderer]
   


class ProductSizeListView(generics.ListAPIView):
    queryset = ProductSize.objects.all()
    serializer_class = ProductSizeSerializer
    renderer_classes = [JSONRenderer]

class ProductSizeDetailView(generics.RetrieveAPIView):
    queryset = ProductSize.objects.all()
    serializer_class = ProductSizeSerializer
    renderer_classes = [JSONRenderer]

# --- ProductImages Views ---
class ProductImagesListView(generics.ListAPIView):
    queryset = ProductImages.objects.all()
    serializer_class = ProductImagesSerializer
    renderer_classes = [JSONRenderer]

class ProductImagesDetailView(generics.RetrieveAPIView):
    queryset = ProductImages.objects.all()
    serializer_class = ProductImagesSerializer
    renderer_classes = [JSONRenderer]
    


class ProductSpecificImagesListView(generics.ListAPIView):
    serializer_class = ProductImagesSerializer
    renderer_classes = [JSONRenderer]

    def get_queryset(self):
        pid = self.kwargs['pid']
        return ProductImages.objects.filter(product__pid=pid)
        
def shopgrid(request):
    categories = Category.objects.all()
    
    # Get all limited products (stock < 30 and > 0)
    shop_products = Product.objects.filter(
        product_status="published",
        in_stock=True
    ).order_by('-date')
    
    # Pagination - 20 products per page
    paginator = Paginator(shop_products, 50)
    page_number = request.GET.get('page')
    
    try:
        products = paginator.page(page_number)
    except PageNotAnInteger:
        products = paginator.page(1)
    except EmptyPage:
        products = paginator.page(paginator.num_pages)
    
    # Get price range for filters
    prices = shop_products.values_list('price', flat=True)
    lowest = min(prices) if prices else 0
    highest = max(prices) if prices else 100000
    
    context = {
        "categories": categories,
        "products": products,  # ✅ FIXED: Use paginated products
        "all_products": shop_products,
        "total_products": shop_products.count(),
        "lowest": lowest,
        "highest": highest,
        'page_number': request.GET.get('page', 1)
    }
    return render(request, "core/shopgrid.html", context)


@user_required
def vouchers(request):
    user = request.user
 
    from django.db.models import Q
    all_coupons = Coupon.objects.filter(
        Q(specific_users__isnull=True) | Q(specific_users=user)
    ).distinct().prefetch_related('product', 'specific_users')
 
    active_coupons   = []
    inactive_coupons = []
 
    for coupon in all_coupons:
        s = coupon.status
        if s == 'active':
            active_coupons.append(coupon)
        else:
            inactive_coupons.append(coupon)
 
    context = {
        'active_coupons':   active_coupons,
        'inactive_coupons': inactive_coupons,
    }
    return render(request, 'core/vouchers.html', context)
 

    

# Initialize Paystack
paystack_secret_key = settings.PAYSTACK_SECRET

# @login_required
# def wallet_view(request):
#     wallet = Wallet.objects.get(user=request.user)
#     # Only show successful transactions
#     transactions = Transaction.objects.filter(wallet=wallet, status='success').order_by('-created_at')
    
#     context = {
#         'wallet': wallet,
#         'transactions': transactions,
#     }
#     return render(request, 'core/wallet.html', context)


# @login_required
# def wallet_view(request):
#     """Main wallet view that handles both new and existing users"""
#     # Get or create wallet for user
#     wallet, created = Wallet.objects.get_or_create(user=request.user)
    
#     # Handle virtual account creation for all users
#     virtual_account_status = ensure_virtual_account(wallet)
    
#     # Get transactions
#     transactions = Transaction.objects.filter(wallet=wallet).order_by('-created_at')[:10]
    
#     context = {
#         "wallet": wallet,
#         "transactions": transactions,
#         "virtual_account_status": virtual_account_status,
#     }
#     return render(request, "core/wallet.html", context)

# @login_required
# def wallet_view(request):
#     """Main wallet view that handles both new and existing users"""
   
#     wallet = Wallet.objects.filter(user=request.user).first()
    
    
#     # Get transactions
#     transactions = Transaction.objects.filter(wallet=wallet).order_by('-created_at')[:10]
    
#     # ADD THIS: Get detailed status for debugging
#     debug_info = {
#         "has_account_number": bool(wallet.account_number),
#         "user_email": request.user.email,
        
#     }
    
#     context = {
#         "wallet": wallet,
#         "transactions": transactions,

#     }
#     return render(request, "core/wallet.html", context)

@user_required
def wallet_view(request):
    """Main wallet view that handles both new and existing users"""
    
    wallet = Wallet.objects.filter(user=request.user).first()
    
    # If no wallet exists, create one
    if not wallet:
        wallet = Wallet.objects.create(user=request.user)
        # Trigger account creation in background
        def create_account_background():
            try:
                wallet.create_paystack_virtual_account()
            except Exception as e:
                print(f"Background account creation error: {e}")
        
        thread = threading.Thread(target=create_account_background)
        thread.daemon = True
        thread.start()
    
    # Get recent transactions
    transactions = Transaction.objects.filter(wallet=wallet).order_by('-created_at')[:10]
    
    # Determine virtual account status for the template
    if wallet.account_number:
        virtual_account_status = "ready"
        status_message = f"Account active: {wallet.account_number}"
    elif wallet.paystack_customer_code and not wallet.account_number:
        virtual_account_status = "pending"
        status_message = "Account being created... This may take a few minutes."
    else:
        virtual_account_status = "not_started"
        status_message = "No virtual account yet. It will be created automatically."
    
    # Debug info
    debug_info = {
        "has_account_number": bool(wallet.account_number),
        "has_customer_code": bool(wallet.paystack_customer_code),
        "user_email": request.user.email,
        "wallet_created": bool(wallet),
    }
    
    context = {
        "wallet": wallet,
        "transactions": transactions,
        "virtual_account_status": {
            "status": virtual_account_status,
            "message": status_message,
        },
        "debug_info": debug_info,
    }
    
    return render(request, "core/wallet.html", context)

import json
import hmac
import hashlib
import logging
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def paystack_webhook(request):
    """Main Paystack webhook handler"""
    logger.info(f"Webhook hit: {request.headers.get('x-paystack-signature', 'NO SIG')[:30]}")
    print(f"Webhook hit: {request.headers.get('x-paystack-signature', 'NO SIG')[:30]}")

    print("\n" + "=" * 60)
    print("PAYSTACK WEBHOOK RECEIVED")
    print("=" * 60)

    # -------------------------------
    # VERIFY SIGNATURE
    # -------------------------------
    signature = request.headers.get("x-paystack-signature")

    if not signature:
        print("Missing signature")
        return HttpResponse(status=400)

    secret = settings.PAYSTACK_SECRET.strip()
    computed_hash = hmac.new(
        secret.encode("utf-8"),
        request.body,
        hashlib.sha512
    ).hexdigest()

    if not hmac.compare_digest(computed_hash, signature):
        print("invalid signature")
        logger.warning(f"Webhook signature mismatch. Got: {signature[:20]}...")
        return HttpResponse(status=400)

    # -------------------------------
    # PARSE PAYLOAD
    # -------------------------------
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        print("invalid JSON")
        return HttpResponse(status=400)

    event = payload.get("event")
    data = payload.get("data", {})

    print(f"Event: {event}")

    # -------------------------------
    # ROUTING
    # -------------------------------
    success = True

    if event == "charge.success":
        success = handle_charge_success(data)

    elif event == "dedicatedaccount.assign.success":
        success = handle_dva_assignment(data)

    else:
        print(f"Unhandled event: {event}")
        return HttpResponse(status=200)

    # IMPORTANT:
    # 200 = processed
    # 400 = retry webhook
    return HttpResponse(status=200 if success else 400)

from decimal import Decimal
from django.db import transaction
from core.models import Wallet, Transaction
from userauths.models import User


def handle_charge_success(data):
    try:
        amount = Decimal(str(data.get("amount", 0))) / Decimal("100")
        reference = data.get("reference")
        channel = data.get("channel")

        customer = data.get("customer", {})
        customer_code = customer.get("customer_code")
        customer_email = customer.get("email")

        auth = data.get("authorization", {})
        sender_name = auth.get("sender_name") or auth.get("account_name", "Unknown")
        
        # DVA account number can be in either location — check both
        dedicated_account = data.get("dedicated_account") or {}
        receiver_account = (
            dedicated_account.get("account_number") or
            auth.get("receiver_bank_account_number") or
            auth.get("receiver_account_number")
        )

        wallet = None

        if receiver_account:
            wallet = Wallet.objects.filter(account_number=receiver_account).first()

        if not wallet and customer_code:
            wallet = Wallet.objects.filter(paystack_customer_code=customer_code).first()

        if not wallet and customer_email:
            user = User.objects.filter(email=customer_email).first()
            if user:
                wallet = Wallet.objects.filter(user=user).first()

        if not wallet:
            logger.error(f"No wallet found for reference {reference}, channel {channel}")
            return False  # tells Paystack to retry

        if Transaction.objects.filter(reference=reference).exists():
            return True  # already processed, tell Paystack we're good

        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(id=wallet.id)
            old_balance = wallet.balance
            wallet.balance += amount
            wallet.save(update_fields=["balance"])

            Transaction.objects.create(
                wallet=wallet,
                amount=amount,
                balance_after=wallet.balance,
                transaction_type="credit",
                status="success",
                reference=reference,
                description=f"Bank transfer from {sender_name}",
            )

        return True

    except Exception as e:
        logger.error("charge.success processing failed", exc_info=True)
        print("Error receiving money")
        return False
        
def handle_dva_assignment(data):
    """Save dedicated virtual account details"""

    print("\n--- PROCESSING DVA ASSIGNMENT ---")

    try:
        customer = data.get("customer", {})
        customer_code = customer.get("customer_code")

        account_number = data.get("account_number")
        bank_name = data.get("bank", {}).get("name")
        account_id = data.get("id")

        print(f"Customer Code: {customer_code}")
        print(f"Account Number: {account_number}")

        wallet = Wallet.objects.filter(
            paystack_customer_code=customer_code
        ).first()

        if not wallet:
            print("❌ Wallet not found for DVA assignment")
            return False

        wallet.account_number = account_number
        wallet.bank_name = bank_name
        wallet.virtual_account_id = account_id
        wallet.save(
            update_fields=[
                "account_number",
                "bank_name",
                "virtual_account_id",
            ]
        )

        print("✅ DVA assigned successfully")
        logger.info(f"DVA assigned to {wallet.user.email}")

        return True

    except Exception as e:
        print(f"❌ DVA assignment error: {str(e)}")
        logger.error("DVA assignment failed", exc_info=True)
        return False
    

import requests
import json
from django.conf import settings
from django.http import JsonResponse

@login_required
def test_paystack_connection_detailed(request):
    """Test Paystack API connection and account capabilities."""
    results = {}
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET}",
        "Content-Type": "application/json"
    }
    
    try:
        # 1. First, test basic API connectivity by fetching your balance
        balance_url = "https://api.paystack.co/balance"
        balance_resp = requests.get(balance_url, headers=headers)
        results['balance_check'] = {
            'status_code': balance_resp.status_code,
            'response': balance_resp.json() if balance_resp.status_code == 200 else str(balance_resp.text)
        }
        
        # 2. Check if the customer exists on Paystack's end
        #    This confirms the customer creation in your model is working
        customer_url = f"https://api.paystack.co/customer?email={request.user.email}"
        customer_resp = requests.get(customer_url, headers=headers)
        results['customer_check'] = {
            'status_code': customer_resp.status_code,
            'response': customer_resp.json() if customer_resp.status_code == 200 else str(customer_resp.text)
        }
        
        # 3. CRITICAL: Try to create a Dedicated Virtual Account with a test bank
        #    This will tell us if the feature is enabled
        if customer_resp.status_code == 200:
            customer_data = customer_resp.json()
            if customer_data.get('status') and customer_data['data']:
                customer_code = customer_data['data'][0]['customer_code']
                
                # Attempt 1: Try with 'test-bank' (only works in test mode)
                va_url = "https://api.paystack.co/dedicated_account"
                va_payload_test = {"customer": customer_code, "preferred_bank": "test-bank"}
                va_resp_test = requests.post(va_url, headers=headers, json=va_payload_test)
                results['va_test_bank_attempt'] = {
                    'status_code': va_resp_test.status_code,
                    'response': va_resp_test.json() if va_resp_test.status_code == 200 else str(va_resp_test.text)
                }
                
                # Attempt 2: Try without a preferred bank (let Paystack decide)
                va_payload_none = {"customer": customer_code}
                va_resp_none = requests.post(va_url, headers=headers, json=va_payload_none)
                results['va_no_bank_attempt'] = {
                    'status_code': va_resp_none.status_code,
                    'response': va_resp_none.json() if va_resp_none.status_code == 200 else str(va_resp_none.text)
                }
                
        return JsonResponse({'success': True, 'results': results})
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
    
    
@user_required
def debug_virtual_account(request):
    """Simple debug view"""
    from django.conf import settings
    
    wallet = Wallet.objects.get(user=request.user)
    
    # Check settings
    debug_info = {
        'user_email': request.user.email,
        'has_wallet': True,
        'has_account_number': bool(wallet.account_number),
        'has_customer_code': bool(wallet.paystack_customer_code),
        'PAYSTACK_SECRET_set': hasattr(settings, 'PAYSTACK_SECRET'),
        'PAYSTACK_SECRET_length': len(settings.PAYSTACK_SECRET) if hasattr(settings, 'PAYSTACK_SECRET') else 0,
    }
    
    # Try to create directly
    try:
        success = wallet.create_paystack_virtual_account()
        debug_info['creation_attempt'] = 'success' if success else 'failed'
    except Exception as e:
        debug_info['creation_error'] = str(e)
    
    return JsonResponse(debug_info)

        
@user_required
def initiate_topup(request):
    if request.method == 'GET':
        return render(request, 'core/initiate_topup.html')
    
    if request.method == 'POST':
        try:
            amount = request.POST.get('amount')
            if not amount or float(amount) <= 0 or float(amount) < 100 or float(amount) % 100 != 0:
                messages.error(request, 'Amount must be at least â‚¦100 and in multiples of 100.')
                return redirect('initiate_topup')
                
            email = request.user.email
            url = "https://api.paystack.co/transaction/initialize"
            headers = {
                "Authorization": f"Bearer {paystack_secret_key}",
                "Content-Type": "application/json",
            }
            data = {
                "email": email,
                "amount": int(float(amount) * 100),  # Convert to kobo
                "currency": "NGN",
                "callback_url": request.build_absolute_uri(reverse('verify_topup')),
            }
            
            response = requests.post(url, headers=headers, json=data)
            response_data = response.json()
            
            if response_data['status']:
                # Store amount and reference in session
                request.session['topup_amount'] = float(amount)  # Stored as float for JSON serialization
                request.session['topup_reference'] = response_data['data']['reference']
                return redirect(response_data['data']['authorization_url'])
            else:
                error_msg = response_data.get('message', 'Unknown error')
                messages.error(request, f'Failed to initialize transaction: {error_msg}')
                return redirect('initiate_topup')
                
        except Exception as e:
            messages.error(request, f'An error occurred: {str(e)}')
            return redirect('initiate_topup')
    
    return redirect('wallet')

@user_required
def verify_topup(request):
    reference = request.GET.get('reference')
    amount = request.session.get('topup_amount')
    session_reference = request.session.get('topup_reference')
    
    if reference and amount and reference == session_reference:
        url = f"https://api.paystack.co/transaction/verify/{reference}"
        headers = {"Authorization": f"Bearer {paystack_secret_key}"}
        
        try:
            response = requests.get(url, headers=headers)
            response_data = response.json()
            
            if response_data['status'] and response_data['data']['status'] == 'success':
                # Convert amount to Decimal
                amount_decimal = Decimal(str(amount))  # Convert float to Decimal
                wallet = Wallet.objects.get(user=request.user)
                
                # Create transaction and update wallet
                transaction = Transaction.objects.create(
                    wallet=wallet,
                    amount=amount_decimal,  # Use actual top-up amount
                    transaction_type='credit',
                    status='success',
                    reference=reference,
                    description='Wallet top up'
                )
                wallet.balance = transaction.balance_after  # Update wallet with balance_after
                wallet.save()
                
                # Send email notification
                from django.core.mail import EmailMessage
                from django.template.loader import render_to_string
                import datetime
                
                subject = "Trenva Wallet Top-Up Confirmation"
                context = {
                    'user_name': request.user.first_name or request.user.username,
                    'transaction_id': reference,
                    'transaction_date': datetime.datetime.now().strftime('%B %d, %Y'),
                    'transaction_time': datetime.datetime.now().strftime('%I:%M %p WAT'),
                    'top_up_amount': transaction.amount,  # Pass raw Decimal
                    'payment_method': 'Paystack',
                    'new_balance': transaction.balance_after,  # Pass raw Decimal
                    'transaction_status': 'success',
                }
                email_content = render_to_string('emails/trenva_wallet_topup.html', context)
                email = EmailMessage(
                    subject=subject,
                    body=email_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[request.user.email],
                )
                email.content_subtype = "html"
                email.send()
                
                # Clear session data
                del request.session['topup_amount']
                del request.session['topup_reference']
                request.session.modified = True
                
                messages.success(request, f'â‚¦{amount:,} has been added to your wallet successfully!')  # Formatted with comma
            else:
                messages.error(request, 'Transaction verification failed.')
                # Clear session to prevent retries
                del request.session['topup_amount']
                del request.session['topup_reference']
                request.session.modified = True
        except Exception as e:
            messages.error(request, f'Verification error: {str(e)}')
            # Clear session on error
            if 'topup_amount' in request.session:
                del request.session['topup_amount']
            if 'topup_reference' in request.session:
                del request.session['topup_reference']
            request.session.modified = True
    else:
        messages.error(request, 'Invalid or missing transaction data.') 
    
    return redirect('wallet')
    
def delete_account(request):
    meth = request.method
    if request.method == "POST":
        user = request.user
        user.deleted = True
        user.save()
    
        context = {
            "deleted": True,
            "meth": meth,
        }
    else:
        context = {
            "deleted": False,
            "meth": meth,
        }
    return JsonResponse(context)
    
    
def vendor_sell(request):
    return  render(request, 'core/vendor_sell.html')
    


# def vendor_signin(request):
#     if request.method == 'POST':
#         email = request.POST.get('username')  
#         password = request.POST.get('password')
        
#         try:
#             # Find user by email
#             user = User.objects.get(email=email)
            
#             # Check if email is verified
#             if not user.is_active:
#                 messages.error(request, 'Please verify your email address before logging in. Check your email for the verification link.')
#                 return render(request, 'user/vendor_signin.html')
           
#             user = authenticate(request, username=user.username, password=password)
            
#             if user is not None:
#                 login(request, user)
#                 messages.success(request, 'Login successful!')
                
#                 try:
#                     vendor = Vendor.objects.get(user=user)
                    
#                     if vendor.approval_status == 'approved':
#                         return redirect('vendor_dashboard')  
#                     elif vendor.approval_status == 'incomplete':
#                         return redirect('vendor_profile_setup')
#                     elif vendor.approval_status == 'pending':
#                         return redirect('vendor-approval-pending')
#                     elif vendor.approval_status == 'rejected':
#                         messages.error(request, 'Your vendor application has been rejected. Please contact support.')
#                         return redirect('vendor-approval-pending')
#                     elif vendor.approval_status == 'needs_revision':
#                         messages.warning(request, 'Your vendor profile needs revisions. Please update your information.')
#                         return redirect('vendor_profile_setup')
#                     else:
#                         return redirect('vendor_profile_setup')
                        
#                 except Vendor.DoesNotExist:
#                     return redirect('vendor_profile_setup')  
#             else:
#                 messages.error(request, 'Invalid email or password')
                
#         except User.DoesNotExist:
#             messages.error(request, 'No account found with this email')
    
#     return render(request, 'user/vendor_signin.html')


def vendor_signin(request):
    # If user is already authenticated, redirect them appropriately
    if request.user.is_authenticated:
        try:
            vendor = Vendor.objects.get(user=request.user)
            if vendor.approval_status == 'approved':
                return redirect('vendor_dashboard')
            elif vendor.approval_status == 'incomplete':
                return redirect('vendor_profile_setup')
            elif vendor.approval_status == 'pending':
                return redirect('vendor-approval-pending')
        except Vendor.DoesNotExist:
            pass
        return redirect('vendor_dashboard')

    if request.method == 'POST':
        email = request.POST.get('username', '').strip()  
        password = request.POST.get('password', '')
        
        if not email or not password:
            messages.error(request, 'Please enter both email and password')
            return render(request, 'user/vendor_signin.html')
        
        try:
            # Find user by email
            user = User.objects.get(email=email)
            
            # Check if email is verified
            if not user.is_active:
                messages.error(request, 'Please verify your email address before logging in. Check your email for the verification link.')
                return render(request, 'user/vendor_signin.html')
           
            # Authenticate user
            user = authenticate(request, username=user.username, password=password)
            
            if user is not None:
                login(request, user)
                messages.success(request, 'Login successful!')
                
                try:
                    vendor = Vendor.objects.get(user=user)
                    
                    if vendor.approval_status == 'approved':
                        return redirect('vendor_dashboard')  
                    elif vendor.approval_status == 'incomplete':
                        return redirect('vendor_profile_setup')
                    elif vendor.approval_status == 'pending':
                        return redirect('vendor-approval-pending')
                    elif vendor.approval_status == 'rejected':
                        messages.error(request, 'Your vendor application has been rejected. Please contact support.')
                        return redirect('vendor-approval-pending')
                    elif vendor.approval_status == 'needs_revision':
                        messages.warning(request, 'Your vendor profile needs revisions. Please update your information.')
                        return redirect('vendor_profile_setup')
                    else:
                        return redirect('vendor_profile_setup')
                        
                except Vendor.DoesNotExist:
                    # User is authenticated but no vendor profile - create one
                    Vendor.objects.create(
                        user=user,
                        name=user.first_name or user.username,
                        store_name=user.username,
                        approval_status='incomplete'
                    )
                    return redirect('vendor_profile_setup')  
            else:
                messages.error(request, 'Invalid email or password')
                
        except User.DoesNotExist:
            messages.error(request, 'No account found with this email')
        except Exception as e:
            logger.error(f"Vendor signin error: {str(e)}")
            messages.error(request, 'An error occurred during login')
    
    return render(request, 'user/vendor_signin.html')



from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse
from django.contrib import messages
import logging

logger = logging.getLogger(__name__)

def vendor_signup(request):
    if request.method == 'POST':
        full_name = request.POST.get('username', '').strip()  
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        confirm_password = request.POST.get('password_confirmation', '')
        
        
        # Validation
        if not all([full_name, email, password, confirm_password,]):
            messages.error(request, 'All fields are required')
            return render(request, 'user/vendor_signup.html')
            
        if password != confirm_password:
            messages.error(request, 'Passwords do not match')
            return render(request, 'user/vendor_signup.html')
        
        if User.objects.filter(email=email).exists():
            messages.error(request, 'Email already exists')
            return render(request, 'user/vendor_signup.html')
        
        
        try:
            # Create username from email
            username = email.split('@')[0]
            counter = 1
            original_username = username
            while User.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1
            
            # Create user but set as inactive until email verification
            user = User.objects.create_user(
                username=username, 
                email=email,
                password=password,
                first_name=full_name,
                is_active=False  # User inactive until email verification
            )
            
            # Create vendor with incomplete status and location
            vendor = Vendor.objects.create(
                user=user,
                name=full_name,
                store_name=full_name,
                approval_status='incomplete',
                
            )
            
            
            # Generate email verification token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Build verification URL
            verification_url = request.build_absolute_uri(
                reverse('vendor_verify_email', kwargs={'uidb64': uid, 'token': token})
            )
            
            # Prepare context for email template
            context = {
                'user': user,
                'username': username,
                'verification_url': verification_url,
                'full_name': full_name,
                'vendor': vendor,
            }
            
            # Render HTML email template
            try:
                html_message = render_to_string('emails/vendor_email_confirm.html', context)
                plain_message = strip_tags(html_message)
                
                # Send verification email
                subject = 'Verify Your Vendor Account - Trenva'
                
                send_mail(
                    subject=subject,
                    message=plain_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    html_message=html_message,
                    fail_silently=False,
                )
                
                logger.info(f"✅ Verification email sent to {email}")
                messages.success(request, 'Account created successfully! A verification link has been sent to your email address. Please check your inbox and verify your email before logging in.')
                return redirect('vendor-signin')  # ✅ REDIRECT TO SIGNIN PAGE
                
            except Exception as email_error:
                # If email fails, delete the user and show error
                user.delete()
                logger.error(f"❌ Failed to send verification email: {str(email_error)}")
                messages.error(request, 'Failed to send verification email. Please try again or contact support.')
                return render(request, 'user/vendor_signup.html')
            
        except Exception as e:
            logger.error(f"❌ Error creating vendor account: {str(e)}")
            messages.error(request, 'Error creating account. Please try again.')
    
    return render(request, 'user/vendor_signup.html')
    
    
# from django.core.mail import send_mail
# from django.template.loader import render_to_string
# from django.utils.html import strip_tags
# from django.conf import settings
# from django.utils.http import urlsafe_base64_encode
# from django.utils.encoding import force_bytes
# from django.contrib.auth.tokens import default_token_generator
# from django.urls import reverse

# def vendor_signup(request):
#     if request.method == 'POST':
#         full_name = request.POST.get('username')  
#         email = request.POST.get('email')
#         password = request.POST.get('password')
#         confirm_password = request.POST.get('password_confirmation')
        
#         # Validation
#         if password != confirm_password:
#             messages.error(request, 'Passwords do not match')
#             return render(request, 'user/vendor_signup.html')
        
#         if User.objects.filter(email=email).exists():
#             messages.error(request, 'Email already exists')
#             return render(request, 'user/vendor_signup.html')
        
#         try:
#             username = email.split('@')[0]
#             counter = 1
#             original_username = username
#             while User.objects.filter(username=username).exists():
#                 username = f"{original_username}{counter}"
#                 counter += 1
            
#             # Create user but set as inactive until email verification
#             user = User.objects.create_user(
#                 username=username, 
#                 email=email,
#                 password=password,
#                 is_active=False  # User inactive until email verification
#             )
            
#             # Create vendor with incomplete status
#             Vendor.objects.create(
#                 user=user,
#                 name=full_name or user.username,  
#                 store_name=user.username,
#                 approval_status='incomplete'
#             )
            
#             # Generate email verification token
#             token = default_token_generator.make_token(user)
#             uid = urlsafe_base64_encode(force_bytes(user.pk))
            
#             # Build verification URL
#             verification_url = request.build_absolute_uri(
#                 reverse('vendor_verify_email', kwargs={'uidb64': uid, 'token': token})
#             )
            
#             # Prepare context for email template
#             context = {
#                 'user': user,
#                 'username': username,
#                 'verification_url': verification_url,
#                 'full_name': full_name or username,
#             }
            
#             # Render HTML email template
#             html_message = render_to_string('emails/vendor_email_confirm.html', context)
#             plain_message = strip_tags(html_message)  # Fallback plain text version
            
#             # Send verification email
#             subject = 'Verify Your Vendor Account'
            
#             send_mail(
#                 subject=subject,
#                 message=plain_message,
#                 from_email=settings.DEFAULT_FROM_EMAIL,
#                 recipient_list=[email],
#                 html_message=html_message,  # HTML version
#                 fail_silently=False,
#             )
            
#             messages.success(request, 'Account created successfully! A verification link has been sent to your email address.')
#             return redirect('vendor-signin')  # Redirect to login page
            
#         except Exception as e:
#             messages.error(request, f'Error creating account: {str(e)}')
    
#     return render(request, 'user/vendor_signup.html')
    
    
    
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.contrib import messages

User = get_user_model()

def vendor_verify_email(request, uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
    
    if user is not None and default_token_generator.check_token(user, token):
        # âœ… Activate the account
        user.is_active = True
        user.save()
        
        # âœ… Redirect to login with success message
        messages.success(request, 'Email verified successfully! You can now login to complete your vendor profile.')
        return redirect('vendor-signin')
    else:
        messages.error(request, 'Invalid verification link or link has expired.')
        return redirect('vendor-signin')



# @login_required
# def vendor_profile_setup(request):
#     vendor, created = Vendor.objects.get_or_create(user=request.user)
    
#     if created:
#         vendor.approval_status = 'incomplete'
#         vendor.save(update_fields=['approval_status'])
    
#     # Clear any previous session errors
#     if 'form_errors' in request.session:
#         del request.session['form_errors']
#     if 'form_data' in request.session:
#         del request.session['form_data']
    
#     # Fetch banks from Paystack API for the dropdown
#     bank_choices = [('', 'Select Bank')]
    
#     try:
#         PAYSTACK_SECRET_KEY = getattr(settings, 'PAYSTACK_SECRET', '')
        
#         if PAYSTACK_SECRET_KEY:
#             url = "https://api.paystack.co/bank"
#             headers = {
#                 "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
#                 "Content-Type": "application/json"
#             }
            
#             response = requests.get(url, headers=headers, timeout=10)
#             paystack_data = response.json()
            
#             if paystack_data.get('status'):
#                 # Filter only Nigerian banks and sort by name
#                 nigerian_banks = [
#                     bank for bank in paystack_data['data'] 
#                     if bank.get('country') == 'Nigeria' and bank.get('active')
#                 ]
#                 sorted_banks = sorted(nigerian_banks, key=lambda x: x['name'])
                
#                 # Create choices for dropdown
#                 bank_choices += [(bank['name'], bank['name']) for bank in sorted_banks]
#                 print(f"Loaded {len(sorted_banks)} banks from Paystack")
#             else:
#                 print("Failed to load banks from Paystack")
#                 # Fallback to some common banks if Paystack fails
#                 bank_choices += [
#                     ('Access Bank', 'Access Bank'),
#                     ('First Bank of Nigeria', 'First Bank of Nigeria'),
#                     ('Guaranty Trust Bank', 'Guaranty Trust Bank'),
#                     ('Zenith Bank', 'Zenith Bank'),
#                     ('United Bank for Africa', 'United Bank for Africa'),
#                 ]
#         else:
#             print("Paystack secret key not configured")
#             # Fallback banks
#             bank_choices += [
#                 ('Access Bank', 'Access Bank'),
#                 ('First Bank of Nigeria', 'First Bank of Nigeria'),
#                 ('Guaranty Trust Bank', 'Guaranty Trust Bank'),
#                 ('Zenith Bank', 'Zenith Bank'),
#                 ('United Bank for Africa', 'United Bank for Africa'),
#             ]
            
#     except Exception as e:
#         print(f"Error loading banks: {str(e)}")
#         # Fallback banks in case of error
#         bank_choices += [
#             ('Access Bank', 'Access Bank'),
#             ('First Bank of Nigeria', 'First Bank of Nigeria'),
#             ('Guaranty Trust Bank', 'Guaranty Trust Bank'),
#             ('Zenith Bank', 'Zenith Bank'),
#             ('United Bank for Africa', 'United Bank for Africa'),
#         ]
    
#     if request.method == 'POST':
#         try:
#             print("Form submitted - processing data...")
            
#             # Get all form data (ignore 'q' field)
#             store_name = request.POST.get('store_name', '').strip()
#             business_name = request.POST.get('business_name', '').strip()
#             business_description = request.POST.get('business_description', '').strip()
#             phone_number = request.POST.get('phone_number', '').strip()
#             business_registered = request.POST.get('business_registered') == 'yes'
#             tax_id_number = request.POST.get('tax_id_number', '').strip()
#             tax_number = request.POST.get('tax_number', '').strip()
#             physical_address = request.POST.get('physical_address', '').strip()
#             return_address = request.POST.get('return_address', '').strip()
#             facebook_url = request.POST.get('facebook_url', '').strip()
#             instagram_url = request.POST.get('instagram_url', '').strip()
#             twitter_url = request.POST.get('twitter_url', '').strip()
#             bank_name = request.POST.get('bank_name', '').strip()
#             account_number = request.POST.get('account_number', '').strip()
#             account_name = request.POST.get('account_name', '').strip()
#             terms_agreed = request.POST.get('terms_agreed') == 'on'
#             category = request.POST.get('category', '').strip()
            
#             # Get location field (Lagos Island/Mainland)
#             location = request.POST.get('location', '').strip()
            
#             # NEW: Get home address field
#             home_address = request.POST.get('home_address', '').strip()
            
#             # Get Mapbox coordinates
#             physical_latitude = request.POST.get('physical_latitude', '').strip() or None
#             physical_longitude = request.POST.get('physical_longitude', '').strip() or None
#             return_latitude = request.POST.get('return_latitude', '').strip() or None
#             return_longitude = request.POST.get('return_longitude', '').strip() or None
            
#             # Debug: Print all POST data to find the 'q' field
#             print("All POST data:")
#             for key, value in request.POST.items():
#                 if key not in ['csrfmiddlewaretoken', 'q']:  # Skip CSRF and search field
#                     print(f"  {key}: {value}")
            
#             # Debug coordinates
#             print(f"Physical coordinates: {physical_latitude}, {physical_longitude}")
#             print(f"Return coordinates: {return_latitude}, {return_longitude}")
#             print(f"Home address: {home_address}")
            
#             # Quick validation (ignore 'q' field)
#             errors = []
            
#             # Required fields validation (don't include 'q')
#             if not store_name:
#                 errors.append("Store Name is required")
#             if not business_name:
#                 errors.append("Business Name is required")
#             if not phone_number:
#                 errors.append("Phone Number is required")
#             if not tax_id_number:
#                 errors.append("Tax ID Number is required")
#             if not physical_address:
#                 errors.append("PickUp Address is required")
#             if not return_address:
#                 errors.append("Return Address is required")
#             if not bank_name:
#                 errors.append("Bank Name is required")
#             if not account_number:
#                 errors.append("Account Number is required")
#             if not account_name:
#                 errors.append("Account Name is required")
#             if not category:
#                 errors.append("Business Category is required")
            
#             # Location validation (REQUIRED)
#             if not location:
#                 errors.append("Location in Lagos is required")
#             elif location not in ['lagos_island', 'lagos_mainland']:
#                 errors.append("Please select either Lagos Island or Lagos Mainland")
            
#             # NEW: Home address validation (optional - you can make it required if needed)
#             # If you want to make home address required, uncomment the lines below:
#             # if not home_address:
#             #     errors.append("Home Address is required")
            
#             # Account number format validation
#             if account_number and (len(account_number) != 10 or not account_number.isdigit()):
#                 errors.append("Account number must be exactly 10 digits")
            
#             # Terms agreement validation
#             if not terms_agreed:
#                 errors.append("You must agree to the terms and conditions")
            
#             print(f"Validation errors: {errors}")
            
#             if errors:
#                 messages.error(request, "Please fix the errors below.")
#                 # Store errors and form data in session (ignore 'q')
#                 request.session['form_errors'] = errors
#                 request.session['form_data'] = {
#                     'store_name': store_name,
#                     'business_name': business_name,
#                     'business_description': business_description,
#                     'phone_number': phone_number,
#                     'business_registered': 'yes' if business_registered else 'no',
#                     'tax_id_number': tax_id_number,
#                     'tax_number': tax_number,
#                     'physical_address': physical_address,
#                     'return_address': return_address,
#                     'facebook_url': facebook_url,
#                     'instagram_url': instagram_url,
#                     'twitter_url': twitter_url,
#                     'bank_name': bank_name,
#                     'account_number': account_number,
#                     'account_name': account_name,
#                     'terms_agreed': 'on' if terms_agreed else '',
#                     'category': category,
#                     'location': location,
#                     'home_address': home_address,  # NEW: Store home address in session
#                     # Store coordinates in session
#                     'physical_latitude': physical_latitude,
#                     'physical_longitude': physical_longitude,
#                     'return_latitude': return_latitude,
#                     'return_longitude': return_longitude,
#                 }
#                 return redirect('vendor_profile_setup')
            
#             # All validations passed - update vendor
#             print("All validations passed - updating vendor...")
            
#             vendor.store_name = store_name
#             vendor.business_name = business_name
#             vendor.business_description = business_description
#             vendor.phone_number = phone_number
#             vendor.business_registered = business_registered
#             vendor.tax_id_number = tax_id_number
#             vendor.tax_number = tax_number
#             vendor.physical_address = physical_address
#             vendor.return_address = return_address
#             vendor.facebook_url = facebook_url
#             vendor.instagram_url = instagram_url
#             vendor.twitter_url = twitter_url
#             vendor.bank_name = bank_name
#             vendor.account_number = account_number
#             vendor.account_name = account_name
#             vendor.category = category
            
#             # Save location (Lagos Island/Mainland)
#             vendor.location = location
            
#             # NEW: Save home address
#             vendor.home_address = home_address if home_address else None
            
#             # Save Mapbox coordinates
#             if physical_latitude and physical_longitude:
#                 vendor.physical_latitude = physical_latitude
#                 vendor.physical_longitude = physical_longitude
#             if return_latitude and return_longitude:
#                 vendor.return_latitude = return_latitude
#                 vendor.return_longitude = return_longitude
            
#             # Handle file uploads
#             if 'image' in request.FILES:
#                 vendor.image = request.FILES['image']
#             if 'registration_certificate' in request.FILES:
#                 vendor.registration_certificate = request.FILES['registration_certificate']
#             if 'identification_document' in request.FILES:
#                 vendor.identification_document = request.FILES['identification_document']
            
#             vendor.approval_status = 'pending'
#             vendor.save()
            
#             print("Vendor saved successfully!")
#             print(f"Location saved: {vendor.location}")
#             print(f"Home address saved: {vendor.home_address}")
#             print(f"Saved coordinates - Physical: {vendor.physical_latitude}, {vendor.physical_longitude}")
#             print(f"Saved coordinates - Return: {vendor.return_latitude}, {vendor.return_longitude}")
            
#             # Clear session data
#             if 'form_errors' in request.session:
#                 del request.session['form_errors']
#             if 'form_data' in request.session:
#                 del request.session['form_data']
            
#             messages.success(request, 'Vendor profile submitted successfully! Waiting for approval.')
#             return redirect('vendor-approval-pending')
            
#         except Exception as e:
#             print(f"Error saving vendor: {str(e)}")
#             import traceback
#             traceback.print_exc()
#             messages.error(request, f'There was an error saving your profile: {str(e)}')
    
#     # Get any stored form data from session
#     form_data = request.session.get('form_data', {})
#     form_errors = request.session.get('form_errors', [])
    
#     context = {
#         'vendor': vendor,
#         'form_data': form_data,
#         'form_errors': form_errors,
#         'bank_choices': bank_choices,
#         'category_choices': Vendor.CATEGORY_CHOICES,
#         'location_choices': Vendor.LOCATION_CHOICES,
#     }
#     return render(request, 'user/vendor_profile.html', context)


@vendor_required
def vendor_profile_setup(request):
    vendor, created = Vendor.objects.get_or_create(user=request.user)
    
    if created:
        vendor.approval_status = 'incomplete'
        vendor.save(update_fields=['approval_status'])
    
    # Clear any previous session errors
    if 'form_errors' in request.session:
        del request.session['form_errors']
    if 'form_data' in request.session:
        del request.session['form_data']
    
    # Fetch banks from Paystack API for the dropdown
    bank_choices = [('', 'Select Bank')]
    
    try:
        PAYSTACK_SECRET_KEY = getattr(settings, 'PAYSTACK_SECRET', '')
        
        if PAYSTACK_SECRET_KEY:
            url = "https://api.paystack.co/bank"
            headers = {
                "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            paystack_data = response.json()
            
            if paystack_data.get('status'):
                # Filter only Nigerian banks and sort by name
                nigerian_banks = [
                    bank for bank in paystack_data['data'] 
                    if bank.get('country') == 'Nigeria' and bank.get('active')
                ]
                sorted_banks = sorted(nigerian_banks, key=lambda x: x['name'])
                
                # Create choices for dropdown
                bank_choices += [(bank['name'], bank['name']) for bank in sorted_banks]
                print(f"Loaded {len(sorted_banks)} banks from Paystack")
            else:
                print("Failed to load banks from Paystack")
                # Fallback to some common banks if Paystack fails
                bank_choices += [
                    ('Access Bank', 'Access Bank'),
                    ('First Bank of Nigeria', 'First Bank of Nigeria'),
                    ('Guaranty Trust Bank', 'Guaranty Trust Bank'),
                    ('Zenith Bank', 'Zenith Bank'),
                    ('United Bank for Africa', 'United Bank for Africa'),
                ]
        else:
            print("Paystack secret key not configured")
            # Fallback banks
            bank_choices += [
                ('Access Bank', 'Access Bank'),
                ('First Bank of Nigeria', 'First Bank of Nigeria'),
                ('Guaranty Trust Bank', 'Guaranty Trust Bank'),
                ('Zenith Bank', 'Zenith Bank'),
                ('United Bank for Africa', 'United Bank for Africa'),
            ]
            
    except Exception as e:
        print(f"Error loading banks: {str(e)}")
        # Fallback banks in case of error
        bank_choices += [
            ('Access Bank', 'Access Bank'),
            ('First Bank of Nigeria', 'First Bank of Nigeria'),
            ('Guaranty Trust Bank', 'Guaranty Trust Bank'),
            ('Zenith Bank', 'Zenith Bank'),
            ('United Bank for Africa', 'United Bank for Africa'),
        ]
    
    if request.method == 'POST':
        try:
            print("Form submitted - processing data...")
            
            # Get all form data (ignore 'q' field)
            store_name = request.POST.get('store_name', '').strip()
            business_name = request.POST.get('business_name', '').strip()
            business_description = request.POST.get('business_description', '').strip()
            phone_number = request.POST.get('phone_number', '').strip()
            business_registered = request.POST.get('business_registered') == 'yes'
            tax_id_number = request.POST.get('tax_id_number', '').strip()
            tax_number = request.POST.get('tax_number', '').strip()
            physical_address = request.POST.get('physical_address', '').strip()
            return_address = request.POST.get('return_address', '').strip()
            facebook_url = request.POST.get('facebook_url', '').strip()
            instagram_url = request.POST.get('instagram_url', '').strip()
            twitter_url = request.POST.get('twitter_url', '').strip()
            bank_name = request.POST.get('bank_name', '').strip()
            account_number = request.POST.get('account_number', '').strip()
            account_name = request.POST.get('account_name', '').strip()
            terms_agreed = request.POST.get('terms_agreed') == 'on'
            category = request.POST.get('category', '').strip()
            
            # Get location field (Lagos Island/Mainland)
            location = request.POST.get('location', '').strip()
            
            # NEW: Get home address field
            home_address = request.POST.get('home_address', '').strip()
            
            # NEW: Get average delivery time
            avg_delivery_time = request.POST.get('avg_delivery_time', '').strip()
            
            # NEW: Get custom delivery time if "Custom" is selected
            custom_delivery_time = request.POST.get('custom_delivery_time', '').strip()
            
            # Get Mapbox coordinates
            physical_latitude = request.POST.get('physical_latitude', '').strip() or None
            physical_longitude = request.POST.get('physical_longitude', '').strip() or None
            return_latitude = request.POST.get('return_latitude', '').strip() or None
            return_longitude = request.POST.get('return_longitude', '').strip() or None
            
            # Debug: Print all POST data to find the 'q' field
            print("All POST data:")
            for key, value in request.POST.items():
                if key not in ['csrfmiddlewaretoken', 'q']:  # Skip CSRF and search field
                    print(f"  {key}: {value}")
            
            # Debug coordinates
            print(f"Physical coordinates: {physical_latitude}, {physical_longitude}")
            print(f"Return coordinates: {return_latitude}, {return_longitude}")
            print(f"Home address: {home_address}")
            print(f"Avg delivery time: {avg_delivery_time}")
            print(f"Custom delivery time: {custom_delivery_time}")
            
            # Quick validation (ignore 'q' field)
            errors = []
            
            # Required fields validation (don't include 'q')
            if not store_name:
                errors.append("Store Name is required")
            if not business_name:
                errors.append("Business Name is required")
            if not phone_number:
                errors.append("Phone Number is required")
            if not tax_id_number:
                errors.append("Tax ID Number is required")
            if not physical_address:
                errors.append("PickUp Address is required")
            if not return_address:
                errors.append("Return Address is required")
            if not bank_name:
                errors.append("Bank Name is required")
            if not account_number:
                errors.append("Account Number is required")
            if not account_name:
                errors.append("Account Name is required")
            if not category:
                errors.append("Business Category is required")
            
            # NEW: Average delivery time validation
            if not avg_delivery_time:
                errors.append("Average Delivery Time is required")
            elif avg_delivery_time == 'Custom' and not custom_delivery_time:
                errors.append("Please enter your custom delivery time")
            
            # Location validation (REQUIRED)
            if not location:
                errors.append("Location in Lagos is required")
            elif location not in ['lagos_island', 'lagos_mainland']:
                errors.append("Please select either Lagos Island or Lagos Mainland")
            
            # NEW: Home address validation (optional - you can make it required if needed)
            # If you want to make home address required, uncomment the lines below:
            # if not home_address:
            #     errors.append("Home Address is required")
            
            # Account number format validation
            if account_number and (len(account_number) != 10 or not account_number.isdigit()):
                errors.append("Account number must be exactly 10 digits")
            
            # Terms agreement validation
            if not terms_agreed:
                errors.append("You must agree to the terms and conditions")
            
            print(f"Validation errors: {errors}")
            
            if errors:
                messages.error(request, "Please fix the errors below.")
                # Store errors and form data in session (ignore 'q')
                request.session['form_errors'] = errors
                request.session['form_data'] = {
                    'store_name': store_name,
                    'business_name': business_name,
                    'business_description': business_description,
                    'phone_number': phone_number,
                    'business_registered': 'yes' if business_registered else 'no',
                    'tax_id_number': tax_id_number,
                    'tax_number': tax_number,
                    'physical_address': physical_address,
                    'return_address': return_address,
                    'facebook_url': facebook_url,
                    'instagram_url': instagram_url,
                    'twitter_url': twitter_url,
                    'bank_name': bank_name,
                    'account_number': account_number,
                    'account_name': account_name,
                    'terms_agreed': 'on' if terms_agreed else '',
                    'category': category,
                    'location': location,
                    'home_address': home_address,  # NEW: Store home address in session
                    'avg_delivery_time': avg_delivery_time,  # NEW: Store avg delivery time
                    'custom_delivery_time': custom_delivery_time,  # NEW: Store custom delivery time
                    # Store coordinates in session
                    'physical_latitude': physical_latitude,
                    'physical_longitude': physical_longitude,
                    'return_latitude': return_latitude,
                    'return_longitude': return_longitude,
                }
                return redirect('vendor_profile_setup')
            
            # All validations passed - update vendor
            print("All validations passed - updating vendor...")
            
            # Handle average delivery time
            if avg_delivery_time == 'Custom' and custom_delivery_time:
                vendor.avg_delivery_time = custom_delivery_time
            else:
                vendor.avg_delivery_time = avg_delivery_time
            
            vendor.store_name = store_name
            vendor.business_name = business_name
            vendor.business_description = business_description
            vendor.phone_number = phone_number
            vendor.business_registered = business_registered
            vendor.tax_id_number = tax_id_number
            vendor.tax_number = tax_number
            vendor.physical_address = physical_address
            vendor.return_address = return_address
            vendor.facebook_url = facebook_url
            vendor.instagram_url = instagram_url
            vendor.twitter_url = twitter_url
            vendor.bank_name = bank_name
            vendor.account_number = account_number
            vendor.account_name = account_name
            vendor.category = category
            
            # Save location (Lagos Island/Mainland)
            vendor.location = location
            
            # NEW: Save home address
            vendor.home_address = home_address if home_address else None
            
            # Save Mapbox coordinates
            if physical_latitude and physical_longitude:
                vendor.physical_latitude = physical_latitude
                vendor.physical_longitude = physical_longitude
            if return_latitude and return_longitude:
                vendor.return_latitude = return_latitude
                vendor.return_longitude = return_longitude
            
            # Handle file uploads
            if 'image' in request.FILES:
                vendor.image = request.FILES['image']
            if 'registration_certificate' in request.FILES:
                vendor.registration_certificate = request.FILES['registration_certificate']
            if 'identification_document' in request.FILES:
                vendor.identification_document = request.FILES['identification_document']
            
            vendor.approval_status = 'pending'
            vendor.save()
            
            print("Vendor saved successfully!")
            print(f"Location saved: {vendor.location}")
            print(f"Home address saved: {vendor.home_address}")
            print(f"Avg delivery time saved: {vendor.avg_delivery_time}")
            print(f"Saved coordinates - Physical: {vendor.physical_latitude}, {vendor.physical_longitude}")
            print(f"Saved coordinates - Return: {vendor.return_latitude}, {vendor.return_longitude}")
            
            # Clear session data
            if 'form_errors' in request.session:
                del request.session['form_errors']
            if 'form_data' in request.session:
                del request.session['form_data']
            
            messages.success(request, 'Vendor profile submitted successfully! Waiting for approval.')
            return redirect('vendor-approval-pending')
            
        except Exception as e:
            print(f"Error saving vendor: {str(e)}")
            import traceback
            traceback.print_exc()
            messages.error(request, f'There was an error saving your profile: {str(e)}')
    
    # Get any stored form data from session
    form_data = request.session.get('form_data', {})
    form_errors = request.session.get('form_errors', [])
    
    context = {
        'vendor': vendor,
        'form_data': form_data,
        'form_errors': form_errors,
        'bank_choices': bank_choices,
        'category_choices': Vendor.CATEGORY_CHOICES,
        'location_choices': Vendor.LOCATION_CHOICES,
    }
    return render(request, 'user/vendor_profile.html', context)






@vendor_required
def vendor_approval_pending(request):
    """View for vendor approval pending page"""
    vendor = get_object_or_404(Vendor, user=request.user)
    
    
    if vendor.approval_status == 'approved':
        return redirect('vendor_dashboard')
    
    context = {
        'vendor': vendor
    }
    return render(request, 'user/vendor_approval_pending.html', context)


        
from django.shortcuts import redirect
from django.contrib import messages
from django.contrib.auth import logout
 

def vendor_logout(request):
    """Smart logout: Redirects vendors to vendor sign-in, others to user sign-in."""
    is_vendor = False
    if request.user.is_authenticated:
        try:
            Vendor.objects.get(user=request.user)
            is_vendor = True
        except Vendor.DoesNotExist:
            pass
    
    
    logout(request)
    messages.success(request, 'You have been logged out successfully')
    
    
    if is_vendor:
        return redirect('https://trenva.store/ng/vendor-sign-in/')
    else:
        return redirect('/user/signin/')
    

@csrf_exempt
@require_http_methods(["POST"])
def verify_account_number(request):
    """
    AJAX view to verify bank account number using Paystack API
    """
    try:
        # Parse the request data
        data = json.loads(request.body)
        account_number = data.get('account_number')
        bank_name = data.get('bank_name')
        
        # Use simple print statements without emojis
        print("Bank verification request - Account:", account_number, "Bank:", bank_name)
        
        # Validate inputs
        if not account_number or not bank_name:
            return JsonResponse({
                'success': False,
                'message': 'Account number and bank name are required'
            })
        
        if len(account_number) != 10 or not account_number.isdigit():
            return JsonResponse({
                'success': False,
                'message': 'Please enter a valid 10-digit account number'
            })
        
        # Get Paystack secret key
        PAYSTACK_SECRET_KEY = getattr(settings, 'PAYSTACK_SECRET', '')
        
        if not PAYSTACK_SECRET_KEY:
            print("Paystack secret key is not set in settings")
            return JsonResponse({
                'success': False,
                'message': 'Bank verification service is not configured'
            })
        
        print("Paystack key found")
        
        # Step 1: Get bank code from bank name
        print("Looking up bank code for:", bank_name)
        banks_response = requests.get(
            "https://api.paystack.co/bank",
            headers={
                "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
                "Content-Type": "application/json"
            },
            timeout=30
        )
        
        banks_data = banks_response.json()
        print("Banks API response status:", banks_data.get('status'))
        
        if not banks_data.get('status'):
            error_msg = banks_data.get('message', 'Unknown error loading banks')
            print("Failed to load banks:", error_msg)
            return JsonResponse({
                'success': False,
                'message': f"Failed to load banks: {error_msg}"
            })
        
        # Find the bank code by bank name
        bank_code = None
        matched_bank = None
        for bank in banks_data['data']:
            if bank['name'].lower() == bank_name.lower():
                bank_code = bank['code']
                matched_bank = bank['name']
                break
        
        if not bank_code:
            print("Bank not found in bank list:", bank_name)
            return JsonResponse({
                'success': False,
                'message': f"Bank '{bank_name}' not found. Please select a valid bank."
            })
        
        print("Found bank code:", bank_code, "for bank:", matched_bank)
        
        # Step 2: Verify account with the bank code
        url = "https://api.paystack.co/bank/resolve"
        params = {
            "account_number": account_number,
            "bank_code": bank_code
        }
        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        print("Calling Paystack verification API")
        response = requests.get(url, params=params, headers=headers, timeout=30)
        
        print("Paystack response status:", response.status_code)
        
        # Get the full response
        paystack_data = response.json()
        print("Paystack response data:", paystack_data)
        
        # Check if the API call was successful
        if paystack_data.get('status'):
            account_name = paystack_data['data']['account_name']
            print("SUCCESS - Account Name:", account_name)
            return JsonResponse({
                'success': True,
                'account_name': account_name,
                'account_number': paystack_data['data']['account_number'],
                'bank_code': bank_code
            })
        else:
            # Return the EXACT Paystack error message
            error_msg = paystack_data.get('message', 'Unknown Paystack error')
            print("Paystack Error:", error_msg)
            
            return JsonResponse({
                'success': False,
                'message': error_msg
            })
            
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print("ERROR:", error_msg)
        import traceback
        print("Stack trace:")
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'message': error_msg
        })

@require_http_methods(["GET"])
def get_bank_list(request):
    """
    Get list of Nigerian banks from Paystack API
    """
    try:
        PAYSTACK_SECRET_KEY = getattr(settings, 'PAYSTACK_SECRET', '')
        
        if not PAYSTACK_SECRET_KEY:
            print("Paystack secret key not found")
            return JsonResponse({
                'success': False,
                'message': 'Bank list service is currently unavailable',
                'banks': []
            })
        
        url = "https://api.paystack.co/bank"
        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        paystack_data = response.json()
        
        if paystack_data.get('status'):
            # Filter only Nigerian banks and sort by name
            nigerian_banks = [
                bank for bank in paystack_data['data'] 
                if bank.get('country') == 'Nigeria' and bank.get('active')
            ]
            sorted_banks = sorted(nigerian_banks, key=lambda x: x['name'])
            
            print("Loaded", len(sorted_banks), "banks")
            
            return JsonResponse({
                'success': True,
                'banks': sorted_banks
            })
        else:
            error_msg = paystack_data.get('message', 'Failed to load banks')
            print("Failed to load banks:", error_msg)
            return JsonResponse({
                'success': False,
                'message': error_msg,
                'banks': []
            })
            
    except Exception as e:
        error_msg = f'Error loading banks: {str(e)}'
        print("Error:", error_msg)
        return JsonResponse({
            'success': False,
            'message': error_msg,
            'banks': []
        })
        
        

    
    
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import requests
from django.conf import settings
from .models import Vendor

# @login_required
# def vendor_settings(request):
#     """Enhanced vendor settings view with bank account verification and all form fields"""
#     try:
#         vendor = Vendor.objects.get(user=request.user)
#     except Vendor.DoesNotExist:
#         messages.error(request, "Vendor profile not found.")
#         return redirect('vendor_dashboard')

#     # Fetch banks from Paystack API for the dropdown
#     bank_choices = [('', 'Select Bank')]
    
#     try:
#         PAYSTACK_SECRET_KEY = getattr(settings, 'PAYSTACK_SECRET', '')
        
#         if PAYSTACK_SECRET_KEY:
#             url = "https://api.paystack.co/bank"
#             headers = {
#                 "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
#                 "Content-Type": "application/json"
#             }
            
#             response = requests.get(url, headers=headers, timeout=10)
#             paystack_data = response.json()
            
#             if paystack_data.get('status'):
#                 # Filter only Nigerian banks and sort by name
#                 nigerian_banks = [
#                     bank for bank in paystack_data['data'] 
#                     if bank.get('country') == 'Nigeria' and bank.get('active')
#                 ]
#                 sorted_banks = sorted(nigerian_banks, key=lambda x: x['name'])
                
#                 # Create choices for dropdown
#                 bank_choices += [(bank['name'], bank['name']) for bank in sorted_banks]
#                 print(f"Loaded {len(sorted_banks)} banks from Paystack")
#             else:
#                 print("Failed to load banks from Paystack")
#                 # Fallback to some common banks if Paystack fails
#                 bank_choices += [
#                     ('Access Bank', 'Access Bank'),
#                     ('First Bank of Nigeria', 'First Bank of Nigeria'),
#                     ('Guaranty Trust Bank', 'Guaranty Trust Bank'),
#                     ('Zenith Bank', 'Zenith Bank'),
#                     ('United Bank for Africa', 'United Bank for Africa'),
#                 ]
#         else:
#             print("Paystack secret key not configured")
#             # Fallback banks
#             bank_choices += [
#                 ('Access Bank', 'Access Bank'),
#                 ('First Bank of Nigeria', 'First Bank of Nigeria'),
#                 ('Guaranty Trust Bank', 'Guaranty Trust Bank'),
#                 ('Zenith Bank', 'Zenith Bank'),
#                 ('United Bank for Africa', 'United Bank for Africa'),
#             ]
            
#     except Exception as e:
#         print(f"Error loading banks: {str(e)}")
#         # Fallback banks in case of error
#         bank_choices += [
#             ('Access Bank', 'Access Bank'),
#             ('First Bank of Nigeria', 'First Bank of Nigeria'),
#             ('Guaranty Trust Bank', 'Guaranty Trust Bank'),
#             ('Zenith Bank', 'Zenith Bank'),
#             ('United Bank for Africa', 'United Bank for Africa'),
#         ]

#     if request.method == 'POST':
#         try:
#             # Handle password change
#             if 'change_password' in request.POST:
#                 old_password = request.POST.get('old_password')
#                 new_password1 = request.POST.get('new_password1')
#                 new_password2 = request.POST.get('new_password2')
                
#                 if old_password and new_password1 and new_password2:
#                     if request.user.check_password(old_password):
#                         if new_password1 == new_password2:
#                             if len(new_password1) >= 8:
#                                 request.user.set_password(new_password1)
#                                 request.user.save()
                                
#                                 # Update session to prevent logout
#                                 from django.contrib.auth import update_session_auth_hash
#                                 update_session_auth_hash(request, request.user)
                                
#                                 messages.success(request, 'Password changed successfully!')
#                                 return redirect('vendor_settings')
#                             else:
#                                 messages.error(request, 'Password must be at least 8 characters long.')
#                         else:
#                             messages.error(request, 'New passwords do not match.')
#                     else:
#                         messages.error(request, 'Current password is incorrect.')
#                 else:
#                     messages.error(request, 'Please fill all password fields.')
            
#             # Handle main settings save
#             elif 'save_settings' in request.POST:
#                 # Update user personal info
#                 first_name = request.POST.get('first_name', '').strip()
#                 last_name = request.POST.get('last_name', '').strip()
#                 email = request.POST.get('email', '').strip()
                
#                 # Validate email
#                 if email and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
#                     messages.error(request, 'Please enter a valid email address.')
#                     return redirect('vendor_settings')
                
#                 # Check if email is already taken by another user
#                 if email and email != request.user.email:
#                     if User.objects.filter(email=email).exclude(id=request.user.id).exists():
#                         messages.error(request, 'This email is already registered by another user.')
#                         return redirect('vendor_settings')
                
#                 request.user.first_name = first_name
#                 request.user.last_name = last_name
#                 request.user.email = email
#                 request.user.save()
                
#                 # Update vendor store information
#                 vendor.phone_number = request.POST.get('phone_number', '').strip()
#                 vendor.store_name = request.POST.get('store_name', '').strip()
#                 vendor.store_category = request.POST.get('store_category', '').strip()
#                 vendor.business_description = request.POST.get('store_description', '').strip()
#                 vendor.store_city = request.POST.get('store_city', '').strip()
#                 vendor.store_address = request.POST.get('store_address', '').strip()
                
#                 # Bank account details
#                 bank_name = request.POST.get('bank_name', '').strip()
#                 account_number = request.POST.get('account_number', '').strip()
#                 account_name = request.POST.get('account_name', '').strip()
                
#                 # Validate bank details if provided
#                 if bank_name or account_number or account_name:
#                     if not all([bank_name, account_number, account_name]):
#                         messages.error(request, 'Please provide complete bank details or leave all bank fields empty.')
#                         return redirect('vendor_settings')
                    
#                     if len(account_number) != 10 or not account_number.isdigit():
#                         messages.error(request, 'Account number must be exactly 10 digits.')
#                         return redirect('vendor_settings')
                
#                 vendor.bank_name = bank_name
#                 vendor.account_number = account_number
#                 vendor.account_name = account_name
                
#                 # Handle logo upload
#                 if 'logo' in request.FILES:
#                     # Validate image
#                     logo = request.FILES['logo']
#                     if logo.size > 5 * 1024 * 1024:  # 5MB limit
#                         messages.error(request, 'Logo image must be less than 5MB.')
#                         return redirect('vendor_settings')
                    
#                     # Check file type
#                     allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
#                     if logo.content_type not in allowed_types:
#                         messages.error(request, 'Please upload a valid image (JPEG, PNG, JPG, GIF, WEBP).')
#                         return redirect('vendor_settings')
                    
#                     vendor.image = logo
                
#                 vendor.save()
#                 messages.success(request, 'Settings updated successfully!')
#                 return redirect('vendor_settings')

#         except Exception as e:
#             print(f"Error saving vendor settings: {str(e)}")
#             import traceback
#             traceback.print_exc()
#             messages.error(request, f'An error occurred while saving settings: {str(e)}')

#     # Prepare context for template
#     context = {
#         'vendor': vendor,
#         'bank_choices': bank_choices,
#         'user': request.user,
#     }
    
#     return render(request, 'user/vendor_settings.html', context)


@vendor_required
def vendor_settings(request):
    """Enhanced vendor settings view with bank account verification and all form fields"""
    try:
        vendor = Vendor.objects.get(user=request.user)
    except Vendor.DoesNotExist:
        messages.error(request, "Vendor profile not found.")
        return redirect('vendor_dashboard')

    # Fetch banks from Paystack API for the dropdown
    bank_choices = [('', 'Select Bank')]
    
    try:
        PAYSTACK_SECRET_KEY = getattr(settings, 'PAYSTACK_SECRET', '')
        
        if PAYSTACK_SECRET_KEY:
            url = "https://api.paystack.co/bank"
            headers = {
                "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            paystack_data = response.json()
            
            if paystack_data.get('status'):
                # Filter only Nigerian banks and sort by name
                nigerian_banks = [
                    bank for bank in paystack_data['data'] 
                    if bank.get('country') == 'Nigeria' and bank.get('active')
                ]
                sorted_banks = sorted(nigerian_banks, key=lambda x: x['name'])
                
                # Create choices for dropdown
                bank_choices += [(bank['name'], bank['name']) for bank in sorted_banks]
                print(f"Loaded {len(sorted_banks)} banks from Paystack")
            else:
                print("Failed to load banks from Paystack")
                # Fallback to some common banks if Paystack fails
                bank_choices += [
                    ('Access Bank', 'Access Bank'),
                    ('First Bank of Nigeria', 'First Bank of Nigeria'),
                    ('Guaranty Trust Bank', 'Guaranty Trust Bank'),
                    ('Zenith Bank', 'Zenith Bank'),
                    ('United Bank for Africa', 'United Bank for Africa'),
                ]
        else:
            print("Paystack secret key not configured")
            # Fallback banks
            bank_choices += [
                ('Access Bank', 'Access Bank'),
                ('First Bank of Nigeria', 'First Bank of Nigeria'),
                ('Guaranty Trust Bank', 'Guaranty Trust Bank'),
                ('Zenith Bank', 'Zenith Bank'),
                ('United Bank for Africa', 'United Bank for Africa'),
            ]
            
    except Exception as e:
        print(f"Error loading banks: {str(e)}")
        # Fallback banks in case of error
        bank_choices += [
            ('Access Bank', 'Access Bank'),
            ('First Bank of Nigeria', 'First Bank of Nigeria'),
            ('Guaranty Trust Bank', 'Guaranty Trust Bank'),
            ('Zenith Bank', 'Zenith Bank'),
            ('United Bank for Africa', 'United Bank for Africa'),
        ]

    if request.method == 'POST':
        try:
            # Handle password change
            if 'change_password' in request.POST:
                old_password = request.POST.get('old_password')
                new_password1 = request.POST.get('new_password1')
                new_password2 = request.POST.get('new_password2')
                
                if old_password and new_password1 and new_password2:
                    if request.user.check_password(old_password):
                        if new_password1 == new_password2:
                            if len(new_password1) >= 8:
                                request.user.set_password(new_password1)
                                request.user.save()
                                
                                # Update session to prevent logout
                                from django.contrib.auth import update_session_auth_hash
                                update_session_auth_hash(request, request.user)
                                
                                messages.success(request, 'Password changed successfully!')
                                return redirect('vendor_settings')
                            else:
                                messages.error(request, 'Password must be at least 8 characters long.')
                        else:
                            messages.error(request, 'New passwords do not match.')
                    else:
                        messages.error(request, 'Current password is incorrect.')
                else:
                    messages.error(request, 'Please fill all password fields.')
            
            # Handle main settings save
            elif 'save_settings' in request.POST:
                # Update user personal info
                first_name = request.POST.get('first_name', '').strip()
                last_name = request.POST.get('last_name', '').strip()
                email = request.POST.get('email', '').strip()
                avg_delivery_time = request.POST.get('avg_delivery_time', '').strip()
    
                if avg_delivery_time == 'Custom':
                    # Get custom delivery time
                    custom_delivery_time = request.POST.get('custom_delivery_time', '').strip()
                    if custom_delivery_time:
                        vendor.avg_delivery_time = custom_delivery_time
                    else:
                        # If custom is selected but no value, use default
                        vendor.avg_delivery_time = '3-5 days'
                else:
                    vendor.avg_delivery_time = avg_delivery_time
                
                # Validate email
                if email and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                    messages.error(request, 'Please enter a valid email address.')
                    return redirect('vendor_settings')
                
                # Check if email is already taken by another user
                if email and email != request.user.email:
                    if User.objects.filter(email=email).exclude(id=request.user.id).exists():
                        messages.error(request, 'This email is already registered by another user.')
                        return redirect('vendor_settings')
                
                request.user.first_name = first_name
                request.user.last_name = last_name
                request.user.email = email
                request.user.save()
                
                # Update vendor store information
                vendor.phone_number = request.POST.get('phone_number', '').strip()
                vendor.store_name = request.POST.get('store_name', '').strip()
                
                # SAVE THE BUSINESS CATEGORY
                vendor.category = request.POST.get('category', '').strip()
                
                vendor.business_description = request.POST.get('store_description', '').strip()
                vendor.store_city = request.POST.get('store_city', '').strip()
                vendor.store_address = request.POST.get('store_address', '').strip()
                
                # ===== NEW: SAVE ADDRESS FIELDS =====
                # Get physical address (pickup)
                physical_address = request.POST.get('physical_address', '').strip()
                physical_latitude = request.POST.get('physical_latitude', '').strip()
                physical_longitude = request.POST.get('physical_longitude', '').strip()
                
                # Get return address
                return_address = request.POST.get('return_address', '').strip()
                return_latitude = request.POST.get('return_latitude', '').strip()
                return_longitude = request.POST.get('return_longitude', '').strip()
                
                # Save physical address
                if physical_address:
                    vendor.physical_address = physical_address
                if physical_latitude:
                    vendor.physical_latitude = physical_latitude
                if physical_longitude:
                    vendor.physical_longitude = physical_longitude
                
                # Save return address
                if return_address:
                    vendor.return_address = return_address
                if return_latitude:
                    vendor.return_latitude = return_latitude
                if return_longitude:
                    vendor.return_longitude = return_longitude
                # ===== END NEW CODE =====
                
                # Bank account details
                bank_name = request.POST.get('bank_name', '').strip()
                account_number = request.POST.get('account_number', '').strip()
                account_name = request.POST.get('account_name', '').strip()
                
                # Validate bank details if provided
                if bank_name or account_number or account_name:
                    if not all([bank_name, account_number, account_name]):
                        messages.error(request, 'Please provide complete bank details or leave all bank fields empty.')
                        return redirect('vendor_settings')
                    
                    if len(account_number) != 10 or not account_number.isdigit():
                        messages.error(request, 'Account number must be exactly 10 digits.')
                        return redirect('vendor_settings')
                
                vendor.bank_name = bank_name
                vendor.account_number = account_number
                vendor.account_name = account_name
                
                # Handle logo upload
                if 'logo' in request.FILES:
                    # Validate image
                    logo = request.FILES['logo']
                    if logo.size > 5 * 1024 * 1024:  # 5MB limit
                        messages.error(request, 'Logo image must be less than 5MB.')
                        return redirect('vendor_settings')
                    
                    # Check file type
                    allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
                    if logo.content_type not in allowed_types:
                        messages.error(request, 'Please upload a valid image (JPEG, PNG, JPG, GIF, WEBP).')
                        return redirect('vendor_settings')
                    
                    vendor.image = logo
                
                vendor.save()
                messages.success(request, 'Settings updated successfully!')
                return redirect('vendor_settings')

        except Exception as e:
            print(f"Error saving vendor settings: {str(e)}")
            import traceback
            traceback.print_exc()
            messages.error(request, f'An error occurred while saving settings: {str(e)}')

    # Prepare context for template
    context = {
        'vendor': vendor,
        'bank_choices': bank_choices,
        'user': request.user,
    }
    
    return render(request, 'user/vendor_settings.html', context)


@csrf_exempt
@require_http_methods(["POST"])
def settings_verify_account_numbers(request):
    """
    AJAX view to verify bank account number using Paystack API for settings page
    """
    try:
        # Parse the request data
        data = json.loads(request.body)
        account_number = data.get('account_number')
        bank_name = data.get('bank_name')
        
        print("Bank verification request - Account:", account_number, "Bank:", bank_name)
        
        # Validate inputs
        if not account_number or not bank_name:
            return JsonResponse({
                'success': False,
                'message': 'Account number and bank name are required'
            })
        
        if len(account_number) != 10 or not account_number.isdigit():
            return JsonResponse({
                'success': False,
                'message': 'Please enter a valid 10-digit account number'
            })
        
        # Get Paystack secret key
        PAYSTACK_SECRET_KEY = getattr(settings, 'PAYSTACK_SECRET', '')
        
        if not PAYSTACK_SECRET_KEY:
            print("Paystack secret key is not set in settings")
            return JsonResponse({
                'success': False,
                'message': 'Bank verification service is not configured'
            })
        
        print("Paystack key found")
        
        # Step 1: Get bank code from bank name
        print("Looking up bank code for:", bank_name)
        banks_response = requests.get(
            "https://api.paystack.co/bank",
            headers={
                "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
                "Content-Type": "application/json"
            },
            timeout=30
        )
        
        banks_data = banks_response.json()
        print("Banks API response status:", banks_data.get('status'))
        
        if not banks_data.get('status'):
            error_msg = banks_data.get('message', 'Unknown error loading banks')
            print("Failed to load banks:", error_msg)
            return JsonResponse({
                'success': False,
                'message': f"Failed to load banks: {error_msg}"
            })
        
        # Find the bank code by bank name
        bank_code = None
        matched_bank = None
        for bank in banks_data['data']:
            if bank['name'].lower() == bank_name.lower():
                bank_code = bank['code']
                matched_bank = bank['name']
                break
        
        if not bank_code:
            print("Bank not found in bank list:", bank_name)
            return JsonResponse({
                'success': False,
                'message': f"Bank '{bank_name}' not found. Please select a valid bank."
            })
        
        print("Found bank code:", bank_code, "for bank:", matched_bank)
        
        # Step 2: Verify account with the bank code
        url = "https://api.paystack.co/bank/resolve"
        params = {
            "account_number": account_number,
            "bank_code": bank_code
        }
        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        print("Calling Paystack verification API")
        response = requests.get(url, params=params, headers=headers, timeout=30)
        
        print("Paystack response status:", response.status_code)
        
        # Get the full response
        paystack_data = response.json()
        print("Paystack response data:", paystack_data)
        
        # Check if the API call was successful
        if paystack_data.get('status'):
            account_name = paystack_data['data']['account_name']
            print("SUCCESS - Account Name:", account_name)
            
            # Update vendor account name in database if user is authenticated
            if request.user.is_authenticated:
                try:
                    vendor = Vendor.objects.get(user=request.user)
                    vendor.account_name = account_name
                    vendor.save()
                    print("Updated vendor account name in database")
                except Vendor.DoesNotExist:
                    print("Vendor not found for user")
            
            return JsonResponse({
                'success': True,
                'account_name': account_name,
                'account_number': paystack_data['data']['account_number'],
                'bank_code': bank_code
            })
        else:
            # Return the EXACT Paystack error message
            error_msg = paystack_data.get('message', 'Unknown Paystack error')
            print("Paystack Error:", error_msg)
            
            return JsonResponse({
                'success': False,
                'message': error_msg
            })
            
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print("ERROR:", error_msg)
        import traceback
        print("Stack trace:")
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'message': error_msg
        })


@require_http_methods(["GET"])
def settings_get_bank_list(request):
    """
    Get list of Nigerian banks from Paystack API for settings page
    """
    try:
        PAYSTACK_SECRET_KEY = getattr(settings, 'PAYSTACK_SECRET', '')
        
        if not PAYSTACK_SECRET_KEY:
            print("Paystack secret key not found")
            return JsonResponse({
                'success': False,
                'message': 'Bank list service is currently unavailable',
                'banks': []
            })
        
        url = "https://api.paystack.co/bank"
        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        paystack_data = response.json()
        
        if paystack_data.get('status'):
            # Filter only Nigerian banks and sort by name
            nigerian_banks = [
                bank for bank in paystack_data['data'] 
                if bank.get('country') == 'Nigeria' and bank.get('active')
            ]
            sorted_banks = sorted(nigerian_banks, key=lambda x: x['name'])
            
            print("Loaded", len(sorted_banks), "banks")
            
            return JsonResponse({
                'success': True,
                'banks': sorted_banks
            })
        else:
            error_msg = paystack_data.get('message', 'Failed to load banks')
            print("Failed to load banks:", error_msg)
            return JsonResponse({
                'success': False,
                'message': error_msg,
                'banks': []
            })
            
    except Exception as e:
        error_msg = f'Error loading banks: {str(e)}'
        print("Error:", error_msg)
        return JsonResponse({
            'success': False,
            'message': error_msg,
            'banks': []
        })
    
    

    
    
    
# def vendor_transaction(request):
#     return render(request, 'user/transaction.html')


# @login_required
# def vendor_transaction(request):
#     """
#     Vendor transaction view - shows payout history and revenue summary
#     """
#     try:
#         vendor = Vendor.objects.get(user=request.user)
        
#         # Check if vendor is approved
#         if vendor.approval_status != 'approved':
#             messages.error(request, 'Your vendor account is not approved yet.')
#             return redirect('vendor_dashboard')
            
#     except Vendor.DoesNotExist:
#         messages.error(request, 'Vendor profile not found.')
#         return redirect('vendor_dashboard')
    
#     # 1. CALCULATE TOTAL REVENUE FROM COMPLETED ORDERS
#     # Get all completed (delivered) orders for this vendor
#     completed_orders = CartOrderItems.objects.filter(
#         vendor_id=vendor.vid,
#         product_status='Delivered'
#     )
    
#     # Calculate total revenue from completed orders
#     total_revenue = completed_orders.aggregate(
#         total_revenue=Sum(F('price') * F('qty'))
#     )['total_revenue'] or 0
    
#     # 2. GET PAYOUT HISTORY (TRANSACTIONS)
#     # In a real system, you would have a Payout model
#     # For now, we'll simulate with AdminTransaction model if it exists
#     payout_history = []
    
#     try:
#         # Try to get actual payout transactions from AdminTransaction
#         # These would be when admin pays the vendor
#         payouts = AdminTransaction.objects.filter(
#             user=vendor.user,  # Assuming AdminTransaction has user field
#             transaction_type='vendor_payout',
#             status='success'
#         ).order_by('-created_at')
        
#         for payout in payouts:
#             payout_history.append({
#                 'id': payout.id or payout.reference[-6:],
#                 'date': payout.created_at,
#                 'amount': payout.amount,
#                 'status': 'Paid',
#                 'reference': payout.reference
#             })
            
#     except Exception as e:
#         # Fallback: Create simulated payout data from completed orders
#         # Group completed orders by month to simulate monthly payouts
#         from django.db.models.functions import TruncMonth
        
#         monthly_totals = completed_orders.annotate(
#             month=TruncMonth('order_date')
#         ).values('month').annotate(
#             total_amount=Sum(F('price') * F('qty'))
#         ).order_by('-month')
        
#         # Generate payout entries (assuming payouts happen monthly)
#         for i, month_data in enumerate(monthly_totals[:8]):  # Last 8 months
#             if month_data['total_amount'] > 0:
#                 payout_history.append({
#                     'id': f"PYT{month_data['month'].strftime('%m%Y')}",
#                     'date': month_data['month'].strftime('%dth %b, %Y'),
#                     'display_date': month_data['month'].strftime('%dth %b, %Y'),
#                     'amount': month_data['total_amount'],
#                     'status': 'Paid'
#                 })
    
#     # 3. ADD PAGINATION FOR PAYOUT HISTORY
#     from django.core.paginator import Paginator
    
#     paginator = Paginator(payout_history, 10)  # 10 items per page
#     page_number = request.GET.get('page')
#     page_obj = paginator.get_page(page_number)
    
#     # If no real payout data, create sample data for display
#     if not payout_history:
#         # Create sample data for demonstration
#         import random
#         from datetime import datetime, timedelta
        
#         sample_amounts = [190000, 250000, 180000, 220000, 195000, 210000, 230000, 175000]
        
#         for i in range(8):
#             date = datetime.now() - timedelta(days=30*(i+1))
#             payout_history.append({
#                 'id': f"1234{357+i}",
#                 'date': date,
#                 'display_date': date.strftime('%dth %b, %Y'),
#                 'amount': random.choice(sample_amounts),
#                 'status': 'Paid'
#             })
        
#         # Re-paginate with sample data
#         paginator = Paginator(payout_history, 10)
#         page_obj = paginator.get_page(page_number)
    
#     # Calculate pending payout (orders completed but not paid out yet)
#     # This would be orders marked as delivered but not yet in payout transactions
#     pending_payout = 0
    
#     # If we have payout transactions, calculate what's still pending
#     if payout_history:
#         total_paid_out = sum(payout['amount'] for payout in payout_history)
#         pending_payout = max(0, float(total_revenue) - float(total_paid_out))
#     else:
#         # If no payouts yet, all revenue is pending
#         pending_payout = float(total_revenue)
    
#     # Prepare context for template
#     context = {
#         'vendor': vendor,
#         'total_revenue': float(total_revenue),
#         'pending_payout': float(pending_payout),
#         'payouts': page_obj,
#         'has_payouts': len(payout_history) > 0,
#     }
    
#     return render(request, 'user/transaction.html', context)
    
    
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from decimal import Decimal
from django.db.models import Sum, F, Q
from django.core.paginator import Paginator

# @login_required
# def vendor_transaction(request):
#     """
#     Vendor transaction view - shows ACTUAL earnings from delivered orders
#     """
#     try:
#         vendor = Vendor.objects.get(user=request.user)
        
#         if vendor.approval_status != 'approved':
#             messages.error(request, 'Your vendor account is not approved yet.')
#             return redirect('vendor_dashboard')
            
#     except Vendor.DoesNotExist:
#         messages.error(request, 'Vendor profile not found.')
#         return redirect('vendor_dashboard')
    
#     # ============ 1. CALCULATE ACCURATE EARNINGS ============
    
#     # A. Get ALL delivered orders for this vendor
#     delivered_orders = CartOrderItems.objects.filter(
#         vendor_id=vendor.vid,
#         product_status='Delivered'
#     ).select_related('order')
    
#     # B. Calculate TOTAL REVENUE from delivered orders
#     total_revenue_result = delivered_orders.aggregate(
#         total=Sum(F('price') * F('qty'))
#     )
#     total_revenue = total_revenue_result['total'] or Decimal('0.00')
    
#     # C. Get orders that are in payouts (already paid)
#     if hasattr(vendor, 'vendor_payouts'):
#         # Get order items that are in completed payouts
#         paid_order_ids = PayoutOrder.objects.filter(
#             payout__vendor=vendor,
#             payout__status='completed'
#         ).values_list('order_item_id', flat=True)
#     else:
#         paid_order_ids = []
    
#     # D. Calculate pending earnings (orders NOT in payouts yet)
#     pending_orders = delivered_orders.exclude(id__in=paid_order_ids)
    
#     pending_revenue_result = pending_orders.aggregate(
#         total=Sum(F('price') * F('qty'))
#     )
#     pending_revenue = pending_revenue_result['total'] or Decimal('0.00')
    
#     # E. Calculate already paid earnings
#     paid_revenue = total_revenue - pending_revenue
    
#     # ============ 2. GET PAYOUT HISTORY ============
    
#     payouts_list = []
    
#     # If VendorPayout model exists, get actual payouts
#     try:
#         if hasattr(vendor, 'vendor_payouts'):
#             vendor_payouts = VendorPayout.objects.filter(
#                 vendor=vendor,
#                 status__in=['completed', 'processing', 'approved']
#             ).order_by('-created_at')
            
#             for payout in vendor_payouts:
#                 # Get order count for this payout
#                 order_count = PayoutOrder.objects.filter(payout=payout).count()
                
#                 payouts_list.append({
#                     'id': payout.payout_id,
#                     'date': payout.created_at,
#                     'display_date': payout.created_at.strftime('%d %b, %Y'),
#                     'amount': payout.net_amount,
#                     'status': payout.status.capitalize(),
#                     'orders_count': order_count,
#                     'reference': f"PAYOUT-{payout.payout_id}"
#                 })
                
#     except Exception as e:
#         print(f"Error getting payouts: {str(e)}")
    
#     # ============ 3. GET RECENT DELIVERED ORDERS ============
    
#     recent_delivered_orders = delivered_orders.order_by('-order_date')[:10]
    
#     order_details = []
#     for order_item in recent_delivered_orders:
#         # Check if this order is already paid
#         is_paid = order_item.id in paid_order_ids if paid_order_ids else False
        
#         order_total = order_item.price * order_item.qty
#         order_details.append({
#             'id': order_item.unique_id,
#             'product': order_item.item,
#             'date': order_item.order_date,
#             'display_date': order_item.order_date.strftime('%d %b, %Y'),
#             'amount': order_total,
#             'status': 'Paid' if is_paid else 'Pending',
#             'qty': order_item.qty,
#             'price': order_item.price,
#             'order_number': order_item.order.oid if order_item.order else 'N/A',
#         })
    
#     # ============ 4. PAGINATE PAYOUTS ============
    
#     paginator = Paginator(payouts_list, 10)
#     page_number = request.GET.get('page')
#     page_obj = paginator.get_page(page_number)
    
#     # ============ 5. PREPARE CONTEXT ============
    
#     context = {
#         'vendor': vendor,
        
#         # Financial Summary
#         'total_revenue': float(total_revenue),
#         'pending_revenue': float(pending_revenue),
#         'paid_revenue': float(paid_revenue),
#         'commission_rate': float(vendor.commission_rate) if hasattr(vendor, 'commission_rate') else 10.0,
        
#         # Counts
#         'total_orders': delivered_orders.count(),
#         'pending_orders_count': pending_orders.count(),
#         'paid_orders_count': len(paid_order_ids),
        
#         # Data for display
#         'payouts': page_obj,
#         'recent_orders': order_details,
#         'has_payouts': len(payouts_list) > 0,
#         'has_orders': delivered_orders.exists(),
        
#         # For payout request (if you add that feature later)
#         'min_payout': float(vendor.payout_threshold) if hasattr(vendor, 'payout_threshold') else 5000.00,
#         'can_request_payout': float(pending_revenue) >= float(vendor.payout_threshold) if hasattr(vendor, 'payout_threshold') else False,
        
#         'today': timezone.now().date(),
#     }
    
#     return render(request, 'user/transaction.html', context)


@vendor_required
def vendor_transaction(request):
    """
    Vendor transaction view - tracks vendor earnings based on their initial product price (excluding commission)
    """
    try:
        vendor = Vendor.objects.get(user=request.user)
        
        if vendor.approval_status != 'approved':
            messages.error(request, 'Your vendor account is not approved yet.')
            return redirect('vendor_dashboard')
            
    except Vendor.DoesNotExist:
        messages.error(request, 'Vendor profile not found.')
        return redirect('vendor_dashboard')
    
    # ============ 1. GET VENDOR'S DELIVERED ORDERS ============
    
    delivered_orders = CartOrderItems.objects.filter(
        vendor_id=vendor.vid,
        product_status='Delivered'
    ).select_related('order')
    
    # ============ 2. CALCULATE TOTAL EARNINGS USING VENDOR'S PRICE ============
    
    total_vendor_earnings = Decimal('0.00')
    order_earnings = []  # Store each order's vendor earnings
    
    for order_item in delivered_orders:
        try:
            # FIRST: Try to get vendor price from the product
            product = Product.objects.filter(
                title=order_item.item,
                vendor=vendor
            ).first()
            
            if product:
                # Use vendor_price if it exists, otherwise calculate from price
                if hasattr(product, 'vendor_price') and product.vendor_price > 0:
                    vendor_price = product.vendor_price
                else:
                    # The product's price IS the vendor's price (before commission markup)
                    vendor_price = product.price
                
                vendor_item_total = vendor_price * order_item.qty
            else:
                # If product not found, use a conservative estimate (80% of selling price)
                vendor_price = order_item.price * Decimal('0.80')
                vendor_item_total = vendor_price * order_item.qty
            
            total_vendor_earnings += vendor_item_total
            
            # Store this order's earnings
            order_earnings.append({
                'order_item': order_item,
                'vendor_price': vendor_price,
                'vendor_total': vendor_item_total,
                'selling_price': order_item.price,
                'selling_total': order_item.price * order_item.qty,
                'commission': (order_item.price * order_item.qty) - vendor_item_total,
            })
            
        except Exception as e:
            print(f"Error calculating vendor earnings for {order_item.item}: {str(e)}")
    
    # ============ 3. GET PAYOUT HISTORY ============
    
    payouts_list = []
    
    # Try to get actual payout transactions
    try:
        if hasattr(vendor, 'vendor_payouts'):
            vendor_payouts = VendorPayout.objects.filter(
                vendor=vendor,
                status__in=['completed', 'processing', 'approved']
            ).order_by('-created_at')
            
            for payout in vendor_payouts:
                payouts_list.append({
                    'id': payout.payout_id,
                    'date': payout.created_at,
                    'display_date': payout.created_at.strftime('%d %b, %Y'),
                    'amount': payout.net_amount,
                    'status': payout.status.capitalize(),
                    'reference': f"PAYOUT-{payout.payout_id}"
                })
    except Exception as e:
        print(f"Error getting payouts: {str(e)}")
    
    # ============ 4. CALCULATE VENDOR'S CURRENT PAYOUT BALANCE ============
    
    # Calculate total paid to vendor
    total_paid_to_vendor = Decimal('0.00')
    for payout in payouts_list:
        if payout['status'] == 'Completed':
            total_paid_to_vendor += Decimal(str(payout['amount']))
    
    # Vendor's current payout balance = Total earnings - Total paid out
    vendor_payout_balance = total_vendor_earnings - total_paid_to_vendor
    
    # ============ 5. GET RECENT ORDERS WITH VENDOR PRICE BREAKDOWN ============
    
    recent_orders_list = []
    recent_delivered = delivered_orders.order_by('-order_date')[:10]
    
    for order_item in recent_delivered:
        # Find the matching earnings record
        order_earning = next(
            (oe for oe in order_earnings if oe['order_item'].id == order_item.id),
            None
        )
        
        if order_earning:
            recent_orders_list.append({
                'id': order_item.unique_id,
                'product': order_item.item,
                'date': order_item.order_date,
                'display_date': order_item.order_date.strftime('%d %b, %Y'),
                'vendor_price': order_earning['vendor_price'],
                'selling_price': order_earning['selling_price'],
                'qty': order_item.qty,
                'vendor_total': order_earning['vendor_total'],
                'selling_total': order_earning['selling_total'],
                'commission': order_earning['commission'],
                'order_number': order_item.order.oid if order_item.order else 'N/A',
                'status': 'Delivered',
            })
    
    # ============ 6. PREPARE CONTEXT ============
    
    context = {
        'vendor': vendor,
        
        # VENDOR'S FINANCIAL SUMMARY (Based on their product prices)
        'total_vendor_earnings': float(total_vendor_earnings),      # Total money vendor should receive
        'total_paid_to_vendor': float(total_paid_to_vendor),        # Already paid to vendor
        'vendor_payout_balance': float(vendor_payout_balance),      # Current balance to be paid
        
        # Backward compatibility - map to your template variables
        'total_revenue': float(total_vendor_earnings),              # Shows total vendor earnings
        'paid_revenue': float(total_paid_to_vendor),                # Shows amount already paid
        'pending_revenue': float(vendor_payout_balance),           # Shows pending payout balance
        
        # Counts
        'total_orders': delivered_orders.count(),
        'pending_orders_count': delivered_orders.filter(
            payout_processed=False
        ).count() if hasattr(CartOrderItems, 'payout_processed') else 0,
        
        # Data for display
        'payouts': payouts_list,
        'recent_orders': recent_orders_list,  # Shows vendor price breakdown
        'has_payouts': len(payouts_list) > 0,
        'has_orders': delivered_orders.exists(),
        
        'today': timezone.now().date(),
    }
    
    # print(f"\n=== VENDOR TRANSACTION DEBUG ===")
    # print(f"Vendor: {vendor.name}")
    # print(f"Total Vendor Earnings: ₦{total_vendor_earnings:,.2f}")
    # print(f"Total Paid to Vendor: ₦{total_paid_to_vendor:,.2f}")
    # print(f"Vendor Payout Balance: ₦{vendor_payout_balance:,.2f}") 
    
    return render(request, 'user/transaction.html', context)
    

import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET

@require_GET
@csrf_exempt
def address_autocomplete(request):
    """Backend endpoint for OpenStreetMap address autocomplete"""
    query = request.GET.get('q', '').strip()
    
    if not query or len(query) < 3:
        return JsonResponse({'suggestions': []})
    
    try:
        # Call OpenStreetMap Nominatim API from server-side (no CORS issues)
        response = requests.get(
            'https://nominatim.openstreetmap.org/search',
            params={
                'format': 'json',
                'q': f'{query}, Nigeria',
                'limit': 5,
                'countrycodes': 'ng'
            },
            headers={
                'User-Agent': 'TrenvaStore/1.0 (https://trenva.store)'
            },
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            suggestions = [place['display_name'] for place in data]
            return JsonResponse({'suggestions': suggestions})
        else:
            return JsonResponse({'suggestions': [], 'error': 'Service unavailable'})
            
    except requests.RequestException as e:
        return JsonResponse({'suggestions': [], 'error': str(e)})
        
        

def vendor_terms(request):
    return render(request, 'user/trenva_terms.html')



from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth.decorators import login_required


# @login_required
# def vendor_products(request):
#     """View for vendors to see and manage their products"""
#     try:
#         vendor = Vendor.objects.get(user=request.user)
        
#         if vendor.approval_status != 'approved':
#             messages.error(request, 'Your vendor account is not approved yet.')
#             return redirect('vendor_dashboard')
            
#     except Vendor.DoesNotExist:
#         messages.error(request, 'Vendor profile not found.')
#         return redirect('vendor_dashboard')

#     # Handle AJAX requests
#     if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
#         try:
#             # Handle DELETE request
#             if 'delete_product_id' in request.POST:
#                 product_id = request.POST.get('delete_product_id')
#                 product = Product.objects.get(id=product_id, vendor=vendor, user=request.user)
                
#                 # Store product info for response
#                 product_title = product.title
                
#                 # PERMANENTLY DELETE the product
#                 product.delete()
                
#                 return JsonResponse({
#                     'success': True,
#                     'message': f'Product "{product_title}" has been permanently deleted.',
#                     'deleted_id': product_id
#                 })
            
#             # Handle TOGGLE request (for visibility - the original toggle functionality)
#             elif 'product_id' in request.POST:
#                 product_id = request.POST.get('product_id')
#                 product = Product.objects.get(id=product_id, vendor=vendor, user=request.user)
                
#                 # ORIGINAL TOGGLE LOGIC (for visibility control):
#                 if product.stock_managed:
#                     # For stock-managed products
#                     product.in_stock = not product.in_stock
                    
#                     # If turning off and stock is managed, set stock to 0
#                     if not product.in_stock:
#                         product.stock_count = 0
#                     # If turning on and stock was 0, set to a default (e.g., 1)
#                     elif product.in_stock and product.stock_count == 0:
#                         product.stock_count = 1
#                 else:
#                     # For non-stock-managed products, just toggle in_stock
#                     product.in_stock = not product.in_stock
                
#                 product.save()
                
#                 # Get stock status for response
#                 status_text = "ON" if product.in_stock else "OFF"
#                 status_class = "on" if product.in_stock else "off"
                
#                 return JsonResponse({
#                     'success': True,
#                     'product_id': product_id,
#                     'in_stock': product.in_stock,
#                     'stock_count': product.stock_count,
#                     'stock_managed': product.stock_managed,
#                     'status_text': status_text,
#                     'status_class': status_class,
#                     'message': f'Product "{product.title}" is now {("visible" if product.in_stock else "hidden")}'
#                 })
                
#         except Product.DoesNotExist:
#             return JsonResponse({'success': False, 'error': 'Product not found'})
#         except Exception as e:
#             return JsonResponse({'success': False, 'error': str(e)})

#     # GET request - show products
#     products = Product.objects.filter(vendor=vendor, user=request.user).order_by('-date')
    
#     # Add display information
#     for product in products:
#         product.display_stock_status = "IN STOCK" if product.in_stock else "OUT OF STOCK"
#         product.stock_class = "in-stock" if product.in_stock else "out-of-stock"
#         product.can_sell = product.can_add_to_cart(1)
#         product.display_selling_price = f"₦{product.price:,.2f}"

#     context = {
#         'products': products,
#         'vendor': vendor,
#     }
#     return render(request, 'user/vendor_products.html', context)

@vendor_required
def vendor_products(request):
    """View for vendors to see and manage their products"""
    try:
        vendor = Vendor.objects.get(user=request.user)
        
        if vendor.approval_status != 'approved':
            messages.error(request, 'Your vendor account is not approved yet.')
            return redirect('vendor_dashboard')
            
    except Vendor.DoesNotExist:
        messages.error(request, 'Vendor profile not found.')
        return redirect('vendor_dashboard')

    # Handle AJAX requests
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            # Handle DELETE request
            if 'delete_product_id' in request.POST:
                product_id = request.POST.get('delete_product_id')
                product = Product.objects.get(id=product_id, vendor=vendor, user=request.user)
                
                # Store product info for response
                product_title = product.title
                
                # ✅ CHECK IF PRODUCT IS CURRENTLY ON ORDER
                active_orders = CartOrderItems.objects.filter(
                    vendor_id=vendor.vid,
                    item=product.title,
                    product_status__in=['Placed', 'Confirmed', 'Processing', 'Shipped']
                ).exclude(
                    product_status__in=['Delivered', 'Canceled', 'Refunded']
                )
                
                if active_orders.exists():
                    # Product is on order - cannot delete
                    order_count = active_orders.count()
                    order_numbers = ', '.join([f"#{item.invoice_no}" for item in active_orders[:3]])
                    
                    if order_count > 3:
                        order_numbers += f" and {order_count - 3} more"
                    
                    return JsonResponse({
                        'success': False,
                        'error': f"Cannot delete '{product_title}' - it is currently on order ({order_numbers}). Please wait until all orders are delivered.",
                        'orders_count': order_count,
                        'on_order': True
                    })
                
                # ✅ NO ACTIVE ORDERS - SAFE TO DELETE
                
                # Create deletion record for admin tracking
                deletion_reason = request.POST.get('deletion_reason', 'vendor_request')
                deletion_notes = request.POST.get('deletion_notes', '')
                
                
                # Create deletion record
                try:
                    deletion_record = DeletedProduct.create_deletion_record(
                        product=product,
                        deleted_by=request.user,
                        reason=deletion_reason,
                        notes=deletion_notes or f'Vendor requested deletion via dashboard'
                    )
                    # logger.info("deletion record was successful")
                except Exception as e:
                    logger.error("Error creating deletion record:", exc_info=True)
                
                # Mark product as disabled
                product.in_stock = False
                product.stock_count = 0
                product.product_status = "disabled"
                product.save()
                
                return JsonResponse({
                    'success': True,
                    'message': f'Product "{product_title}" has been deleted successfully.',
                    'deleted_id': product_id
                })
            
            # Handle TOGGLE request (for visibility - the original toggle functionality)
            elif 'product_id' in request.POST:
                product_id = request.POST.get('product_id')
                product = Product.objects.get(id=product_id, vendor=vendor, user=request.user)
                
                # ORIGINAL TOGGLE LOGIC (for visibility control):
                if product.stock_managed:
                    # For stock-managed products
                    product.in_stock = not product.in_stock
                    
                    # If turning off and stock is managed, set stock to 0
                    if not product.in_stock:
                        product.stock_count = 0
                    # If turning on and stock was 0, set to a default (e.g., 1)
                    elif product.in_stock and product.stock_count == 0:
                        product.stock_count = 1
                else:
                    # For non-stock-managed products, just toggle in_stock
                    product.in_stock = not product.in_stock
                
                product.save()
                
                # Get stock status for response
                status_text = "ON" if product.in_stock else "OFF"
                status_class = "on" if product.in_stock else "off"
                
                return JsonResponse({
                    'success': True,
                    'product_id': product_id,
                    'in_stock': product.in_stock,
                    'stock_count': product.stock_count,
                    'stock_managed': product.stock_managed,
                    'status_text': status_text,
                    'status_class': status_class,
                    'message': f'Product "{product.title}" is now {("visible" if product.in_stock else "hidden")}'
                })
                
        except Product.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Product not found'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    # GET request - show products
    products = Product.objects.filter(vendor=vendor, user=request.user).order_by('-date')
    
    # Add display information
    for product in products:
        product.display_stock_status = "IN STOCK" if product.in_stock else "OUT OF STOCK"
        product.stock_class = "in-stock" if product.in_stock else "out-of-stock"
        product.can_sell = product.can_add_to_cart(1)
        product.display_selling_price = f"₦{product.price:,.2f}"

    context = {
        'products': products,
        'vendor': vendor,
    }
    return render(request, 'user/vendor_products.html', context)
    

# @login_required
# def vendor_add_products(request):
#     """View for vendors to add new products"""
#     try:
#         vendor = Vendor.objects.get(user=request.user)
        
#         if vendor.approval_status != 'approved':
#             messages.error(request, 'Your vendor account is not approved yet.')
#             return redirect('vendor_dashboard')
            
#     except Vendor.DoesNotExist:
#         messages.error(request, 'Vendor profile not found.')
#         return redirect('vendor_dashboard')

#     # Get data for template
#     categories = Category.objects.all()
#     subcategories = SubCategory.objects.all()
#     level_two_categories = LevelTwoCategory.objects.all()
#     brands = Brand.objects.all()
#     colors = ProductColor.objects.all()
#     sizes = ProductSize.objects.all()

#     # Category markup percentages
#     CATEGORY_MARKUPS = {
#         'Fashion': 25.0,
#         'Phones & Tablets': 20.0,
#         'Computing': 15.0,
#         'Health & Beauty': 30.0,
#         'Sound System': 18.0,
#         'Games': 22.0,
#         'default': 20.0,
#     }

#     SIZE_CATEGORIES = [
#         ('', 'Select size category'),
#         ('small', 'Small items - Fits on a motorbike'),
#         ('large', 'Large items - Cannot fit on a motorbike'),
#     ]

#     if request.method == 'POST':
#         try:
#             # Get form data
#             title = request.POST.get('title', '').strip()
#             category_id = request.POST.get('category')
#             subcategory_id = request.POST.get('subcategory')
#             level_two_category_id = request.POST.get('level_two_category')
#             brand_input = request.POST.get('brand', '').strip()
#             description = request.POST.get('description', '').strip()
#             specifications = request.POST.get('specifications', '').strip()
            
#             vendor_price = request.POST.get('vendor_price', '0')
#             old_price = request.POST.get('old_price', '')
#             size_category = request.POST.get('size_category', 'small')
#             product_status = request.POST.get('product_status', 'draft')
#             tags_input = request.POST.get('tags', '')
#             terms_agreement = request.POST.get('terms_agreement')
            
#             # Stock fields
#             total_stock = request.POST.get('stock_count', '0')
            
#             # Color fields
#             enable_colors = request.POST.get('enable_colors')
#             color_ids = request.POST.getlist('color_id[]')
#             color_stocks = request.POST.getlist('color_stock[]')
            
#             # Size fields
#             enable_sizes = request.POST.get('enable_sizes')
#             size_ids = request.POST.getlist('size_id[]')
#             size_stocks = request.POST.getlist('size_stock[]')

#             # Basic validation
#             if not all([title, category_id, vendor_price, terms_agreement]):
#                 messages.error(request, 'Please fill in all required fields.')
#                 return render(request, 'user/vendor_add_products.html', locals())

#             if float(vendor_price) <= 0:
#                 messages.error(request, 'Please enter a valid price.')
#                 return render(request, 'user/vendor_add_products.html', locals())

#             # Stock validation
#             try:
#                 stock_count_int = int(total_stock)
#                 if stock_count_int < 0:
#                     stock_count_int = 0
#             except ValueError:
#                 stock_count_int = 0

#             # Get category
#             category = Category.objects.get(id=category_id)
            
#             # Get subcategory (optional)
#             subcategory = None
#             if subcategory_id:
#                 try:
#                     subcategory = SubCategory.objects.get(id=subcategory_id)
#                 except SubCategory.DoesNotExist:
#                     pass

#             # Get level two category (optional)
#             level_two_category = None
#             if level_two_category_id:
#                 try:
#                     level_two_category = LevelTwoCategory.objects.get(id=level_two_category_id)
#                 except LevelTwoCategory.DoesNotExist:
#                     pass

#             # Handle brand (optional)
#             brand = None
#             if brand_input:
#                 brand, _ = Brand.objects.get_or_create(title=brand_input)

#             # Price calculation
#             vendor_price_float = float(vendor_price)
#             markup_percentage = CATEGORY_MARKUPS.get(category.title, CATEGORY_MARKUPS['default'])
#             marked_up_price = vendor_price_float * (1 + markup_percentage / 100)
#             marked_up_price = round(marked_up_price, 2)
            
#             # Handle old price
#             old_price_float = None
#             if old_price and old_price.strip():
#                 try:
#                     old_price_float = float(old_price)
#                     if old_price_float <= 0:
#                         old_price_float = None
#                 except ValueError:
#                     old_price_float = None

#             # CREATE PRODUCT
#             product = Product.objects.create(
#                 user=request.user,
#                 vendor=vendor,
#                 title=title,
#                 category=category,
#                 subcategory=subcategory,
#                 leveltwocategory=level_two_category,
#                 brand=brand,
#                 description=description,
#                 specifications=specifications,
#                 vendor_price=vendor_price_float,
#                 price=marked_up_price,
#                 old_price=old_price_float,
#                 size_category=size_category,
#                 product_status=product_status,
#                 in_stock=(stock_count_int > 0),
#                 stock_count=stock_count_int,
#             )

#             # Handle main image
#             if 'image' in request.FILES:
#                 product.image = request.FILES['image']
#                 product.save()

#             # Handle colors with stock
#             if enable_colors and color_ids:
#                 for i, color_id in enumerate(color_ids):
#                     if color_id and color_stocks[i]:
#                         try:
#                             color = ProductColor.objects.get(id=color_id)
#                             color.stock = int(color_stocks[i])
#                             color.save()
#                             product.color.add(color)
#                         except ProductColor.DoesNotExist:
#                             pass

#             # Handle sizes with stock
#             if enable_sizes and size_ids:
#                 for i, size_id in enumerate(size_ids):
#                     if size_id and size_stocks[i]:
#                         try:
#                             size_obj = ProductSize.objects.get(id=size_id)
#                             size_obj.stock = int(size_stocks[i])
#                             size_obj.save()
#                             product.size.add(size_obj)
#                         except ProductSize.DoesNotExist:
#                             pass

#             # Handle tags
#             if tags_input:
#                 tags_list = [tag.strip() for tag in tags_input.split(',') if tag.strip()]
#                 for tag in tags_list:
#                     product.tag.add(tag)

#             # Handle additional images
#             additional_images = request.FILES.getlist('additional_images')
#             for image in additional_images:
#                 ProductImages.objects.create(product=product, images=image)

#             messages.success(request, f'✅ Product "{title}" created successfully!')
#             return redirect('vendor_products')

#         except Exception as e:
#             import traceback
#             traceback.print_exc()
#             messages.error(request, f'Error: {str(e)}')
#             return render(request, 'user/vendor_add_products.html', locals())

#     context = {
#         'categories': categories,
#         'subcategories': subcategories,
#         'level_two_categories': level_two_categories,
#         'brands': brands,
#         'colors': colors,
#         'sizes': sizes,
#         'category_markups': CATEGORY_MARKUPS,
#         'size_categories': SIZE_CATEGORIES,
#         'vendor': vendor,
#     }
#     return render(request, 'user/vendor_add_products.html', context)
    

@vendor_required
def vendor_add_products(request):
    """View for vendors to add new products"""
    try:
        vendor = Vendor.objects.get(user=request.user)
        
        if vendor.approval_status != 'approved':
            messages.error(request, 'Your vendor account is not approved yet.')
            return redirect('vendor_dashboard')
            
    except Vendor.DoesNotExist:
        messages.error(request, 'Vendor profile not found.')
        return redirect('vendor_dashboard')

    # Get data for template
    categories = Category.objects.all()
    subcategories = SubCategory.objects.all()
    level_two_categories = LevelTwoCategory.objects.all()
    brands = Brand.objects.all()
    colors = ProductColor.objects.all()
    sizes = ProductSize.objects.all()

    # Category markup percentages
    CATEGORY_MARKUPS = {
        'Fashion': 25.0,
        'Phones & Tablets': 20.0,
        'Computing': 15.0,
        'Health & Beauty': 30.0,
        'Sound System': 18.0,
        'Games': 22.0,
        'default': 20.0,
    }

    SIZE_CATEGORIES = [
        ('', 'Select size category'),
        ('small', 'Small items - Fits on a motorbike'),
        ('large', 'Large items - Cannot fit on a motorbike'),
    ]

    if request.method == 'POST':
        try:
            # Get form data
            title = request.POST.get('title', '').strip()
            category_id = request.POST.get('category')
            subcategory_id = request.POST.get('subcategory')
            level_two_category_id = request.POST.get('level_two_category')
            brand_input = request.POST.get('brand', '').strip()
            description = request.POST.get('description', '').strip()
            specifications = request.POST.get('specifications', '').strip()
            
            vendor_price = request.POST.get('vendor_price', '0')
            old_price = request.POST.get('old_price', '')
            size_category = request.POST.get('size_category', 'small')
            product_status = request.POST.get('product_status', 'draft')
            tags_input = request.POST.get('tags', '')
            terms_agreement = request.POST.get('terms_agreement')
            
            # Stock fields
            total_stock = request.POST.get('stock_count', '0')
            
            # Color fields
            enable_colors = request.POST.get('enable_colors')
            color_ids = request.POST.getlist('color_id[]')
            color_stocks = request.POST.getlist('color_stock[]')
            
            # Size fields
            enable_sizes = request.POST.get('enable_sizes')
            size_ids = request.POST.getlist('size_id[]')
            size_stocks = request.POST.getlist('size_stock[]')
            
            # NEW: Color-Size combination fields
            enable_combinations = request.POST.get('enable_combinations')
            combo_color_ids = request.POST.getlist('combo_color_id[]')
            combo_size_ids = request.POST.getlist('combo_size_id[]')
            combo_stocks = request.POST.getlist('combo_stock[]')

            # Basic validation
            if not all([title, category_id, vendor_price, terms_agreement]):
                messages.error(request, 'Please fill in all required fields.')
                return render(request, 'user/vendor_add_products.html', locals())

            if float(vendor_price) <= 0:
                messages.error(request, 'Please enter a valid price.')
                return render(request, 'user/vendor_add_products.html', locals())

            # Stock validation
            try:
                stock_count_int = int(total_stock)
                if stock_count_int < 0:
                    stock_count_int = 0
            except ValueError:
                stock_count_int = 0

            # Get category
            category = Category.objects.get(id=category_id)
            
            # Get subcategory (optional)
            subcategory = None
            if subcategory_id:
                try:
                    subcategory = SubCategory.objects.get(id=subcategory_id)
                except SubCategory.DoesNotExist:
                    pass

            # Get level two category (optional)
            level_two_category = None
            if level_two_category_id:
                try:
                    level_two_category = LevelTwoCategory.objects.get(id=level_two_category_id)
                except LevelTwoCategory.DoesNotExist:
                    pass

            # Handle brand (optional)
            brand = None
            if brand_input:
                brand, _ = Brand.objects.get_or_create(title=brand_input)

            # Price calculation
            vendor_price_float = float(vendor_price)
            markup_percentage = CATEGORY_MARKUPS.get(category.title, CATEGORY_MARKUPS['default'])
            marked_up_price = vendor_price_float * (1 + markup_percentage / 100)
            marked_up_price = round(marked_up_price, 2)
            
            # Handle old price
            old_price_float = None
            if old_price and old_price.strip():
                try:
                    old_price_float = float(old_price)
                    if old_price_float <= 0:
                        old_price_float = None
                except ValueError:
                    old_price_float = None

            # CREATE PRODUCT
            product = Product.objects.create(
                user=request.user,
                vendor=vendor,
                title=title,
                category=category,
                subcategory=subcategory,
                leveltwocategory=level_two_category,
                brand=brand,
                description=description,
                specifications=specifications,
                vendor_price=vendor_price_float,
                price=marked_up_price,
                old_price=old_price_float,
                size_category=size_category,
                product_status=product_status,
                in_stock=(stock_count_int > 0),
                stock_count=stock_count_int,
            )

            # Handle main image
            if 'image' in request.FILES:
                product.image = request.FILES['image']
                product.save()

            # Handle colors with stock (simple color-only products)
            if enable_colors and color_ids:
                for i, color_id in enumerate(color_ids):
                    if color_id and color_stocks[i]:
                        try:
                            color = ProductColor.objects.get(id=color_id)
                            color.stock = int(color_stocks[i])
                            color.save()
                            product.color.add(color)
                        except ProductColor.DoesNotExist:
                            pass

            # Handle sizes with stock (simple size-only products)
            if enable_sizes and size_ids:
                for i, size_id in enumerate(size_ids):
                    if size_id and size_stocks[i]:
                        try:
                            size_obj = ProductSize.objects.get(id=size_id)
                            size_obj.stock = int(size_stocks[i])
                            size_obj.save()
                            product.size.add(size_obj)
                        except ProductSize.DoesNotExist:
                            pass

            # NEW: Handle color-size combinations
            if enable_combinations and combo_color_ids:
                for i in range(len(combo_color_ids)):
                    color_id = combo_color_ids[i]
                    size_id = combo_size_ids[i] if i < len(combo_size_ids) else None
                    stock = combo_stocks[i] if i < len(combo_stocks) else 0
                    
                    if color_id and size_id and int(stock) > 0:
                        try:
                            from core.models import ProductColorSizeStock
                            ProductColorSizeStock.objects.create(
                                product=product,
                                color_id=int(color_id),
                                size_id=int(size_id),
                                stock=int(stock)
                            )
                        except Exception as e:
                            print(f"Error creating combination: {e}")

            # Handle tags
            if tags_input:
                tags_list = [tag.strip() for tag in tags_input.split(',') if tag.strip()]
                for tag in tags_list:
                    product.tag.add(tag)

            # Handle additional images
            additional_images = request.FILES.getlist('additional_images')
            for image in additional_images:
                ProductImages.objects.create(product=product, images=image)

            messages.success(request, f'✅ Product "{title}" created successfully!')
            return redirect('vendor_products')

        except Exception as e:
            import traceback
            traceback.print_exc()
            messages.error(request, f'Error: {str(e)}')
            return render(request, 'user/vendor_add_products.html', locals())

    context = {
        'categories': categories,
        'subcategories': subcategories,
        'level_two_categories': level_two_categories,
        'brands': brands,
        'colors': colors,
        'sizes': sizes,
        'category_markups': CATEGORY_MARKUPS,
        'size_categories': SIZE_CATEGORIES,
        'vendor': vendor,
    }
    return render(request, 'user/vendor_add_products.html', context)



    
@login_required
def get_subcategories_ajax(request):
    """AJAX endpoint to get subcategories for a category"""
    category_id = request.GET.get('category_id')
    
    if category_id:
        subcategories = SubCategory.objects.filter(category_id=category_id).values('id', 'title')
        return JsonResponse({'subcategories': list(subcategories)})
    
    return JsonResponse({'subcategories': []})

@login_required
def get_level2_categories_ajax(request):
    """AJAX endpoint to get level 2 categories for a subcategory"""
    subcategory_id = request.GET.get('subcategory_id')
    
    if subcategory_id:
        level2_categories = LevelTwoCategory.objects.filter(
            subcategory_id=subcategory_id
        ).values('id', 'title')
        return JsonResponse({'level2_categories': list(level2_categories)})
    
    return JsonResponse({'level2_categories': []})
    
def admin_chats(request):
    return render(request, 'user/admin_chats.html')

@vendor_required
def vendor_reviews(request):
    """
    View for vendors to see and manage reviews for their products
    """
    try:
        vendor = Vendor.objects.get(user=request.user)
        
        # Check if vendor is approved
        if vendor.approval_status != 'approved':
            messages.error(request, 'Your vendor account is not approved yet.')
            return redirect('vendor_dashboard')
            
    except Vendor.DoesNotExist:
        messages.error(request, 'Vendor profile not found.')
        return redirect('vendor_dashboard')

    # Get all reviews for vendor's products
    vendor_products = Product.objects.filter(vendor=vendor)
    reviews = ProductReview.objects.filter(product__in=vendor_products).select_related(
        'product', 'user'
    ).order_by('-date')

    # Review statistics
    total_reviews = reviews.count()
    average_rating = reviews.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
    
    # Rating distribution (for the bar chart)
    rating_distribution = {}
    rating_percentages = {}
    for i in range(5, 0, -1):  # 5 to 1
        count = reviews.filter(rating=i).count()
        rating_distribution[i] = count
        rating_percentages[i] = (count / total_reviews * 100) if total_reviews > 0 else 0

    # Filtering
    rating_filter = request.GET.get('rating', '')
    product_filter = request.GET.get('product', '')
    date_filter = request.GET.get('date', '')

    if rating_filter:
        reviews = reviews.filter(rating=rating_filter)
    
    if product_filter:
        reviews = reviews.filter(product_id=product_filter)
    
    if date_filter:
        if date_filter == 'today':
            today = timezone.now().date()
            reviews = reviews.filter(date__date=today)
        elif date_filter == 'week':
            week_ago = timezone.now() - timedelta(days=7)
            reviews = reviews.filter(date__gte=week_ago)
        elif date_filter == 'month':
            month_ago = timezone.now() - timedelta(days=30)
            reviews = reviews.filter(date__gte=month_ago)

    # Handle review actions (replies, hiding, etc.)
    if request.method == 'POST':
        review_id = request.POST.get('review_id')
        action = request.POST.get('action')
        
        try:
            review = ProductReview.objects.get(id=review_id, product__vendor=vendor)
            
            if action == 'reply':
                reply_text = request.POST.get('reply_text', '').strip()
                if reply_text:
                    review.vendor_reply = reply_text
                    review.vendor_reply_date = timezone.now()
                    review.save()
                    messages.success(request, 'Reply added successfully!')
            
            elif action == 'delete_reply':
                review.vendor_reply = ''
                review.vendor_reply_date = None
                review.save()
                messages.success(request, 'Reply deleted successfully!')
            
            elif action == 'hide_review':
                review.is_visible = False
                review.save()
                messages.success(request, 'Review hidden successfully!')
            
            elif action == 'show_review':
                review.is_visible = True
                review.save()
                messages.success(request, 'Review shown successfully!')
                
        except ProductReview.DoesNotExist:
            messages.error(request, 'Review not found.')
        
        return redirect('vendor_reviews')

    # Get helpful counts (you might want to add this to your ProductReview model)
    # For now, we'll simulate helpful counts
    import random
    for review in reviews:
        review.helpful_count = random.randint(50, 1500)  # Simulated data

    # Pagination
    paginator = Paginator(reviews, 10)  # 10 reviews per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'vendor': vendor,
        'reviews': page_obj,
        'total_reviews': total_reviews,
        'average_rating': round(average_rating, 1),
        'rating_distribution': rating_distribution,
        'rating_percentages': rating_percentages,
        'vendor_products': vendor_products,
        'current_filters': {
            'rating': rating_filter,
            'product': product_filter,
            'date': date_filter,
        }
    }
    
    return render(request, 'user/rating_reviews.html', context)


@user_required
def rating_reviews(request):
    """
    Main rating and reviews page - uses the same template but different URL
    """
    return vendor_reviews(request)


@vendor_required
def vendor_review_stats_api(request):
    """
    API endpoint for vendor review statistics (for charts/graphs)
    """
    try:
        vendor = Vendor.objects.get(user=request.user)
        vendor_products = Product.objects.filter(vendor=vendor)
        reviews = ProductReview.objects.filter(product__in=vendor_products)
        
        # Monthly review count for the past 6 months
        six_months_ago = timezone.now() - timedelta(days=180)
        monthly_reviews = []
        
        for i in range(6):
            month_date = timezone.now() - timedelta(days=30*i)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if i > 0:
                next_month = (month_date + timedelta(days=32)).replace(day=1)
                month_end = next_month - timedelta(days=1)
            else:
                month_end = timezone.now()
            
            month_count = reviews.filter(
                date__gte=month_start,
                date__lte=month_end
            ).count()
            
            monthly_reviews.append({
                'month': month_start.strftime('%b %Y'),
                'count': month_count
            })
        
        monthly_reviews.reverse()
        
        # Product-wise review distribution
        product_reviews = Product.objects.filter(vendor=vendor).annotate(
            review_count=Count('productreview'),
            avg_rating=Avg('productreview__rating')
        ).filter(review_count__gt=0).values('title', 'review_count', 'avg_rating').order_by('-review_count')[:10]
        
        data = {
            'monthly_reviews': monthly_reviews,
            'product_reviews': list(product_reviews),
            'total_reviews': reviews.count(),
            'average_rating': reviews.aggregate(avg=Avg('rating'))['avg'] or 0,
        }
        
        return JsonResponse(data)
        
    except Vendor.DoesNotExist:
        return JsonResponse({'error': 'Vendor not found'}, status=404)


@vendor_required
def mark_review_helpful(request, review_id):
    """
    Mark a review as helpful (for vendor reference)
    """
    if request.method == 'POST':
        try:
            vendor = Vendor.objects.get(user=request.user)
            review = ProductReview.objects.get(id=review_id, product__vendor=vendor)
            
            # You might want to create a HelpfulVote model for this
            # For now, we'll just acknoedge the action
            return JsonResponse({
                'success': True,
                'message': 'Review marked as helpful'
            })
            
        except (Vendor.DoesNotExist, ProductReview.DoesNotExist):
            return JsonResponse({
                'success': False,
                'error': 'Review not found'
            }, status=404)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def updates_disputes(request):
    return render(request, 'user/updates_disputes.html')
    

@vendor_required
def vendor_orders(request):
    """
    SIMPLE VIEW - Just show ALL orders for this vendor so we can see what's happening
    """
    try:
        vendor = Vendor.objects.get(user=request.user)
        vid = vendor.vid
        
        # CORRECTED: Use vendor object instead of vendor.name
        orders = CartOrderItems.objects.filter(vendor=vendor).select_related('order').order_by('-order_date')
        
        print(f"SIMPLIFIED DEBUG: Vendor '{vendor.name}'")
        print(f"SIMPLIFIED DEBUG: Found {orders.count()} total orders")
        
        for order in orders:
            print(f"ORDER: {order.id} - {order.item} - STATUS: '{order.product_status}'")
        
        context = {
            "vendor": vendor,
            "vid": vid,
            "orders": orders,
        }
        return render(request, "user/vendor-orders.html", context)
    
    except Exception as e:
        print(f"ERROR: {str(e)}")
        messages.error(request, f"Error: {str(e)}")
        return redirect('vendor_dashboard')
        



@vendor_required
def vendor_edit_products(request, pid):
    """View for vendors to edit existing products."""
    try:
        vendor = Vendor.objects.get(user=request.user)
        if vendor.approval_status != 'approved':
            messages.error(request, 'Your vendor account is not approved yet.')
            return redirect('vendor_dashboard')
    except Vendor.DoesNotExist:
        messages.error(request, 'Vendor profile not found.')
        return redirect('vendor_dashboard')

    # Get the product to edit
    try:
        product = Product.objects.get(pid=pid, vendor=vendor, user=request.user)
    except Product.DoesNotExist:
        messages.error(request, 'Product not found.')
        return redirect('vendor_products')

    # Get existing color stock
    product_color_stock = []
    for color in product.color.all():
        product_color_stock.append({
            'color': color,
            'stock': color.stock
        })
    
    # Get existing size stock
    product_size_stock = []
    for size in product.size.all():
        product_size_stock.append({
            'size': size,
            'stock': size.stock
        })
    
    # NEW: Get existing color-size combinations
    from core.models import ProductColorSizeStock
    product_combinations = []
    for combo in ProductColorSizeStock.objects.filter(product=product):
        product_combinations.append({
            'id': combo.id,
            'color': combo.color,
            'size': combo.size,
            'stock': combo.stock
        })

    # Data for template
    categories = Category.objects.all()
    subcategories = SubCategory.objects.all()
    level_two_categories = LevelTwoCategory.objects.all()
    brands = Brand.objects.all()
    colors = ProductColor.objects.all()
    sizes = ProductSize.objects.all()
    existing_images = ProductImages.objects.filter(product=product)

    CATEGORY_MARKUPS = {
        'Fashion': 25.0, 'Phones & Tablets': 20.0, 'Computing': 15.0,
        'Health & Beauty': 30.0, 'Sound System': 18.0, 'Games': 22.0, 'default': 20.0,
    }

    SIZE_CATEGORIES = [
        ('', 'Select size category'),
        ('small', 'Small items - Fits on a motorbike'),
        ('large', 'Large items - Cannot fit on a motorbike'),
    ]

    was_published = product.product_status == 'published'
    
    # Check if product has combinations
    has_combinations = len(product_combinations) > 0

    if request.method == 'POST':
        try:
            # Get form data
            title = request.POST.get('title', '').strip()
            category_id = request.POST.get('category')
            subcategory_id = request.POST.get('subcategory')
            level_two_category_id = request.POST.get('level_two_category')
            brand_input = request.POST.get('brand', '').strip()
            description = request.POST.get('description', '').strip()
            specifications = request.POST.get('specifications', '').strip()
            
            vendor_price = request.POST.get('vendor_price', '0')
            old_price = request.POST.get('old_price', '')
            size_category = request.POST.get('size_category', 'small')
            product_status = request.POST.get('product_status', 'draft')
            tags_input = request.POST.get('tags', '')
            
            terms_agreement = request.POST.get('terms_agreement')
            delete_images = [img_id for img_id in request.POST.getlist('delete_images') if img_id.strip()]
            
            # Stock fields
            total_stock = request.POST.get('stock_count', '0')
            
            # Color fields
            enable_colors = request.POST.get('enable_colors')
            color_ids = request.POST.getlist('color_id[]')
            color_stocks = request.POST.getlist('color_stock[]')
            
            # Size fields
            enable_sizes = request.POST.get('enable_sizes')
            size_ids = request.POST.getlist('size_id[]')
            size_stocks = request.POST.getlist('size_stock[]')
            
            # NEW: Combination fields
            enable_combinations = request.POST.get('enable_combinations')
            combo_color_ids = request.POST.getlist('combo_color_id[]')
            combo_size_ids = request.POST.getlist('combo_size_id[]')
            combo_stocks = request.POST.getlist('combo_stock[]')
            combo_delete_ids = request.POST.getlist('combo_delete_ids[]')

            # Validation
            if not all([title, category_id, vendor_price, terms_agreement]):
                messages.error(request, 'Please fill in all required fields.')
                return render(request, 'user/vendor_edit_products.html', locals())

            if not size_category:
                messages.error(request, 'Please select a size category.')
                return render(request, 'user/vendor_edit_products.html', locals())

            # Convert prices
            vendor_price_float = float(vendor_price)
            
            # Handle old price
            old_price_float = None
            if old_price and old_price.strip():
                try:
                    old_price_float = float(old_price)
                    if old_price_float <= 0:
                        old_price_float = None
                except ValueError:
                    old_price_float = None

            # Get category
            category = Category.objects.get(id=category_id)
            markup_percentage = CATEGORY_MARKUPS.get(category.title, CATEGORY_MARKUPS['default'])
            new_display_price = vendor_price_float * (1 + markup_percentage / 100)
            new_display_price = round(new_display_price, 2)

            # Get subcategory and level2 if provided
            subcategory = None
            if subcategory_id:
                try:
                    subcategory = SubCategory.objects.get(id=subcategory_id)
                except SubCategory.DoesNotExist:
                    pass

            level_two_category = None
            if level_two_category_id:
                try:
                    level_two_category = LevelTwoCategory.objects.get(id=level_two_category_id)
                except LevelTwoCategory.DoesNotExist:
                    pass

            # Handle brand
            brand = None
            if brand_input:
                brand, _ = Brand.objects.get_or_create(title=brand_input)

            # Approval logic
            was_published = product.product_status == 'published'
            needs_approval = was_published

            if needs_approval:
                product.last_published_data = {
                    'title': product.title,
                    'description': product.description,
                    'specifications': product.specifications,
                    'vendor_price': str(product.vendor_price),
                    'old_price': str(product.old_price) if product.old_price else None,
                    'price': str(product.price),
                    'category_id': product.category_id,
                    'subcategory_id': product.subcategory_id,
                    'leveltwocategory_id': product.leveltwocategory_id,
                    'brand_id': product.brand_id,
                    'brand_name': product.brand.title if product.brand else None,
                    'size_category': product.size_category,
                    'snapshot_date': timezone.now().isoformat(),
                }
                product.is_edited_after_publish = True
                product.previous_status = 'published'
                product.edit_submitted_at = timezone.now()
                product.product_status = 'pending_edit_review'
            elif was_published:
                product.product_status = 'published'

            # Update product fields
            product.title = title
            product.category = category
            product.subcategory = subcategory
            product.leveltwocategory = level_two_category
            product.brand = brand
            product.description = description
            product.specifications = specifications
            product.vendor_price = vendor_price_float
            product.price = new_display_price
            product.old_price = old_price_float
            product.size_category = size_category
            product.stock_count = int(total_stock)
            product.in_stock = int(total_stock) > 0
            product.updated = timezone.now()

            # Handle main image
            if 'image' in request.FILES:
                product.image = request.FILES['image']

            product.save()

            # NEW: Handle color-size combinations
            if enable_combinations:
                # Delete removed combinations
                for combo_id in combo_delete_ids:
                    if combo_id:
                        try:
                            ProductColorSizeStock.objects.filter(id=int(combo_id), product=product).delete()
                        except:
                            pass
                
                # Update or create combinations
                for i in range(len(combo_color_ids)):
                    color_id = combo_color_ids[i]
                    size_id = combo_size_ids[i] if i < len(combo_size_ids) else None
                    stock = combo_stocks[i] if i < len(combo_stocks) else 0
                    
                    if color_id and size_id and int(stock) > 0:
                        try:
                            # Check if combination already exists
                            existing_combo = ProductColorSizeStock.objects.filter(
                                product=product,
                                color_id=int(color_id),
                                size_id=int(size_id)
                            ).first()
                            
                            if existing_combo:
                                existing_combo.stock = int(stock)
                                existing_combo.save()
                            else:
                                ProductColorSizeStock.objects.create(
                                    product=product,
                                    color_id=int(color_id),
                                    size_id=int(size_id),
                                    stock=int(stock)
                                )
                        except Exception as e:
                            print(f"Error saving combination: {e}")
                
                # Clear individual color and size relations since using combinations
                product.color.clear()
                product.size.clear()
            else:
                # Handle colors with stock (individual)
                if enable_colors and color_ids:
                    # Reset all color stock to 0
                    for color in product.color.all():
                        color.stock = 0
                        color.save()
                    
                    # Clear existing color relations
                    product.color.clear()
                    
                    # Add new colors with stock
                    for i, color_id in enumerate(color_ids):
                        if color_id and color_stocks[i]:
                            try:
                                color = ProductColor.objects.get(id=color_id)
                                color.stock = int(color_stocks[i])
                                color.save()
                                product.color.add(color)
                            except ProductColor.DoesNotExist:
                                pass
                else:
                    # No colors enabled, clear all color relations
                    for color in product.color.all():
                        color.stock = 0
                        color.save()
                    product.color.clear()

                # Handle sizes with stock (individual)
                if enable_sizes and size_ids:
                    # Reset all size stock to 0
                    for size_obj in product.size.all():
                        size_obj.stock = 0
                        size_obj.save()
                    
                    # Clear existing size relations
                    product.size.clear()
                    
                    # Add new sizes with stock
                    for i, size_id in enumerate(size_ids):
                        if size_id and size_stocks[i]:
                            try:
                                size_obj = ProductSize.objects.get(id=size_id)
                                size_obj.stock = int(size_stocks[i])
                                size_obj.save()
                                product.size.add(size_obj)
                            except ProductSize.DoesNotExist:
                                pass
                else:
                    # No sizes enabled, clear all size relations
                    for size_obj in product.size.all():
                        size_obj.stock = 0
                        size_obj.save()
                    product.size.clear()
                
                # Clear any existing combinations if using individual mode
                ProductColorSizeStock.objects.filter(product=product).delete()

            # Handle tags
            product.tag.clear()
            if tags_input.strip():
                tags_list = [tag.strip() for tag in tags_input.split(',') if tag.strip()]
                for tag in tags_list:
                    product.tag.add(tag)

            # Handle additional images
            for image in request.FILES.getlist('additional_images'):
                ProductImages.objects.create(product=product, images=image)

            if delete_images:
                for img_id in delete_images:
                    try:
                        ProductImages.objects.filter(id=int(img_id), product=product).delete()
                    except ValueError:
                        pass

            if needs_approval:
                messages.warning(request, f'📝 Product "{title}" updated and submitted for admin review.')
            else:
                messages.success(request, f'✅ Product "{title}" updated successfully!')

            return redirect('vendor_products')

        except Exception as e:
            import traceback
            traceback.print_exc()
            messages.error(request, f'Error: {str(e)}')
            return render(request, 'user/vendor_edit_products.html', locals())

    # GET request
    initial_data = {
        'title': product.title,
        'category': product.category.id if product.category else '',
        'subcategory': product.subcategory.id if product.subcategory else '',
        'level_two_category': product.leveltwocategory.id if product.leveltwocategory else '',
        'brand': product.brand.title if product.brand else '',
        'description': product.description,
        'specifications': product.specifications,
        'vendor_price': product.vendor_price,
        'old_price': product.old_price if product.old_price else '',
        'size_category': product.size_category,
        'product_status': product.product_status,
        'stock_count': product.stock_count,
        'tags': ','.join([tag.name for tag in product.tag.all()]),
    }
    
    return render(request, 'user/vendor_edit_products.html', {
        'vendor': vendor,
        'product': product,
        'categories': categories,
        'subcategories': subcategories,
        'level_two_categories': level_two_categories,
        'brands': brands,
        'colors': colors,
        'sizes': sizes,
        'existing_images': existing_images,
        'form_data': initial_data,
        'category_markups': CATEGORY_MARKUPS,
        'size_categories': SIZE_CATEGORIES,
        'was_published': was_published,
        'product_color_stock': product_color_stock,
        'product_size_stock': product_size_stock,
        'product_combinations': product_combinations,
        'has_combinations': has_combinations,
    })

# KEEP ONLY ONE VERSION OF THESE IMPORTS (remove duplicates)
from rest_framework import viewsets, status, filters, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import rest_framework
from rest_framework import renderers
import logging

# Import models and serializers - FIXED: Use custom User model
# from userauths.models import User  # âœ… CORRECT: Use your custom User model
# from django.contrib.auth import get_user_model
# User = get_user_model()

from core.models import (
    Product, ProductColor, ProductSize, ProductImages, Category, 
    SubCategory, LevelTwoCategory, Vendor, CartOrder, CartOrderItems,
    Address, Cart, Wishlist, Wallet, Transaction, Coupon, CouponEmail,
    ProductReview, Slider, Testimonial, Team, Advertisement, 
    SearchHistory, CompareProduct, Background, AboutSite, CurrencySwitch,
    Tags, ContactForm, NewsLetter, EmailTemplate, State, Lgas, Ward,
    ChatMessage, SaveCustomerCart, Brand
)
from .serializers import *

# ========== CUSTOM PAGINATION ==========
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

# ========== DASHBOARD & ANALYTICS APIs ==========
class DashboardAPI(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            today = timezone.now().date()
            thirty_days_ago = today - timedelta(days=30)
            
            data = {
                'total_users': User.objects.count(),
                'total_vendors': Vendor.objects.count(),
                'total_products': Product.objects.count(),
                'total_orders': CartOrder.objects.count(),
                'total_revenue': CartOrder.objects.filter(paid_status=True).aggregate(
                    Sum('price'))['price__sum'] or 0,
                'pending_orders': CartOrder.objects.filter(product_status='Placed').count(),
                'pending_vendors': Vendor.objects.filter(approval_status='pending').count(),
                'new_customers_today': User.objects.filter(date_joined__date=today).count(),
                'new_orders_today': CartOrder.objects.filter(order_date__date=today).count(),
                'revenue_today': CartOrder.objects.filter(
                    order_date__date=today, paid_status=True
                ).aggregate(Sum('price'))['price__sum'] or 0,
                'revenue_30_days': CartOrder.objects.filter(
                    order_date__date__gte=thirty_days_ago, paid_status=True
                ).aggregate(Sum('price'))['price__sum'] or 0,
            }
            return Response(data)
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"DashboardAPI error: {str(e)}")
            return Response(
                {'error': 'An error occurred while fetching dashboard data'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SalesAnalyticsAPI(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            days = int(request.GET.get('days', 30))
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=days)
            
            sales_data = []
            current_date = start_date
            
            while current_date <= end_date:
                daily_orders = CartOrder.objects.filter(
                    order_date__date=current_date, 
                    paid_status=True
                )
                total_sales = daily_orders.aggregate(total=Sum('price'))['total'] or 0
                order_count = daily_orders.count()
                avg_order_value = total_sales / order_count if order_count > 0 else 0
                
                sales_data.append({
                    'date': current_date,
                    'total_sales': float(total_sales),
                    'order_count': order_count,
                    'average_order_value': float(avg_order_value)
                })
                
                current_date += timedelta(days=1)
            
            return Response(sales_data)
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"SalesAnalyticsAPI error: {str(e)}")
            return Response(
                {'error': 'An error occurred while fetching analytics data'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ========== USER APIs ==========
class UserViewSet(viewsets.ModelViewSet):
    """
    User API endpoint - Admin only
    """
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CustomerProfileSerializer
        return UserSerializer
    
    @action(detail=True, methods=['get'])
    def orders(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
            orders = CartOrder.objects.filter(user=user).order_by('-order_date')
            page = self.paginate_queryset(orders)
            if page is not None:
                serializer = CartOrderSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = CartOrderSerializer(orders, many=True)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch user orders'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
            serializer = CustomerProfileSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch user profile'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ========== PRODUCT APIs ==========
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related(
        'category', 'vendor', 'brand', 'user'
    ).prefetch_related(
        'color', 'size', 'p_images', 'tag'
    ).order_by('-date')
    serializer_class = ProductSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'sku', 'category__title']
    filterset_fields = ['product_status', 'category', 'vendor', 'brand', 'featured', 'in_stock', 'promo']
    ordering_fields = ['price', 'date', 'average_rating']
    ordering = ['-date']
    
    renderer_classes = [rest_framework.renderers.JSONRenderer]
    
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        try:
            featured_products = self.get_queryset().filter(featured=True, product_status='published')
            page = self.paginate_queryset(featured_products)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = self.get_serializer(featured_products, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch featured products'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def on_sale(self, request):
        try:
            sale_products = self.get_queryset().filter(promo=True, product_status='published')
            page = self.paginate_queryset(sale_products)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = self.get_serializer(sale_products, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch sale products'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def similar(self, request, pk=None):
        try:
            product = self.get_object()
            similar_products = Product.objects.filter(
                category=product.category,
                product_status='published'
            ).exclude(pid=product.pid)[:12]
            serializer = self.get_serializer(similar_products, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch similar products'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ========== PRODUCT COLOR APIs ==========
class ProductColorViewSet(viewsets.ModelViewSet):
    queryset = ProductColor.objects.all().order_by('color_name')
    serializer_class = ProductColorSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['color_name']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

# ========== PRODUCT SIZE APIs ==========
class ProductSizeViewSet(viewsets.ModelViewSet):
    queryset = ProductSize.objects.all().order_by('size')
    serializer_class = ProductSizeSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

# ========== PRODUCT IMAGES APIs ==========
class ProductImagesViewSet(viewsets.ModelViewSet):
    queryset = ProductImages.objects.all().order_by('-date')
    serializer_class = ProductImagesSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

# ========== BRAND APIs ==========
class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all().order_by('brand')
    serializer_class = BrandSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['brand', 'title']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

# ========== CATEGORY APIs ==========
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('title')
    serializer_class = CategorySerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['title']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        try:
            category = self.get_object()
            products = Product.objects.filter(category=category, product_status='published')
            page = self.paginate_queryset(products)
            if page is not None:
                serializer = ProductSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = ProductSerializer(products, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch category products'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SubCategoryViewSet(viewsets.ModelViewSet):
    queryset = SubCategory.objects.all().order_by('title')
    serializer_class = SubCategorySerializer
    pagination_class = StandardResultsSetPagination
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

class LevelTwoCategoryViewSet(viewsets.ModelViewSet):
    queryset = LevelTwoCategory.objects.all().order_by('title')
    serializer_class = LevelTwoCategorySerializer
    pagination_class = StandardResultsSetPagination
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

# ========== VENDOR APIs ==========
class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all().order_by('-date')
    serializer_class = VendorSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'store_name', 'user__email', 'phone_number']
    filterset_fields = ['approval_status', 'category', 'verified']
    
    renderer_classes = [rest_framework.renderers.JSONRenderer]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return VendorDetailSerializer
        return VendorSerializer
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        try:
            pending_vendors = Vendor.objects.filter(approval_status='pending')
            page = self.paginate_queryset(pending_vendors)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = self.get_serializer(pending_vendors, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch pending vendors'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        try:
            vendor = self.get_object()
            vendor.approval_status = 'approved'
            vendor.approved_at = timezone.now()
            vendor.approved_by = request.user
            vendor.save()
            
            return Response({
                'success': True,
                'message': f'Vendor {vendor.name} has been approved.'
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to approve vendor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        try:
            vendor = self.get_object()
            vendor.approval_status = 'rejected'
            vendor.save()
            
            return Response({
                'success': True,
                'message': f'Vendor {vendor.name} has been rejected.'
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to reject vendor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        try:
            vendor = self.get_object()
            products = Product.objects.filter(vendor=vendor)
            page = self.paginate_queryset(products)
            if page is not None:
                serializer = ProductSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = ProductSerializer(products, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch vendor products'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def orders(self, request, pk=None):
        try:
            vendor = self.get_object()
            orders = CartOrderItems.objects.filter(vendor_id=vendor.vid)
            page = self.paginate_queryset(orders)
            if page is not None:
                serializer = CartOrderItemSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = CartOrderItemSerializer(orders, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch vendor orders'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ========== ORDER APIs ==========
class OrderViewSet(viewsets.ModelViewSet):
    queryset = CartOrder.objects.all().select_related('user').prefetch_related(
        'cartorderitems_set'
    ).order_by('-order_date')
    serializer_class = CartOrderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['oid', 'tracking_id', 'first_name', 'last_name', 'email_address']
    filterset_fields = ['product_status', 'paid_status', 'payment_method']
    
    renderer_classes = [rest_framework.renderers.JSONRenderer]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return CartOrder.objects.all().order_by('-order_date')
        return CartOrder.objects.filter(user=self.request.user).order_by('-order_date')
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        try:
            order = self.get_object()
            new_status = request.data.get('status')
            
            # Use CartOrder model's STATUS_CHOICE
            valid_statuses = [choice[0] for choice in CartOrder.STATUS_CHOICE]
            
            if new_status in valid_statuses:
                order.product_status = new_status
                order.save()
                
                return Response({
                    'success': True,
                    'message': f'Order status updated to {new_status}'
                })
            else:
                return Response({
                    'success': False,
                    'error': f'Invalid status. Valid statuses: {", ".join(valid_statuses)}'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to update order status'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        try:
            if request.user.is_staff:
                queryset = CartOrder.objects.all()
            else:
                queryset = CartOrder.objects.filter(user=request.user)
                
            total_orders = queryset.count()
            paid_orders = queryset.filter(paid_status=True).count()
            total_revenue = queryset.filter(paid_status=True).aggregate(
                total=Sum('price'))['total'] or 0
            
            status_counts = queryset.values('product_status').annotate(
                count=Count('id')
            )
            
            return Response({
                'total_orders': total_orders,
                'paid_orders': paid_orders,
                'total_revenue': float(total_revenue),
                'status_breakdown': list(status_counts)
            })
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch order statistics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ========== CART & WISHLIST APIs ==========
class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user).select_related('product')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def total(self, request):
        try:
            cart_items = self.get_queryset()
            total_items = cart_items.count()
            total_price = 0
            
            for item in cart_items:
                try:
                    if hasattr(item, 'total_price') and callable(getattr(item, 'total_price')):
                        item_total = item.total_price()
                    else:
                        # Fallback calculation
                        item_total = float(item.product.price) * float(item.qty) if item.product and item.qty else 0
                    total_price += item_total
                except (AttributeError, TypeError, ValueError):
                    continue
            
            return Response({
                'total_items': total_items,
                'total_price': float(total_price)
            })
        except Exception as e:
            return Response(
                {'error': 'Failed to calculate cart total'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        try:
            cart_items = self.get_queryset()
            count = cart_items.count()
            cart_items.delete()
            
            return Response({
                'success': True,
                'message': f'Cleared {count} items from cart'
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to clear cart'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).select_related('product')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        try:
            count = self.get_queryset().count()
            return Response({'count': count})
        except Exception as e:
            return Response(
                {'error': 'Failed to get wishlist count'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ========== WALLET & TRANSACTION APIs ==========
class WalletViewSet(viewsets.ModelViewSet):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Wallet.objects.all().select_related('user')
        return Wallet.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_balance(self, request, pk=None):
        try:
            wallet = self.get_object()
            amount = Decimal(str(request.data.get('amount', 0)))
            description = request.data.get('description', 'Manual balance addition')
            
            if amount <= 0:
                return Response({'error': 'Amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create transaction
            transaction = Transaction.objects.create(
                wallet=wallet,
                amount=amount,
                transaction_type='credit',
                status='success',
                description=description
            )
            
            # Update wallet balance
            wallet.balance += amount
            wallet.save()
            
            transaction.balance_after = wallet.balance
            transaction.save()
            
            return Response({
                'success': True,
                'new_balance': float(wallet.balance),
                'transaction': TransactionSerializer(transaction).data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to add balance'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        try:
            wallet = self.get_object()
            transactions = Transaction.objects.filter(wallet=wallet).order_by('-created_at')
            
            page = self.paginate_queryset(transactions)
            if page is not None:
                serializer = TransactionSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = TransactionSerializer(transactions, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch transactions'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['transaction_type', 'status']
    
    renderer_classes = [rest_framework.renderers.JSONRenderer]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Transaction.objects.all().select_related('wallet__user')
        return Transaction.objects.filter(wallet__user=self.request.user).select_related('wallet')

# ========== REVIEW & RATING APIs ==========
class ProductReviewViewSet(viewsets.ModelViewSet):
    queryset = ProductReview.objects.all().select_related('user', 'product').order_by('-date')
    serializer_class = ProductReviewSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['review', 'product__title', 'user__username']
    filterset_fields = ['rating', 'product']
    
    renderer_classes = [rest_framework.renderers.JSONRenderer]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def product_stats(self, request):
        try:
            product_id = request.GET.get('product_id')
            if not product_id:
                return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            product = Product.objects.get(pid=product_id)
            reviews = ProductReview.objects.filter(product=product)
            
            total_reviews = reviews.count()
            average_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or 0
            
            rating_distribution = reviews.values('rating').annotate(
                count=Count('id')
            ).order_by('rating')
            
            return Response({
                'total_reviews': total_reviews,
                'average_rating': round(float(average_rating), 1),
                'rating_distribution': list(rating_distribution)
            })
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch product review statistics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FlashSaleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FlashSaleSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active', 'featured']
    search_fields = ['title', 'description']

    def get_queryset(self):
        queryset = FlashSale.objects.prefetch_related('flash_sale_products__product').order_by('-created_at')
        active = self.request.query_params.get('active')
        if active is None:
            queryset = queryset.filter(is_active=True)
        else:
            active_bool = str(active).lower() in ['1', 'true', 'yes']
            queryset = queryset.filter(is_active=active_bool)
        return queryset


class FlashSaleProductViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FlashSaleProductSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['flash_sale', 'product']

    def get_queryset(self):
        queryset = FlashSaleProduct.objects.select_related('flash_sale', 'product').order_by('-added_at')
        active = self.request.query_params.get('active')
        if active is None:
            queryset = queryset.filter(flash_sale__is_active=True)
        else:
            active_bool = str(active).lower() in ['1', 'true', 'yes']
            queryset = queryset.filter(flash_sale__is_active=active_bool)
        return queryset

class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all().prefetch_related('product').order_by('-id')
    serializer_class = CouponSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['coupon_code', 'discount']
    filterset_fields = ['active']
    
    renderer_classes = [rest_framework.renderers.JSONRenderer]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CouponDetailSerializer
        return CouponSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve", "validate"]:
            permission_classes = [AllowAny]   # or [IsAuthenticated] if you want login-only
        elif self.action in ["use"]:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def validate(self, request):
        serializer = CouponValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
    
        coupon_code = serializer.validated_data["coupon_code"].strip()
        email = serializer.validated_data.get("email")
        user = request.user if request.user.is_authenticated else None
    
        try:
            coupon = Coupon.objects.get(coupon_code__iexact=coupon_code, active=True)
        except Coupon.DoesNotExist:
            return Response(
                {"valid": False, "message": "Invalid or expired coupon code."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Coupon.MultipleObjectsReturned:
            coupon = Coupon.objects.filter(coupon_code__iexact=coupon_code, active=True).order_by("-id").first()
    
        now = timezone.now()
        if coupon.expiry_date and now > coupon.expiry_date:
            return Response({"valid": False, "message": "This coupon has expired."}, status=400)
    
        if coupon.usage_limit is not None and coupon.usage_count >= coupon.usage_limit:
            return Response({"valid": False, "message": "This coupon has reached its usage limit."}, status=400)
    
        if user and coupon.specific_users.exists() and not coupon.specific_users.filter(id=user.id).exists():
            return Response({"valid": False, "message": "This coupon is not valid for your account."}, status=400)
    
        if email and CouponEmail.objects.filter(coupon=coupon, user_email=email).exists():
            return Response({"valid": False, "message": "This coupon has already been used with this email."}, status=400)
    
        return Response(
            {
                "valid": True,
                "coupon": CouponDetailSerializer(coupon).data,
                "message": "Coupon is valid.",
            },
            status=200,
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def use(self, request, pk=None):
        try:
            coupon = self.get_object()
            email = request.data.get("email", request.user.email)
    
            now = timezone.now()
    
            if not coupon.active:
                return Response(
                    {"success": False, "message": "Coupon is inactive."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
    
            if coupon.expiry_date and now > coupon.expiry_date:
                return Response(
                    {"success": False, "message": "Coupon has expired."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
    
            if coupon.usage_limit is not None and coupon.usage_count >= coupon.usage_limit:
                return Response(
                    {"success": False, "message": "Coupon usage limit reached."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
    
            if coupon.specific_users.exists() and not coupon.specific_users.filter(id=request.user.id).exists():
                return Response(
                    {"success": False, "message": "This coupon is not valid for your account."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
    
            if email and CouponEmail.objects.filter(coupon=coupon, user_email=email).exists():
                return Response(
                    {"success": False, "message": "This coupon has already been used with this email."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
    
            # Mark usage
            Coupon.objects.filter(id=coupon.id).update(usage_count=F("usage_count") + 1)
    
            if email:
                CouponEmail.objects.get_or_create(coupon=coupon, user_email=email)
    
            # refresh coupon object for latest usage_count if needed
            coupon.refresh_from_db(fields=["usage_count"])
    
            return Response(
                {
                    "success": True,
                    "message": "Coupon has been successfully applied.",
                    "discount": coupon.discount,
                    "discount_type": coupon.discount_type,
                    "coupon_code": coupon.coupon_code,
                    "usage_count": coupon.usage_count,
                },
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"success": False, "error": "Failed to use coupon"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
# ========== ADDRESS APIs ==========
class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user, delete=False)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        try:
            # Remove default status from all addresses
            Address.objects.filter(user=request.user).update(status='No')
            
            # Set this address as default
            address = self.get_object()
            address.status = 'Yes'
            address.save()
            
            return Response({'success': True, 'message': 'Default address updated'})
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to set default address'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ========== CONTENT MANAGEMENT APIs ==========
class SliderViewSet(viewsets.ModelViewSet):
    queryset = Slider.objects.all().order_by('-date')
    serializer_class = SliderSerializer
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

class TestimonialViewSet(viewsets.ModelViewSet):
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination

class AdvertisementViewSet(viewsets.ModelViewSet):
    queryset = Advertisement.objects.all()
    serializer_class = AdvertisementSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination

class BackgroundViewSet(viewsets.ModelViewSet):
    queryset = Background.objects.all().order_by('-date')
    serializer_class = BackgroundSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination

class AboutSiteViewSet(viewsets.ModelViewSet):
    queryset = AboutSite.objects.all().order_by('-date')
    serializer_class = AboutSiteSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination

class CurrencySwitchViewSet(viewsets.ModelViewSet):
    queryset = CurrencySwitch.objects.all()
    serializer_class = CurrencySwitchSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination

# ========== OTHER MODEL APIs ==========
class SearchHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = SearchHistorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return SearchHistory.objects.filter(user=self.request.user).order_by('-date')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CompareProductViewSet(viewsets.ModelViewSet):
    serializer_class = CompareProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CompareProduct.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ContactFormViewSet(viewsets.ModelViewSet):
    queryset = ContactForm.objects.all().order_by('-id')
    serializer_class = ContactFormSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

class NewsLetterViewSet(viewsets.ModelViewSet):
    queryset = NewsLetter.objects.all().order_by('-date')
    serializer_class = NewsLetterSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination

class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all().order_by('name')
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination

class StateViewSet(viewsets.ModelViewSet):
    queryset = State.objects.all().order_by('name')
    serializer_class = StateSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

class LgasViewSet(viewsets.ModelViewSet):
    queryset = Lgas.objects.all().order_by('name')
    serializer_class = LgasSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

class WardViewSet(viewsets.ModelViewSet):
    queryset = Ward.objects.all().order_by('name')
    serializer_class = WardSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return ChatMessage.objects.all().order_by('-timestamp')
        return ChatMessage.objects.filter(vendor__user=self.request.user).order_by('-timestamp')

class SaveCustomerCartViewSet(viewsets.ModelViewSet):
    serializer_class = SaveCustomerCartSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SaveCustomerCart.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# ========== SEARCH API ==========
class SearchAPI(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            query = request.GET.get('q', '')
            if not query or len(query) < 2:
                return Response({'results': {}})
            
            # Search products
            products = Product.objects.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(category__title__icontains=query) |
                Q(tag__name__icontains=query),
                product_status='published'
            ).distinct()[:10]
            
            # Search categories
            categories = Category.objects.filter(title__icontains=query)[:5]
            
            # Save search history if user is authenticated
            if request.user.is_authenticated:
                SearchHistory.objects.create(user=request.user, search_text=query)
            
            results = {
                'products': ProductSerializer(products, many=True).data,
                'categories': CategorySerializer(categories, many=True).data,
                'query': query,
                'products_count': products.count(),
                'categories_count': categories.count(),
            }
            
            return Response(results)
        except Exception as e:
            return Response(
                {'error': 'Failed to perform search'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ========== PUBLIC APIs (No Authentication Required) ==========
class PublicProductListAPI(generics.ListAPIView):
    queryset = Product.objects.filter(product_status='published').select_related(
        'category', 'vendor', 'brand'
    ).prefetch_related('color', 'size', 'p_images').order_by('-date')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'category__title']
    filterset_fields = ['category', 'vendor', 'brand', 'featured', 'in_stock', 'promo']
    ordering_fields = ['price', 'date', 'average_rating']
    ordering = ['-date']

class PublicCategoryListAPI(generics.ListAPIView):
    queryset = Category.objects.all().order_by('title')
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

class PublicVendorListAPI(generics.ListAPIView):
    queryset = Vendor.objects.filter(approval_status='approved').order_by('name')
    serializer_class = VendorSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

# ========== MOBILE AUTH APIs ==========
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MobileTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['is_vendor'] = hasattr(user, 'vendor')

        return token

class MobileTokenObtainPairView(TokenObtainPairView):
    serializer_class = MobileTokenObtainPairSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def mobile_register(request):
    try:
        from django.contrib.auth.hashers import make_password
        
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        
        if not all([username, email, password]):
            return Response({
                'success': False,
                'error': 'Username, email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({
                'success': False,
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({
                'success': False,
                'error': 'Email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create(
            username=username,
            email=email,
            password=make_password(password),
            first_name=first_name,
            last_name=last_name
        )
        
        # Create wallet for user
        Wallet.objects.create(user=user)
        
        return Response({
            'success': True,
            'message': 'User registered successfully',
            'user_id': user.id
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
        
        

def request_return(request, order_id):
    """
    View for customers to request a return with images
    """
    from admin_dashboard.signals import notify_return_request
    
    try:
        order = CartOrder.objects.get(id=order_id, user=request.user)
        
        # Check if order is eligible for return
        if not order.can_return:
            messages.error(request, "This order is not eligible for return.")
            return redirect('order-details', id=order_id)
        
        # Check if return already exists
        if order.return_reason_category: 
            messages.error(request, "You have already submitted a return request for this order.")
            return redirect('order-details', id=order_id)
        
        if request.method == 'POST':
            # Process return request
            return_reason = request.POST.get('return_reason')
            return_description = request.POST.get('return_description')
            return_images = request.FILES.getlist('return_images')
            
            if not return_reason:
                messages.error(request, "Please select a return reason.")
            elif len(return_images) < 2:
                messages.error(request, "Please upload 2 images of the product.")
            else:
                # Update order with return request
                order.return_reason_category = return_reason
                order.return_reason = return_description or f"Return requested: {dict(order.RETURN_REASON_CHOICES).get(return_reason, return_reason)}"
                order.product_status = "Return Requested"  # Update status
                order.save()
                
                notify_return_request(order)

                # Save return images
                for image in return_images[:2]:  # Limit to 2 images
                    ReturnImage.objects.create(
                        return_request=order,  # This should match your ForeignKey field name
                        image=image
                    )
                
                messages.success(request, "Return request submitted successfully with images! We'll review your request and contact you soon.")
                return redirect('order-details', id=order_id)
        
        context = {
            'order': order,
            'return_reasons': order.RETURN_REASON_CHOICES,
        }
        return render(request, 'core/request_return.html', context)
        
    except CartOrder.DoesNotExist:
        messages.error(request, "Order not found.")
        return redirect('orders')
    except Exception as e:
        messages.error(request, f"An error occurred: {str(e)}")
        return redirect('order-details', id=order_id)
        
        
# Use __name__ to automatically name the logger after the current module
logger = logging.getLogger(__name__)

@vendor_required
def vendor_delete_product(request, pid):
    """
    Delete product with order check - vendors cannot delete products that are currently on order
    Creates deletion record for admin tracking
    """
    try:
        vendor = Vendor.objects.get(user=request.user)
        product = Product.objects.get(pid=pid, vendor=vendor, user=request.user)
        
        # ✅ CHECK IF PRODUCT IS CURRENTLY ON ORDER (NOT YET DELIVERED)
        active_orders = CartOrderItems.objects.filter(
            vendor_id=vendor.vid,
            item=product.title,
            product_status__in=['Placed', 'Confirmed', 'Processing', 'Shipped']  # Not delivered yet
        ).exclude(
            product_status__in=['Delivered', 'Canceled', 'Refunded']  # Exclude completed/cancelled orders
        )
        
        if active_orders.exists():
            # Product is currently on order - cannot delete
            order_count = active_orders.count()
            order_numbers = ', '.join([f"#{item.invoice_no}" for item in active_orders[:3]])
            
            if order_count > 3:
                order_numbers += f" and {order_count - 3} more"
            
            messages.error(
                request, 
                f"❌ Cannot delete '{product.title}' because it is currently on order. "
                f"Orders: {order_numbers}. Please wait until all orders are delivered before deleting this product."
            )
            return redirect('vendor_products')
        
        # ✅ NO ACTIVE ORDERS - SAFE TO DELETE
        # Create deletion record for admin tracking
        deletion_reason = request.POST.get('deletion_reason', 'vendor_request')
        deletion_notes = request.POST.get('deletion_notes', '')
        
        
        # Create deletion record
        try:
            deletion_record = DeletedProduct.create_deletion_record(
                product=product,
                deleted_by=request.user,
                reason=deletion_reason,
                notes=deletion_notes or f'Vendor requested deletion via dashboard'
            )
            # logger.info("deletion record was successful")
        except Exception as e:
            logger.error("Error creating deletion record:", exc_info=True)
        
        # Mark product as disabled
        product.in_stock = False
        product.stock_count = 0
        product.product_status = "disabled"
        product.save()
        
        # Create admin notification
        # AdminNotification.objects.create(
        #     notification_type='edited_product',
        #     title='Product Deleted by Vendor',
        #     message=f'Vendor "{vendor.name}" deleted product "{product.title}"',
        #     vendor=vendor,
        #     product=product,
        #     action_url=f'/ng/admin/deleted-products/{deletion_record.id}/'
        # )
        
        messages.success(
            request, 
            f"'{product.title}' has been deleted successfully!"
            f"All orders for this product have been delivered."
        )
        return redirect('vendor_products')
        
    except Product.DoesNotExist:
        messages.error(request, "Product not found.")
        return redirect('vendor_products')
    except Exception as e:
        print(f"ERROR: {str(e)}")
        messages.error(request, f"Error deleting product: {str(e)}")
        return redirect('vendor_products')
        

def handle_failed_payment(request):
    """Handle failed payment attempts and notify admin"""
    if request.method == 'POST':
        try:
            customer_name = request.POST.get('customer_name', 'Unknown Customer')
            customer_email = request.POST.get('customer_email', 'Unknown Email')
            attempted_amount = request.POST.get('attempted_amount', '0')
            error_message = request.POST.get('error_message', 'Unknown error')
            payment_gateway = request.POST.get('payment_gateway', 'Unknown Gateway')
            
            # Log the failed payment attempt
            logger.warning(f"Failed payment attempt: {customer_email} attempted {attempted_amount} via {payment_gateway}. Error: {error_message}")
            
            # Send admin notification
            send_admin_failed_payment_notification(
                customer_name, customer_email, attempted_amount, error_message, payment_gateway
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Failed payment recorded'
            })
            
        except Exception as e:
            logger.error(f"Error handling failed payment: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': 'Failed to process payment error'
            }, status=400)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


def send_admin_failed_payment_notification(customer_name, customer_email, attempted_amount, error_message, payment_gateway):
    """Send failed payment notification to admin"""
    try:
        admin_users = User.objects.filter(is_superuser=True, is_active=True)
        admin_emails = [admin.email for admin in admin_users if admin.email]
        
        if admin_emails:
            context = {
                'customer_name': customer_name,
                'customer_email': customer_email,
                'attempted_amount': attempted_amount,
                'error_message': error_message,
                'attempt_date': timezone.now(),
                'payment_gateway': payment_gateway,
            }
            
            email_template = render_to_string('emails/failed_payment.html', context)
            subject = "Failed Payment Attempt Detected"
            
            email = EmailMessage(
                subject=subject,
                body=email_template,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=admin_emails,
            )
            email.content_subtype = "html"
            email.send()
            
            logger.info(f"Failed payment notification sent to admin for {customer_email}")
            
    except Exception as e:
        logger.error(f"Failed to send failed payment email to admin: {str(e)}")
        


@vendor_required
def update_order_status(request, order_item_id):
    """Allow vendors to update order status and notify admin if rejected"""
    try:
        vendor = Vendor.objects.get(user=request.user)
        order_item = CartOrderItems.objects.get(
            id=order_item_id, 
            vendor_id=vendor.vid
        )
        
        if request.method == 'POST':
            new_status = request.POST.get('status')
            rejection_reason = request.POST.get('rejection_reason', '')
            
            # Validate status change
            valid_statuses = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
            if new_status not in valid_statuses:
                messages.error(request, "Invalid status.")
                return redirect('vendor_orders_details', vid=vendor.vid, unique_id=order_item.unique_id)
            
            # Update order item status
            old_status = order_item.product_status
            order_item.product_status = new_status
            order_item.save()
            
            # Update main order status if all items have same status
            update_main_order_status(order_item.order)
            
            # If vendor rejected order, notify admin
            if new_status == 'Cancelled' and rejection_reason:
                send_admin_vendor_rejection_notification(order_item, vendor, rejection_reason)
                messages.warning(request, f"Order rejected. Admin has been notified.")
            else:
                messages.success(request, f"Order status updated to {new_status}.")
            
            return redirect('vendor_orders_details', vid=vendor.vid, unique_id=order_item.unique_id)
            
    except Vendor.DoesNotExist:
        messages.error(request, "Vendor profile not found.")
        return redirect('vendor_dashboard')
    except CartOrderItems.DoesNotExist:
        messages.error(request, "Order item not found.")
        return redirect('vendor_orders')
    except Exception as e:
        logger.error(f"Error updating order status: {str(e)}")
        messages.error(request, "Error updating order status.")
        return redirect('vendor_orders')


def update_main_order_status(order):
    """Update the main order status based on all order items"""
    try:
        order_items = CartOrderItems.objects.filter(order=order)
        
        # If all items have same status, update main order
        statuses = set(item.product_status for item in order_items)
        if len(statuses) == 1:
            order.product_status = statuses.pop()
            order.save()
    except Exception as e:
        logger.error(f"Error updating main order status: {str(e)}")


def send_admin_vendor_rejection_notification(order_item, vendor, rejection_reason):
    """Send vendor rejection notification to admin"""
    try:
        admin_users = User.objects.filter(is_superuser=True, is_active=True)
        admin_emails = [admin.email for admin in admin_users if admin.email]
        
        if admin_emails:
            context = {
                'order': order_item.order,
                'vendor_name': vendor.name,
                'product_name': order_item.item,
                'reason': rejection_reason,
                'rejection_date': timezone.now(),
                'order_item': order_item,
            }
            
            email_template = render_to_string('emails/vendor_rejects.html', context)
            subject = f"Vendor Rejected Order #{order_item.order.id}"
            
            email = EmailMessage(
                subject=subject,
                body=email_template,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=admin_emails,
            )
            email.content_subtype = "html"
            email.send()
            
            logger.info(f"Vendor rejection notification sent to admin for order #{order_item.order.id}")
            
    except Exception as e:
        logger.error(f"Failed to send vendor rejection email to admin: {str(e)}")
        
        

# ========== VENDOR ORDER REJECTION VIEWS ==========
from django.db import transaction
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.http import JsonResponse
import json
from decimal import Decimal

# MODELS NEEDED - Add these imports and models at the top if not present
from core.models import OrderRejection, Notification, AdminWallet 


@vendor_required
def vendor_order_reject(request, unique_id):
    """
    SIMPLIFIED: View for vendors to reject an order item
    """
    try:
        vendor = Vendor.objects.get(user=request.user)
        order_item = CartOrderItems.objects.get(unique_id=unique_id, vendor_id=vendor.vid)
        
        # Check if order can be rejected
        if order_item.product_status not in ['Placed', 'Confirmed']:
            messages.error(request, f"This order is {order_item.product_status} and cannot be rejected.")
            return redirect('vendor_orders_details', vid=vendor.vid, unique_id=unique_id)
        
        if request.method == 'POST':
            reason = request.POST.get('rejection_reason', '')
            details = request.POST.get('rejection_details', '')
            
            if not reason:
                messages.error(request, "Please select a reason for rejection.")
                return redirect('vendor_orders_details', vid=vendor.vid, unique_id=unique_id)
            
            # Calculate the amount to move to admin wallet
            order_total = order_item.price * order_item.qty
            
            # Try to get the product to calculate commission
            try:
                product = Product.objects.filter(
                    title=order_item.item,
                    vendor=vendor
                ).first()
                
                if product:
                    # Calculate commission rate
                    commission_rate = get_commission_rate(product.category)
                    commission_amount = (order_total * commission_rate) / Decimal('100.00')
                    
                    # Net amount to move to admin wallet (vendor price - commission)
                    net_refund_amount = order_total - commission_amount
                    
                    # Move vendor's revenue to admin wallet for refund
                    admin_wallet = AdminWallet.get_wallet()
                    admin_wallet.add_fund(
                        amount=net_refund_amount,
                        vendor=vendor,
                        order_item=order_item,
                        transaction_type='refund_hold',
                        description=f"Refund hold for {order_item.item} - Order {order_item.oid}"
                    )
                    
                    print(f"DEBUG: Moved ₦{net_refund_amount} to admin wallet for refund of {order_item.item}")
                    
            except Exception as e:
                print(f"Error processing commission for refund: {str(e)}")
            
            # UPDATE: Use 'Canceled' instead of 'Rejected'
            order_item.product_status = 'Canceled'
            
            # Save rejection reason separately
            order_item.rejection_reason = f"Reason: {reason}\nDetails: {details}"
            
            # Mark as cancellation processed
            order_item.cancellation_processed = True  # This is important!
            
            # ALSO CREATE ORDER REJECTION RECORD FOR ADMIN DASHBOARD
            OrderRejection.objects.create(
                order_item=order_item,
                vendor=vendor,
                reason='other',
                description=f"Vendor rejection. Reason: {reason}. Details: {details}",
                is_approved=False
            )
            
            # Restock if requested
            if request.POST.get('restock_item') == 'on':
                try:
                    product = Product.objects.get(title=order_item.item, vendor=vendor)
                    product.stock_count = product.stock_count + order_item.qty
                    product.save()
                except Product.DoesNotExist:
                    pass
            
            order_item.save()
            
            # Send notification to admin
            from django.contrib.auth.models import User
            admin_users = User.objects.filter(is_staff=True)
            
            for admin_user in admin_users:
                Notification.objects.create(
                    user=admin_user,
                    notification_type='order_rejected',
                    title=f'Order Item Cancelled by Vendor',
                    message=f'Vendor {vendor.name} cancelled order item #{order_item.unique_id}. '
                            f'Order: #{order_item.order.oid}, Item: {order_item.item}. '
                            f'Amount: ₦{order_total}. '
                            f'Reason: {reason}',
                    order=order_item.order,
                    order_item=order_item
                )
            
            # Notify customer if requested
            if request.POST.get('notify_customer') == 'on':
                email_sent = send_cancellation_email_to_customer(order_item, reason, details)
                if email_sent:
                    messages.info(request, "Customer has been notified via email.")
                else:
                    messages.warning(request, "Customer notification email failed to send.")
            
            messages.success(request, "Order cancelled successfully! Admin has been notified and funds moved to admin wallet.")
            return redirect('vendor_orders_details', vid=vendor.vid, unique_id=unique_id)
        
        else:
            # GET request - redirect to details page with modal
            messages.info(request, "Please use the cancellation form on the order details page.")
            return redirect('vendor_orders_details', vid=vendor.vid, unique_id=unique_id)
    
    except Vendor.DoesNotExist:
        messages.error(request, "Vendor profile not found.")
        return redirect('vendor_orders')
    except CartOrderItems.DoesNotExist:
        messages.error(request, "Order item not found.")
        return redirect('vendor_orders')
    except Exception as e:
        print(f"Error in vendor_order_reject: {str(e)}")
        messages.error(request, f"An error occurred: {str(e)}")
        return redirect('vendor_orders')

def send_cancellation_email_to_customer(order_item, reason, details):
    """
    Send cancellation email to customer with proper error handling
    """
    try:
        customer_email = order_item.order.user.email
        if not customer_email:
            print(f"No email found for customer {order_item.order.user.username}")
            return False
        
        # Create a proper email message
        subject = f'Order #{order_item.invoice_no} Cancelled by Vendor'
        
        # Create HTML email content
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Order Item Cancellation Notification</h2>
            <p>Dear {order_item.order.user.first_name or 'Customer'},</p>
            
            <p>We regret to inform you that your order item has been cancelled by the vendor.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
                <strong>Order Details:</strong><br>
                Order #: {order_item.invoice_no}<br>
                Item: {order_item.item}<br>
                Quantity: {order_item.qty}<br>
                Price: ₦{order_item.price:,.2f}<br>
                Vendor: {order_item.vendor}<br>
                <br>
                <strong>Cancellation Reason:</strong> {reason}<br>
                <strong>Additional Details:</strong> {details or 'No additional details provided'}
            </div>
            
            <p>If you have any questions or concerns, please contact our customer support.</p>
            
            <p>We apologize for any inconvenience caused.</p>
            
            <hr>
            <p style="color: #666; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
            </p>
        </body>
        </html>
        """
        
        # Create plain text version as fallback
        text_content = f"""
        Order #{order_item.invoice_no} Cancelled by Vendor
        
        Dear {order_item.order.user.first_name or 'Customer'},
        
        We regret to inform you that your order item has been cancelled by the vendor.
        
        Order Details:
        - Order #: {order_item.invoice_no}
        - Item: {order_item.item}
        - Quantity: {order_item.qty}
        - Price: ₦{order_item.price:,.2f}
        - Vendor: {order_item.vendor}
        
        Cancellation Reason: {reason}
        Additional Details: {details or 'No additional details provided'}
        
        If you have any questions or concerns, please contact our customer support.
        
        We apologize for any inconvenience caused.
        
        ---
        This is an automated message. Please do not reply to this email.
        """
        
        email = EmailMessage(
            subject=subject,
            body=html_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[customer_email],
        )
        email.content_subtype = "html"  # This sets the content type to HTML
        
        # Add plain text alternative
        email.alternatives = [(text_content, 'text/plain')]
        
        # Try to send email
        email_sent = email.send(fail_silently=False)  # Set to False to see errors
        
        if email_sent:
            print(f"Cancellation email sent to {customer_email}")
            return True
        else:
            print(f"Email send() returned 0 - no email sent to {customer_email}")
            return False
            
    except Exception as e:
        print(f"ERROR sending cancellation email: {str(e)}")
        # Log the full traceback
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return False


@login_required
def admin_rejection_review(request):
    """Admin view to review vendor rejections"""
    if not request.user.is_staff:
        messages.error(request, "Access denied.")
        return redirect('home')
    
    # Simple list of rejected orders
    rejected_orders = CartOrderItems.objects.filter(product_status='Rejected').select_related(
        'order', 'order__user'
    ).order_by('-order_date')
    
    context = {
        'rejected_orders': rejected_orders,
    }
    return render(request, 'admin/rejection_review.html', context)


@vendor_required
def vendor_order_hold(request, unique_id):
    """
    Simple order hold view
    """
    try:
        vendor = Vendor.objects.get(user=request.user)
        order_item = CartOrderItems.objects.get(unique_id=unique_id, vendor_id=vendor.vid)
        
        if order_item.product_status not in ['Placed', 'Confirmed']:
            messages.error(request, f"Cannot put {order_item.product_status} order on hold.")
            return redirect('vendor_orders_details', vid=vendor.vid, unique_id=unique_id)
        
        if request.method == 'POST':
            reason = request.POST.get('hold_reason', '')
            notes = request.POST.get('hold_notes', '')
            
            # Update status to 'On Hold'
            order_item.product_status = 'On Hold'
            order_item.vendor_notes = f"On Hold: {reason}\nNotes: {notes}"
            order_item.save()
            
            messages.success(request, "Order placed on hold successfully!")
            return redirect('vendor_orders_details', vid=vendor.vid, unique_id=unique_id)
        
        else:
            messages.info(request, "Please use the hold form.")
            return redirect('vendor_orders_details', vid=vendor.vid, unique_id=unique_id)
    
    except Exception as e:
        print(f"Error in vendor_order_hold: {str(e)}")
        messages.error(request, f"An error occurred: {str(e)}")
        return redirect('vendor_orders')


@vendor_required
def vendor_mark_order_seen(request, unique_id):
    """
    Mark order as seen by vendor (AJAX endpoint)
    """
    try:
        vendor = Vendor.objects.get(user=request.user)
        order_item = CartOrderItems.objects.get(unique_id=unique_id, vendor_id=vendor.vid)
        
        order_item.vendor_seen = True
        order_item.seen_at = timezone.now()
        order_item.save()
        
        return JsonResponse({'success': True, 'message': 'Order marked as seen'})
    
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@vendor_required
def vendor_restock_item(request, unique_id):
    """
    Restock item after rejection
    """
    try:
        vendor = Vendor.objects.get(user=request.user)
        order_item = CartOrderItems.objects.get(unique_id=unique_id, vendor_id=vendor.vid)
        
        if order_item.product_status != 'Rejected':
            messages.error(request, "Only rejected items can be restocked.")
            return redirect('vendor_orders_details', vid=vendor.vid, unique_id=unique_id)
        
        # Find the product and restock
        try:
            product = Product.objects.get(title=order_item.item, vendor=vendor)
            product.stock_count = product.stock_count + order_item.qty
            product.in_stock = True
            product.save()
            
            messages.success(request, f"Restocked {order_item.qty} units of {product.title}")
        except Product.DoesNotExist:
            messages.warning(request, "Original product not found for restocking.")
        
        return redirect('vendor_orders_details', vid=vendor.vid, unique_id=unique_id)
    
    except Exception as e:
        print(f"Error in vendor_restock_item: {str(e)}")
        messages.error(request, f"An error occurred: {str(e)}")
        return redirect('vendor_orders')


# AJAX endpoints for the template
@vendor_required
def vendor_update_order_status_ajax(request):
    """
    AJAX endpoint for updating order status from the details page
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            unique_id = data.get('unique_id')
            new_status = data.get('status')
            tracking = data.get('tracking_number', '')
            carrier = data.get('shipping_carrier', '')
            
            vendor = Vendor.objects.get(user=request.user)
            order_item = CartOrderItems.objects.get(unique_id=unique_id, vendor_id=vendor.vid)
            
            # Validate status transition
            valid_statuses = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Canceled', 'On Hold']
            if new_status not in valid_statuses:
                return JsonResponse({'success': False, 'error': 'Invalid status'})
            
            # Update order item
            order_item.product_status = new_status
            
            if new_status == 'Shipped':
                order_item.tracking_number = tracking
                order_item.shipping_carrier = carrier
            
            order_item.save()
            
            # Update main order status if needed
            update_main_order_status(order_item.order)
            
            return JsonResponse({
                'success': True, 
                'message': f'Order status updated to {new_status}',
                'new_status': new_status
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})


def update_main_order_status(order):
    """
    Helper function to update main order status based on order items
    """
    try:
        items = CartOrderItems.objects.filter(order=order)
        
        # Check if all items have the same status
        statuses = [item.product_status for item in items]
        if len(set(statuses)) == 1:
            order.product_status = statuses[0]
            order.save()
    except Exception as e:
        print(f"Error updating main order status: {str(e)}")
        
        

from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

def send_low_stock_alert(product):
    """
    Send low stock alert to vendor when product stock is below threshold (9)
    """
    from admin_dashboard.signals import check_and_notify_stock
    try:
        vendor = product.vendor
        if not vendor or not vendor.user.email:
            logger.warning(f"No vendor or email found for product {product.id}")
            return False
        
        # Get other low stock products for this vendor
        low_stock_products = Product.objects.filter(
            vendor=vendor,
            stock_managed=True,
            stock_count__lt=10,
            stock_count__gt=0
        ).exclude(id=product.id).order_by('stock_count')[:5]
        
        context = {
            'product': product,
            'vendor': vendor,
            'low_stock_products': low_stock_products,
            'threshold': 9,  # Alert when below 10
        }
        
        html_message = render_to_string('emails/low_stock_alert.html', context)
        subject = f'⚠️ Low Stock Alert: {product.title} ({product.stock_count} units left)'
        
        email = EmailMessage(
            subject=subject,
            body=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[vendor.user.email],
            # You can also BCC admin for monitoring
            # bcc=['admin@trenva.store']
        )
        email.content_subtype = "html"
        email.send()
        
        # Log the alert
        product.last_stock_alert = timezone.now()
        product.save(update_fields=['last_stock_alert'])
        
        check_and_notify_stock(product)
        
        logger.info(f"Low stock alert sent for {product.title} to {vendor.user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send low stock alert: {str(e)}")
        return False


def check_and_send_low_stock_alerts():
    """
    Check all products and send alerts for those with low stock
    This can be called from a scheduled task (cron) or manually
    """
    try:
        # Get products with stock below 10 and managed stock
        low_stock_products = Product.objects.filter(
            stock_managed=True,
            stock_count__lt=10,
            stock_count__gt=0,  # Don't alert for zero stock (out of stock)
            in_stock=True  # Only alert if still marked as in stock
        ).select_related('vendor', 'vendor__user')
        
        # Filter to avoid sending too many alerts (once per day per product)
        one_day_ago = timezone.now() - timedelta(days=1)
        low_stock_products = low_stock_products.filter(
            Q(last_stock_alert__isnull=True) | 
            Q(last_stock_alert__lt=one_day_ago)
        )
        
        alerts_sent = 0
        for product in low_stock_products:
            if send_low_stock_alert(product):
                alerts_sent += 1
        
        logger.info(f"Low stock check complete. Sent {alerts_sent} alerts.")
        return alerts_sent
        
    except Exception as e:
        logger.error(f"Error in low stock check: {str(e)}")
        return 0


def send_stock_critical_alert(product):
    """
    Send critical stock alert when stock is very low (below 3)
    """
    try:
        if product.stock_count > 3:  # Only for critical levels
            return False
            
        vendor = product.vendor
        if not vendor or not vendor.user.email:
            return False
        
        context = {
            'product': product,
            'vendor': vendor,
            'is_critical': True,
        }
        
        html_message = render_to_string('emails/low_stock_alert.html', context)
        subject = f'🚨 CRITICAL Stock Alert: {product.title} (ONLY {product.stock_count} units left!)'
        
        email = EmailMessage(
            subject=subject,
            body=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[vendor.user.email],
        )
        email.content_subtype = "html"
        email.send()
        
        product.last_critical_alert = timezone.now()
        product.save(update_fields=['last_critical_alert'])
        
        logger.warning(f"CRITICAL stock alert sent for {product.title}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send critical stock alert: {str(e)}")
        return False
        
        
        
def send_order_cancellation_email(order, reason="", cancelled_by="system"):
    """Send email notification when order is cancelled"""
    try:
        customer = order.user
        context = {
            'order': order,
            'customer_name': customer.get_full_name() or customer.username,
            'cancellation_reason': reason,
            'cancelled_by': cancelled_by,
            'cancellation_date': timezone.now(),
            'order_items': CartOrderItems.objects.filter(order=order),
        }
        
        html_message = render_to_string('emails/order_cancelled.html', context)
        subject = f'Order #{order.oid} Cancellation Notification'
        
        email = EmailMessage(
            subject=subject,
            body=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[customer.email],
        )
        email.content_subtype = "html"
        email.send()
        
        logger.info(f"Cancellation email sent for order #{order.oid} to {customer.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send cancellation email: {str(e)}")
        return False
        
        
        
@login_required
def admin_fund_wallet(request):
    """
    View for admin to fund their admin wallet via Paystack
    """
    if not request.user.is_superuser and not request.user.is_staff:
        messages.error(request, "Access denied. Admin privileges required.")
        return redirect('home')
    
    admin_wallet = AdminWallet.get_wallet()
    
    # Get recent transactions
    transactions = AdminTransaction.objects.filter(
        admin_wallet=admin_wallet,
        transaction_type__in=['funding', 'withdrawal']
    ).order_by('-created_at')[:10]
    
    if request.method == 'POST':
        try:
            # Convert amount to Decimal
            amount_str = request.POST.get('amount', '0')
            email = request.POST.get('email', '').strip()
            description = request.POST.get('description', '').strip()
            
            # Validate amount
            try:
                amount = Decimal(amount_str)
            except:
                messages.error(request, "Please enter a valid amount.")
                return render(request, 'core/admin_fund_wallet.html', {
                    'admin_wallet': admin_wallet,
                    'transactions': transactions,
                })
            
            if amount < 100:
                messages.error(request, "Minimum funding amount is ₦100.")
                return render(request, 'core/admin_fund_wallet.html', {
                    'admin_wallet': admin_wallet,
                    'transactions': transactions,
                })
            
            if amount % 100 != 0:
                messages.error(request, "Amount must be in multiples of ₦100.")
                return render(request, 'core/admin_fund_wallet.html', {
                    'admin_wallet': admin_wallet,
                    'transactions': transactions,
                })
            
            if not email or '@' not in email:
                messages.error(request, "Please provide a valid email address.")
                return render(request, 'core/admin_fund_wallet.html', {
                    'admin_wallet': admin_wallet,
                    'transactions': transactions,
                })
            
            # Store as string in session to avoid Decimal serialization issues
            request.session['admin_funding_amount'] = str(amount)
            request.session['admin_funding_email'] = email
            
            # Initialize Paystack payment
            result = admin_wallet.initialize_paystack_funding(
                amount=amount,  # Pass as Decimal
                email=email,
                created_by=request.user
            )
            
            if result['success']:
                # Store transaction reference in session
                request.session['admin_funding_reference'] = result['reference']
                
                print(f"DEBUG: Redirecting to Paystack URL: {result['authorization_url']}")
                
                # Redirect to Paystack
                return redirect(result['authorization_url'])
            else:
                messages.error(request, f"Payment initialization failed: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Error in admin_fund_wallet: {str(e)}")
            messages.error(request, f"An error occurred: {str(e)}")
    
    context = {
        'admin_wallet': admin_wallet,
        'transactions': transactions,
    }
    
    return render(request, 'core/admin_fund_wallet.html', context)


@login_required
def admin_fund_wallet_verify(request):
    """
    Verify Paystack payment for admin wallet funding
    """
    print(f"DEBUG: admin_fund_wallet_verify called")
    print(f"DEBUG: GET params: {dict(request.GET)}")
    print(f"DEBUG: Session data: {dict(request.session)}")
    
    if not request.user.is_superuser and not request.user.is_staff:
        messages.error(request, "Access denied.")
        return redirect('home')
    
    # Get reference from query parameters
    reference = request.GET.get('reference', '')
    trxref = request.GET.get('trxref', '')
    
    # Debug print
    print(f"DEBUG: Reference from URL: {reference}")
    print(f"DEBUG: Trxref from URL: {trxref}")
    
    # Use reference or trxref (Paystack uses different param names)
    if not reference and trxref:
        reference = trxref
        print(f"DEBUG: Using trxref as reference: {reference}")
    
    # Try session as fallback
    if not reference:
        reference = request.session.get('admin_funding_reference', '')
        print(f"DEBUG: Reference from session: {reference}")
    
    if reference:
        print(f"DEBUG: Verifying payment with reference: {reference}")
        admin_wallet = AdminWallet.get_wallet()
        
        # Verify payment with Paystack
        result = admin_wallet.verify_paystack_payment(reference)
        print(f"DEBUG: Verification result: {result}")
        
        if result['success']:
            # Clear session data
            session_keys = ['admin_funding_reference', 'admin_funding_amount', 'admin_funding_email']
            for key in session_keys:
                if key in request.session:
                    del request.session[key]
            
            messages.success(
                request, 
                f"✅ Successfully funded ₦{result['amount']:,.2f} to Admin Wallet! "
                f"Confirmation sent to {result['email']}."
            )
        else:
            messages.error(request, f"Payment verification failed: {result.get('error', 'Unknown error')}")
    
    else:
        print(f"DEBUG: No reference found anywhere")
        messages.error(request, "No payment reference found.")
    
    return redirect('admin_fund_wallet')
    

@login_required
def admin_fund_wallet_verify(request):
    """
    Verify Paystack payment for admin wallet funding
    """
    print(f"DEBUG: admin_fund_wallet_verify called")
    print(f"DEBUG: GET params: {dict(request.GET)}")
    
    if not request.user.is_superuser and not request.user.is_staff:
        messages.error(request, "Access denied.")
        return redirect('home')
    
    # Get reference from query parameters
    reference = request.GET.get('reference')
    trxref = request.GET.get('trxref')
    
    print(f"DEBUG: Reference from URL: {reference}")
    print(f"DEBUG: Trxref from URL: {trxref}")
    
    # Try multiple ways to get the reference
    if not reference and trxref:
        reference = trxref
        print(f"DEBUG: Using trxref as reference: {reference}")
    
    # Also check session
    if not reference:
        reference = request.session.get('admin_funding_reference')
        print(f"DEBUG: Reference from session: {reference}")
    
    if not reference:
        messages.error(request, "No payment reference found.")
        return redirect('admin_fund_wallet')
    
    print(f"DEBUG: Verifying payment with reference: {reference}")
    
    admin_wallet = AdminWallet.get_wallet()
    
    # FIRST: Check if transaction already succeeded
    try:
        existing_transaction = AdminTransaction.objects.filter(
            reference=reference,
            status='success'
        ).first()
        
        if existing_transaction:
            print(f"DEBUG: Transaction already succeeded: {existing_transaction.id}")
            messages.success(request, f"Payment already processed! ₦{existing_transaction.amount:,.2f} was credited.")
            
            # Clear session
            session_keys = ['admin_funding_reference', 'admin_funding_amount', 'admin_funding_email']
            for key in session_keys:
                if key in request.session:
                    del request.session[key]
            
            return redirect('admin_fund_wallet')
    except Exception as e:
        print(f"DEBUG: Error checking existing transaction: {str(e)}")
    
    # Verify payment with Paystack
    result = admin_wallet.verify_paystack_payment(reference)
    print(f"DEBUG: Verification result: {result}")
    
    if result['success']:
        # Clear session data
        session_keys = ['admin_funding_reference', 'admin_funding_amount', 'admin_funding_email']
        for key in session_keys:
            if key in request.session:
                del request.session[key]
        
        messages.success(
            request, 
            f"✅ Successfully funded ₦{result['amount']:,.2f} to Admin Wallet! "
            f"Confirmation sent to {result['email']}."
        )
    else:
        messages.error(request, f"Payment verification failed: {result.get('error', 'Unknown error')}")
    
    return redirect('admin_fund_wallet')


@login_required
def admin_credit_user_wallet(request):
    """
    Admin view to credit user's wallet from admin wallet
    """
    if not request.user.is_superuser and not request.user.is_staff:
        messages.error(request, "Access denied. Admin privileges required.")
        return redirect('home')
    
    admin_wallet = AdminWallet.get_wallet()
    
    if request.method == 'POST':
        try:
            user_id = request.POST.get('user_id')
            amount = float(request.POST.get('amount', 0))
            description = request.POST.get('description', '').strip()
            
            # Validation
            if amount <= 0:
                messages.error(request, "Amount must be greater than zero.")
                return redirect('admin_fund_wallet')
            
            if not admin_wallet.can_afford(amount):
                messages.error(request, f"Insufficient balance in Admin Wallet. Available: ₦{admin_wallet.balance:,.2f}")
                return redirect('admin_fund_wallet')
            
            # Get user
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                messages.error(request, "User not found.")
                return redirect('admin_fund_wallet')
            
            # Credit user wallet
            admin_transaction, user_transaction = admin_wallet.credit_user_wallet(
                user=user,
                amount=amount,
                description=description,
                created_by=request.user
            )
            
            messages.success(
                request, 
                f"✅ Successfully credited ₦{amount:,.2f} to {user.get_full_name() or user.username}'s wallet. "
                f"Transaction reference: {user_transaction.reference}"
            )
            
            return redirect('admin_fund_wallet')
            
        except ValueError as e:
            messages.error(request, f"Error: {str(e)}")
        except Exception as e:
            logger.error(f"Error in admin_credit_user_wallet: {str(e)}")
            messages.error(request, f"An error occurred: {str(e)}")
    
    # If GET request or error, redirect to main funding page
    return redirect('admin_fund_wallet')


@login_required
def admin_wallet_stats(request):
    """
    API endpoint for admin wallet statistics (for charts/dashboard)
    """
    if not request.user.is_superuser and not request.user.is_staff:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    admin_wallet = AdminWallet.get_wallet()
    
    # Get 30-day transaction summary
    thirty_days_ago = timezone.now() - timedelta(days=30)
    
    funding_data = AdminTransaction.objects.filter(
        admin_wallet=admin_wallet,
        transaction_type='funding',
        status='success',
        created_at__gte=thirty_days_ago
    ).values('created_at__date').annotate(
        total_amount=Sum('amount'),
        count=Count('id')
    ).order_by('created_at__date')
    
    credit_data = AdminTransaction.objects.filter(
        admin_wallet=admin_wallet,
        transaction_type='user_credit',
        status='success',
        created_at__gte=thirty_days_ago
    ).values('created_at__date').annotate(
        total_amount=Sum('amount'),
        count=Count('id')
    ).order_by('created_at__date')
    
    # Format data for charts
    funding_chart = [
        {
            'date': item['created_at__date'].strftime('%Y-%m-%d'),
            'amount': float(item['total_amount']),
            'count': item['count']
        }
        for item in funding_data
    ]
    
    credit_chart = [
        {
            'date': item['created_at__date'].strftime('%Y-%m-%d'),
            'amount': float(item['total_amount']),
            'count': item['count']
        }
        for item in credit_data
    ]
    
    # Top users credited
    top_users = AdminTransaction.objects.filter(
        admin_wallet=admin_wallet,
        transaction_type='user_credit',
        status='success'
    ).values('user__username', 'user__email').annotate(
        total_credited=Sum('amount'),
        times_credited=Count('id')
    ).order_by('-total_credited')[:10]
    
    data = {
        'wallet_balance': float(admin_wallet.balance),
        'total_credits_given': float(admin_wallet.total_credits_given),
        'total_refunds_given': float(admin_wallet.total_refunds_given),
        'funding_chart': funding_chart,
        'credit_chart': credit_chart,
        'top_users': list(top_users),
    }
    
    return JsonResponse(data)
    
    
    
     
from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg, F, Q
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

def flash_sales(request):
    """
    Flash Sales page - Shows products with countdown timers
    """
    # Get category filter
    current_category = request.GET.get('category', 'all')
    
    # Base queryset - Get products with countdown timers or promo products
    flash_products = Product.objects.filter(
        product_status="published",
        in_stock=True
    ).filter(
        Q(promo=True) | 
        Q(days__gt=0) | 
        Q(hours__gt=0) | 
        Q(minutes__gt=0) | 
        Q(seconds__gt=0) |
        Q(countdown_start__isnull=False)
    ).select_related('category', 'brand').prefetch_related('p_images')
    
    # Apply category filter
    if current_category != 'all':
        try:
            flash_products = flash_products.filter(category__title__iexact=current_category)
        except:
            pass
    
    # Add calculated fields to each product
    for product in flash_products:
        # Calculate dynamic remaining time
        if product.days or product.hours or product.minutes or product.seconds:
            # Calculate total seconds from days, hours, minutes, seconds
            total_seconds = (product.days * 86400) + (product.hours * 3600) + (product.minutes * 60) + (product.seconds or 0)
            
            if total_seconds > 0:
                # Calculate remaining time from countdown_start
                if product.countdown_start:
                    end_time = product.countdown_start + timedelta(seconds=total_seconds)
                    now = timezone.now()
                    
                    if end_time > now:
                        remaining = end_time - now
                        product.remaining_days = remaining.days
                        product.remaining_hours = remaining.seconds // 3600
                        product.remaining_minutes = (remaining.seconds % 3600) // 60
                        product.remaining_seconds = remaining.seconds % 60
                    else:
                        # Countdown expired
                        product.remaining_days = 0
                        product.remaining_hours = 0
                        product.remaining_minutes = 0
                        product.remaining_seconds = 0
                        product.promo = False
                        product.save()
                else:
                    # Use static values if countdown_start not set
                    product.remaining_days = product.days or 0
                    product.remaining_hours = product.hours or 0
                    product.remaining_minutes = product.minutes or 0
                    product.remaining_seconds = product.seconds or 0
        
        # Calculate discount percentage
        if product.old_price and product.old_price > 0 and product.old_price > product.price:
            discount_percentage = ((product.old_price - product.price) / product.old_price) * 100
            product.discount_percentage = round(discount_percentage, 0)
        else:
            product.discount_percentage = 0
        
        # Calculate sold percentage (for progress bar)
        if product.stock_count > 0:
            # Simulate sold percentage - in real app, calculate from order history
            if product.stock_count < 50:
                product.sold_percentage = 100 - ((product.stock_count / 50) * 100)
            else:
                product.sold_percentage = 50  # Default
        else:
            product.sold_percentage = 100
    
    # Get categories for filter
    categories = Category.objects.all()[:8]
    
    # Calculate main flash sale timer (based on earliest ending product)
    main_timer = {'days': 1, 'hours': 12, 'minutes': 0, 'seconds': 0}
    
    # Try to get real timer from products
    if flash_products.exists():
        # Find product with shortest time
        min_seconds = float('inf')
        for product in flash_products:
            if hasattr(product, 'remaining_seconds'):
                total_secs = (product.remaining_days * 86400) + (product.remaining_hours * 3600) + (product.remaining_minutes * 60) + product.remaining_seconds
                if total_secs < min_seconds:
                    min_seconds = total_secs
                    main_timer = {
                        'days': product.remaining_days,
                        'hours': product.remaining_hours,
                        'minutes': product.remaining_minutes,
                        'seconds': product.remaining_seconds
                    }
    
    context = {
        "flash_products": flash_products,
        "flash_timer": main_timer,
        "categories": categories,
        "current_category": current_category,
    }
    
    return render(request, "core/flash_sales.html", context)


from django.db.models import Avg, F, Count, Q
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
import json

def top_products(request):
    """
    View for Top Products page - Shows best-selling and featured items
    """
    # Get sort parameter
    sort_by = request.GET.get('sort_by', 'best_selling')
    
    # Get category filter
    current_category = request.GET.get('category', 'all')
    
    # Base queryset
    products = Product.objects.filter(
        product_status="published"
    ).select_related('category', 'brand').prefetch_related('p_images')
    
    # Apply category filter
    if current_category != 'all':
        try:
            products = products.filter(category__id=current_category)
        except:
            pass
    
    # Apply sorting
    if sort_by == 'best_selling':
        # Get products with highest cart counts
        from django.db.models import Count
        products = products.annotate(
            cart_count=Count('cart')
        ).order_by('-cart_count', '-featured', '-date')
    elif sort_by == 'newest':
        products = products.order_by('-date')
    elif sort_by == 'price_low':
        products = products.order_by('price')
    elif sort_by == 'price_high':
        products = products.order_by('-price')
    elif sort_by == 'featured':
        products = products.filter(featured=True).order_by('-date')
    
    # Get categories for filter
    categories = Category.objects.all()[:10]
    
    # Calculate stats
    total_products = products.count()
    featured_count = products.filter(featured=True).count()
    
    # For best selling count, get top 20% of products by cart count
    best_selling_count = 0
    if products.exists():
        # Simple approximation: featured products + products with stock < 20
        best_selling_count = products.filter(
            Q(featured=True) | Q(stock_count__lt=20, stock_count__gt=0)
        ).count()
    
    # Add calculated fields to products
    for product in products:
        # Check if product has reviews relation
        if hasattr(product, 'reviews') and hasattr(product.reviews, 'all'):
            reviews = product.reviews.all()
            if reviews.exists():
                avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
                product.average_rating = float(avg_rating) if avg_rating else 0
                product.review_count = reviews.count()
            else:
                product.average_rating = 0
                product.review_count = 0
        else:
            product.average_rating = 0
            product.review_count = 0
        
        # Calculate discount percentage
        if product.old_price and product.old_price > 0 and product.old_price > product.price:
            discount_percentage = ((product.old_price - product.price) / product.old_price) * 100
            product.discount_percentage = round(discount_percentage, 0)
        else:
            product.discount_percentage = 0
    
    # Pagination
    paginator = Paginator(products, 30)
    page = request.GET.get('page', 1)
    
    try:
        products_page = paginator.page(page)
    except (PageNotAnInteger, EmptyPage):
        products_page = paginator.page(1)
    
    context = {
        "products": products_page,
        "categories": categories,
        "sort_by": sort_by,
        "current_category": current_category,
        "total_products": total_products,
        "featured_count": featured_count,
        "best_selling_count": best_selling_count,
    }
    
    return render(request, "core/top_products.html", context)


# In your views.py
from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from decimal import Decimal

@vendor_required
def vendor_payouts(request):
    """Vendor payout request page"""
    try:
        vendor = Vendor.objects.get(user=request.user)
    except Vendor.DoesNotExist:
        messages.error(request, 'Vendor profile not found.')
        return redirect('vendor_dashboard')
    
    # Get available balance
    available = vendor.get_available_for_payout()
    
    # Get payout history
    payouts = vendor.get_payout_history()
    
    context = {
        'vendor': vendor,
        'available': available,
        'payouts': payouts,
        'min_amount': vendor.payout_threshold,
    }
    
    return render(request, 'vendor/payouts.html', context)

@vendor_required
def request_payout(request):
    """Handle payout request"""
    if request.method == 'POST':
        try:
            vendor = Vendor.objects.get(user=request.user)
            amount = Decimal(request.POST.get('amount', 0))
            notes = request.POST.get('notes', '')
            
            # Create payout request
            payout = vendor.create_payout_request(amount, notes)
            
            messages.success(request, f'Payout request for ₦{amount} submitted successfully!')
            return redirect('vendor_payouts')
            
        except ValueError as e:
            messages.error(request, str(e))
        except Exception as e:
            messages.error(request, f'Error creating payout: {str(e)}')
    
    return redirect('vendor_payouts')

@user_passes_test(lambda u: u.is_staff)
def admin_payout_approval(request):
    """Admin view to approve/reject payouts"""
    payouts = VendorPayout.objects.filter(status='pending').order_by('requested_at')
    
    context = {
        'payouts': payouts,
    }
    
    return render(request, 'admin/payout_approval.html', context)

@user_passes_test(lambda u: u.is_staff)
def process_payout(request, payout_id):
    """Process an approved payout"""
    if request.method == 'POST':
        payout = get_object_or_404(VendorPayout, payout_id=payout_id)
        action = request.POST.get('action')
        
        if action == 'approve' and payout.can_approve():
            payout.status = 'approved'
            payout.approved_by = request.user
            payout.approved_at = timezone.now()
            payout.save()
            
            messages.success(request, f'Payout {payout_id} approved!')
            
        elif action == 'reject' and payout.can_reject():
            reason = request.POST.get('reason', '')
            payout.status = 'rejected'
            payout.rejection_reason = reason
            payout.save()
            
            messages.warning(request, f'Payout {payout_id} rejected.')
            
        elif action == 'process' and payout.can_process():
            # Get admin wallet
            admin_wallet = AdminWallet.get_wallet()
            
            try:
                success = admin_wallet.process_vendor_payout(payout, request.user)
                
                if success:
                    messages.success(request, f'Payout {payout_id} processed successfully!')
                else:
                    messages.error(request, f'Failed to process payout {payout_id}')
                    
            except ValueError as e:
                messages.error(request, str(e))
    
    return redirect('admin_payout_approval')
    
    
    
def trenva_policy(request):
    return render(request, 'core/trenva_policy.html')
    
    
def terms_of_use(request):
    return render(request, 'core/terms_of_use.html')
    
    
def be_affilate(request):
    return render(request, 'core/affilate.html')
    
    
@user_required
def cancelled_orders(request):
    """
    View to display all cancelled orders for the current user.
    Shows empty state if no cancelled orders exist.
    """
    user = request.user
    
    # Get all cancelled orders for the user
    cancelled_orders = CartOrder.objects.filter(
        user=user,
        product_status="Canceled"
    ).order_by('-order_date')
    
    # Get order items for each cancelled order
    order_items_dict = {}
    for order in cancelled_orders:
        items = CartOrderItems.objects.filter(order=order)
        order_items_dict[order.id] = items
    
    # Get user's address and other info for context
    address = Address.objects.filter(user=user, status="Yes")
    orders = CartOrder.objects.filter(user=user)
    wishlist = Wishlist.objects.filter(user=request.user).count()
    
    context = {
        "user": user,
        "cancelled_orders": cancelled_orders,
        "order_items_dict": order_items_dict,
        "address": address,
        "orders": orders,
        "wishlist": wishlist,
        "has_cancelled_orders": cancelled_orders.exists(),  # Boolean for template logic
    }
    
    return render(request, "core/cancelled-orders.html", context)
    
    

@login_required
@user_passes_test(lambda u: u.is_staff)
def admin_process_cancellation(request, order_item_id):
    """
    Process cancellation - Move VENDOR'S PRICE to admin wallet
    """
    try:
        # Get the order item
        order_item = CartOrderItems.objects.get(id=order_item_id)
        
        # Check if it's cancelled
        if order_item.product_status.lower() not in ['canceled', 'cancelled']:
            messages.error(request, "This order is not cancelled.")
            return redirect('admin:core_cartorder_changelist')
        
        # Check if already processed
        if order_item.cancellation_processed:
            messages.warning(request, "This cancellation was already processed.")
            return redirect('admin:core_cartorder_changelist')
        
        # Get vendor
        vendor = Vendor.objects.get(vid=order_item.vendor_id)
        
        # Try to find the actual product to get vendor_price
        try:
            product = Product.objects.get(
                title=order_item.item,
                vendor=vendor
            )
            # Use vendor_price if it exists
            if hasattr(product, 'vendor_price') and product.vendor_price > 0:
                vendor_price = product.vendor_price
            else:
                # If no vendor_price, calculate it from selling price
                # Assuming 20% commission as default
                vendor_price = order_item.price * Decimal('0.80')
        except Product.DoesNotExist:
            # If product not found, use 80% of selling price as vendor price
            vendor_price = order_item.price * Decimal('0.80')
        
        # Calculate total vendor amount
        vendor_amount = vendor_price * order_item.qty
        
        # Get admin wallet
        admin_wallet = AdminWallet.get_wallet()
        
        # Move vendor's amount to admin wallet
        amount_to_move = Decimal(str(vendor_amount))
        admin_wallet.balance += amount_to_move
        admin_wallet.save()
        
        # Create transaction record
        AdminTransaction.objects.create(
            admin_wallet=admin_wallet,
            amount=amount_to_move,
            balance_after=admin_wallet.balance,
            transaction_type='refund_received',
            status='success',
            reference=f"CANCEL_{order_item.unique_id}",
            description=f"Cancellation refund (vendor price) for {order_item.item}",
            vendor=vendor,
            order_item=order_item
        )
        
        # Mark order item as processed
        order_item.cancellation_processed = True
        order_item.save()
        
        messages.success(request, f"Successfully moved ₦{amount_to_move:,.2f} (vendor price) to admin wallet.")
        
    except CartOrderItems.DoesNotExist:
        messages.error(request, "Order item not found.")
    except Vendor.DoesNotExist:
        messages.error(request, "Vendor not found.")
    except Exception as e:
        messages.error(request, f"Error: {str(e)}")
    
    return redirect('admin:core_cartorder_changelist')
    
    
    
# views.py
from django.shortcuts import render, redirect
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from django.contrib import messages
import re
from core.models import Vendor  # Import your Vendor model

def vendor_password_reset(request):
    """
    Simple vendor password reset view - Only for vendors
    """
    if request.method == 'POST':
        # Get email from form
        email = request.POST.get('email', '').strip()
        
        # Basic validation
        if not email:
            messages.error(request, 'Please enter your email address')
            return render(request, 'user/vendor_password_reset_form.html')
        
        # Email validation
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            messages.error(request, 'Please enter a valid email address')
            return render(request, 'user/vendor_password_reset_form.html')
        
        User = get_user_model()
        
        try:
            # Find user by email
            user = User.objects.get(email__iexact=email)
            
            # Check if user is a vendor by looking for Vendor object
            try:
                vendor = Vendor.objects.get(user=user)
                is_vendor = True
            except Vendor.DoesNotExist:
                # Also check if user is in Vendors group (if using groups)
                is_vendor = user.groups.filter(name='Vendors').exists()
            
            if not is_vendor:
                # Show generic message for security
                messages.success(request, 'If this email is registered as a vendor, you will receive a password reset link.')
                return redirect('vendor_password_reset_done')
            
            # Generate token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Build reset URL - FIXED: Using trenva.store/ng/ domain with vendor path
            protocol = 'https' if request.is_secure() else 'http'
            reset_url = f"{protocol}://trenva.store/ng/vendor/create-password/{uid}/{token}/"
            
            # Get vendor name if available
            vendor_name = vendor.name if is_vendor and hasattr(vendor, 'name') else user.get_full_name() or user.username
            
            # Prepare email context
            email_context = {
                'vendor_name': vendor_name,
                'token': f"{uid}/{token}/",  # Combined token for template
                'reset_url': reset_url,
                'domain': 'trenva.store/ng',
            }
            
            # Render email template
            email_body = render_to_string('user/vendor_password_reset.html', email_context)
            
            # Send email
            email_message = EmailMessage(
                'Reset Your Vendor Password - Trenva',
                email_body,
                'noreply@trenva.store',
                [user.email]
            )
            email_message.content_subtype = "html"
            email_message.send()
            
            # Log success
            print(f"Vendor password reset email sent to {user.email} (Vendor: {vendor_name})")
            
            # Show success message
            messages.success(request, 'Password reset link has been sent to your email.')
            return redirect('vendor_password_reset_done')
            
        except User.DoesNotExist:
            # User doesn't exist - show generic success for security
            messages.success(request, 'If this email is registered as a vendor, you will receive a password reset link.')
            return redirect('vendor_password_reset_done')
    
    # GET request - show form
    return render(request, 'user/vendor_password_reset_form.html')


def vendor_password_reset_done(request):
    """
    Show success page after password reset request
    """
    return render(request, 'user/vendor_password_reset_done.html')
    
    

# Add this to your views.py
def vendor_password_reset_confirm(request, uidb64, token):
    """
    Handle password reset confirmation when user clicks email link
    """
    User = get_user_model()
    
    try:
        # Decode the user ID
        from django.utils.encoding import force_str
        from django.utils.http import urlsafe_base64_decode
        
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
        
        # Check if token is valid
        if default_token_generator.check_token(user, token):
            # Token is valid - show password reset form
            if request.method == 'POST':
                # Handle password reset
                new_password1 = request.POST.get('new_password1', '')
                new_password2 = request.POST.get('new_password2', '')
                
                # Validate passwords
                if new_password1 and new_password1 == new_password2:
                    # Set new password
                    user.set_password(new_password1)
                    user.save()
                    
                    # Show success
                    messages.success(request, 'Your password has been reset successfully!')
                    return redirect('vendor-signin')  # Redirect to login page
                else:
                    messages.error(request, 'Passwords do not match or are empty.')
            
            # Show password reset form
            return render(request, 'user/vendor_password_reset_confirm.html', {
                'validlink': True,
                'uidb64': uidb64,
                'token': token,
            })
        else:
            # Token is invalid
            messages.error(request, 'Password reset link is invalid or has expired.')
            return render(request, 'user/vendor_password_reset_confirm.html', {'validlink': False})
            
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        messages.error(request, 'Invalid password reset link.')
        return render(request, 'user/vendor_password_reset_confirm.html', {'validlink': False})
        
# @login_required   
def trenva_vendor_guide(request):
    return render(request, 'user/trenva_vendor_guide.html')
    

@require_POST
def track_share(request):
    """Track social media shares"""
    try:
        data = json.loads(request.body)
        platform = data.get('platform')
        title = data.get('title')
        url = data.get('url')
        
        # Get IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        # Create share record
        SocialShare.objects.create(
            platform=platform,
            title=title,
            url=url,
            user=request.user if request.user.is_authenticated else None,
            ip_address=ip_address
        )
        
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
        
        
def vendor_store(request, store_slug):
    # Get vendor by slug
    vendor = get_object_or_404(Vendor, store_slug=store_slug)
    
    # Get vendor products (published and in stock)
    products = Product.objects.filter(
        vendor=vendor, 
        product_status='published',
        in_stock=True
    ).order_by('-date')  # Show newest first
    
    # Follow status
    is_following_vendor = False
    if request.user.is_authenticated:
        is_following_vendor = vendor.is_followed_by(request.user)
    
    # Follower count
    vendor_follower_count = vendor.get_follower_count()
    
    # Real vendor statistics
    total_sales = vendor.get_total_sales()
    average_rating = vendor.get_average_rating()
    total_reviews = vendor.get_total_reviews()
    total_revenue = vendor.get_total_revenue()
    response_rate = vendor.get_response_rate()
    positive_rating_percentage = vendor.get_positive_rating_percentage()
    
    # Get rating distribution for visual display
    rating_distribution = vendor.get_rating_distribution()
    
    # Apply pagination
    paginator = Paginator(products, 30)  # 20 products per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'vendor': vendor,
        'products': page_obj,
        'page_obj': page_obj,
        'is_following_vendor': is_following_vendor,
        'vendor_follower_count': vendor_follower_count,
        
        # Real statistics
        'total_sales': total_sales,
        'average_rating': average_rating,
        'total_reviews': total_reviews,
        'total_revenue': total_revenue,
        'response_rate': response_rate,
        'positive_rating_percentage': positive_rating_percentage,
        'rating_distribution': rating_distribution,
    }
    
    return render(request, 'user/vendor_store.html', context)    

from django.db.models import Sum  # Add this import at the top

@user_required
def transaction_history(request):
    """View all transactions for the logged-in user with filters"""
    try:
        wallet = Wallet.objects.get(user=request.user)
        
        # Start with base queryset
        transactions = Transaction.objects.filter(wallet=wallet).order_by('-created_at')
        
        # Get filter parameters from request
        transaction_type = request.GET.get('type')
        status = request.GET.get('status')
        
        # Apply transaction type filter (credit/debit)
        if transaction_type in ['credit', 'debit']:
            transactions = transactions.filter(transaction_type=transaction_type)
            print(f"DEBUG: Filtering by type: {transaction_type}")  # Debug line
        
        # Apply status filter (success/pending/failed)
        if status in ['success', 'pending', 'failed']:
            transactions = transactions.filter(status=status)
            print(f"DEBUG: Filtering by status: {status}")  # Debug line
        
        # Calculate totals for stats (only successful transactions)
        total_credits = transactions.filter(
            transaction_type='credit', 
            status='success'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_debits = transactions.filter(
            transaction_type='debit', 
            status='success'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Add pagination (20 transactions per page)
        paginator = Paginator(transactions, 20)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        
        # Build filter params for template
        filter_params = {}
        if transaction_type:
            filter_params['type'] = transaction_type
        if status:
            filter_params['status'] = status
        
        context = {
            'wallet': wallet,
            'page_obj': page_obj,
            'transactions': page_obj,
            'total_credits': total_credits,
            'total_debits': total_debits,
            'filter_params': filter_params,
            'current_type': transaction_type,
            'current_status': status,
        }
        
        print(f"DEBUG: Transaction count after filters: {transactions.count()}")  # Debug line
        return render(request, 'core/transaction_history.html', context)
        
    except Wallet.DoesNotExist:
        messages.error(request, "Wallet not found")
        return redirect('wallet')
        
        
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
def trippa_webhook(request):
    """
    Receive webhook notifications from Trippa
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        # Verify API key if Trippa sends it in headers
        api_key = request.headers.get('x-api-key')
        if api_key and api_key != settings.TRIPPA_API_KEY:
            logger.warning(f"Invalid API key in webhook: {api_key}")
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        # Parse webhook payload
        payload = json.loads(request.body)
        
        event_type = payload.get('event')
        data = payload.get('data', {})
        
        logger.info(f"Received Trippa webhook: {event_type}")
        
        # Handle different event types
        if event_type == 'delivery.created':
            # New delivery created
            tracking_number = data.get('tracking_number')
            delivery_id = data.get('id')
            logger.info(f"Delivery created: {tracking_number}")
            
        elif event_type == 'delivery.updated':
            # Delivery status updated
            tracking_number = data.get('tracking_number')
            status = data.get('status')
            logger.info(f"Delivery {tracking_number} status: {status}")
            
            # Update your order status
            try:
                from core.models import CartOrder
                order = CartOrder.objects.filter(tracking_id=tracking_number).first()
                if order:
                    order.product_status = status
                    order.save()
                    logger.info(f"Updated order {order.id} status to {status}")
            except Exception as e:
                logger.error(f"Failed to update order: {str(e)}")
            
        elif event_type == 'delivery.delivered':
            # Package delivered
            tracking_number = data.get('tracking_number')
            delivered_at = data.get('delivered_at')
            proof_of_delivery = data.get('proof_of_delivery_url')
            
            logger.info(f"Delivery {tracking_number} delivered at {delivered_at}")
            
            # Update order to delivered
            try:
                from core.models import CartOrder
                order = CartOrder.objects.filter(tracking_id=tracking_number).first()
                if order:
                    order.product_status = "Delivered"
                    order.save()
            except Exception as e:
                logger.error(f"Failed to update delivered order: {str(e)}")
            
        elif event_type == 'delivery.failed':
            # Delivery failed
            tracking_number = data.get('tracking_number')
            failure_reason = data.get('failure_reason')
            logger.warning(f"Delivery {tracking_number} failed: {failure_reason}")
            
            # Update order to failed
            try:
                from core.models import CartOrder
                order = CartOrder.objects.filter(tracking_id=tracking_number).first()
                if order:
                    order.product_status = "Delivery Failed"
                    order.save()
            except Exception as e:
                logger.error(f"Failed to update failed order: {str(e)}")
        
        return JsonResponse({'status': 'success'}, status=200)
        
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in webhook: {str(e)}")
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        return JsonResponse({'error': 'Internal error'}, status=500)
        
        
@user_required
def track_delivery(request, order_id):
    """
    Track delivery status for an order
    Shows real-time delivery progress from Trippa
    """
    try:
        # Get the order
        order = get_object_or_404(CartOrder, id=order_id, user=request.user)
        
        # 🔍 ADD THIS DEBUG
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"=== TRACK DELIVERY DEBUG ===")
        logger.info(f"Order ID: {order.id}")
        logger.info(f"Trippa Tracking ID: {order.trippa_tracking_id}")
        logger.info(f"Your Tracking ID: {order.tracking_id}")
        logger.info(f"Delivery Method: {order.delivery_method}")
        logger.info(f"==========================")
        
        # ✅ UPDATED: Check if order has a TRIPPA tracking ID
        if not order.trippa_tracking_id:
            messages.warning(request, "No tracking information available for this order yet.")
            return redirect('order-details', id=order_id)
        
        # Get tracking info from Trippa
        from core.services.trippa import TrippaDelivery
        
        trippa = TrippaDelivery()
        
        # ✅ UPDATED: Use trippa_tracking_id instead of tracking_id
        # Try public tracking first (no API key required)
        result = trippa.track_delivery_public(order.trippa_tracking_id)
        
        # If public tracking fails, fall back to authenticated
        if not result.get("success"):
            result = trippa.track_by_tracking_number(order.trippa_tracking_id)
        
        # Prepare tracking data
        tracking_data = {}
        status = 'pending'
        timeline = []
        
        if result.get("success"):
            tracking_data = result.get("data", result)
            status = tracking_data.get('status', 'pending')
            
            # Build timeline from status history if available
            status_history = tracking_data.get('status_history', [])
            if status_history:
                for event in status_history:
                    timeline.append({
                        'status': event.get('status'),
                        'description': event.get('description', event.get('status', '').replace('_', ' ').title()),
                        'timestamp': event.get('created_at'),
                        'completed': True
                    })
            else:
                # Create basic timeline from current status
                status_order = ['pending', 'processing', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']
                for s in status_order:
                    if status_order.index(s) <= status_order.index(status):
                        timeline.append({
                            'status': s,
                            'description': s.replace('_', ' ').title(),
                            'timestamp': None,
                            'completed': True
                        })
                    else:
                        timeline.append({
                            'status': s,
                            'description': s.replace('_', ' ').title(),
                            'timestamp': None,
                            'completed': False
                        })
        
        # Status display mapping
        status_display = {
            'pending': 'Order Received',
            'processing': 'Processing',
            'picked_up': 'Picked Up',
            'in_transit': 'In Transit',
            'out_for_delivery': 'Out for Delivery',
            'delivered': 'Delivered',
            'failed': 'Delivery Failed',
            'cancelled': 'Cancelled',
        }
        
        # Status icon mapping
        status_icon = {
            'pending': '📦',
            'processing': '⚙️',
            'picked_up': '🛵',
            'in_transit': '🚚',
            'out_for_delivery': '🚛',
            'delivered': '✅',
            'failed': '❌',
            'cancelled': '🚫',
        }
        
        context = {
            'order': order,
            'tracking_id': order.trippa_tracking_id,  # ✅ UPDATED: Show Trippa tracking ID
            'status': status,
            'status_display': status_display.get(status, status.replace('_', ' ').title()),
            'status_icon': status_icon.get(status, '📦'),
            'timeline': timeline,
            'tracking_data': tracking_data,
            'delivery_method': order.delivery_method,
            'rider_name': tracking_data.get('rider', {}).get('name') if isinstance(tracking_data, dict) else None,
            'rider_phone': tracking_data.get('rider', {}).get('phone') if isinstance(tracking_data, dict) else None,
            'estimated_delivery': tracking_data.get('estimated_delivery_time') if isinstance(tracking_data, dict) else None,
            'delivery_cost': tracking_data.get('delivery_cost') if isinstance(tracking_data, dict) else None,
            'proof_of_delivery': tracking_data.get('proof_of_delivery_url') if isinstance(tracking_data, dict) else None,
            'signature_url': tracking_data.get('recipient_signature_url') if isinstance(tracking_data, dict) else None,
            'tracking_unavailable': not result.get("success"),
        }
        
        return render(request, "core/track-delivery.html", context)
        
    except Exception as e:
        logger.error(f"Track delivery error for order {order_id}: {str(e)}")
        messages.error(request, "Unable to retrieve tracking information at this time.")
        return redirect('order-details', id=order_id)  

# @login_required
# def track_delivery(request, order_id):
#     """
#     Track delivery status for an order
#     Shows real-time delivery progress from Trippa
#     """
#     try:
#         # Get the order
#         order = get_object_or_404(CartOrder, id=order_id, user=request.user)
        
#          # 🔍 ADD THIS DEBUG
#         import logging
#         logger = logging.getLogger(__name__)
#         logger.info(f"=== TRACK DELIVERY DEBUG ===")
#         logger.info(f"Order ID: {order.id}")
#         logger.info(f"Tracking ID: {order.tracking_id}")
#         logger.info(f"Delivery Method: {order.delivery_method}")
#         logger.info(f"==========================")
        
#         # Check if order has a tracking ID
#         if not order.tracking_id:
#             messages.warning(request, "No tracking information available for this order yet.")
#             return redirect('order-details', id=order_id)
        
#         # Get tracking info from Trippa
#         from .services.trippa import TrippaDelivery
        
#         trippa = TrippaDelivery()
        
#         # Try public tracking first (no API key required)
#         result = trippa.track_delivery_public(order.tracking_id)
        
#         # If public tracking fails, fall back to authenticated
#         if not result.get("success"):
#             result = trippa.track_by_tracking_number(order.tracking_id)
        
#         # Prepare tracking data
#         tracking_data = {}
#         status = 'pending'
#         timeline = []
        
#         if result.get("success"):
#             tracking_data = result.get("data", result)
#             status = tracking_data.get('status', 'pending')
            
#             # Build timeline from status history if available
#             status_history = tracking_data.get('status_history', [])
#             if status_history:
#                 for event in status_history:
#                     timeline.append({
#                         'status': event.get('status'),
#                         'description': event.get('description', event.get('status', '').replace('_', ' ').title()),
#                         'timestamp': event.get('created_at'),
#                         'completed': True
#                     })
#             else:
#                 # Create basic timeline from current status
#                 status_order = ['pending', 'processing', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']
#                 for s in status_order:
#                     if status_order.index(s) <= status_order.index(status):
#                         timeline.append({
#                             'status': s,
#                             'description': s.replace('_', ' ').title(),
#                             'timestamp': None,
#                             'completed': True
#                         })
#                     else:
#                         timeline.append({
#                             'status': s,
#                             'description': s.replace('_', ' ').title(),
#                             'timestamp': None,
#                             'completed': False
#                         })
        
#         # Status display mapping
#         status_display = {
#             'pending': 'Order Received',
#             'processing': 'Processing',
#             'picked_up': 'Picked Up',
#             'in_transit': 'In Transit',
#             'out_for_delivery': 'Out for Delivery',
#             'delivered': 'Delivered',
#             'failed': 'Delivery Failed',
#             'cancelled': 'Cancelled',
#         }
        
#         # Status icon mapping
#         status_icon = {
#             'pending': '📦',
#             'processing': '⚙️',
#             'picked_up': '🛵',
#             'in_transit': '🚚',
#             'out_for_delivery': '🚛',
#             'delivered': '✅',
#             'failed': '❌',
#             'cancelled': '🚫',
#         }
        
#         context = {
#             'order': order,
#             'tracking_id': order.tracking_id,
#             'status': status,
#             'status_display': status_display.get(status, status.replace('_', ' ').title()),
#             'status_icon': status_icon.get(status, '📦'),
#             'timeline': timeline,
#             'tracking_data': tracking_data,
#             'delivery_method': order.delivery_method,
#             'rider_name': tracking_data.get('rider', {}).get('name') if isinstance(tracking_data, dict) else None,
#             'rider_phone': tracking_data.get('rider', {}).get('phone') if isinstance(tracking_data, dict) else None,
#             'estimated_delivery': tracking_data.get('estimated_delivery_time') if isinstance(tracking_data, dict) else None,
#             'delivery_cost': tracking_data.get('delivery_cost') if isinstance(tracking_data, dict) else None,
#             'proof_of_delivery': tracking_data.get('proof_of_delivery_url') if isinstance(tracking_data, dict) else None,
#             'signature_url': tracking_data.get('recipient_signature_url') if isinstance(tracking_data, dict) else None,
#             'tracking_unavailable': not result.get("success"),
#         }
        
#         return render(request, "core/track-delivery.html", context)
        
#     except Exception as e:
#         logger.error(f"Track delivery error for order {order_id}: {str(e)}")
#         messages.error(request, "Unable to retrieve tracking information at this time.")
#         return redirect('order-details', id=order_id)
        
        
@user_required
def my_returns(request):
    """
    Show all returned items for the logged-in user
    """
    # Get all orders where return_reason exists (user requested return)
    returned_orders = CartOrder.objects.filter(
        user=request.user,
        return_reason__isnull=False,
        return_reason__gt=''  # Not empty
    ).order_by('-order_date')
    
    # Count statistics
    total_returns = returned_orders.count()
    refunded_count = returned_orders.filter(is_refund_processed=True).count()
    pending_count = total_returns - refunded_count
    
    context = {
        'returns': returned_orders,
        'total_returns': total_returns,
        'refunded_count': refunded_count,
        'pending_count': pending_count,
    }
    return render(request, "core/my-returns.html", context)
    
    
    

# =========================
# Mobile Payment API Views
# =========================

from decimal import Decimal
import uuid
import shortuuid
import requests

from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

# Ensure these models are imported in your file:
# Cart, CartOrder, CartOrderItems, Address, Wallet, Transaction, ProductColor, ProductSize, Coupon, CouponEmail


def _mobile_calculate_cart_total(user):
    cart_items = Cart.objects.filter(user=user).select_related("product")
    total = Decimal("0.00")
    for item in cart_items:
        total += (item.product.price * item.qty)
    return cart_items, total


def _apply_coupon_to_total_for_user(*, user, cart_total: Decimal, coupon_code: str = "", coupon_id=None):
    """
    Returns: (final_total, discount_amount, coupon_obj_or_none)
    """
    final_total = cart_total
    discount_amount = Decimal("0.00")
    coupon_obj = None

    if not coupon_code and not coupon_id:
        return final_total, discount_amount, coupon_obj

    try:
        if coupon_id:
            coupon_obj = Coupon.objects.get(id=coupon_id, active=True)
        else:
            coupon_obj = Coupon.objects.get(coupon_code__iexact=coupon_code.strip(), active=True)
    except Coupon.DoesNotExist:
        return final_total, discount_amount, None

    if coupon_obj.expiry_date and timezone.now() > coupon_obj.expiry_date:
        return final_total, discount_amount, None

    if coupon_obj.usage_limit is not None and coupon_obj.usage_count >= coupon_obj.usage_limit:
        return final_total, discount_amount, None

    if coupon_obj.specific_users.exists() and not coupon_obj.specific_users.filter(id=user.id).exists():
        return final_total, discount_amount, None

    if coupon_obj.minimum_order and cart_total < coupon_obj.minimum_order:
        return final_total, discount_amount, None

    if coupon_obj.discount_type == "percentage":
        discount_amount = (cart_total * Decimal(str(coupon_obj.discount))) / Decimal("100")
    else:
        discount_amount = min(Decimal(str(coupon_obj.discount)), cart_total)

    final_total = max(Decimal("0.00"), cart_total - discount_amount)
    return final_total, discount_amount, coupon_obj


def _mobile_create_order_from_cart(
    user,
    address_obj,
    payment_method,
    paid_status,
    order_note="Null",
    delivery_method="Door Step Delivery",
    total_override=None,
    coupon_used=False,
):
    """
    Creates CartOrder + CartOrderItems from current user's Cart
    and clears cart after success.
    """
    cart_items = Cart.objects.filter(user=user).select_related("product")
    if not cart_items.exists():
        raise ValueError("Your cart is empty.")

    if total_override is not None:
        total = Decimal(str(total_override))
    else:
        total = Decimal("0.00")
        for c in cart_items:
            total += (c.product.price * c.qty)

    with transaction.atomic():
        order = CartOrder.objects.create(
            user=user,
            price=total,
            coupon_used=coupon_used,
            order_note=order_note or "Null",
            address=address_obj.address,
            apartment_floor=address_obj.apartment,
            city=address_obj.city,
            state=address_obj.state,
            postal=address_obj.postal,
            first_name=address_obj.first_name,
            last_name=address_obj.last_name,
            phone_number=address_obj.phone,
            delivery_method=delivery_method or "Door Step Delivery",
            payment_method=payment_method,
            email_address=user.email,
            session_token=str(uuid.uuid4()),
            paid_status=paid_status,
            product_status="Placed",
        )

        for c in cart_items:
            product = c.product
            qty = int(c.qty)

            # Reduce stock only for paid flows
            if paid_status:
                if hasattr(product, "reduce_stock"):
                    product.reduce_stock(qty)
                else:
                    if product.stock_count is not None:
                        product.stock_count = max(0, product.stock_count - qty)
                        product.save(update_fields=["stock_count"])

            CartOrderItems.objects.create(
                order=order,
                user=user,
                invoice_no="#" + str(order.id),
                item=product.title,
                image=product.image,
                qty=qty,
                price=product.price,
                total=product.price * qty,
                product_ref=product,
                vendor=product.vendor.name if product.vendor else "Trenva",
                vendor_id=product.vendor.vid if product.vendor else "1",
                product_color=c.product_color or "",
                product_size=c.product_size or "",
            )

            # Optional color stock reduction
            if c.product_color and c.product_color != "Default":
                color_obj = ProductColor.objects.filter(
                    product=product, color_name=c.product_color
                ).first()
                if color_obj and hasattr(color_obj, "stock"):
                    color_obj.stock = max(0, color_obj.stock - qty)
                    color_obj.save(update_fields=["stock"])

            # Optional size stock reduction
            if c.product_size and c.product_size != "Default":
                size_obj = ProductSize.objects.filter(
                    product=product, size=c.product_size
                ).first()
                if size_obj and hasattr(size_obj, "stock"):
                    size_obj.stock = max(0, size_obj.stock - qty)
                    size_obj.save(update_fields=["stock"])

        # Clear cart after order creation
        cart_items.delete()

    return order


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mobile_paystack_init(request):
    """
    POST body:
    {
      "address_id": 123,
      "delivery_method": "Door Step Delivery",
      "order_note": "Leave at gate",
      "coupon_code": "ABC123",   # optional
      "coupon_id": 1             # optional
    }
    """
    user = request.user
    address_id = request.data.get("address_id")
    delivery_method = request.data.get("delivery_method", "Door Step Delivery")
    order_note = request.data.get("order_note", "Null")
    coupon_code = request.data.get("coupon_code", "")
    coupon_id = request.data.get("coupon_id")

    if not address_id:
        return Response(
            {"success": False, "error": "address_id is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        address_obj = Address.objects.get(id=address_id, user=user, delete=False)
    except Address.DoesNotExist:
        return Response(
            {"success": False, "error": "Invalid address selected"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cart_items, cart_total = _mobile_calculate_cart_total(user)
    if not cart_items.exists():
        return Response(
            {"success": False, "error": "Your cart is empty"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    final_total, discount_amount, coupon_obj = _apply_coupon_to_total_for_user(
        user=user,
        cart_total=cart_total,
        coupon_code=coupon_code,
        coupon_id=coupon_id,
    )

    amount_kobo = int(final_total * 100)
    reference = f"TVA_{shortuuid.uuid()}"
    callback_url = request.data.get("callback_url") or "https://trenva.store/ng/paystack-verify/"

    # Persist checkout context for verify step
    cache_key = f"mobile_paystack_ctx:{reference}"
    cache.set(
        cache_key,
        {
            "user_id": user.id,
            "address_id": address_obj.id,
            "delivery_method": delivery_method,
            "order_note": order_note,
            "total": str(final_total),
            "coupon_id": coupon_obj.id if coupon_obj else None,
            "coupon_code": coupon_obj.coupon_code if coupon_obj else "",
            "discount_amount": str(discount_amount),
        },
        timeout=60 * 30,
    )

    url = "https://api.paystack.co/transaction/initialize"
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET}",
        "Content-Type": "application/json",
    }
    payload = {
        "email": user.email,
        "amount": amount_kobo,
        "reference": reference,
        "callback_url": callback_url,
        "metadata": {
            "source": "mobile_app",
            "user_id": user.id,
            "address_id": address_obj.id,
        },
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=20)
        data = resp.json()

        if resp.status_code >= 400 or not data.get("status"):
            return Response(
                {
                    "success": False,
                    "error": data.get("message", "Paystack initialization failed"),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "authorization_url": data["data"]["authorization_url"],
                "reference": reference,
                "amount": str(final_total),
                "discount_amount": str(discount_amount),
                "coupon_code": coupon_obj.coupon_code if coupon_obj else "",
            },
            status=status.HTTP_200_OK,
        )
    except requests.RequestException:
        return Response(
            {"success": False, "error": "Paystack API error"},
            status=status.HTTP_502_BAD_GATEWAY,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mobile_paystack_verify(request):
    """
    POST body:
    {
      "reference": "TVA_xxxxx"
    }
    """
    user = request.user
    reference = request.data.get("reference")
    if not reference:
        return Response(
            {"success": False, "error": "reference is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cache_key = f"mobile_paystack_ctx:{reference}"
    ctx = cache.get(cache_key)
    if not ctx:
        return Response(
            {"success": False, "error": "Payment session expired. Re-init payment."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if ctx.get("user_id") != user.id:
        return Response(
            {"success": False, "error": "Unauthorized payment context"},
            status=status.HTTP_403_FORBIDDEN,
        )

    verify_url = f"https://api.paystack.co/transaction/verify/{reference}"
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET}",
        "Content-Type": "application/json",
    }

    try:
        resp = requests.get(verify_url, headers=headers, timeout=20)
        data = resp.json()
    except requests.RequestException:
        return Response(
            {"success": False, "error": "Paystack verify API error"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    ok = (
        data.get("status") is True
        and data.get("data", {}).get("status") in ["success", "completed"]
    )
    if not ok:
        return Response(
            {
                "success": False,
                "error": data.get("message", "Payment verification failed"),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        address_obj = Address.objects.get(id=ctx["address_id"], user=user, delete=False)
    except Address.DoesNotExist:
        return Response(
            {"success": False, "error": "Selected address no longer exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        ctx_total = Decimal(str(ctx.get("total", "0")))
        ctx_coupon_id = ctx.get("coupon_id")
        ctx_coupon_obj = Coupon.objects.filter(id=ctx_coupon_id).first() if ctx_coupon_id else None

        order = _mobile_create_order_from_cart(
            user=user,
            address_obj=address_obj,
            payment_method="Paystack",
            paid_status=True,
            order_note=ctx.get("order_note", "Null"),
            delivery_method=ctx.get("delivery_method", "Door Step Delivery"),
            total_override=ctx_total,
            coupon_used=bool(ctx_coupon_obj),
        )

        # Mark coupon usage after successful order
        if ctx_coupon_obj:
            Coupon.objects.filter(id=ctx_coupon_obj.id).update(usage_count=F("usage_count") + 1)
            CouponEmail.objects.get_or_create(coupon=ctx_coupon_obj, user_email=user.email)

        cache.delete(cache_key)

        return Response(
            {
                "success": True,
                "order_id": order.id,
                "oid": order.oid,
                "message": "Payment verified and order placed successfully",
            },
            status=status.HTTP_200_OK,
        )
    except ValueError as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception:
        return Response(
            {"success": False, "error": "Could not place order after payment verification"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mobile_wallet_checkout(request):
    """
    POST body:
    {
      "address_id": 123,
      "delivery_method": "Door Step Delivery",
      "order_note": "Leave at gate",
      "coupon_code": "ABC123",   # optional
      "coupon_id": 1             # optional
    }
    """
    user = request.user
    address_id = request.data.get("address_id")
    delivery_method = request.data.get("delivery_method", "Door Step Delivery")
    order_note = request.data.get("order_note", "Null")
    coupon_code = request.data.get("coupon_code", "")
    coupon_id = request.data.get("coupon_id")

    if not address_id:
        return Response(
            {"success": False, "error": "address_id is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        address_obj = Address.objects.get(id=address_id, user=user, delete=False)
    except Address.DoesNotExist:
        return Response(
            {"success": False, "error": "Invalid address selected"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cart_items, cart_total = _mobile_calculate_cart_total(user)
    if not cart_items.exists():
        return Response(
            {"success": False, "error": "Your cart is empty"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    final_total, discount_amount, coupon_obj = _apply_coupon_to_total_for_user(
        user=user,
        cart_total=cart_total,
        coupon_code=coupon_code,
        coupon_id=coupon_id,
    )

    wallet, _ = Wallet.objects.get_or_create(user=user, defaults={"balance": Decimal("0.00")})
    if wallet.balance < final_total:
        return Response(
            {
                "success": False,
                "error": "Insufficient wallet balance",
                "wallet_balance": str(wallet.balance),
                "required": str(final_total),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        with transaction.atomic():
            wallet.balance -= final_total
            wallet.save(update_fields=["balance"])

            trx_ref = f"ORDER_{shortuuid.uuid()}"
            Transaction.objects.create(
                wallet=wallet,
                amount=final_total,
                transaction_type="debit",
                status="success",
                reference=trx_ref,
                description=f"Payment for order via wallet ({trx_ref})",
                balance_after=wallet.balance,
            )

            order = _mobile_create_order_from_cart(
                user=user,
                address_obj=address_obj,
                payment_method="TrenvaWallet",
                paid_status=True,
                order_note=order_note,
                delivery_method=delivery_method,
                total_override=final_total,
                coupon_used=bool(coupon_obj),
            )

            # Mark coupon usage after successful order
            if coupon_obj:
                Coupon.objects.filter(id=coupon_obj.id).update(usage_count=F("usage_count") + 1)
                CouponEmail.objects.get_or_create(coupon=coupon_obj, user_email=user.email)

        return Response(
            {
                "success": True,
                "order_id": order.id,
                "oid": order.oid,
                "wallet_balance": str(wallet.balance),
                "discount_amount": str(discount_amount),
                "coupon_code": coupon_obj.coupon_code if coupon_obj else "",
                "message": "Wallet payment successful and order placed",
            },
            status=status.HTTP_200_OK,
        )
    except ValueError as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception:
        return Response(
            {"success": False, "error": "Wallet checkout failed"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
