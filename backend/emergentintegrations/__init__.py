"""
Stub for emergentintegrations package
This provides minimal types so the server can start without the actual package.
"""

from pydantic import BaseModel
from typing import Optional

# Stripe checkout stubs
class StripeCheckout:
    def __init__(self, api_key: str = "", webhook_url: str = ""):
        self.api_key = api_key
        self.webhook_url = webhook_url

class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str

class CheckoutStatusResponse(BaseModel):
    status: str
    payment_status: Optional[str] = None

class CheckoutSessionRequest(BaseModel):
    product_name: str
    price: float
    success_url: str
    cancel_url: str
