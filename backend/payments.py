from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from models import PaymentTransaction, PaymentTransactionCreate, CheckoutRequest
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from datetime import datetime
from typing import Dict, Any

# Setup logging
logger = logging.getLogger(__name__)

# Database setup
from server import db

# Payment router
payments = APIRouter(prefix="/api/payments")

# Course packages - FIXED PRICES DEFINED ON BACKEND
COURSE_PACKAGES = {
    "sleep-optimization": {
        "title": "The 4-Week Sleep Optimization Blueprint",
        "price": 97.00,
        "instructor": "Randy Bauer, PT"
    }
}

async def get_stripe_checkout() -> StripeCheckout:
    """Initialize Stripe checkout with API key from environment"""
    api_key = os.environ.get('STRIPE_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    # Note: webhook_url will be set dynamically per request
    return StripeCheckout(api_key=api_key, webhook_url="")

@payments.post("/checkout/session", response_model=CheckoutSessionResponse)
async def create_checkout_session(request: CheckoutRequest, http_request: Request):
    """Create a Stripe checkout session for course enrollment"""
    try:
        # Validate course exists and get fixed price
        if request.course_id not in COURSE_PACKAGES:
            raise HTTPException(status_code=400, detail="Invalid course ID")
        
        course_info = COURSE_PACKAGES[request.course_id]
        amount = course_info["price"]  # Fixed price from backend
        
        # Initialize Stripe checkout with webhook URL
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/payments/webhook/stripe"
        
        api_key = os.environ.get('STRIPE_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="Stripe API key not configured")
            
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        
        # Prepare checkout session request
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="usd",
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata={
                "course_id": request.course_id,
                "course_title": course_info["title"],
                "instructor": course_info["instructor"],
                **request.metadata
            }
        )
        
        # Create checkout session
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store payment transaction record
        payment_data = PaymentTransactionCreate(
            session_id=session.session_id,
            course_id=request.course_id,
            amount=amount,
            currency="usd",
            metadata={
                "course_title": course_info["title"],
                "instructor": course_info["instructor"],
                **request.metadata
            }
        )
        
        payment_transaction = PaymentTransaction(**payment_data.dict())
        await db.payment_transactions.insert_one(payment_transaction.dict())
        
        logger.info(f"Created checkout session {session.session_id} for course {request.course_id}")
        
        return session
        
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to create checkout session")

@payments.get("/checkout/status/{session_id}", response_model=CheckoutStatusResponse)
async def get_checkout_status(session_id: str):
    """Get the status of a checkout session and update our records"""
    try:
        # Get existing transaction record
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Initialize Stripe checkout
        stripe_checkout = await get_stripe_checkout()
        
        # Get status from Stripe
        status_response = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction record if status changed
        update_data = {
            "payment_status": status_response.payment_status,
            "status": status_response.status,
            "updated_at": datetime.utcnow()
        }
        
        # Only update if status actually changed to avoid duplicate processing
        if (transaction.get("payment_status") != status_response.payment_status or 
            transaction.get("status") != status_response.status):
            
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": update_data}
            )
            
            # Log successful payment
            if status_response.payment_status == "paid" and transaction.get("payment_status") != "paid":
                logger.info(f"Payment successful for session {session_id}, course {transaction.get('course_id')}")
                
                # Here you could trigger additional actions like:
                # - Send enrollment confirmation email
                # - Grant course access
                # - Update user records
                # - Analytics tracking
        
        return status_response
        
    except Exception as e:
        logger.error(f"Error checking payment status for session {session_id}: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to check payment status")

@payments.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks for payment events"""
    try:
        # Get request body and signature
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        if not signature:
            raise HTTPException(status_code=400, detail="Missing Stripe signature")
        
        # Initialize Stripe checkout
        stripe_checkout = await get_stripe_checkout()
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update our transaction record based on webhook
        if webhook_response.session_id:
            update_data = {
                "payment_status": webhook_response.payment_status,
                "updated_at": datetime.utcnow()
            }
            
            # Add payment_id if available
            if hasattr(webhook_response, 'payment_id') and webhook_response.payment_id:
                update_data["payment_id"] = webhook_response.payment_id
            
            result = await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                logger.info(f"Updated transaction via webhook: {webhook_response.session_id}")
            
            # Handle successful payment
            if webhook_response.payment_status == "paid":
                transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
                if transaction:
                    logger.info(f"Webhook confirmed payment for course {transaction.get('course_id')}")
                    
                    # Additional post-payment processing can be added here
                    # - Course access provisioning
                    # - Email notifications
                    # - Analytics events
        
        return {"status": "success", "event_id": webhook_response.event_id}
        
    except Exception as e:
        logger.error(f"Error processing Stripe webhook: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Webhook processing failed")

@payments.get("/transactions")
async def get_transactions(limit: int = 50, skip: int = 0):
    """Get payment transactions (for admin/debugging purposes)"""
    try:
        transactions = await db.payment_transactions.find().skip(skip).limit(limit).to_list(limit)
        return transactions
    except Exception as e:
        logger.error(f"Error fetching transactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")

@payments.get("/transactions/{session_id}")
async def get_transaction(session_id: str):
    """Get a specific transaction by session ID"""
    try:
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return transaction
    except Exception as e:
        logger.error(f"Error fetching transaction {session_id}: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to fetch transaction")