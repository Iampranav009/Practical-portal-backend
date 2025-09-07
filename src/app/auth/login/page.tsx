import SignInFlow from "@/components/auth/signin-flow";

/**
 * Login page for the Practical Portal application
 * 
 * This page provides a 2-step login interface with:
 * - Step 1: Role selection (Student/Teacher)
 * - Step 2: Authentication form with role-specific fields
 * - Firebase authentication integration
 * - Beautiful gradient animations and responsive design
 */
export default function LoginPage() {
  return <SignInFlow />;
}

// Page metadata for SEO and accessibility
export const metadata = {
  title: "Login - Practical Portal",
  description: "Sign in to your Practical Portal account. Choose your role and access courses, assignments, and manage your learning journey.",
};
