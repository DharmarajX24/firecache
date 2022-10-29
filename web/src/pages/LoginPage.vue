<template>
  <q-page class="row items-center justify-evenly">
    <div class="flex column items-center">
      <h5 class="q-mb-none font-jetbrains-mono">Sign in to continue</h5>
      <q-btn
        icon="mdi-google"
        class="q-mt-md font-jetbrains-mono"
        color="primary"
        label="Sign in with Google"
        @click="signInWithGoogle"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { auth } from 'boot/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};
</script>
