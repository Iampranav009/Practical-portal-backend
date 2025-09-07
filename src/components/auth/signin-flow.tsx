"use client"

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, LucideIcon, ArrowLeft, User, GraduationCap, Home } from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { UserRole } from "@/contexts/auth-context";
import { apiCall } from "@/utils/api";

// Google Icon Component
interface GoogleIconProps {
  className?: string;
}

const GoogleIcon = ({ className }: GoogleIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    width="24"
    height="24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className = "" }: CardProps) => (
  <div className={`bg-card border border-border rounded-lg ${className}`}>
    {children}
  </div>
);

// Form Header Component
interface FormHeaderProps {
  title: string;
  subtitle: string;
}

const FormHeader = ({ title, subtitle }: FormHeaderProps) => (
  <div className="text-center space-y-2">
    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
      {title}
    </h1>
    <p className="text-gray-600">
      {subtitle}
    </p>
  </div>
);

// Input Field Component
interface InputFieldProps {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: LucideIcon;
  required?: boolean;
  className?: string;
}

const InputField = ({ 
  id, 
  type, 
  label, 
  placeholder, 
  value, 
  onChange, 
  icon: Icon, 
  required = false,
  className = ""
}: InputFieldProps) => (
  <div className="space-y-2">
    <label 
      htmlFor={id} 
      className="text-sm font-medium text-gray-700"
    >
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full h-11 pl-10 pr-3 rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:border-purple-500 transition-all duration-300 ${className}`}
        required={required}
      />
    </div>
  </div>
);

// Password Field Component
interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  required?: boolean;
  className?: string;
}

const PasswordField = ({ 
  id, 
  label, 
  placeholder, 
  value, 
  onChange, 
  showPassword, 
  onTogglePassword, 
  required = false,
  className = ""
}: PasswordFieldProps) => (
  <div className="space-y-2">
    <label 
      htmlFor={id} 
      className="text-sm font-medium text-gray-700"
    >
      {label}
    </label>
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full h-11 pl-10 pr-10 rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:border-purple-500 transition-all duration-300 ${className}`}
        required={required}
      />
      <button
        type="button"
        onClick={onTogglePassword}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </div>
);

// Checkbox Component
interface CheckboxProps {
  id: string;
  label: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox = ({ id, label, checked, onChange }: CheckboxProps) => (
  <label htmlFor={id} className="flex items-center space-x-2 cursor-pointer">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
    />
    <span className="text-gray-600 select-none text-sm">{label}</span>
  </label>
);

// Link Component
interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const Link = ({ href, children, className = "" }: LinkProps) => (
  <a
    href={href}
    className={`text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300 ${className}`}
  >
    {children}
  </a>
);

// Button Component
interface ButtonProps {
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "outline" | "gradient";
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

const Button = ({ 
  type = "button", 
  variant = "primary", 
  onClick, 
  children, 
  className = "",
  fullWidth = false,
  disabled = false 
}: ButtonProps) => {
  const baseStyles = "h-11 rounded-md font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-primary-foreground shadow-lg hover:opacity-90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-border bg-background hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 text-foreground transition-all duration-200",
    gradient: "w-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 text-white py-3 rounded-md font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
};

// Divider Component
interface DividerProps {
  text: string;
}

const Divider = ({ text }: DividerProps) => (
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300"></div>
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-white px-2 text-gray-500">
        {text}
      </span>
    </div>
  </div>
);

// Social Button Component
interface SocialButtonProps {
  provider: "google" | "github" | "facebook";
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const SocialButton = ({ provider, onClick, children, disabled = false }: SocialButtonProps) => {
  const icons = {
    google: <GoogleIcon className="h-5 w-5" />,
    github: null, // Add GitHub icon if needed
    facebook: null // Add Facebook icon if needed
  };

  return (
    <Button variant="outline" onClick={onClick} fullWidth disabled={disabled}>
      {icons[provider]}
      {children}
    </Button>
  );
};

// Role Selection Button Component
interface RoleButtonProps {
  role: UserRole;
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

const RoleButton = ({ icon: Icon, title, description, onClick }: RoleButtonProps) => (
  <button
    onClick={onClick}
    className="w-full p-6 bg-white border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 hover:shadow-md transition-all duration-300 group"
  >
    <div className="flex flex-col items-center text-center space-y-3">
      <div className="p-3 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors">
        <Icon className="h-8 w-8 text-purple-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  </button>
);

// Animated Blob Component
interface AnimatedBlobProps {
  color: string;
  position: string;
  delay?: string;
}

const AnimatedBlob = ({ color, position, delay = "" }: AnimatedBlobProps) => (
  <div className={`absolute ${position} w-72 h-72 ${color} rounded-full mix-blend-screen filter blur-xl opacity-70 animate-blob ${delay}`} />
);

// Gradient Wave Component
const GradientWave = () => (
  <div className="absolute inset-0 opacity-20">
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 560">
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path fill="url(#gradient1)" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,186.7C1248,181,1344,203,1392,213.3L1440,224L1440,560L1392,560C1344,560,1248,560,1152,560C1056,560,960,560,864,560C768,560,672,560,576,560C480,560,384,560,288,560C192,560,96,560,48,560L0,560Z" />
    </svg>
  </div>
);

// Progress Dots Component
interface ProgressDotsProps {
  count?: number;
  activeIndex?: number;
  color?: string;
}

const ProgressDots = ({ count = 3, activeIndex = 2, color = "white" }: ProgressDotsProps) => (
  <div className="flex justify-center gap-2 pt-4">
    {Array.from({ length: count }).map((_, index) => (
      <div 
        key={index}
        className={`w-2 h-2 rounded-full bg-${color}/${index <= activeIndex ? (100 - (activeIndex - index) * 20) : 40}`}
      />
    ))}
  </div>
);

// Icon Badge Component
interface IconBadgeProps {
  icon: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "light";
}

const IconBadge = ({ icon, size = "md", variant = "light" }: IconBadgeProps) => {
  const sizes = {
    sm: "p-2",
    md: "p-3",
    lg: "p-4"
  };

  const variants = {
    light: "bg-white/10 backdrop-blur-sm text-white",
  };

  return (
    <div className={`inline-flex rounded-full ${sizes[size]} ${variants[variant]} mb-4`}>
      {icon}
    </div>
  );
};

// Hero Section Component
interface HeroSectionProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  showProgress?: boolean;
}

const HeroSection = ({ title, description, icon, showProgress = true }: HeroSectionProps) => (
  <div className="text-center space-y-6 max-w-md">
    {icon && (
      <IconBadge icon={icon} size="md" variant="light" />
    )}
    <h2 className="text-3xl lg:text-4xl font-bold text-white">
      {title}
    </h2>
    <p className="text-lg text-white/80">
      {description}
    </p>
    {showProgress && <ProgressDots count={3} activeIndex={2} color="white" />}
  </div>
);

// Gradient Background Component
interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: "default" | "light";
}

const GradientBackground = ({ children, variant = "default" }: GradientBackgroundProps) => {
  const variants = {
    default: "bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800",
    light: "bg-gradient-to-br from-white via-blue-50 to-purple-50"
  };

  return (
    <div className={`hidden lg:flex flex-1 relative overflow-hidden`}>
      <div className={`absolute inset-0 ${variants[variant]}`} />
      
      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 bg-black/10" />
      
      <div className="absolute inset-0">
        <AnimatedBlob color="bg-purple-400/20" position="top-0 -left-4" />
        <AnimatedBlob color="bg-indigo-400/20" position="top-0 -right-4" delay="animation-delay-2000" />
        <AnimatedBlob color="bg-purple-500/20" position="-bottom-8 left-20" delay="animation-delay-4000" />
      </div>

      <GradientWave />
      
      <div className="relative z-10 flex items-center justify-center p-8 lg:p-12 w-full">
        {children}
      </div>
    </div>
  );
};

// Form Footer Component
interface FormFooterProps {
  text: string;
  linkText: string;
  linkHref: string;
}

const FormFooter = ({ text, linkText, linkHref }: FormFooterProps) => (
  <p className="mt-6 text-center text-sm text-gray-600">
    {text}{" "}
    <Link href={linkHref}>
      {linkText}
    </Link>
  </p>
);

// Home Button Component
const HomeButton = () => (
  <Link
    href="/"
    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm font-medium"
  >
    <Home className="h-4 w-4" />
    Back to Home
  </Link>
);

// ============================================================================
// MAIN SIGNIN FLOW COMPONENT
// ============================================================================

const SignInFlow = () => {
  // Get URL parameters
  const searchParams = useSearchParams();
  
  // Authentication state management
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole | null>(null);
  
  // Form fields state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle URL parameters for pre-selecting role
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'student' || roleParam === 'teacher') {
      setRole(roleParam as UserRole);
      setStep(2);
    }
  }, [searchParams]);

  /**
   * Handle role selection (Step 1)
   * Sets the selected role and moves to Step 2
   */
  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(2);
    setError(""); // Clear any previous errors
  };

  /**
   * Handle back button click
   * Returns to Step 1 and clears form data
   */
  const handleBack = () => {
    setStep(1);
    setRole(null);
    setEmail("");
    setPassword("");
    setRememberMe(false);
    setError("");
  };

  /**
   * Handle Google Sign In
   * Uses Firebase Google Auth Provider
   */
  const handleGoogleSignIn = async () => {
    if (!role) return;
    
    setLoading(true);
    setError("");
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Store user role in backend along with Google auth data
      await apiCall('auth/google-signin', {
        method: 'POST',
        body: JSON.stringify({
          firebaseUid: user.uid,
          name: user.displayName,
          email: user.email,
          role: role,
          photoURL: user.photoURL
        })
      });

      // Redirect to appropriate dashboard
      window.location.href = role === 'teacher' ? '/teachers/dashboard' : '/students/my-batches';
      
    } catch (error: unknown) {
      console.error('Google sign in error:', error);
      
      // Handle different types of errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('popup-closed-by-user')) {
        setError('Sign in was cancelled. Please try again.');
      } else if (errorMessage.includes('Validation errors')) {
        setError('Please select a role first.');
      } else {
        setError(errorMessage || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle email/password sign in
   * Uses Firebase email/password authentication
   */
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Sign in with Firebase first
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Verify user role in backend
      await apiCall('auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: email,
          role: role
        })
      });

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Redirect to appropriate dashboard
      window.location.href = role === 'teacher' ? '/teachers/dashboard' : '/students/my-batches';
      
    } catch (error: unknown) {
      console.error('Email sign in error:', error);
      
      // Handle different types of errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('auth/invalid-credential')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (errorMessage.includes('Validation errors')) {
        setError('Please fill in all required fields correctly.');
      } else if (errorMessage.includes('User not found')) {
        setError('No account found with this email. Please sign up first.');
      } else {
        setError(errorMessage || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render Step 1: Role Selection
   */
  const renderRoleSelection = () => (
    <div className="w-full max-w-md space-y-8">
      <div className="flex justify-start">
        <HomeButton />
      </div>
      <FormHeader 
        title="Welcome Back"
        subtitle="Sign in to your account"
      />

      <Card className="p-6 sm:p-8 shadow-lg bg-white border-0">
        <div className="space-y-4">
          <RoleButton
            role="student"
            icon={GraduationCap}
            title="Student Sign In"
            description="Access courses, assignments, and track your progress"
            onClick={() => handleRoleSelect('student')}
          />
          
          <RoleButton
            role="teacher"
            icon={User}
            title="Teacher Sign In"
            description="Manage courses, create assignments, and track student progress"
            onClick={() => handleRoleSelect('teacher')}
          />
        </div>

        <FormFooter 
          text="Don't have an account?"
          linkText="Sign up"
          linkHref={role ? `/auth/signup?role=${role}` : "/auth/signup"}
        />
      </Card>
    </div>
  );

  /**
   * Render Step 2: Authentication Form
   */
  const renderAuthForm = () => (
    <div className="w-full max-w-md space-y-8">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back to role selection"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <FormHeader 
            title={`${role === 'student' ? 'Student' : 'Teacher'} Sign In`}
            subtitle={`Welcome back! Please enter your ${role} credentials`}
          />
        </div>
        <HomeButton />
      </div>

      <Card className="p-6 sm:p-8 shadow-lg bg-white border-0">
        <form onSubmit={handleEmailSignIn} className="space-y-6">
          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 p-3 rounded-md">
              {error}
            </div>
          )}
          
          <InputField
            id="email"
            type="email"
            label="Email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            required
          />

          <PasswordField
            id="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            required
          />

          <div className="flex items-center justify-between text-sm">
            <Checkbox
              id="remember"
              label="Remember me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <Link href="/auth/forgot-password">Forgot password?</Link>
          </div>

          <Button 
            type="submit" 
            variant="gradient" 
            fullWidth 
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <Divider text="Or continue with" />

          <SocialButton 
            provider="google" 
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            Continue with Google
          </SocialButton>
        </form>

        <FormFooter 
          text="Don't have an account?"
          linkText="Sign up"
          linkHref={role ? `/auth/signup?role=${role}` : "/auth/signup"}
        />
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full">
      {/* Left Side - Authentication Flow */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
        {step === 1 ? renderRoleSelection() : renderAuthForm()}
      </div>

      {/* Right Side - Hero Section with Gradient Background */}
      <GradientBackground variant="default">
        <HeroSection
          title="Secure Authentication"
          description="Your data is protected with industry-standard encryption and security measures. Sign in with confidence."
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          showProgress
        />
      </GradientBackground>
    </div>
  );
};

export default SignInFlow;
