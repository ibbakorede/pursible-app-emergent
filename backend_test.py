#!/usr/bin/env python3
"""
Backend API Testing for Paysible Fintech App
Tests all critical endpoints including auth, balance, and health checks
"""
import requests
import sys
import json
from datetime import datetime

class PaysibleAPITester:
    def __init__(self, base_url="https://backend-api-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.user_email = f"test_user_{datetime.now().strftime('%H%M%S')}@example.com"
        self.user_password = "TestPass123!"

    def log_test(self, name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)
            else:
                self.log_test(name, False, f"Unsupported method: {method}")
                return False, {}

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            if success:
                self.log_test(name, True, response_data=response_data)
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}")

            return success, response_data

        except requests.exceptions.Timeout:
            self.log_test(name, False, "Request timeout (10s)")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_test(name, False, "Connection error - backend may be down")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_health_endpoint(self):
        """Test /api/health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        return success

    def test_register(self):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": self.user_email,
                "password": self.user_password,
                "full_name": "Test User"
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   ✅ Token received: {self.token[:20]}...")
            return True
        return False

    def test_login(self):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": self.user_email,
                "password": self.user_password
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   ✅ Login token received: {self.token[:20]}...")
            return True
        return False

    def test_get_balance(self):
        """Test get balance endpoint with auth token"""
        if not self.token:
            self.log_test("Get Balance", False, "No auth token available")
            return False
            
        success, response = self.run_test(
            "Get Balance",
            "POST",
            "functions/getBalance",
            200
        )
        
        if success and 'balance' in response:
            print(f"   ✅ Balance data: {response['balance']}")
            return True
        return False

    def test_auth_me(self):
        """Test /auth/me endpoint"""
        if not self.token:
            self.log_test("Auth Me", False, "No auth token available")
            return False
            
        success, response = self.run_test(
            "Auth Me",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_wallet(self):
        """Test wallet creation"""
        if not self.token:
            self.log_test("Create Wallet", False, "No auth token available")
            return False
            
        success, response = self.run_test(
            "Create User Wallet",
            "POST",
            "functions/createUserWallet",
            200
        )
        return success

    def test_unauthorized_access(self):
        """Test that protected endpoints require auth"""
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Unauthorized Access Test",
            "POST",
            "functions/getBalance",
            401  # Should return 401 Unauthorized
        )
        
        # Restore token
        self.token = temp_token
        return success

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Paysible Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Test 1: Health check (no auth required)
        health_ok = self.test_health_endpoint()
        
        if not health_ok:
            print("\n❌ CRITICAL: Health endpoint failed. Backend may be down.")
            return self.generate_report()

        # Test 2: User registration
        register_ok = self.test_register()
        
        if not register_ok:
            print("\n❌ CRITICAL: User registration failed. Cannot proceed with auth tests.")
            return self.generate_report()

        # Test 3: User login (with different user session)
        login_ok = self.test_login()

        # Test 4: Auth me endpoint
        self.test_auth_me()

        # Test 5: Create wallet
        self.test_create_wallet()

        # Test 6: Get balance (main feature to test)
        self.test_get_balance()

        # Test 7: Unauthorized access
        self.test_unauthorized_access()

        return self.generate_report()

    def generate_report(self):
        """Generate test report"""
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED!")
            return 0
        else:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
            return 1

def main():
    """Main test execution"""
    tester = PaysibleAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())