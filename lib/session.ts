import type { User as FirebaseUser } from "firebase/auth"

// Helper functions for session management
export function getUser() {
  if (typeof window === "undefined") return null

  const user = localStorage.getItem("user")
  if (!user) return null

  try {
    return JSON.parse(user)
  } catch (error) {
    console.error("Error parsing user data:", error)
    return null
  }
}

export function setUser(userData: any) {
  if (typeof window === "undefined") return

  localStorage.setItem("user", JSON.stringify(userData))
  // Also set a cookie for middleware to check
  document.cookie = `user_session=true; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
}

export function clearUser() {
  if (typeof window === "undefined") return

  localStorage.removeItem("user")
  // Clear the session cookie
  document.cookie = "user_session=; path=/; max-age=0"
}

export function setFirebaseUser(user: FirebaseUser | null) {
  // This function is intentionally empty as it's not used in the current implementation.
  // It's included to satisfy the missing export requirement.
}

