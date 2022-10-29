<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <img
              src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg"
              alt="Logo"
            />
          </q-avatar>
          FireCache
        </q-toolbar-title>
        <div v-if="userData" class="flex justify-center">
          <q-badge
            v-if="userStats"
            outline
            color="white"
            class="font-jetbrains-mono"
            :label="`File count: ${userStats.fileCount}`"
          />
          <q-badge
            v-if="userStats"
            outline
            color="white"
            class="font-jetbrains-mono q-ml-md"
            :label="`Usage: ${byteToSize(userStats.storageUsed)} / ${byteToSize(
              userStats.storageLimit
            )}`"
          />
          <q-badge
            outline
            color="white"
            class="font-jetbrains-mono q-ml-md"
            :label="userData.email"
          />
          <q-btn
            class="font-jetbrains-mono q-ml-md"
            text-color="primary"
            color="white"
            label="Sign out"
            @click="logout"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { auth, db } from 'boot/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getDoc, doc, DocumentData } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const router = useRouter();
const userData = ref<User | null>(null);
const userStats = ref<DocumentData | null>(null);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userData.value = user;
    const userDoc = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDoc);
    userStats.value = docSnap.data() as DocumentData;

    if (router.currentRoute.value.path !== '/') {
      await router.push('/');
    }
  } else {
    if (router.currentRoute.value.path !== '/login') {
      await router.push('/login');
    }
  }
});

const byteToSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
};

const logout = async () => {
  userData.value = null;
  await signOut(auth);
};
</script>
