import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import authService from '../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to appropriate dashboard
    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      if (user?.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (user?.role === 'GUARD') navigate('/guard', { replace: true });
      else if (user?.role === 'OCCUPIER') navigate('/occupier', { replace: true });
    }
    setMounted(true);
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await authService.login(email, password);

      // Navigate based on role returned by backend — no client-side role selection
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'GUARD') {
        navigate('/guard', { replace: true });
      } else if (user.role === 'OCCUPIER') {
        navigate('/occupier', { replace: true });
      } else {
        setError('Unauthorized access. Please contact your administrator.');
      }
    } catch (err) {
      setError(err || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '2rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              backgroundColor: '#eff6ff',
              borderRadius: '50%',
              marginBottom: '1rem',
            }}
          >
            <Truck size={32} color="#2563eb" />
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 0.5rem 0',
            }}
          >
            GateSync Login
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
            Enter your credentials to access your account
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #f87171',
              borderRadius: '6px',
              color: '#b91c1c',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="login-email"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem',
              }}
            >
              Email Address / Account ID
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '0',
                  top: '0',
                  bottom: '0',
                  paddingLeft: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  color: '#9ca3af',
                }}
              >
                <Mail size={18} />
              </div>
              <input
                id="login-email"
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#1f2937',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="login-password"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '0',
                  top: '0',
                  bottom: '0',
                  paddingLeft: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  color: '#9ca3af',
                }}
              >
                <Lock size={18} />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '0.625rem 2.5rem 0.625rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#1f2937',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: '0',
                  top: '0',
                  bottom: '0',
                  paddingRight: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <a
                href="#"
                style={{
                  fontSize: '0.75rem',
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                Forgot password?
              </a>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '0.625rem 1rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLoading ? 0.7 : 1,
              transition: 'background-color 0.15s ease-in-out',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.target.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.target.style.backgroundColor = '#2563eb';
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          textAlign: 'center',
          width: '100%',
          fontSize: '0.75rem',
          color: '#6b7280',
        }}
      >
        © {new Date().getFullYear()} GateSync Management System
      </div>
    </div>
  );
};

export default Login;
