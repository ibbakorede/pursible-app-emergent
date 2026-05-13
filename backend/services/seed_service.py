"""
Seed Data Service - Handles demo data seeding
"""
from typing import Dict, Any, List
from datetime import datetime, timezone
import uuid


def generate_id() -> str:
    """Generate a unique ID"""
    return str(uuid.uuid4())


def get_timestamp() -> str:
    """Get current UTC timestamp in ISO format"""
    return datetime.now(timezone.utc).isoformat()


class SeedDataService:
    """Service for seeding demo/test data"""
    
    DEFAULT_RATES: List[Dict[str, Any]] = [
        {"from_currency": "USD", "to_currency": "NGN", "rate": 1550, "fee_percentage": 0.5, "is_active": True},
        {"from_currency": "USD", "to_currency": "USDC", "rate": 1, "fee_percentage": 0.1, "is_active": True},
        {"from_currency": "USD", "to_currency": "USDT", "rate": 1, "fee_percentage": 0.1, "is_active": True},
        {"from_currency": "USDC", "to_currency": "NGN", "rate": 1550, "fee_percentage": 0.5, "is_active": True},
        {"from_currency": "USDC", "to_currency": "USD", "rate": 1, "fee_percentage": 0.1, "is_active": True},
        {"from_currency": "USDT", "to_currency": "NGN", "rate": 1550, "fee_percentage": 0.5, "is_active": True},
        {"from_currency": "USDT", "to_currency": "USD", "rate": 1, "fee_percentage": 0.1, "is_active": True},
        {"from_currency": "NGN", "to_currency": "USD", "rate": 0.000645, "fee_percentage": 0.5, "is_active": True},
        {"from_currency": "NGN", "to_currency": "USDC", "rate": 0.000645, "fee_percentage": 0.5, "is_active": True},
        {"from_currency": "NGN", "to_currency": "USDT", "rate": 0.000645, "fee_percentage": 0.5, "is_active": True},
    ]
    
    DEFAULT_DEPOSIT_ACCOUNTS: List[Dict[str, Any]] = [
        {
            "type": "usd_wire",
            "label": "USD Wire Transfer",
            "is_active": True,
            "fields": [
                {"key": "bank_name", "label": "Bank Name", "value": "Bridge Bank"},
                {"key": "routing_number", "label": "Routing Number", "value": "Demo Routing"},
                {"key": "account_number", "label": "Account Number", "value": "Demo Account"},
                {"key": "account_type", "label": "Account Type", "value": "Checking"},
                {"key": "reference", "label": "Reference", "value": "Use your email"},
            ],
        },
        {
            "type": "stable_wallet",
            "label": "USDT / Stablecoin",
            "is_active": True,
            "fields": [
                {"key": "network", "label": "Network", "value": "Ethereum / ERC-20"},
                {"key": "wallet_address", "label": "Wallet Address", "value": "0x1234567890abcdef1234567890abcdef12345678"},
                {"key": "supported_tokens", "label": "Supported Tokens", "value": "USDT, USDC"},
            ],
        },
        {
            "type": "ngn_bank",
            "label": "NGN Bank Transfer",
            "is_active": True,
            "fields": [
                {"key": "bank_name", "label": "Bank Name", "value": "Wema Bank"},
                {"key": "account_number", "label": "Account Number", "value": "9900000001"},
                {"key": "account_name", "label": "Account Name", "value": "Pursible Ltd"},
            ],
        }
    ]
    
    def __init__(self, db):
        self.db = db
    
    async def seed_conversion_rates(self) -> int:
        """Seed conversion rates, returns count of rates added"""
        added = 0
        for rate in self.DEFAULT_RATES:
            existing = await self.db.conversion_rates.find_one({
                "from_currency": rate["from_currency"],
                "to_currency": rate["to_currency"]
            })
            if not existing:
                rate_doc = {
                    **rate,
                    "id": generate_id(),
                    "created_date": get_timestamp()
                }
                await self.db.conversion_rates.insert_one(rate_doc)
                added += 1
        return added
    
    async def seed_deposit_accounts(self) -> int:
        """Seed deposit accounts, returns count of accounts added"""
        added = 0
        for account in self.DEFAULT_DEPOSIT_ACCOUNTS:
            existing = await self.db.deposit_accounts.find_one({"type": account["type"]})
            if not existing:
                account_doc = {
                    **account,
                    "id": generate_id(),
                    "created_date": get_timestamp()
                }
                await self.db.deposit_accounts.insert_one(account_doc)
                added += 1
        return added
    
    async def seed_all(self) -> Dict[str, Any]:
        """Seed all demo data"""
        rates_added = await self.seed_conversion_rates()
        accounts_added = await self.seed_deposit_accounts()
        
        return {
            "success": True,
            "rates_added": rates_added,
            "accounts_added": accounts_added,
            "message": f"Demo data seeded ({rates_added} rates, {accounts_added} accounts)"
        }
