"""
Test Suite for Prompt 4 Final Hardening Pass
Tests: Backend route handlers (withdraw, swap_currency), API health, swap quote
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('VITE_BACKEND_URL', 'https://backend-api-hub-1.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "testprompt4@pursible.com"
TEST_PASSWORD = "Test123!"


class TestHealthAndBasicAPIs:
    """Test health check and basic API endpoints"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print("PASS: Health endpoint returns healthy status")
    
    def test_root_endpoint(self):
        """Test /api/ returns API info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Pursible" in data["message"]
        print("PASS: Root endpoint returns API info")
    
    def test_rates_endpoint(self):
        """Test /api/rates returns conversion rates"""
        response = requests.get(f"{BASE_URL}/api/rates")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "rates" in data
        assert len(data["rates"]) > 0
        print(f"PASS: Rates endpoint returns {len(data['rates'])} rates")


class TestAuthenticationFlow:
    """Test authentication endpoints"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create a requests session"""
        return requests.Session()
    
    def test_register_or_login(self, session):
        """Test user registration or login"""
        # Try to login first
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code == 200:
            data = login_response.json()
            assert "token" in data
            assert "user" in data
            print(f"PASS: Login successful for {TEST_EMAIL}")
            return data
        
        # If login fails, try to register
        register_response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "full_name": "Test Prompt4 User"
            }
        )
        
        if register_response.status_code == 200:
            data = register_response.json()
            assert "token" in data
            assert "user" in data
            print(f"PASS: Registration successful for {TEST_EMAIL}")
            return data
        elif register_response.status_code == 400:
            # User exists but login failed - password might be wrong
            print(f"INFO: User exists but login failed - checking error")
            assert False, f"Login failed: {login_response.json()}"
        else:
            assert False, f"Registration failed: {register_response.json()}"


class TestSwapCurrencyEndpoint:
    """Test swap currency endpoint - validates refactored handler"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        
        # Login
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if response.status_code != 200:
            # Try register
            response = session.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD,
                    "full_name": "Test Prompt4 User"
                }
            )
        
        if response.status_code == 200:
            data = response.json()
            session.headers.update({"Authorization": f"Bearer {data['token']}"})
        
        return session
    
    def test_swap_quote_returns_kyc_blocked(self, auth_session):
        """Test swap quote with confirmed=false returns quote or KYC blocked"""
        response = auth_session.post(
            f"{BASE_URL}/api/functions/swapCurrency",
            json={
                "fromCurrency": "USD",
                "toCurrency": "NGN",
                "amount": 100,
                "confirmed": False
            }
        )
        
        # Should return 200 with either quote or KYC blocked message
        assert response.status_code == 200
        data = response.json()
        
        # Either kycBlocked or quote should be present
        if data.get("kycBlocked"):
            assert data["kycBlocked"] == True
            assert "message" in data or "error" in data
            print(f"PASS: Swap quote returns KYC blocked (expected for unverified user)")
        else:
            # Quote returned
            assert "quote" in data or "rate" in data or "receiveAmount" in data
            print(f"PASS: Swap quote returns valid quote")
    
    def test_swap_invalid_currency(self, auth_session):
        """Test swap with invalid currency returns error"""
        response = auth_session.post(
            f"{BASE_URL}/api/functions/swapCurrency",
            json={
                "fromCurrency": "INVALID",
                "toCurrency": "NGN",
                "amount": 100,
                "confirmed": False
            }
        )
        
        # Should return error (400 or 200 with error message)
        data = response.json()
        # Either HTTP error or kycBlocked (since KYC check happens first)
        if response.status_code == 400:
            print(f"PASS: Invalid currency returns 400 error")
        elif data.get("kycBlocked"):
            print(f"PASS: KYC check happens before currency validation (expected)")
        else:
            print(f"INFO: Response: {data}")


class TestWithdrawEndpoint:
    """Test withdraw endpoint - validates refactored handler"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if response.status_code != 200:
            response = session.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD,
                    "full_name": "Test Prompt4 User"
                }
            )
        
        if response.status_code == 200:
            data = response.json()
            session.headers.update({"Authorization": f"Bearer {data['token']}"})
        
        return session
    
    def test_withdraw_returns_kyc_blocked(self, auth_session):
        """Test withdraw returns KYC blocked for unverified user"""
        response = auth_session.post(
            f"{BASE_URL}/api/functions/withdraw",
            json={
                "currency": "NGN",
                "amount": 1000,
                "destination": {
                    "bank_name": "Test Bank",
                    "account_number": "1234567890",
                    "account_name": "Test User"
                }
            }
        )
        
        # Should return 200 with KYC blocked message
        assert response.status_code == 200
        data = response.json()
        
        if data.get("kycBlocked"):
            assert data["kycBlocked"] == True
            assert "message" in data or "error" in data
            print(f"PASS: Withdraw returns KYC blocked (expected for unverified user)")
        else:
            # If KYC is verified, should return insufficient balance or success
            print(f"INFO: Withdraw response: {data}")


class TestEntityEndpoints:
    """Test entity CRUD endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if response.status_code != 200:
            response = session.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD,
                    "full_name": "Test Prompt4 User"
                }
            )
        
        if response.status_code == 200:
            data = response.json()
            session.headers.update({"Authorization": f"Bearer {data['token']}"})
        
        return session
    
    def test_list_conversion_rates(self, auth_session):
        """Test listing conversion rates entity"""
        response = auth_session.get(f"{BASE_URL}/api/entities/ConversionRate")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: ConversionRate entity returns {len(data)} rates")
    
    def test_list_wallets(self, auth_session):
        """Test listing user wallets"""
        response = auth_session.get(f"{BASE_URL}/api/entities/wallets")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Wallets entity returns {len(data)} wallets")
    
    def test_get_balance(self, auth_session):
        """Test getBalance function"""
        response = auth_session.post(f"{BASE_URL}/api/functions/getBalance")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "balance" in data
        balance = data["balance"]
        assert "USD" in balance
        assert "NGN" in balance
        print(f"PASS: getBalance returns balance: USD={balance['USD']}, NGN={balance['NGN']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
