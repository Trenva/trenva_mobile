from django.urls import path
from userauths import views
from .views import verify_email
from userauths.views import (
    CustomTokenObtainPairView, UserRegisterAPIView, UserProfileAPIView,
    ChangePasswordAPIView, PasswordResetRequestAPIView, PasswordResetConfirmAPIView,
    VerifyEmailAPIView, check_email_exists, check_username_exists
)

urlpatterns = [
    # ========== TEMPLATE VIEWS (Your existing views) ==========
    path('signup/', views.signup, name="signup"),
    path('signin/', views.signin, name="login"),
    path('signout/', views.signout, name="signout"),
    path('forget-password/', views.reset_password, name="reset-password"),
    path('create-password/<token>/', views.create_password, name="create-password"),
    path('verify-email/', verify_email, name='verify_email'),
    
    
    # ========== API ENDPOINTS ==========
    # Authentication
    path('api/auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/register/', UserRegisterAPIView.as_view(), name='api_register'),
    
    # User Profile
    path('api/user/profile/', UserProfileAPIView.as_view(), name='api_user_profile'),
    path('api/user/change-password/', ChangePasswordAPIView.as_view(), name='api_change_password'),
    
    # Password Reset
    path('api/auth/password-reset/', PasswordResetRequestAPIView.as_view(), name='api_password_reset'),
    path('api/auth/password-reset-confirm/<uidb64>/<token>/', PasswordResetConfirmAPIView.as_view(), name='api_password_reset_confirm'),
    
    # Email Verification
    path('api/auth/verify-email/', VerifyEmailAPIView.as_view(), name='api_verify_email'),
    
    # Validation endpoints
    path('api/check-email/', check_email_exists, name='api_check_email'),
    path('api/check-username/', check_username_exists, name='api_check_username'),
]