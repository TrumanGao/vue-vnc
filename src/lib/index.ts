import type { App } from "vue";
import VueVncComponent from "./vue-vnc.vue";

console.log("import vue-vnc as ES Module. ");

export default {
  install(App: App) {
    App.component(VueVncComponent.name, VueVncComponent);
  },
};
