"""
Test Suite for Security Migration - httpOnly Cookies
Tests the migration from localStorage/sessionStorage to httpOnly cookies
and server-side MongoDB storage for auth tokens, biometric data, and push tokens.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('VITE_BACKEND_URL', 'https://backend-api-hub-1.preview.emergentagent.com')

# Test credentials from review request
TEST_USER = {"email": "securitytest@pursible.com", "password": "Test123!"}
ADMIN_USER = {"email": "testadmin123@pursible.com", "password": "Admin123!"}

# Cookie name used by the backend
COOKIE_NAME = "pursible_auth"


class TestHealthEndpoint:
    """Basic health check"""
    
    def test_health_check(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")


class TestHttpOnlyCookieAuth:
    """Test httpOnly cookie-based authentication"""
    
    def test_login_sets_httponly_cookie(self):
        """Login should set httpOnly cookie"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_USER
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        # Check that cookie is set (pursible_auth is the cookie name)
        cookies = session.cookies.get_dict()
        assert COOKIE_NAME in cookies, f"{COOKIE_NAME} cookie not set, got: {list(cookies.keys())}"
        
        # Verify response contains user data
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_USER["email"]
        print(f"✓ Login successful, cookie set: {list(cookies.keys())}")
        
    def test_auth_me_with_cookie(self):
        """GET /auth/me should work with httpOnly cookie"""
        session = requests.Session()
        
        # Login first
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_USER
        )
        assert login_response.status_code == 200
        
        # Now call /auth/me - cookie should be sent automatically
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200, f"GET /auth/me failed: {me_response.text}"
        
        data = me_response.json()
        assert data["email"] == TEST_USER["email"]
        print(f"✓ GET /auth/me works with cookie, user: {data['email']}")
        
    def test_logout_clears_cookie(self):
        """Logout should clear httpOnly cookie"""
        session = requests.Session()
        
        # Login first
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_USER
        )
        assert login_response.status_code == 200
        
        # Verify we're logged in
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        
        # Logout
        logout_response = session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_response.status_code == 200
        data = logout_response.json()
        assert data["success"] == True
        
        # Verify /auth/me now fails
        me_after_logout = session.get(f"{BASE_URL}/api/auth/me")
        assert me_after_logout.status_code == 401, f"Expected 401 after logout, got {me_after_logout.status_code}"
        print("✓ Logout clears cookie, /auth/me returns 401")
        
    def test_token_refresh(self):
        """Token refresh should work with cookie"""
        session = requests.Session()
        
        # Login first
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_USER
        )
        assert login_response.status_code == 200
        
        # Refresh token
        refresh_response = session.post(f"{BASE_URL}/api/auth/refresh")
        assert refresh_response.status_code == 200
        data = refresh_response.json()
        assert data["success"] == True
        print("✓ Token refresh works with cookie")


class TestBiometricEndpoints:
    """Test biometric credential management endpoints"""
    
    @pytest.fixture
    def authenticated_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_USER
        )
        assert response.status_code == 200
        return session
    
    def test_biometric_register(self, authenticated_session):
        """POST /api/biometric/register should store credentials"""
        response = authenticated_session.post(
            f"{BASE_URL}/api/biometric/register",
            json={
                "credential_id": "test-credential-id-123",
                "credential_raw_id": "test-raw-id-456",
                "public_key": "test-public-key-789"
            }
        )
        assert response.status_code == 200, f"Biometric register failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        print("✓ Biometric register works")
        
    def test_biometric_status(self, authenticated_session):
        """GET /api/biometric/status should return status"""
        response = authenticated_session.get(f"{BASE_URL}/api/biometric/status")
        assert response.status_code == 200, f"Biometric status failed: {response.text}"
        data = response.json()
        assert "biometric_enabled" in data
        assert "has_credentials" in data
        print(f"✓ Biometric status: enabled={data['biometric_enabled']}, has_credentials={data['has_credentials']}")
        
    def test_biometric_verify(self, authenticated_session):
        """POST /api/biometric/verify should verify credentials"""
        # First register a credential
        authenticated_session.post(
            f"{BASE_URL}/api/biometric/register",
            json={
                "credential_id": "verify-test-credential",
                "credential_raw_id": "verify-test-raw-id",
                "public_key": "verify-test-public-key"
            }
        )
        
        # Now verify it (using a new session without auth)
        verify_response = requests.post(
            f"{BASE_URL}/api/biometric/verify",
            json={
                "credential_id": "verify-test-credential"
            }
        )
        assert verify_response.status_code == 200, f"Biometric verify failed: {verify_response.text}"
        data = verify_response.json()
        assert data["success"] == True
        assert data["verified"] == True
        print(f"✓ Biometric verify works, email: {data.get('email')}")
        
    def test_biometric_delete(self, authenticated_session):
        """DELETE /api/biometric/credential should disable biometric"""
        response = authenticated_session.delete(f"{BASE_URL}/api/biometric/credential")
        assert response.status_code == 200, f"Biometric delete failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        print("✓ Biometric delete works")


class TestPushNotificationEndpoints:
    """Test push notification token management endpoints"""
    
    @pytest.fixture
    def authenticated_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_USER
        )
        assert response.status_code == 200
        return session
    
    def test_push_register_token(self, authenticated_session):
        """POST /api/push/register-token should store push token"""
        response = authenticated_session.post(
            f"{BASE_URL}/api/push/register-token",
            json={
                "token": "test-fcm-token-abc123",
                "device_type": "web"
            }
        )
        assert response.status_code == 200, f"Push register failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        print("✓ Push token register works")
        
    def test_push_get_settings(self, authenticated_session):
        """GET /api/push/settings should return notification settings"""
        response = authenticated_session.get(f"{BASE_URL}/api/push/settings")
        assert response.status_code == 200, f"Push settings failed: {response.text}"
        data = response.json()
        assert "settings" in data
        print(f"✓ Push settings: {data['settings']}")
        
    def test_push_update_settings(self, authenticated_session):
        """PATCH /api/push/settings should update notification settings"""
        response = authenticated_session.patch(
            f"{BASE_URL}/api/push/settings",
            json={
                "transactions": True,
                "rateAlerts": False,
                "security": True,
                "marketing": False
            }
        )
        assert response.status_code == 200, f"Push settings update failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        print("✓ Push settings update works")
        
    def test_push_delete_token(self, authenticated_session):
        """DELETE /api/push/token should clear push token"""
        response = authenticated_session.delete(f"{BASE_URL}/api/push/token")
        assert response.status_code == 200, f"Push delete failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        print("✓ Push token delete works")


class TestAdminAccess:
    """Test admin user access - SKIPPED if admin user doesn't exist"""
    
    def test_admin_login(self):
        """Admin user should be able to login"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_USER
        )
        if response.status_code == 401:
            pytest.skip("Admin user not found in database - may need to be created")
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert data["user"]["email"] == ADMIN_USER["email"]
        print(f"✓ Admin login successful, role: {data['user'].get('role')}")
        
    def test_admin_me_endpoint(self):
        """Admin /auth/me should return admin role"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_USER
        )
        if login_response.status_code == 401:
            pytest.skip("Admin user not found in database - may need to be created")
        assert login_response.status_code == 200
        
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        data = me_response.json()
        assert data["email"] == ADMIN_USER["email"]
        print(f"✓ Admin /auth/me works, role: {data.get('role')}")


class TestUnauthenticatedAccess:
    """Test that protected endpoints require authentication"""
    
    def test_biometric_status_requires_auth(self):
        """GET /api/biometric/status should require auth"""
        response = requests.get(f"{BASE_URL}/api/biometric/status")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Biometric status requires auth")
        
    def test_push_settings_requires_auth(self):
        """GET /api/push/settings should require auth"""
        response = requests.get(f"{BASE_URL}/api/push/settings")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Push settings requires auth")
        
    def test_biometric_register_requires_auth(self):
        """POST /api/biometric/register should require auth"""
        response = requests.post(
            f"{BASE_URL}/api/biometric/register",
            json={"credential_id": "test", "credential_raw_id": "test"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Biometric register requires auth")
        
    def test_push_register_requires_auth(self):
        """POST /api/push/register-token should require auth"""
        response = requests.post(
            f"{BASE_URL}/api/push/register-token",
            json={"token": "test"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Push register requires auth")


class TestWalletAndTransactions:
    """Test wallet and transaction endpoints still work with cookie auth"""
    
    @pytest.fixture
    def authenticated_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_USER
        )
        assert response.status_code == 200
        return session
    
    def test_get_wallets(self, authenticated_session):
        """GET /api/entities/wallets should work with cookie auth"""
        response = authenticated_session.get(f"{BASE_URL}/api/entities/wallets")
        assert response.status_code == 200, f"Get wallets failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get wallets works, count: {len(data)}")
        
    def test_get_balance(self, authenticated_session):
        """POST /api/functions/getBalance should work with cookie auth"""
        response = authenticated_session.post(f"{BASE_URL}/api/functions/getBalance", json={})
        assert response.status_code == 200, f"Get balance failed: {response.text}"
        data = response.json()
        assert "usd" in data or "USD" in str(data) or "balances" in data
        print(f"✓ Get balance works")
        
    def test_get_transactions(self, authenticated_session):
        """GET /api/entities/transactions should work with cookie auth"""
        response = authenticated_session.get(f"{BASE_URL}/api/entities/transactions")
        assert response.status_code == 200, f"Get transactions failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get transactions works, count: {len(data)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
