<script setup lang="ts">
import { ref } from "vue";

const vncInputValue = ref<string>("");
const isVncRunning = ref<boolean>(false);

function handleConnectionStatus() {
  if (
    !isVncRunning.value &&
    (!vncInputValue.value || vncInputValue.value.indexOf("wss://") !== 0)
  ) {
    return;
  }
  isVncRunning.value = !isVncRunning.value;
}
</script>

<template>
  <div class="app">
    <div class="app-control">
      <input class="app-input" placeholder="wss://" v-model="vncInputValue" />
      <button class="app-button" @click="handleConnectionStatus">
        {{ isVncRunning ? "disconnect" : "connect" }}
      </button>
    </div>
    <div class="app-message">
      Since the site is loaded over HTTPS, only `wss://` URLs (SSL encrypted
      websockets URLs) are supported.
      <br />
      To test a `ws://` URL, clone the application and run it on
      http://localhost:3000
    </div>
    <VueVnc
      v-if="isVncRunning"
      :url="vncInputValue"
      style="
         {
          box-shadow: 0px 15px 30px rgba(0, 0, 0, 0.1),
            0px 30px 60px rgba(0, 0, 0, 0.09);
          background-color: #dcdcdc;
        }
      "
    ></VueVnc>
  </div>
</template>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  padding: 10px;
}
.app .app-control {
  margin-bottom: 10px;
}
.app .app-control .app-input {
  width: 300px;
  height: 30px;
  line-height: 30px;
  margin-right: 10px;
  font-size: 14px;
}
.app .app-control .app-button {
  width: 80px;
  height: 30px;
  font-size: 14px;
}
.app .app-message {
  display: none;
}
</style>
