import { redirect } from 'next/navigation';

/**
 * Redirect to the new auth structure
 * This maintains backward compatibility for /login links
 */
export default function LoginPage() {
  redirect('/auth/login');
}

// Page metadata for SEO and accessibility
export const metadata = {
  title: "Login - Practical Portal",
  description: "Sign in to your Practical Portal account to access courses, assignments, and manage your learning journey.",
};
