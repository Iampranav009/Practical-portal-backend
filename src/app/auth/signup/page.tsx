import SignUpFlow from "@/components/auth/signup-flow";

/**
 * Signup page for the Practical Portal application
 * 
 * This page provides a 2-step signup interface with:
 * - Step 1: Role selection (Student/Teacher)
 * - Step 2: Registration form with role-specific fields
 * - Firebase authentication integration
 * - Beautiful gradient animations and responsive design
 */
export default function SignupPage() {
  return <SignUpFlow />;
}

// Page metadata for SEO and accessibility
export const metadata = {
  title: "Sign Up - Practical Portal",
  description: "Create your Practical Portal account. Choose your role and start your learning or teaching journey.",
};
