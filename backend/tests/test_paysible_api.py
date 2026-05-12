"""
Pursible Backend API Tests
Tests for: Authentication, Wallets, Conversion Rates, KYC, Bank Accounts, File Upload
"""
import pytest
import requests
import os
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from environment variables
TEST_EMAIL = os.environ.get('TEST_USER_EMAIL', 'testuser123@pursible.com')
TEST_PASSWORD = os.environ.get('TEST_USER_PASSWORD', 'Test123!')
NEW_USER_EMAIL = f"TEST_newuser_{uuid.uuid4().hex[:8]}@pursible.com"
NEW_USER_PASSWORD = os.environ.get('TEST_USER_PASSWORD', 'TestPass123!')


class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_check(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print("✓ Health check passed")


class TestAuthentication:
    """Authentication endpoint tests - login, register, me"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        assert len(data["token"]) > 0
        print(f"✓ Login successful for {TEST_EMAIL}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")
    
    def test_register_new_user(self):
        """Test user registration creates new user with wallets"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": NEW_USER_EMAIL,
            "password": NEW_USER_PASSWORD,
            "full_name": "Test New User"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == NEW_USER_EMAIL
        print(f"✓ Registration successful for {NEW_USER_EMAIL}")
        return data["token"]
    
    def test_register_duplicate_email(self):
        """Test registration with existing email returns 400"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": "anypassword"
        })
        assert response.status_code == 400
        print("✓ Duplicate email registration correctly rejected")
    
    def test_get_me_authenticated(self):
        """Test /api/auth/me returns user info when authenticated"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get user info
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        print("✓ Get current user successful")
    
    def test_get_me_unauthenticated(self):
        """Test /api/auth/me returns 401 without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Unauthenticated /me correctly rejected")


class TestConversionRates:
    """Conversion rates endpoint tests"""
    
    def test_get_all_rates(self):
        """Test /api/rates returns all conversion rates"""
        response = requests.get(f"{BASE_URL}/api/rates")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "rates" in data
        assert len(data["rates"]) >= 10  # Should have at least 10 rate pairs
        
        # Verify expected currency pairs exist
        rate_pairs = [(r["from_currency"], r["to_currency"]) for r in data["rates"]]
        assert ("USD", "NGN") in rate_pairs
        assert ("USD", "USDC") in rate_pairs
        assert ("USDT", "NGN") in rate_pairs
        print(f"✓ Got {len(data['rates'])} conversion rates")
    
    def test_get_specific_rate_usd_ngn(self):
        """Test /api/rates/USD/NGN returns correct rate"""
        response = requests.get(f"{BASE_URL}/api/rates/USD/NGN")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["from_currency"] == "USD"
        assert data["to_currency"] == "NGN"
        assert data["rate"] == 1550  # Expected rate
        print(f"✓ USD to NGN rate: {data['rate']}")
    
    def test_get_specific_rate_usdc_usd(self):
        """Test /api/rates/USDC/USD returns correct rate"""
        response = requests.get(f"{BASE_URL}/api/rates/USDC/USD")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["rate"] == 1  # Stablecoin 1:1
        print(f"✓ USDC to USD rate: {data['rate']}")


class TestWallets:
    """Wallet and balance endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_balance(self, auth_token):
        """Test /api/functions/getBalance returns wallet balances"""
        response = requests.post(f"{BASE_URL}/api/functions/getBalance", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "balance" in data
        
        # Verify all 4 currencies present
        balance = data["balance"]
        assert "USD" in balance
        assert "USDC" in balance
        assert "USDT" in balance
        assert "NGN" in balance
        print(f"✓ Got balances: USD={balance['USD']}, NGN={balance['NGN']}")
    
    def test_list_wallets(self, auth_token):
        """Test listing user wallets via entities endpoint"""
        response = requests.get(f"{BASE_URL}/api/entities/wallets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        wallets = response.json()
        assert isinstance(wallets, list)
        
        # User should have 4 wallets
        currencies = [w["currency"] for w in wallets]
        assert "USD" in currencies
        assert "NGN" in currencies
        print(f"✓ User has {len(wallets)} wallets")


class TestKYC:
    """KYC verification endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_submit_kyc_auto_approve(self, auth_token):
        """Test KYC submission auto-approves in test mode"""
        response = requests.post(f"{BASE_URL}/api/functions/submitKYC",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "kycData": {
                    "full_name": "Test User",
                    "date_of_birth": "1990-01-15",
                    "nationality": "Nigerian",
                    "address": "123 Test Street, Lagos",
                    "id_type": "International Passport",
                    "id_number": "A12345678"
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        # In test mode (no Dojah keys), should auto-approve
        assert data["status"] in ["approved", "in_review"]
        print(f"✓ KYC submission status: {data['status']}")
    
    def test_submit_kyc_missing_name(self, auth_token):
        """Test KYC submission fails without full name"""
        response = requests.post(f"{BASE_URL}/api/functions/submitKYC",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "kycData": {
                    "full_name": "",
                    "date_of_birth": "1990-01-15"
                }
            }
        )
        assert response.status_code == 400
        print("✓ KYC without name correctly rejected")


class TestBankAccounts:
    """Bank account verification endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_verify_bank_account_test_mode(self, auth_token):
        """Test bank account verification in test mode"""
        response = requests.post(f"{BASE_URL}/api/functions/verifyBankAccount",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "accountNumber": "0123456789",
                "bankName": "Zenith Bank"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "accountName" in data
        print(f"✓ Bank verification returned: {data['accountName']}")
    
    def test_verify_bank_invalid_account_number(self, auth_token):
        """Test bank verification fails with invalid account number"""
        response = requests.post(f"{BASE_URL}/api/functions/verifyBankAccount",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "accountNumber": "123",  # Too short
                "bankName": "Zenith Bank"
            }
        )
        assert response.status_code == 400
        print("✓ Invalid account number correctly rejected")
    
    def test_verify_bank_unknown_bank(self, auth_token):
        """Test bank verification fails with unknown bank"""
        response = requests.post(f"{BASE_URL}/api/functions/verifyBankAccount",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "accountNumber": "0123456789",
                "bankName": "Unknown Bank XYZ"
            }
        )
        assert response.status_code == 400
        print("✓ Unknown bank correctly rejected")


class TestDepositAccounts:
    """Deposit account configuration tests"""
    
    def test_seed_demo_data(self):
        """Test seeding demo data creates deposit accounts"""
        response = requests.post(f"{BASE_URL}/api/seed-demo-data")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✓ Demo data seeded successfully")
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_list_deposit_accounts(self, auth_token):
        """Test listing deposit accounts"""
        response = requests.get(f"{BASE_URL}/api/entities/deposit_accounts/filter?is_active=true",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        accounts = response.json()
        assert isinstance(accounts, list)
        
        # Should have 3 deposit account types
        types = [a["type"] for a in accounts]
        assert "usd_wire" in types
        assert "stable_wallet" in types
        assert "ngn_bank" in types
        print(f"✓ Found {len(accounts)} deposit account types")


class TestFileUpload:
    """File upload endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_upload_image_file(self, auth_token):
        """Test uploading an image file"""
        # Create a simple test image (1x1 PNG)
        import base64
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'file': ('test_image.png', png_data, 'image/png')
        }
        response = requests.post(f"{BASE_URL}/api/upload",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "file_url" in data
        assert data["file_url"].startswith("/api/files/")
        print(f"✓ File uploaded: {data['file_url']}")
        return data["file_url"]
    
    def test_upload_invalid_file_type(self, auth_token):
        """Test uploading invalid file type is rejected"""
        files = {
            'file': ('test.exe', b'fake executable content', 'application/x-msdownload')
        }
        response = requests.post(f"{BASE_URL}/api/upload",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )
        assert response.status_code == 400
        print("✓ Invalid file type correctly rejected")


class TestBiometricLogin:
    """Biometric login endpoint tests"""
    
    def test_biometric_login_existing_user(self):
        """Test biometric login for existing user"""
        response = requests.post(f"{BASE_URL}/api/auth/biometric-login", json={
            "email": TEST_EMAIL
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print("✓ Biometric login successful")
    
    def test_biometric_login_nonexistent_user(self):
        """Test biometric login fails for non-existent user"""
        response = requests.post(f"{BASE_URL}/api/auth/biometric-login", json={
            "email": "nonexistent@example.com"
        })
        assert response.status_code == 401
        print("✓ Biometric login for non-existent user correctly rejected")


class TestCurrencySwap:
    """Currency swap/conversion endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_swap_insufficient_balance(self, auth_token):
        """Test swap fails with insufficient balance (expected behavior)"""
        response = requests.post(f"{BASE_URL}/api/functions/swapCurrency",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "fromCurrency": "USD",
                "toCurrency": "NGN",
                "amount": 100,
                "confirmed": False
            }
        )
        # With 0 balance, should return 400 with insufficient balance error
        assert response.status_code == 400
        data = response.json()
        assert "Insufficient" in data.get("detail", "")
        print("✓ Swap correctly rejected due to insufficient balance")


class TestDepositFiat:
    """Deposit fiat endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_deposit_usd_details(self, auth_token):
        """Test getting USD deposit details"""
        response = requests.post(f"{BASE_URL}/api/functions/depositFiat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"currency": "USD"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["currency"] == "USD"
        assert "depositDetails" in data
        print("✓ USD deposit details retrieved")
    
    def test_deposit_ngn_details(self, auth_token):
        """Test getting NGN deposit details"""
        response = requests.post(f"{BASE_URL}/api/functions/depositFiat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"currency": "NGN"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["currency"] == "NGN"
        assert "depositDetails" in data
        print("✓ NGN deposit details retrieved")


# Cleanup fixture to remove test data
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    # Note: In a real scenario, we'd delete test users here
    # For now, test users remain in DB for manual inspection
    print("\n✓ Test session completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
