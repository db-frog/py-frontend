<script lang="ts">
import { useOidc } from '@/composables/useOidc';
import { defineComponent, onMounted } from "vue";

export default defineComponent({
  name: "AuthButton",
  setup() {
    const { signIn, signOut, isAuthenticated, currentUser, loadUser } = useOidc();

    const login = async () => {
      signIn();
    };

    const logout = async () => {
      signOut();
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
    <a class="text-xl auth not-forced-colors hover:underline" v-if="!isAuthenticated" aria-label="Login to Calnet"  @click="login">Login</a>
    <a class="text-xl auth not-forced-colors hover:underline" v-if="isAuthenticated" aria-label="Logout of Calnet" @click="logout">Logout</a>
  </div>
</template>


<style scoped>
.auth {
  color: var(--color-primary-blue);
}
.auth:hover {
  color: var(--color-secondary-orange);
  background-color: transparent;
  cursor: pointer;
}

</style>