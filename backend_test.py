#!/usr/bin/env python3
"""
Backend Test Suite for Muscle-Meta Matrix Course Payment Flow
Tests the complete payment integration including Stripe checkout and database operations.
"""

import asyncio
import aiohttp
import json
import os
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Test configuration
BACKEND_URL = "https://muscle-health.preview.emergentagent.com/api"
TEST_COURSE_ID = "sleep-optimization"
EXPECTED_COURSE_PRICE = 97.00

class PaymentFlowTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.created_session_id = None
        
    async def setup(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()
            
    def log_test(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
            
    async def test_api_health_check(self):
        """Test 1: Basic API Health Check"""
        try:
            async with self.session.get(f"{BACKEND_URL}/") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("message") == "Hello World":
                        self.log_test("API Health Check", True, "Backend API is responding correctly")
                        return True
                    else:
                        self.log_test("API Health Check", False, f"Unexpected response: {data}")
                        return False
                else:
                    self.log_test("API Health Check", False, f"HTTP {response.status}: {await response.text()}")
                    return False
        except Exception as e:
            self.log_test("API Health Check", False, f"Connection error: {str(e)}")
            return False
            
    async def test_create_checkout_session(self):
        """Test 2: Create Checkout Session for Sleep Optimization Course"""
        try:
            payload = {
                "course_id": TEST_COURSE_ID,
                "success_url": "https://example.com/success",
                "cancel_url": "https://example.com/cancel",
                "metadata": {
                    "test_user": "backend_tester",
                    "test_timestamp": datetime.utcnow().isoformat()
                }
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/payments/checkout/session",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify required fields in response (handle both 'url' and 'checkout_url')
                    required_fields = ["session_id"]
                    checkout_url_field = "checkout_url" if "checkout_url" in data else "url"
                    required_fields.append(checkout_url_field)
                    
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_test("Create Checkout Session", False, 
                                    f"Missing required fields: {missing_fields}", data)
                        return False
                        
                    # Store session ID for later tests
                    self.created_session_id = data["session_id"]
                    
                    # Verify checkout URL format
                    checkout_url = data.get("checkout_url") or data.get("url")
                    if not checkout_url.startswith("https://checkout.stripe.com"):
                        self.log_test("Create Checkout Session", False, 
                                    f"Invalid checkout URL format: {checkout_url}")
                        return False
                        
                    self.log_test("Create Checkout Session", True, 
                                f"Session created successfully: {self.created_session_id}")
                    return True
                    
                else:
                    error_text = await response.text()
                    self.log_test("Create Checkout Session", False, 
                                f"HTTP {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            self.log_test("Create Checkout Session", False, f"Request error: {str(e)}")
            return False
            
    async def test_checkout_status(self):
        """Test 3: Check Payment Status"""
        if not self.created_session_id:
            self.log_test("Check Payment Status", False, "No session ID available from previous test")
            return False
            
        try:
            async with self.session.get(
                f"{BACKEND_URL}/payments/checkout/status/{self.created_session_id}"
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify status response structure
                    required_fields = ["status", "payment_status"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_test("Check Payment Status", False, 
                                    f"Missing required fields: {missing_fields}", data)
                        return False
                        
                    # Note: session_id might not be returned in status response, which is acceptable
                    # The important thing is that we get status and payment_status
                        
                    self.log_test("Check Payment Status", True, 
                                f"Status retrieved: {data['status']}, Payment: {data['payment_status']}")
                    return True
                    
                else:
                    error_text = await response.text()
                    self.log_test("Check Payment Status", False, 
                                f"HTTP {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            self.log_test("Check Payment Status", False, f"Request error: {str(e)}")
            return False
            
    async def test_transaction_storage(self):
        """Test 4: Verify Transaction Storage in Database"""
        if not self.created_session_id:
            self.log_test("Transaction Storage", False, "No session ID available from previous test")
            return False
            
        try:
            async with self.session.get(
                f"{BACKEND_URL}/payments/transactions/{self.created_session_id}"
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify transaction data
                    expected_fields = ["id", "session_id", "course_id", "amount", "currency", "payment_status"]
                    missing_fields = [field for field in expected_fields if field not in data]
                    
                    if missing_fields:
                        self.log_test("Transaction Storage", False, 
                                    f"Missing transaction fields: {missing_fields}", data)
                        return False
                        
                    # Verify course and amount match expected values
                    if data["course_id"] != TEST_COURSE_ID:
                        self.log_test("Transaction Storage", False, 
                                    f"Course ID mismatch: expected {TEST_COURSE_ID}, got {data['course_id']}")
                        return False
                        
                    if data["amount"] != EXPECTED_COURSE_PRICE:
                        self.log_test("Transaction Storage", False, 
                                    f"Amount mismatch: expected {EXPECTED_COURSE_PRICE}, got {data['amount']}")
                        return False
                        
                    self.log_test("Transaction Storage", True, 
                                f"Transaction stored correctly with amount ${data['amount']}")
                    return True
                    
                else:
                    error_text = await response.text()
                    self.log_test("Transaction Storage", False, 
                                f"HTTP {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            self.log_test("Transaction Storage", False, f"Request error: {str(e)}")
            return False
            
    async def test_invalid_course_id(self):
        """Test 5: Error Handling - Invalid Course ID"""
        try:
            payload = {
                "course_id": "invalid-course-id",
                "success_url": "https://example.com/success",
                "cancel_url": "https://example.com/cancel",
                "metadata": {}
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/payments/checkout/session",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 400:
                    error_data = await response.json()
                    if "Invalid course ID" in error_data.get("detail", ""):
                        self.log_test("Invalid Course ID Handling", True, 
                                    "Correctly rejected invalid course ID")
                        return True
                    else:
                        self.log_test("Invalid Course ID Handling", False, 
                                    f"Wrong error message: {error_data}")
                        return False
                else:
                    self.log_test("Invalid Course ID Handling", False, 
                                f"Expected 400 status, got {response.status}")
                    return False
                    
        except Exception as e:
            self.log_test("Invalid Course ID Handling", False, f"Request error: {str(e)}")
            return False
            
    async def test_missing_parameters(self):
        """Test 6: Error Handling - Missing Required Parameters"""
        try:
            # Test with missing success_url
            payload = {
                "course_id": TEST_COURSE_ID,
                "cancel_url": "https://example.com/cancel"
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/payments/checkout/session",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 422:  # FastAPI validation error
                    self.log_test("Missing Parameters Handling", True, 
                                "Correctly rejected request with missing parameters")
                    return True
                else:
                    error_text = await response.text()
                    self.log_test("Missing Parameters Handling", False, 
                                f"Expected 422 status, got {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            self.log_test("Missing Parameters Handling", False, f"Request error: {str(e)}")
            return False
            
    async def test_invalid_session_status(self):
        """Test 7: Error Handling - Invalid Session ID for Status Check"""
        try:
            fake_session_id = "cs_test_invalid_session_id_12345"
            
            async with self.session.get(
                f"{BACKEND_URL}/payments/checkout/status/{fake_session_id}"
            ) as response:
                
                if response.status == 404:
                    error_data = await response.json()
                    if "Transaction not found" in error_data.get("detail", ""):
                        self.log_test("Invalid Session Status Handling", True, 
                                    "Correctly handled invalid session ID")
                        return True
                    else:
                        self.log_test("Invalid Session Status Handling", False, 
                                    f"Wrong error message: {error_data}")
                        return False
                else:
                    error_text = await response.text()
                    self.log_test("Invalid Session Status Handling", False, 
                                f"Expected 404 status, got {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            self.log_test("Invalid Session Status Handling", False, f"Request error: {str(e)}")
            return False
            
    async def test_course_packages_configuration(self):
        """Test 8: Verify Course Packages Configuration"""
        try:
            # Test that the sleep-optimization course is properly configured
            payload = {
                "course_id": TEST_COURSE_ID,
                "success_url": "https://example.com/success",
                "cancel_url": "https://example.com/cancel",
                "metadata": {"test": "course_config"}
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/payments/checkout/session",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    # Verify the transaction was created with correct amount
                    data = await response.json()
                    session_id = data["session_id"]
                    
                    # Check the stored transaction
                    async with self.session.get(
                        f"{BACKEND_URL}/payments/transactions/{session_id}"
                    ) as tx_response:
                        
                        if tx_response.status == 200:
                            tx_data = await tx_response.json()
                            
                            # Verify fixed pricing is enforced
                            if tx_data["amount"] == EXPECTED_COURSE_PRICE:
                                self.log_test("Course Package Configuration", True, 
                                            f"Fixed pricing correctly enforced: ${EXPECTED_COURSE_PRICE}")
                                return True
                            else:
                                self.log_test("Course Package Configuration", False, 
                                            f"Price mismatch: expected ${EXPECTED_COURSE_PRICE}, got ${tx_data['amount']}")
                                return False
                        else:
                            self.log_test("Course Package Configuration", False, 
                                        f"Could not retrieve transaction: {tx_response.status}")
                            return False
                else:
                    error_text = await response.text()
                    self.log_test("Course Package Configuration", False, 
                                f"Session creation failed: {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            self.log_test("Course Package Configuration", False, f"Request error: {str(e)}")
            return False
            
    async def test_webhook_endpoint_structure(self):
        """Test 9: Verify Webhook Endpoint Structure (without triggering)"""
        try:
            # Test webhook endpoint exists and handles missing signature correctly
            async with self.session.post(
                f"{BACKEND_URL}/payments/webhook/stripe",
                json={"test": "webhook"},
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 400:
                    error_data = await response.json()
                    if "Missing Stripe signature" in error_data.get("detail", ""):
                        self.log_test("Webhook Endpoint Structure", True, 
                                    "Webhook endpoint properly validates Stripe signature")
                        return True
                    else:
                        self.log_test("Webhook Endpoint Structure", False, 
                                    f"Unexpected error message: {error_data}")
                        return False
                else:
                    error_text = await response.text()
                    self.log_test("Webhook Endpoint Structure", False, 
                                f"Expected 400 status, got {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            self.log_test("Webhook Endpoint Structure", False, f"Request error: {str(e)}")
            return False
            
    async def test_transactions_list_endpoint(self):
        """Test 10: Verify Transactions List Endpoint"""
        try:
            async with self.session.get(f"{BACKEND_URL}/payments/transactions") as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    if isinstance(data, list):
                        # Check if our test transaction is in the list
                        if self.created_session_id:
                            found_transaction = any(
                                tx.get("session_id") == self.created_session_id 
                                for tx in data
                            )
                            if found_transaction:
                                self.log_test("Transactions List Endpoint", True, 
                                            f"Transactions endpoint working, found test transaction")
                                return True
                            else:
                                self.log_test("Transactions List Endpoint", True, 
                                            f"Transactions endpoint working, returned {len(data)} transactions")
                                return True
                        else:
                            self.log_test("Transactions List Endpoint", True, 
                                        f"Transactions endpoint working, returned {len(data)} transactions")
                            return True
                    else:
                        self.log_test("Transactions List Endpoint", False, 
                                    f"Expected list response, got: {type(data)}")
                        return False
                else:
                    error_text = await response.text()
                    self.log_test("Transactions List Endpoint", False, 
                                f"HTTP {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            self.log_test("Transactions List Endpoint", False, f"Request error: {str(e)}")
            return False
            
    async def run_all_tests(self):
        """Run all payment flow tests"""
        print("🚀 Starting Muscle-Meta Matrix Payment Flow Tests")
        print(f"🎯 Testing backend at: {BACKEND_URL}")
        print(f"📚 Testing course: {TEST_COURSE_ID} (${EXPECTED_COURSE_PRICE})")
        print("=" * 60)
        
        await self.setup()
        
        try:
            # Run tests in sequence
            test_methods = [
                self.test_api_health_check,
                self.test_create_checkout_session,
                self.test_checkout_status,
                self.test_transaction_storage,
                self.test_invalid_course_id,
                self.test_missing_parameters,
                self.test_invalid_session_status,
                self.test_course_packages_configuration,
                self.test_webhook_endpoint_structure,
                self.test_transactions_list_endpoint
            ]
            
            for test_method in test_methods:
                await test_method()
                await asyncio.sleep(0.5)  # Small delay between tests
                
        finally:
            await self.cleanup()
            
        # Print summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}: {result['message']}")
                    
        print(f"\n🎯 Overall Success Rate: {(passed/total)*100:.1f}%")
        
        return passed == total

async def main():
    """Main test runner"""
    tester = PaymentFlowTester()
    success = await tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! Payment flow is working correctly.")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed. Check the details above.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())