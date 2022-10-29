<template>
  <q-page class="row items-center justify-evenly font-jetbrains-mono">
    <div class="flex column">
      <h5>Select files</h5>
      <q-file
        v-model="files"
        label="Pick files"
        filled
        counter
        multiple
        style="max-width: 300px"
      />
      <q-btn
        class="q-mt-md"
        color="primary"
        label="Upload"
        @click="uploadFiles"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { httpsCallable } from 'firebase/functions';
import { functions } from 'boot/firebase';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const files = ref<File[]>([]);

type UploadFilesPayload = { files: Array<{ name: string; size: number }> };
type UploadFilesResult = {
  result: Record<string, string>;
  error?: { message: string };
};

const uploadFiles = async () => {
  const dialog = $q.dialog({
    message: `Uploading ${files.value.length} files.`,
    progress: true,
    persistent: true,
    ok: false,
  });

  const uploadFiles = httpsCallable<UploadFilesPayload, UploadFilesResult>(
    functions,
    'getUploadSignedUrls'
  );

  const payload = files.value.map((file) => ({
    name: file.name,
    size: file.size,
  }));

  const { data } = await uploadFiles({ files: payload });

  if (data.result) {
    const gcsUploads = files.value.map((file) => {
      const url = data.result[file.name];
      return fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });
    });

    try {
      await Promise.all(gcsUploads);
      $q.notify({
        type: 'positive',
        message: `Uploaded ${files.value.length} files.`,
      });
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: String(error),
      });
    }
  }

  dialog.hide();

  if (data.error) {
    $q.notify({
      type: 'negative',
      message: data.error.message,
    });
  }
};
</script>
