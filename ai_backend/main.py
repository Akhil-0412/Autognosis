from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from dotenv import load_dotenv
import os
import stripe

# Load environment variables
load_dotenv()

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

# Import after loading env to ensure keys are present
from agent import run_agent
from document_processor import process_document

app = FastAPI(title="Autognosis AI & Telemetry API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard Stripe price mapping for Autognosis tiers ($5, $10, $15)
STRIPE_PRICES = {
    "Starter": "price_1U91QO1rVaFcdb9oqRCG8eDZ",
    "Pro Fleet": "price_1U91QP1rVaFcdb9oeRcRXVW4",
    "Enterprise": "price_1U91QP1rVaFcdb9oCi82jMKT",
}

class AnalyzeRequest(BaseModel):
    query: str
    make: str
    model: str
    year: int
    mileage: int
    history: list[dict] = []

class CreateSubscriptionRequest(BaseModel):
    email: str
    name: Optional[str] = "Fleet Operator"
    plan_name: str
    payment_method_id: Optional[str] = None # e.g. 'pm_card_visa' or test card token
    off_session: Optional[bool] = True
    payment_behavior: Optional[str] = "error_if_incomplete"
    proration_behavior: Optional[str] = "none"

class CheckoutSessionRequest(BaseModel):
    plan_name: str
    email: Optional[str] = None
    success_url: Optional[str] = "http://localhost:8080/billing?success=true"
    cancel_url: Optional[str] = "http://localhost:8080/billing?canceled=true"

@app.get("/health")
def health():
    return {"status": "ok", "service": "Autognosis API", "stripe_configured": bool(stripe.api_key)}

@app.get("/stripe/prices")
def get_prices():
    return {"prices": STRIPE_PRICES, "publishable_key": os.getenv("STRIPE_PUBLISHABLE_KEY")}

@app.post("/stripe/create-subscription")
async def create_subscription(req: CreateSubscriptionRequest):
    """
    Creates a Stripe customer and subscription following exact Stripe API v1 specs:
    curl https://api.stripe.com/v1/subscriptions \
      -u "$STRIPE_SECRET_KEY:" \
      -d customer={{CUSTOMER_ID}} \
      -d "items[0][price]"={{PRICE_ID}} \
      -d "items[0][quantity]"=1 \
      -d off_session=true \
      -d payment_behavior=error_if_incomplete \
      -d proration_behavior=none
    """
    try:
        price_id = STRIPE_PRICES.get(req.plan_name, STRIPE_PRICES["Pro Fleet"])

        # 1. Find or create Stripe customer
        existing_customers = stripe.Customer.list(email=req.email, limit=1)
        if existing_customers.data:
            customer = existing_customers.data[0]
        else:
            customer = stripe.Customer.create(
                email=req.email,
                name=req.name or "Fleet Operator",
                metadata={"source": "Autognosis v2 Telemetry Console"}
            )

        # 2. Attach a valid test payment method to customer if needed
        pm_token = req.payment_method_id or "tok_visa"
        try:
            if pm_token.startswith("pm_"):
                stripe.PaymentMethod.attach(pm_token, customer=customer.id)
                stripe.Customer.modify(
                    customer.id,
                    invoice_settings={"default_payment_method": pm_token}
                )
            else:
                # Create payment method from token (e.g. tok_visa)
                pm = stripe.PaymentMethod.create(
                    type="card",
                    card={"token": pm_token if pm_token.startswith("tok_") else "tok_visa"}
                )
                stripe.PaymentMethod.attach(pm.id, customer=customer.id)
                stripe.Customer.modify(
                    customer.id,
                    invoice_settings={"default_payment_method": pm.id}
                )
        except Exception as pm_err:
            print(f"Payment method setup note: {pm_err}")

        # 3. Create Subscription with exact curl parameters
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": price_id, "quantity": 1}],
            off_session=req.off_session,
            payment_behavior=req.payment_behavior or "error_if_incomplete",
            proration_behavior=req.proration_behavior or "none",
            expand=["latest_invoice.payment_intent"]
        )

        invoice_id = getattr(subscription.latest_invoice, 'id', str(subscription.latest_invoice))

        return {
            "status": "success",
            "subscription_id": getattr(subscription, "id", str(subscription)),
            "customer_id": getattr(subscription, "customer", customer.id),
            "invoice_id": invoice_id,
            "plan_name": req.plan_name,
            "status_state": getattr(subscription, "status", "active"),
            "current_period_end": getattr(subscription, "current_period_end", 0),
        }

    except stripe.error.CardError as e:
        raise HTTPException(status_code=402, detail=f"Card error: {e.user_message or str(e)}")
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/stripe/create-checkout-session")
async def create_checkout_session(req: CheckoutSessionRequest):
    """
    Creates a hosted Stripe Checkout Session for seamless web checkout.
    """
    try:
        price_id = STRIPE_PRICES.get(req.plan_name, STRIPE_PRICES["Pro Fleet"])
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            customer_email=req.email if req.email else None,
            success_url=req.success_url,
            cancel_url=req.cancel_url,
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        vehicle_context = f"Vehicle: {request.year} {request.make} {request.model} with {request.mileage} miles."
        result = await run_agent(request.query, request.history, vehicle_context)
        advice_text = result.get("advice") or result.get("response") or "No advice generated."
        return {
            "response": advice_text,
            "suggestions": result.get("suggestions", []),
            "video_link": result.get("video_link"),
            "video_label": result.get("video_label")
        }
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents/process")
async def process_document_endpoint(file: UploadFile = File(...)):
    try:
        content = await file.read()
        # Decode text (assuming txt or basic parsed OCR output for now)
        text = content.decode("utf-8", errors="ignore")
        
        result = await process_document(text)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
            
        # TODO: Store structured result and its embeddings in Supabase Vector DB
        return {"status": "success", "extracted_data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

