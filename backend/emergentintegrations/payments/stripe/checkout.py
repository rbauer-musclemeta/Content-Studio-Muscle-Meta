from pydantic import BaseModel
from typing import Optional
import os

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
        self.api_key = api_key or os.environ.get("STRIPE_SECRET_KEY", "")
        self.webhook_url = webhook_url

    async def create_session(self, request: CheckoutSessionRequest) -> CheckoutSessionResponse:
        return CheckoutSessionResponse(session_id="stub_session", url="https://checkout.stripe.com/stub")

    async def get_session_status(self, session_id: str) -> CheckoutStatusResponse:
        return CheckoutStatusResponse(status="complete", payment_status="paid")
