"""Stub for emergentintegrations package"""
from pydantic import BaseModel
from typing import Optional

class CheckoutSessionRequest(BaseModel):
    product_name: str
    price: float
    success_url: str
    cancel_url: str

class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str

class CheckoutStatusResponse(BaseModel):
    status: str
    payment_status: Optional[str] = None

class StripeCheckout:
    def __init__(self, api_key: str = "", webhook_url: str = ""):
        self.api_key = api_key
    async def create_session(self, request: CheckoutSessionRequest) -> CheckoutSessionResponse:
        return CheckoutSessionResponse(session_id="stub", url="https://stub.com")
    async def get_session_status(self, session_id: str) -> CheckoutStatusResponse:
        return CheckoutStatusResponse(status="complete", payment_status="paid")
