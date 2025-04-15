import { computed, ref } from 'vue';

const STORAGE_KEY = 'oidcUser';

function saveUser(user: any) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function loadStoredUser() {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

function clearUser() {
  sessionStorage.removeItem(STORAGE_KEY);
}

const currentUser = ref(loadStoredUser());

export function useOidc() {
  const isAuthenticated = computed(() => currentUser.value !== null);

  async function loadUser() {
    try {
      const response = await fetch('/api/auth/current-user', { credentials: 'include' });
      if (response.ok) {
        const user = await response.json();
        currentUser.value = user;
        saveUser(user);
      } else {
        currentUser.value = null;
      }
    } catch (error) {
      console.error('Error loading user', error);
      currentUser.value = null;
    }
  }

  // The login flow redirects to the backend.
  function signIn() {
    window.location.href = '/api/auth/login';
  }

  // Sign out by redirecting to the backend logout endpoint,
  // and then clear local storage and state.
  function signOut() {
    window.location.href = '/api/auth/logout';
    clearUser();
    currentUser.value = null;
  }

  return {
    currentUser,
    isAuthenticated,
    loadUser,
    signIn,
    signOut,
  };
}