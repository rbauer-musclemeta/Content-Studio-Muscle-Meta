# CLAUDE.md - AI Assistant Guide

## Project Overview

The **Muscle-Meta Matrix Newsletter & Course Platform** is a full-stack web application that combines educational newsletters with paid online courses focused on metabolic health, fitness, and longevity. The platform features Stripe payment integration, course management, and a rich content delivery system.

**Project Type:** Monorepo with separate frontend and backend
**Primary Purpose:** Educational content platform with payment processing
**Target Users:** Health and fitness enthusiasts seeking science-backed courses

---

## Architecture & Tech Stack

### Backend
- **Framework:** FastAPI 0.110.1 (Python async web framework)
- **Database:** MongoDB with Motor 3.3.1 (async driver)
- **Payment Processing:** Stripe 12.5.1 + emergentintegrations 0.1.0
- **Server:** Uvicorn 0.25.0 (ASGI server)
- **Data Validation:** Pydantic 2.11.7
- **Testing:** pytest 8.4.2 with custom async test suite

### Frontend
- **Framework:** React 19.0.0 (Create React App)
- **Routing:** React Router DOM 7.5.1
- **HTTP Client:** Axios 1.8.4
- **Styling:** Tailwind CSS 3.4.17
- **UI Components:** shadcn/ui (45+ Radix UI components)
- **Icons:** Lucide React 0.507.0
- **Forms:** react-hook-form 7.56.2 + Zod 3.24.4
- **Build Tool:** CRACO 7.1.0

### Architecture Pattern
- **Client-Server:** Clear separation between frontend SPA and backend API
- **RESTful API:** JSON-based communication
- **Async/Await:** Throughout both frontend and backend
- **Component-Based:** React components with shadcn/ui library

---

## Directory Structure

```
/home/user/muscle-metacourse-newsletter/
├── backend/                          # Python FastAPI backend
│   ├── server.py                    # Main app entry, routes, DB setup
│   ├── payments.py                  # Stripe payment endpoints
│   ├── admin.py                     # Admin CRUD endpoints
│   ├── models.py                    # Pydantic data models
│   ├── seed_pickleball_course.py   # DB seeding script
│   └── requirements.txt             # Python dependencies (121 packages)
│
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── components/              # Main app components (12 files)
│   │   │   ├── Newsletter.jsx       # Muscle Metabolic Health issue
│   │   │   ├── HIITNewsletter.jsx   # HIIT Longevity issue
│   │   │   ├── NewsletterHub.jsx    # Newsletter archive/home
│   │   │   ├── CoursesPage.jsx      # Course catalog
│   │   │   ├── SleepCourse.jsx      # Sleep Optimization course
│   │   │   ├── PickleballCourse.jsx # Pickleball course
│   │   │   ├── PickleballCourseStyled.jsx # Styled variant
│   │   │   ├── CourseSuccess.jsx    # Payment success page
│   │   │   ├── AdminDashboard.jsx   # Admin analytics
│   │   │   ├── CourseEditor.jsx     # Course CRUD interface
│   │   │   ├── CourseAgent.jsx      # AI course agent
│   │   │   └── AdminTest.jsx        # Admin testing
│   │   │   └── ui/                  # shadcn/ui components (45+ files)
│   │   ├── hooks/                   # React hooks (use-toast.js)
│   │   ├── lib/                     # Utilities (utils.js)
│   │   ├── App.js                   # Main routing & app setup
│   │   ├── App.css                  # Global styles
│   │   ├── index.js                 # React entry point
│   │   └── mock.js                  # Mock data for development
│   ├── public/                      # Static assets
│   │   ├── index.html               # HTML template
│   │   └── course-templates/        # Course HTML templates
│   ├── package.json                 # NPM dependencies (55+ packages)
│   ├── craco.config.js              # CRA configuration override
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── postcss.config.js            # PostCSS config
│   ├── jsconfig.json                # JavaScript config
│   └── components.json              # shadcn/ui config
│
├── tests/                            # Test directory (currently empty)
├── backend_test.py                  # Backend test suite (497 lines, 10 tests)
├── contracts.md                     # API contracts & integration docs
├── test_result.md                   # Testing protocol & results
├── .gitignore                       # Git ignore patterns
├── .gitconfig                       # Git configuration
├── .emergent/emergent.yml           # Emergent config
└── README.md                        # Project readme (minimal)
```

---

## Development Setup

### Environment Variables

**Backend (.env in root or backend/):**
```bash
MONGO_URL=mongodb://localhost:27017  # or MongoDB Atlas connection string
DB_NAME=muscle_meta_matrix
STRIPE_API_KEY=sk_test_...           # Stripe secret key
```

**Frontend (.env in frontend/):**
```bash
REACT_APP_BACKEND_URL=http://localhost:8000
```

### Running the Application

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start  # Uses craco start (port 3000)
```

**Testing:**
```bash
# Backend tests
python backend_test.py

# Frontend tests (not yet implemented)
cd frontend
npm test
```

### Hot Reload
- **Backend:** Enabled with `--reload` flag (restart only for dependency changes)
- **Frontend:** Enabled by default with React Scripts

---

## Database Models & Collections

### Collections in MongoDB

**payment_transactions**
- Stores all Stripe payment sessions and completions
- Updated via webhooks and status polling
- Fields: `session_id`, `payment_id`, `course_id`, `user_email`, `amount`, `payment_status`, `status`

**courses**
- Course catalog with pricing and metadata
- Fields: `title`, `subtitle`, `instructor`, `description`, `price`, `original_price`, `duration`, `lessons`, `level`, `featured`, `pillars`

**newsletters**
- Newsletter content and metadata
- Fields: `title`, `subtitle`, `issue_number`, `content`, `published_date`, `featured`, `topics`

**status_checks**
- System health monitoring
- Fields: `client_name`, `timestamp`

**Future Collections (Planned):**
- `users` - User accounts and authentication
- `user_engagements` - Interaction tracking
- `resources` - Uploaded course materials
- `tts_audio` - Generated audio content

### Data Models

All models defined in `backend/models.py`:
- `StatusCheck`, `StatusCheckCreate`
- `Course`, `CourseCreate`
- `PaymentTransaction`, `PaymentTransactionCreate`
- `CheckoutRequest`
- `Newsletter`, `NewsletterCreate`
- `UserEngagement`, `UserEngagementCreate`

**Key Pattern:** Each model has a base class with all fields and a `Create` variant without auto-generated fields (id, timestamps).

---

## API Endpoints

### Public Endpoints
```
GET  /api/                           # Health check
GET  /api/status                     # Get status checks
POST /api/status                     # Create status check
GET  /api/health                     # Health check with service status
```

### Payment Endpoints
```
POST /api/payments/checkout/session              # Create Stripe checkout
GET  /api/payments/checkout/status/{session_id}  # Poll payment status
POST /api/payments/webhook/stripe                # Stripe webhook handler
GET  /api/payments/transactions                  # List all transactions
GET  /api/payments/transactions/{session_id}     # Get specific transaction
```

### Admin Course Endpoints
```
GET    /api/admin/courses            # List all courses
GET    /api/admin/courses/{id}       # Get course by ID
POST   /api/admin/courses            # Create course
PUT    /api/admin/courses/{id}       # Update course
DELETE /api/admin/courses/{id}       # Delete course
```

### Admin Newsletter Endpoints
```
GET    /api/admin/newsletters        # List all newsletters
GET    /api/admin/newsletters/{id}   # Get newsletter by ID
POST   /api/admin/newsletters        # Create newsletter
PUT    /api/admin/newsletters/{id}   # Update newsletter
```

### Admin Content Endpoints
```
POST /api/admin/tts/generate         # Generate TTS audio
POST /api/admin/upload/resource      # Upload course resource
GET  /api/admin/resources            # Get uploaded resources
```

### Admin Analytics Endpoints
```
GET /api/admin/analytics/dashboard   # Dashboard analytics
GET /api/admin/analytics/course/{id} # Course-specific analytics
```

---

## Frontend Routes & Components

### Route Structure
```javascript
/                                    # NewsletterHub (home/archive)
/muscle-metabolic-health            # Newsletter Issue #42
/hiit-longevity                     # Newsletter Issue #43
/courses                            # Courses catalog
/courses/sleep-optimization         # Sleep course detail
/courses/pickleball-3p-system       # Pickleball course detail
/courses/*/success                  # Payment success page
/admin                              # Admin dashboard
/admin/courses/create               # Create course
/admin/courses/edit/:courseId       # Edit course
/admin-test                         # Admin testing
```

### Component Organization

**Page Components (src/components/):**
- Newsletter components for content display
- Course components for course detail pages
- Admin components for management interfaces
- Success component for payment confirmation

**UI Components (src/components/ui/):**
- 45+ reusable shadcn/ui components
- All styled with Tailwind CSS
- Radix UI primitives for accessibility
- Consistent design system

**Key Pattern:** Components are self-contained with their own logic and styling. Mock data in `src/mock.js` for development.

---

## Key Conventions & Patterns

### Code Style

**Python (Backend):**
- Async/await for all database and external API calls
- Pydantic models for data validation
- Type hints throughout
- Snake_case for variables and functions
- Comprehensive error handling with try/except blocks

**JavaScript/React (Frontend):**
- Functional components with hooks
- CamelCase for variables and functions
- PascalCase for components
- Arrow functions preferred
- Destructuring for props
- useEffect for side effects

### Security Patterns

**CRITICAL - Server-Side Pricing:**
```python
# backend/payments.py
COURSE_PACKAGES = {
    "sleep-optimization": {"price": 97.00},
    "pickleball-3p-system": {"price": 197.00}
}
```
- ALL prices defined server-side only
- Frontend sends course_id, backend determines price
- Prevents client-side price manipulation

**Webhook Security:**
- Stripe signature verification on all webhooks
- Transaction deduplication to prevent double-processing
- Status validation before processing

**Payment Flow:**
1. Frontend: User clicks "Enroll Now" → calls `/api/payments/checkout/session`
2. Backend: Creates Stripe session with FIXED course price
3. Frontend: Redirects to Stripe Checkout
4. Stripe: Handles payment → redirects back with session_id
5. Frontend: Polls `/api/payments/checkout/status/{session_id}`
6. Backend: Updates transaction via webhook
7. Frontend: Shows success/failure page

### Database Patterns

**UUID Primary Keys:**
```python
id: str = Field(default_factory=lambda: str(uuid.uuid4()))
```

**Timestamps:**
```python
created_at: datetime = Field(default_factory=datetime.utcnow)
updated_at: datetime = Field(default_factory=datetime.utcnow)
```

**ObjectId Serialization:**
- MongoDB uses ObjectId, converted to string in API responses
- Custom serialization in `backend/server.py:serialize_doc()`

### Error Handling

**Backend:**
- HTTP exceptions with appropriate status codes
- Detailed error messages in development
- Generic messages in production
- Logging for debugging

**Frontend:**
- Try/catch blocks for API calls
- Toast notifications for user feedback
- Console errors for debugging
- Graceful degradation

---

## Payment Integration

### Stripe Configuration

**Package:** `emergentintegrations 0.1.0`
- Custom library optimized for this platform
- Handles checkout, status checks, webhooks
- Automatic STRIPE_API_KEY from environment

**Fixed Course Packages:**
```python
COURSE_PACKAGES = {
    "sleep-optimization": {
        "title": "The 4-Week Sleep Optimization Blueprint",
        "price": 97.00,
        "instructor": "Randy Bauer, PT"
    },
    "pickleball-3p-system": {
        "title": "Pickleball 3P System",
        "price": 197.00,
        "instructor": "Randy Bauer, PT"
    }
}
```

**Webhook Events:**
- `checkout.session.completed` - Payment successful
- `checkout.session.expired` - Payment session expired
- Auto-updates transaction records

**Status Polling:**
- Frontend polls every 2 seconds during checkout
- Stops on completion, failure, or expiration
- Provides real-time feedback to users

---

## Testing

### Backend Testing

**File:** `backend_test.py` (497 lines)
**Coverage:** 10 comprehensive tests (100% passing)

**Test Suite:**
1. API Health Check
2. Checkout Session Creation
3. Payment Status Checking
4. Database Transaction Storage
5. Invalid Course ID Handling
6. Missing Parameters Handling
7. Invalid Session Status Handling
8. Course Package Configuration
9. Webhook Endpoint Structure
10. Transactions List Endpoint

**Testing Protocol:**
- Documented in `test_result.md`
- Agent-based testing coordination
- Priority-based test execution
- Task tracking with status history

**Run Tests:**
```bash
python backend_test.py
```

### Frontend Testing

**Status:** Test infrastructure exists but no tests implemented yet
**Framework:** React Testing Library (via react-scripts)

**Run Tests (when implemented):**
```bash
cd frontend
npm test
```

---

## Common Development Tasks

### Adding a New Course

1. **Define in backend/payments.py:**
```python
COURSE_PACKAGES["new-course-id"] = {
    "title": "Course Title",
    "price": 97.00,
    "instructor": "Instructor Name"
}
```

2. **Create frontend component:**
```javascript
// src/components/NewCourse.jsx
import React from 'react';
// Component implementation
```

3. **Add route in App.js:**
```javascript
<Route path="/courses/new-course-id" element={<NewCourse />} />
<Route path="/courses/new-course-id/success" element={<CourseSuccess />} />
```

4. **Update CoursesPage.jsx** to include the new course in catalog

### Adding a New Newsletter

1. **Create component in src/components/:**
```javascript
// NewNewsletter.jsx
export default function NewNewsletter() {
  // Use Newsletter.jsx or HIITNewsletter.jsx as template
}
```

2. **Add route in App.js:**
```javascript
<Route path="/newsletter-slug" element={<NewNewsletter />} />
```

3. **Update NewsletterHub.jsx** to include in archive

### Adding a New API Endpoint

1. **Define model in backend/models.py** (if needed)
2. **Add endpoint in appropriate backend file:**
   - `server.py` - General endpoints
   - `payments.py` - Payment-related
   - `admin.py` - Admin-only endpoints

3. **Update frontend to call endpoint:**
```javascript
const response = await axios.get(`${BACKEND_URL}/api/your-endpoint`);
```

### Database Operations

**Connect to MongoDB:**
```python
# backend/server.py
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
```

**CRUD Operations:**
```python
# Create
result = await db.collection_name.insert_one(document)

# Read
doc = await db.collection_name.find_one({"id": id})
docs = await db.collection_name.find().to_list(length=100)

# Update
await db.collection_name.update_one(
    {"id": id},
    {"$set": updated_fields}
)

# Delete
await db.collection_name.delete_one({"id": id})
```

### Running Database Seeds

```bash
cd backend
python seed_pickleball_course.py
```

---

## Important Notes for AI Assistants

### When Modifying Code

1. **Always read files before editing** - Don't propose changes to code you haven't read
2. **Respect security patterns** - Never modify server-side pricing logic
3. **Maintain consistency** - Follow existing patterns and conventions
4. **Avoid over-engineering** - Only make requested changes, no extra features
5. **Test your changes** - Run backend_test.py after backend modifications

### Payment-Related Changes

**CRITICAL:** Payment logic is EXTREMELY sensitive. Before modifying:
- Understand the full payment flow (see contracts.md)
- Maintain server-side price validation
- Never trust client-side pricing data
- Test webhook handlers thoroughly
- Verify Stripe signature validation remains intact

### Database Schema Changes

When modifying models:
1. Update `backend/models.py` first
2. Update corresponding collection in MongoDB
3. Update API documentation in `contracts.md`
4. Consider migration strategy for existing data

### Frontend State Management

**Current State:**
- Mock data in `src/mock.js` for newsletters and courses
- Real payment data from backend API
- No global state management (Redux/Context) yet
- Component-level state with useState/useEffect

**If adding backend integration:**
- Replace mock.js imports with API calls
- Add loading states
- Add error handling
- Consider caching strategy

### Component Library (shadcn/ui)

**Adding New Components:**
```bash
cd frontend
npx shadcn@latest add [component-name]
```

**Available Components:**
See `frontend/components.json` for configuration
All components in `src/components/ui/`

### CORS Configuration

Backend has CORS enabled for all origins (`allow_origins=["*"]`).
**TODO:** Restrict to specific origins in production.

### Environment-Specific Behavior

**Development:**
- Hot reload enabled
- Detailed error messages
- CORS open
- Mock data available

**Production:**
- Build optimizations
- Generic error messages
- CORS restricted
- Real data only

---

## Git Workflow

### Branch Strategy

**Main Branch:** `main` (or master)
**Feature Branches:** Use Claude-specific branch format:
```
claude/claude-md-[session-id]
```

### Commit Guidelines

**Good Commit Messages:**
- "Add payment status polling to CourseSuccess component"
- "Fix MongoDB ObjectId serialization in transaction endpoint"
- "Update course pricing for sleep-optimization package"

**Bad Commit Messages:**
- "fix bug"
- "updates"
- "WIP"

### Before Committing

1. **Test backend changes:** `python backend_test.py`
2. **Verify frontend builds:** `cd frontend && npm run build`
3. **Check for errors:** Review console logs
4. **Review git diff:** Ensure only intended changes
5. **Don't commit secrets:** Check `.env` files not included

### Push Strategy

```bash
# Push to feature branch
git push -u origin claude/claude-md-[session-id]

# Create PR when ready
gh pr create --title "Description" --body "Details"
```

---

## Current Development Status

### Completed
- Backend FastAPI setup with MongoDB
- Stripe payment integration (fully tested)
- Payment webhook handling
- Frontend React app with routing
- 12 page components (newsletters, courses, admin)
- 45+ UI components (shadcn/ui)
- Admin dashboard and course editor
- Backend test suite (10 tests, 100% passing)
- Payment flow end-to-end

### In Progress / Planned
- Frontend test suite
- User authentication system
- Course progress tracking
- Video lesson streaming
- Downloadable resources
- Email subscription management
- Newsletter analytics
- Backend integration for newsletters/courses (currently using mock.js)

### Known Issues
- Frontend still uses mock data for newsletters and course content
- No user authentication yet
- CORS open to all origins (needs production restriction)
- Frontend tests not implemented

---

## Quick Reference

### Key Files to Know

**Backend:**
- `backend/server.py` - Main app, routes, DB setup (351 lines)
- `backend/payments.py` - Payment endpoints and Stripe logic (280 lines)
- `backend/admin.py` - Admin CRUD operations (267 lines)
- `backend/models.py` - All Pydantic models (125 lines)

**Frontend:**
- `frontend/src/App.js` - Routes and app setup (65 lines)
- `frontend/src/mock.js` - Mock data for development
- `frontend/src/components/CoursesPage.jsx` - Course catalog (415 lines)
- `frontend/src/components/CourseSuccess.jsx` - Payment success (247 lines)

**Documentation:**
- `contracts.md` - API contracts and integration patterns
- `test_result.md` - Testing protocol and results
- `README.md` - Basic project info (minimal)
- `CLAUDE.md` - This file

### Common Commands

```bash
# Start backend
cd backend && uvicorn server:app --reload

# Start frontend
cd frontend && npm start

# Run tests
python backend_test.py

# Install dependencies
cd backend && pip install -r requirements.txt
cd frontend && npm install

# Build frontend
cd frontend && npm run build

# Add shadcn/ui component
cd frontend && npx shadcn@latest add [component]
```

### Environment URLs

**Development:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Useful MongoDB Queries

```javascript
// Find all courses
db.courses.find({})

// Find all transactions
db.payment_transactions.find({})

// Find paid transactions
db.payment_transactions.find({"payment_status": "paid"})

// Find all newsletters
db.newsletters.find({})
```

---

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
- Check MONGO_URL in .env
- Verify MongoDB is running
- Test connection string

**Stripe API Error:**
- Verify STRIPE_API_KEY in .env
- Check Stripe dashboard for issues
- Ensure key starts with `sk_test_` (test) or `sk_live_` (prod)

**Import Errors:**
- Reinstall dependencies: `pip install -r requirements.txt`
- Check Python version (3.8+)
- Verify virtual environment activated

### Frontend Issues

**API Connection Error:**
- Verify REACT_APP_BACKEND_URL in .env
- Check backend is running
- Inspect browser console for CORS errors

**Build Errors:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm cache clean --force`
- Check Node version (14+)

**Component Import Errors:**
- Verify component exists in src/components/ui/
- Check import path (case-sensitive)
- Ensure shadcn/ui installed correctly

### Payment Flow Issues

**Checkout Session Creation Fails:**
- Verify course_id matches COURSE_PACKAGES key
- Check success_url and cancel_url format
- Review backend logs for errors

**Payment Status Not Updating:**
- Check webhook endpoint is accessible
- Verify Stripe webhook signature
- Review payment_transactions collection

---

## Resources

### Documentation
- FastAPI: https://fastapi.tiangolo.com/
- React: https://react.dev/
- MongoDB Motor: https://motor.readthedocs.io/
- Stripe API: https://stripe.com/docs/api
- shadcn/ui: https://ui.shadcn.com/
- Tailwind CSS: https://tailwindcss.com/

### Tools
- MongoDB Compass: GUI for MongoDB
- Stripe Dashboard: Payment monitoring
- React DevTools: Component debugging
- Postman: API testing

---

## Contact & Support

For questions about this codebase:
1. Review this CLAUDE.md file
2. Check contracts.md for API details
3. Read test_result.md for testing info
4. Inspect relevant source files
5. Review git history for context

**Last Updated:** 2025-12-19
**Version:** 1.0.0
