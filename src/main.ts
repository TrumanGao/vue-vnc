import { createApp } from "vue";
import App from "./App.vue";
import VueVnc from "./lib/index";

const app = createApp(App);
app.use(VueVnc);
app.mount("#root");
