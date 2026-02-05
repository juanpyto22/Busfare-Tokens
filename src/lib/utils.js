import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const STRIPE_KEYS = {
  PUBLISHABLE: "pk_test_51SeX6bBEyBNhEGxLxSXTi6rLM85vFRYMdCPwkOlCUzlq5KzfufjxwRy5zbpOB3FdLpbpR0ZsuVpDmx67RddZn0zy00NyQVPzb2",
  // SECURITY WARNING: Secret keys should NEVER be exposed on the frontend.
  // In a real app, this would be on your backend server.
  // The SECRET key has been removed for security reasons and should be handled on the backend.
}