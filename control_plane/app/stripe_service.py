from __future__ import annotations

import os
from typing import Any


class StripeService:
    """Stripe payment processing service.
    
    Handles:
    - Creating checkout sessions for credit purchases
    - Processing webhooks for payment confirmation
    - Managing customer records
    - Refunds and disputes
    """
    
    def __init__(self):
        self.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
        self.webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
        self._client = None
    
    @property
    def client(self):
        """Lazy initialization of Stripe client."""
        if self._client is None:
            try:
                import stripe
                stripe.api_key = self.api_key
                self._client = stripe
            except ImportError:
                raise RuntimeError("stripe package not installed. Run: pip install stripe")
        return self._client
    
    def is_configured(self) -> bool:
        """Check if Stripe is properly configured."""
        return bool(self.api_key)
    
    def create_customer(self, email: str, name: str | None = None) -> dict:
        """Create a Stripe customer."""
        if not self.is_configured():
            raise RuntimeError("Stripe not configured")
        
        customer = self.client.Customer.create(
            email=email,
            name=name or email,
        )
        return {
            "stripe_customer_id": customer.id,
            "email": customer.email,
        }
    
    def create_checkout_session(
        self,
        customer_id: str,
        amount_usd: float,
        success_url: str,
        cancel_url: str,
    ) -> dict:
        """Create a Stripe Checkout session for credit purchase.
        
        Args:
            customer_id: Stripe customer ID
            amount_usd: Amount in USD (e.g., 10.00 for $10)
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect if payment is cancelled
        
        Returns:
            dict with checkout_url and session_id
        """
        if not self.is_configured():
            raise RuntimeError("Stripe not configured")
        
        # Convert to cents
        amount_cents = int(amount_usd * 100)
        
        session = self.client.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": "Boxty Credits",
                        "description": f"${amount_usd:.2f} credit for Boxty workloads",
                    },
                    "unit_amount": amount_cents,
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "type": "credit_purchase",
                "amount_usd": str(amount_usd),
            },
        )
        
        return {
            "checkout_url": session.url,
            "session_id": session.id,
            "status": session.status,
        }
    
    def verify_webhook(self, payload: bytes, signature: str) -> dict:
        """Verify Stripe webhook signature and return event.
        
        Args:
            payload: Raw request body
            signature: Stripe-Signature header value
        
        Returns:
            Stripe event dict
        """
        if not self.is_configured():
            raise RuntimeError("Stripe not configured")
        
        if not self.webhook_secret:
            raise RuntimeError("STRIPE_WEBHOOK_SECRET not configured")
        
        event = self.client.Webhook.construct_event(
            payload, signature, self.webhook_secret
        )
        return event
    
    def handle_payment_success(self, event: dict) -> dict:
        """Handle successful payment webhook.
        
        Returns:
            dict with payment details
        """
        session = event["data"]["object"]
        
        amount_usd = float(session["metadata"].get("amount_usd", 0))
        customer_id = session.get("customer", "")
        
        return {
            "stripe_session_id": session["id"],
            "stripe_customer_id": customer_id,
            "amount_usd": amount_usd,
            "status": "completed",
            "payment_intent_id": session.get("payment_intent", ""),
        }
    
    def create_refund(self, payment_intent_id: str, amount_usd: float | None = None) -> dict:
        """Create a refund for a payment.
        
        Args:
            payment_intent_id: Stripe PaymentIntent ID
            amount_usd: Amount to refund (None for full refund)
        
        Returns:
            Refund details
        """
        if not self.is_configured():
            raise RuntimeError("Stripe not configured")
        
        refund_params = {"payment_intent": payment_intent_id}
        if amount_usd is not None:
            refund_params["amount"] = int(amount_usd * 100)
        
        refund = self.client.Refund.create(**refund_params)
        
        return {
            "refund_id": refund.id,
            "status": refund.status,
            "amount_usd": refund.amount / 100 if refund.amount else 0,
        }
    
    def get_customer_invoices(self, customer_id: str, limit: int = 10) -> list[dict]:
        """Get customer invoices.
        
        Returns:
            List of invoice dicts
        """
        if not self.is_configured():
            raise RuntimeError("Stripe not configured")
        
        invoices = self.client.Invoice.list(
            customer=customer_id,
            limit=limit,
        )
        
        return [
            {
                "invoice_id": inv.id,
                "amount_usd": inv.amount_due / 100,
                "status": inv.status,
                "created": inv.created,
            }
            for inv in invoices.data
        ]
