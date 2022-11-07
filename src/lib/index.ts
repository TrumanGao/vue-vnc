import type { App } from "vue";
import VueVncComponent from "./vue-vnc.vue";

export default {
  install(App: App) {
    App.component(VueVncComponent.name, VueVncComponent);
  },
};
