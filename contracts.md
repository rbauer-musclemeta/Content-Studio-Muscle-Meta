# Muscle-Meta Matrix Platform Contracts

## Overview
This document outlines the API contracts, data models, and integration patterns for the Muscle-Meta Matrix platform, which includes newsletters and courses with Stripe payment integration.

## API Contracts

### Newsletter Endpoints
- `GET /api/` - Health check endpoint
- `GET /api/status` - System status checks
- `POST /api/status` - Create status check

### Payment & Course Endpoints
- `POST /api/payments/checkout/session` - Create Stripe checkout session
- `GET /api/payments/checkout/status/{session_id}` - Get payment status
- `POST /api/payments/webhook/stripe` - Stripe webhook handler
- `GET /api/payments/transactions` - List transactions (admin)
- `GET /api/payments/transactions/{session_id}` - Get specific transaction

## Data Models

### Courses
```python
class Course:
    id: str
    title: str
    subtitle: str
    instructor: str
    description: str
    price: float
    original_price: Optional[float]
    duration: str
    lessons: int
    level: str = "All Levels"
    featured: bool = False
    pillars: List[str] = []
```

### Payment Transactions
```python
class PaymentTransaction:
    id: str
    session_id: str
    payment_id: Optional[str]
    course_id: Optional[str]
    user_email: Optional[str]
    amount: float
    currency: str = "usd"
    payment_status: str  # pending, paid, failed, expired
    status: str          # initiated, completed, failed, expired
    metadata: Dict[str, Any]
```

### Newsletters
```python
class Newsletter:
    id: str
    title: str
    subtitle: str
    issue_number: int
    content: Dict[str, Any]
    published_date: datetime
    featured: bool = False
    topics: List[str] = []
```

## Course Packages (Backend-Defined)
Fixed pricing to prevent client-side manipulation:

```python
COURSE_PACKAGES = {
    "sleep-optimization": {
        "title": "The 4-Week Sleep Optimization Blueprint",
        "price": 97.00,
        "instructor": "Randy Bauer, PT"
    }
}
```

## Frontend-Backend Integration

### Mock Data (Frontend Only)
The following data structures are currently mocked in `/app/frontend/src/mock.js`:
- Newsletter issues and content
- Course details and modules
- User engagement metrics
- Social links and navigation

### Payment Flow Integration
1. **Frontend**: User clicks "Enroll Now" → calls `/api/payments/checkout/session`
2. **Backend**: Creates Stripe session with fixed course price → returns checkout URL
3. **Frontend**: Redirects to Stripe Checkout
4. **Stripe**: Handles payment → redirects back with session_id
5. **Frontend**: Polls `/api/payments/checkout/status/{session_id}` for confirmation
6. **Backend**: Updates transaction status and triggers post-payment actions

### Security Patterns
- ✅ Fixed course pricing on backend (prevents price manipulation)
- ✅ Dynamic success/cancel URLs using window.location.origin
- ✅ Webhook signature verification
- ✅ Transaction deduplication (prevent double-processing)
- ✅ Payment status polling for real-time updates

## Database Collections

### payment_transactions
- Stores all payment attempts and completions
- Tracks session_id, course_id, amounts, status
- Updated via webhook and status polling

### status_checks
- System health monitoring
- Basic functionality testing

### Future Collections (Planned)
- `courses` - Course catalog management
- `newsletters` - Newsletter content and metadata
- `user_engagements` - User interaction tracking
- `users` - User accounts and progress (when auth is added)

## Stripe Integration Details

### Package: emergentintegrations
- Custom integration library optimized for the platform
- Handles checkout sessions, status checks, and webhooks
- Automatic STRIPE_API_KEY management from environment

### Webhook Events
- `checkout.session.completed` - Payment successful
- `checkout.session.expired` - Payment session expired
- Updates local transaction records automatically

### Payment Security
- SSL encrypted transactions
- Stripe-managed PCI compliance
- Server-side amount validation
- Session-based transaction tracking

## Frontend Routes

### Current Routes
- `/` - Newsletter Hub (NewsletterHub component)
- `/muscle-metabolic-health` - Original newsletter issue
- `/hiit-longevity` - HIIT newsletter issue
- `/courses` - Courses catalog page
- `/courses/sleep-optimization` - Sleep course detail
- `/courses/sleep-optimization/success` - Payment success page

### Component Architecture
- Shared UI components from `/app/frontend/src/components/ui/`
- Shadcn/ui component library integration
- Toast notifications for user feedback
- Responsive design with Tailwind CSS

## Mock Data Replacement Strategy

When implementing backend integration:

1. **Newsletter Data**: Replace mock.js newsletter content with API calls
2. **Course Content**: Fetch course modules and lessons from database
3. **User Progress**: Implement progress tracking and completion status
4. **Analytics**: Replace mock engagement data with real metrics
5. **Authentication**: Add user accounts and enrollment tracking

## Performance Considerations

- Frontend hot reload enabled (no restart needed for code changes)
- Backend hot reload enabled (restart only for dependency changes)
- Image optimization for course thumbnails and instructor photos
- Lazy loading for course content and newsletter archives
- Payment status polling with exponential backoff

## Future Enhancements

### Course Management
- Course progress tracking
- Video lesson streaming
- Downloadable resources
- Community forums
- Certificate generation

### Newsletter Expansion
- Email subscription management
- Newsletter analytics
- Content personalization
- RSS feed generation

### User Features
- User accounts and profiles
- Learning progress dashboard
- Course recommendations
- Social sharing features

## Environment Variables

### Required Backend Variables
```
MONGO_URL=<mongodb_connection_string>
DB_NAME=<database_name>
STRIPE_API_KEY=<stripe_secret_key>
```

### Required Frontend Variables
```
REACT_APP_BACKEND_URL=<backend_api_url>
```

## API Testing

Use the payment status polling mechanism for testing:
```javascript
// Frontend polling implementation
async function pollPaymentStatus(sessionId) {
    const response = await fetch(`/api/payments/checkout/status/${sessionId}`);
    const data = await response.json();
    
    if (data.payment_status === 'paid') {
        // Payment successful
    } else if (data.status === 'expired') {
        // Payment expired
    }
    // Continue polling if pending
}
```

## Deployment Notes

- Frontend builds to static files (React CRA)
- Backend runs on FastAPI with uvicorn
- MongoDB for data persistence
- Stripe for payment processing
- All services containerized with supervisor