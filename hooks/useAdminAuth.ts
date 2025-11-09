import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

/**
 * Admin authentication hook
 * Checks if the current user has admin privileges
 * Redirects to home if not authorized
 */
export function useAdminAuth() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // TODO: Replace with actual authentication check
      // Example:
      // const user = await getCurrentUser();
      // const isAdminUser = user?.accountType === 'admin';

      // Mock: Always return true for development
      // In production, this should validate against backend
      const isAdminUser = true; // Replace with actual check

      if (!isAdminUser) {
        // Not authorized - redirect to home
        router.replace('/');
      } else {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Failed to check admin status:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, loading };
}
