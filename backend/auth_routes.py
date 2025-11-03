"""
Authentication routes for user registration, login, and profile management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from typing import Optional

from models import User, UserCreate, UserLogin, Token, UserUpdate, UserInDB
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_active_user,
)

# Create router
auth_router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


@auth_router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user

    Args:
        user_data: User registration data

    Returns:
        JWT token and user information

    Raises:
        HTTPException: If email already exists
    """
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user document
    user_dict = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": get_password_hash(user_data.password),
        "is_active": True,
        "is_admin": False,
        "enrolled_courses": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    # Insert into database
    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)

    # Create user object (without password)
    user_obj = User(
        id=user_dict["id"],
        email=user_dict["email"],
        full_name=user_dict["full_name"],
        is_active=user_dict["is_active"],
        is_admin=user_dict["is_admin"],
        enrolled_courses=user_dict["enrolled_courses"],
        created_at=user_dict["created_at"],
        updated_at=user_dict["updated_at"],
    )

    # Generate access token
    access_token = create_access_token(data={"sub": user_data.email})

    return Token(access_token=access_token, user=user_obj)


@auth_router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """
    Login user with email and password

    Args:
        user_credentials: User login credentials

    Returns:
        JWT token and user information

    Raises:
        HTTPException: If credentials are invalid
    """
    # Find user by email
    user_doc = await db.users.find_one({"email": user_credentials.email})

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not verify_password(user_credentials.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )

    # Create user object (without password)
    user_obj = User(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        full_name=user_doc["full_name"],
        is_active=user_doc.get("is_active", True),
        is_admin=user_doc.get("is_admin", False),
        enrolled_courses=user_doc.get("enrolled_courses", []),
        created_at=user_doc.get("created_at", datetime.utcnow()),
        updated_at=user_doc.get("updated_at", datetime.utcnow()),
    )

    # Generate access token
    access_token = create_access_token(data={"sub": user_credentials.email})

    return Token(access_token=access_token, user=user_obj)


@auth_router.post("/login/form", response_model=Token)
async def login_form(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login using OAuth2 password flow (for compatibility with OAuth2PasswordBearer)

    Args:
        form_data: OAuth2 form data with username (email) and password

    Returns:
        JWT token and user information
    """
    # Use email from username field
    user_credentials = UserLogin(email=form_data.username, password=form_data.password)
    return await login(user_credentials)


@auth_router.get("/me", response_model=User)
async def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """
    Get current user profile

    Args:
        current_user: Authenticated user from token

    Returns:
        User profile information
    """
    return current_user


@auth_router.put("/me", response_model=User)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Update current user profile

    Args:
        user_update: Updated user data
        current_user: Authenticated user from token

    Returns:
        Updated user profile

    Raises:
        HTTPException: If email already exists (when changing email)
    """
    update_data = {}

    # Update full name if provided
    if user_update.full_name is not None:
        update_data["full_name"] = user_update.full_name

    # Update email if provided
    if user_update.email is not None and user_update.email != current_user.email:
        # Check if new email already exists
        existing_user = await db.users.find_one({"email": user_update.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        update_data["email"] = user_update.email

    # Update password if provided
    if user_update.password is not None:
        update_data["hashed_password"] = get_password_hash(user_update.password)

    # Update timestamp
    update_data["updated_at"] = datetime.utcnow()

    # Perform update
    if update_data:
        await db.users.update_one(
            {"email": current_user.email},
            {"$set": update_data}
        )

    # Fetch updated user
    updated_user_doc = await db.users.find_one({"email": update_data.get("email", current_user.email)})

    return User(
        id=str(updated_user_doc["_id"]),
        email=updated_user_doc["email"],
        full_name=updated_user_doc["full_name"],
        is_active=updated_user_doc.get("is_active", True),
        is_admin=updated_user_doc.get("is_admin", False),
        enrolled_courses=updated_user_doc.get("enrolled_courses", []),
        created_at=updated_user_doc.get("created_at", datetime.utcnow()),
        updated_at=updated_user_doc.get("updated_at", datetime.utcnow()),
    )


@auth_router.get("/verify", response_model=dict)
async def verify_token_endpoint(current_user: User = Depends(get_current_user)):
    """
    Verify if the current token is valid

    Args:
        current_user: Authenticated user from token

    Returns:
        Verification status and user email
    """
    return {
        "valid": True,
        "email": current_user.email,
        "user_id": current_user.id
    }
