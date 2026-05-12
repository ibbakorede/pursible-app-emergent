"""
Pursible Backend Tests - Bug Fixes Verification
Tests for the 4 reported bugs:
1. Deposit Funds tab - DepositAccount entity
2. Currency Conversion rates - /api/rates endpoint
3. Bank Account list - BottomSheetSelect (frontend only)
4. KYC Document Upload - /api/upload endpoint
"""
import pytest
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://backend-api-hub-1.preview.emergentagent.com')

# Test credentials from environment variables
TEST_EMAIL = os.environ.get('TEST_USER_EMAIL', 'testuser123@pursible.com')
TEST_PASSWORD = os.environ.get('TEST_USER_PASSWORD', 'Test123!')


class TestHealthAndSetup:
    """Basic health and setup tests"""
    
    def test_health_endpoint(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health endpoint working")
    
    def test_seed_demo_data(self):
        """Test seeding demo data"""
        response = requests.post(f"{BASE_URL}/api/seed-demo-data")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✓ Demo data seeded successfully")


class TestAuthentication:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful for {TEST_EMAIL}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpass"}
        )
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")


class TestBug1DepositAccounts:
    """Bug 1: Deposit Funds tab - DepositAccount entity tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_deposit_accounts_exist(self, auth_token):
        """Test that deposit accounts are seeded and accessible"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/entities/deposit_accounts/filter?is_active=true",
            headers=headers
        )
        assert response.status_code == 200
        accounts = response.json()
        assert len(accounts) >= 3, "Should have at least 3 deposit account types"
        print(f"✓ Found {len(accounts)} deposit accounts")
        
        # Verify all 3 types exist
        types = [acc["type"] for acc in accounts]
        assert "usd_wire" in types, "Missing USD Wire deposit account"
        assert "stable_wallet" in types, "Missing Stablecoin deposit account"
        assert "ngn_bank" in types, "Missing NGN Bank deposit account"
        print("✓ All 3 deposit account types present (usd_wire, stable_wallet, ngn_bank)")
    
    def test_usd_wire_account_fields(self, auth_token):
        """Test USD Wire account has correct fields"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/entities/deposit_accounts/filter?type=usd_wire",
            headers=headers
        )
        assert response.status_code == 200
        accounts = response.json()
        assert len(accounts) > 0
        
        usd_account = accounts[0]
        assert usd_account["label"] == "USD Wire Transfer"
        assert "fields" in usd_account
        
        field_keys = [f["key"] for f in usd_account["fields"]]
        assert "bank_name" in field_keys
        assert "account_number" in field_keys
        print("✓ USD Wire account has correct structure and fields")
    
    def test_stable_wallet_account_fields(self, auth_token):
        """Test Stablecoin account has correct fields"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/entities/deposit_accounts/filter?type=stable_wallet",
            headers=headers
        )
        assert response.status_code == 200
        accounts = response.json()
        assert len(accounts) > 0
        
        stable_account = accounts[0]
        assert stable_account["label"] == "USDT / Stablecoin"
        
        field_keys = [f["key"] for f in stable_account["fields"]]
        assert "wallet_address" in field_keys
        assert "network" in field_keys
        print("✓ Stablecoin account has correct structure and fields")
    
    def test_ngn_bank_account_fields(self, auth_token):
        """Test NGN Bank account has correct fields"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/entities/deposit_accounts/filter?type=ngn_bank",
            headers=headers
        )
        assert response.status_code == 200
        accounts = response.json()
        assert len(accounts) > 0
        
        ngn_account = accounts[0]
        assert ngn_account["label"] == "NGN Bank Transfer"
        
        field_keys = [f["key"] for f in ngn_account["fields"]]
        assert "bank_name" in field_keys
        assert "account_number" in field_keys
        assert "account_name" in field_keys
        print("✓ NGN Bank account has correct structure and fields")


class TestBug2CurrencyConversion:
    """Bug 2: Currency Conversion rates tests"""
    
    def test_rates_endpoint_public(self):
        """Test /api/rates endpoint returns rates without auth"""
        response = requests.get(f"{BASE_URL}/api/rates")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "rates" in data
        assert len(data["rates"]) > 0
        print(f"✓ Rates endpoint returns {len(data['rates'])} rates")
    
    def test_usd_to_ngn_rate_exists(self):
        """Test USD to NGN rate exists and is correct"""
        response = requests.get(f"{BASE_URL}/api/rates")
        assert response.status_code == 200
        rates = response.json()["rates"]
        
        usd_ngn = next((r for r in rates if r["from_currency"] == "USD" and r["to_currency"] == "NGN"), None)
        assert usd_ngn is not None, "USD to NGN rate not found"
        assert usd_ngn["rate"] == 1550, f"Expected rate 1550, got {usd_ngn['rate']}"
        assert usd_ngn["is_active"] == True
        print(f"✓ USD to NGN rate: 1 USD = {usd_ngn['rate']} NGN")
    
    def test_specific_rate_endpoint(self):
        """Test specific rate endpoint /api/rates/{from}/{to}"""
        response = requests.get(f"{BASE_URL}/api/rates/USD/NGN")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["rate"] == 1550
        assert data["from_currency"] == "USD"
        assert data["to_currency"] == "NGN"
        print(f"✓ Specific rate endpoint: 1 USD = {data['rate']} NGN")
    
    def test_all_currency_pairs_have_rates(self):
        """Test all expected currency pairs have rates"""
        response = requests.get(f"{BASE_URL}/api/rates")
        rates = response.json()["rates"]
        
        expected_pairs = [
            ("USD", "NGN"), ("USD", "USDC"), ("USD", "USDT"),
            ("USDC", "NGN"), ("USDC", "USD"),
            ("USDT", "NGN"), ("USDT", "USD"),
            ("NGN", "USD"), ("NGN", "USDC"), ("NGN", "USDT")
        ]
        
        for from_curr, to_curr in expected_pairs:
            rate = next((r for r in rates if r["from_currency"] == from_curr and r["to_currency"] == to_curr), None)
            assert rate is not None, f"Missing rate for {from_curr} to {to_curr}"
        
        print(f"✓ All {len(expected_pairs)} expected currency pairs have rates")


class TestBug4FileUpload:
    """Bug 4: KYC Document Upload tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_upload_png_file(self, auth_token):
        """Test uploading a PNG file"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a minimal valid PNG file
        png_header = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {"file": ("test_document.png", png_header, "image/png")}
        response = requests.post(
            f"{BASE_URL}/api/upload",
            headers=headers,
            files=files
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "file_url" in data
        assert data["file_url"].startswith("/api/files/")
        print(f"✓ PNG upload successful: {data['file_url']}")
    
    def test_upload_jpeg_file(self, auth_token):
        """Test uploading a JPEG file"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a minimal valid JPEG file
        jpeg_header = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9teletext\xff\xd9'
        
        files = {"file": ("test_document.jpg", jpeg_header, "image/jpeg")}
        response = requests.post(
            f"{BASE_URL}/api/upload",
            headers=headers,
            files=files
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "file_url" in data
        print(f"✓ JPEG upload successful: {data['file_url']}")
    
    def test_upload_pdf_file(self, auth_token):
        """Test uploading a PDF file"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a minimal valid PDF file
        pdf_content = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n116\n%%EOF'
        
        files = {"file": ("test_document.pdf", pdf_content, "application/pdf")}
        response = requests.post(
            f"{BASE_URL}/api/upload",
            headers=headers,
            files=files
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "file_url" in data
        print(f"✓ PDF upload successful: {data['file_url']}")
    
    def test_upload_requires_auth(self):
        """Test that upload requires authentication"""
        files = {"file": ("test.png", b'\x89PNG\r\n\x1a\n', "image/png")}
        response = requests.post(
            f"{BASE_URL}/api/upload",
            files=files
        )
        assert response.status_code == 401
        print("✓ Upload correctly requires authentication")
    
    def test_upload_invalid_file_type(self, auth_token):
        """Test that invalid file types are rejected"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        files = {"file": ("test.exe", b'MZ\x90\x00', "application/x-msdownload")}
        response = requests.post(
            f"{BASE_URL}/api/upload",
            headers=headers,
            files=files
        )
        
        assert response.status_code == 400
        print("✓ Invalid file type correctly rejected")
    
    def test_uploaded_file_accessible(self, auth_token):
        """Test that uploaded files can be accessed"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Upload a file first
        png_header = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        files = {"file": ("test_access.png", png_header, "image/png")}
        upload_response = requests.post(
            f"{BASE_URL}/api/upload",
            headers=headers,
            files=files
        )
        
        assert upload_response.status_code == 200
        file_url = upload_response.json()["file_url"]
        
        # Try to access the file
        access_response = requests.get(f"{BASE_URL}{file_url}")
        assert access_response.status_code == 200
        assert access_response.headers.get("content-type") == "image/png"
        print(f"✓ Uploaded file accessible at {file_url}")


class TestConversionRatesEntity:
    """Test ConversionRate entity via entities API"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_list_conversion_rates(self, auth_token):
        """Test listing conversion rates via entity API"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/entities/conversion_rates",
            headers=headers
        )
        assert response.status_code == 200
        rates = response.json()
        assert len(rates) >= 10, "Should have at least 10 conversion rates"
        print(f"✓ Entity API returns {len(rates)} conversion rates")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
