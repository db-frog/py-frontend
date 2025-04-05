<script lang="ts">
import { useOidc } from '@/composables/useOidc';
import { defineComponent, onMounted } from "vue";

export default defineComponent({
  name: "AuthButton",
  setup() {
    const { signIn, signOut, isAuthenticated, currentUser, loadUser } = useOidc();

    const login = async () => {
      await signIn();
    };

    const logout = async () => {
      await signOut();
      window.location.href = window.location.origin;
    };

    onMounted(() => {
      loadUser();
    });

    return {
      login,
      logout,
      isAuthenticated,
      user: currentUser,
    };
  },
});
</script>

<template>
  <div>
    <button v-if="!isAuthenticated"  @click="login">Login</button>
    <button v-if="isAuthenticated" @click="logout">Logout</button>
    <span v-if="isAuthenticated && user">
      Hello, {{ user.profile.name || user.profile.preferred_username }}
    </span>
  </div>
</template>


<style>
button {
  background-color: var(--color-primary-blue);
  color: var(--color-primary-white);
  display: block;
  margin-top: 0.5rem;
  width: 25%;
}
button:hover {
  background-color: var(--color-secondary-darknavy);
  cursor: pointer;
}

</style>