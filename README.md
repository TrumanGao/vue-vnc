# vue-vnc

A Vue Component, adapted from the popular [react-vnc](https://github.com/roerohan/react-vnc), to connect to a websockified VNC client using [noVNC](https://github.com/novnc/noVNC).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

The project in development mode will run on http://localhost:3000, where you can set a connection with VNC client by inputting a WebSocket URL.

```sh
npm run dev
```

### Usage

As a vue plugin, vue-vnc should be installed firstly in "/src/main". After that, the usage demo in "/src/App.vue" shows how to use it in a vue component. The only requeired param is "url", which specifies the VNC server to connect to.

`/src/main.ts`

```js
import { createApp } from "vue";
import App from "./App.vue";
import VueVnc from "vue-vnc";

const app = createApp(App);
app.use(VueVnc);
```

`/src/App.vue`

```vue
<template>
  <VueVnc :url="wssUrl"></VueVnc>
</template>
```
