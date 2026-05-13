"""
Bank Verification Service - Handles bank account verification
"""
from typing import Dict, Any, Optional
import httpx


# Nigerian bank codes for Flutterwave
BANK_CODES: Dict[str, str] = {
    "Access Bank": "044",
    "Citibank": "023",
    "Diamond Bank": "063",
    "Ecobank": "050",
    "Fidelity Bank": "070",
    "First Bank": "011",
    "First City Monument Bank": "214",
    "Guaranty Trust Bank": "058",
    "Heritage Bank": "030",
    "Jaiz Bank": "301",
    "Keystone Bank": "082",
    "Kuda Bank": "50211",
    "Opay": "999992",
    "Palmpay": "999991",
    "Polaris Bank": "076",
    "Providus Bank": "101",
    "Stanbic IBTC Bank": "221",
    "Standard Chartered Bank": "068",
    "Sterling Bank": "232",
    "Suntrust Bank": "100",
    "Union Bank": "032",
    "United Bank for Africa": "033",
    "Unity Bank": "215",
    "VFD Microfinance Bank": "090110",
    "Wema Bank": "035",
    "Zenith Bank": "057",
}


class BankVerificationService:
    """Service for verifying bank accounts"""
    
    FLW_BASE = "https://api.flutterwave.com/v3"
    
    def __init__(self, flutterwave_key: Optional[str] = None):
        self.api_key = flutterwave_key
    
    def get_bank_code(self, bank_name: str) -> Optional[str]:
        """Get bank code from bank name"""
        return BANK_CODES.get(bank_name)
    
    def validate_account_number(self, account_number: str) -> tuple[bool, Optional[str]]:
        """Validate Nigerian account number format"""
        if len(account_number) != 10:
            return False, "Account number must be exactly 10 digits"
        if not account_number.isdigit():
            return False, "Account number must contain only digits"
        return True, None
    
    def get_mock_verification(self, account_number: str) -> Dict[str, Any]:
        """Return mock verification for test mode"""
        return {
            "success": True,
            "accountName": f"TEST USER - {account_number[-4:]}",
            "verified": True,
            "note": "Test mode - verification simulated"
        }
    
    async def verify_with_flutterwave(
        self,
        account_number: str,
        bank_code: str
    ) -> Dict[str, Any]:
        """Call Flutterwave API to verify account"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.FLW_BASE}/accounts/resolve",
                params={
                    "account_number": account_number,
                    "account_bank": bank_code
                },
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                timeout=10.0
            )
            return response.json()
    
    async def verify_account(
        self,
        bank_name: str,
        account_number: str
    ) -> Dict[str, Any]:
        """Full verification flow - validates input, calls API or returns mock"""
        # Validate bank name
        bank_code = self.get_bank_code(bank_name)
        if not bank_code:
            return {
                "success": False,
                "error": f"Unrecognized bank: {bank_name}"
            }
        
        # Validate account number
        is_valid, error = self.validate_account_number(account_number)
        if not is_valid:
            return {
                "success": False,
                "error": error
            }
        
        # If no API key, return mock
        if not self.api_key:
            return self.get_mock_verification(account_number)
        
        # Call Flutterwave
        result = await self.verify_with_flutterwave(account_number, bank_code)
        
        if result.get("status") != "success" or not result.get("data", {}).get("account_name"):
            return {
                "success": False,
                "error": "Account could not be verified. Please check the details."
            }
        
        return {
            "success": True,
            "accountName": result["data"]["account_name"],
            "verified": True
        }
