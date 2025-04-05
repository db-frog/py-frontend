import { ref, computed } from 'vue';
import { UserManager, WebStorageStateStore, User } from 'oidc-client-ts';

// OIDC configuration with provided values and a client secret.
const config = {
  authority: 'https://auth-test.berkeley.edu/cas/oidc',
  client_id: 'anthropology_folklore_archive',
  client_secret: import.meta.env.VITE_CLIENT_SECRET,
  redirect_uri: window.location.origin + '/callback',
  response_type: 'code',
  scope: 'openid profile berkeley_edu_default',
  post_logout_redirect_uri: window.location.origin,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
};

const userManager = new UserManager(config);
const currentUser = ref<User | null>(null);

export function useOidc() {
  // isAuthenticated is true if we have a non-null user
  const isAuthenticated = computed(() => currentUser.value !== null);

  async function loadUser() {
    try {
      const user = await userManager.getUser();
      currentUser.value = user;
    } catch (error) {
      console.error('Error loading user', error);
      currentUser.value = null;
    }
  }

  async function signIn() {
    await userManager.signinRedirect();
  }

  async function handleCallback() {
    try {
      const user = await userManager.signinRedirectCallback();
      currentUser.value = user;
    } catch (error) {
      console.error('Error handling callback', error);
    }
  }

  async function signOut() {
    await userManager.signoutRedirect();
    currentUser.value = null;
  }

  return {
    currentUser,
    isAuthenticated,
    loadUser,
    signIn,
    handleCallback,
    signOut,
  };
}