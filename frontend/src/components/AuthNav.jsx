import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';

/**
 * Authentication navigation component
 * Shows login/register for guests, profile/logout for authenticated users
 */
const AuthNav = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login">
          <Button variant="ghost" size="sm">
            Login
          </Button>
        </Link>
        <Link to="/register">
          <Button size="sm">
            Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  // Get initials from user's full name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex items-center gap-2">
      <Link to="/profile">
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{user.full_name}</span>
        </Button>
      </Link>
    </div>
  );
};

export default AuthNav;
