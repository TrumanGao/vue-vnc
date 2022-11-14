<script lang="ts" setup>
import {
  onMounted,
  ref,
  withDefaults,
  onBeforeUnmount,
  type StyleValue,
} from "vue";
import RFB, {
  type NoVncOptions,
  type NoVncEvents,
} from "@novnc/novnc/core/rfb";

interface Props {
  // address
  url: string;
  // view
  style?: StyleValue;
  // connection
  rfbOptions?: NoVncOptions;
  autoConnect?: boolean;
  retryDuration?: number;
  // console
  debug?: boolean;
  // properties
  viewOnly?: boolean;
  focusOnClick?: boolean;
  clipViewport?: boolean;
  dragViewport?: boolean;
  scaleViewport?: boolean;
  resizeSession?: boolean;
  showDotCursor?: boolean;
  background?: string;
  qualityLevel?: number;
  compressionLevel?: number;
  // listener
  onConnect?: (rfb?: RFB) => void;
  onDisconnect?: (rfb?: RFB) => void;
  // others
  onCredentialsRequired?: (rfb?: RFB) => void;
  onSecurityFailure?: (e?: {
    detail: { status: number; reason: string };
  }) => void;
  onClipboard?: (e?: { detail: { text: string } }) => void;
  onBell?: () => void;
  onDesktopName?: (e?: { detail: { name: string } }) => void;
  onCapabilities?: (e?: {
    detail: { capabilities: RFB["capabilities"] };
  }) => void;
}

const props = withDefaults(defineProps<Props>(), {
  autoConnect: true,
  retryDuration: 3000,
  debug: false,
});
const rfb = ref<RFB | null>(null);
const connected = ref<boolean>(props.autoConnect ?? true);
const timeouts = ref<Array<any>>([]);
const eventListeners = ref<{
  -readonly [Event in keyof NoVncEvents]?: (e: any) => void;
}>({});
const screen = ref<HTMLDivElement | null>(null);
const loading = ref<boolean>(true);

onMounted(() => {
  if (props.autoConnect) {
    connect();
  }
});

onBeforeUnmount(() => {
  disconnect();
});

const logger = {
  log: (...args: any[]) => {
    if (props.debug) console.log(...args);
  },
  info: (...args: any[]) => {
    if (props.debug) console.info(...args);
  },
  error: (...args: any[]) => {
    if (props.debug) console.error(...args);
  },
};

const getRfb = () => {
  return rfb.value;
};

const setRfb = (_rfb: RFB | null) => {
  rfb.value = _rfb;
};

const getConnected = () => {
  return connected.value;
};

const setConnected = (state: boolean) => {
  connected.value = state;
};

const _onConnect = () => {
  const rfb = getRfb();
  if (props.onConnect) {
    props.onConnect(rfb ?? undefined);
    loading.value = false;
    return;
  }

  logger.info("Connected to remote VNC.");
  loading.value = false;
};

const _onDisconnect = () => {
  const rfb = getRfb();
  if (props.onDisconnect) {
    props.onDisconnect(rfb ?? undefined);
    loading.value = true;
    return;
  }

  const connected = getConnected();
  if (connected) {
    logger.info(
      `Unexpectedly disconnected from remote VNC, retrying in ${
        props.retryDuration / 1000
      } seconds.`
    );

    timeouts.value.push(setTimeout(connect, props.retryDuration));
  } else {
    logger.info(`Disconnected from remote VNC.`);
  }
  loading.value = true;
};

const _onCredentialsRequired = () => {
  const rfb = getRfb();
  if (props.onCredentialsRequired) {
    props.onCredentialsRequired(rfb ?? undefined);
    return;
  }

  const password =
    props.rfbOptions?.credentials?.password ?? prompt("请输入密码:");
  rfb?.sendCredentials({ password: password });
};

const _onDesktopName = (e: { detail: { name: string } }) => {
  if (props.onDesktopName) {
    props.onDesktopName(e);
    return;
  }

  logger.info(`Desktop name is ${e.detail.name}`);
};

const disconnect = () => {
  const rfb = getRfb();
  try {
    if (!rfb) {
      return;
    }

    timeouts.value.forEach(clearTimeout);
    (Object.keys(eventListeners.value) as (keyof NoVncEvents)[]).forEach(
      (event) => {
        if (eventListeners.value[event]) {
          rfb.removeEventListener(event, eventListeners.value[event]);
          eventListeners.value[event] = undefined;
        }
      }
    );
    rfb.disconnect();
    setRfb(null);
    setConnected(false);

    // NOTE(roerohan): This needs to be called since the event listener is removed.
    // Even if the event listener is removed after rfb.disconnect(), the disconnect
    // event is not fired.
    _onDisconnect();
  } catch (err) {
    logger.error(err);
    setRfb(null);
    setConnected(false);
  }
};

const connect = () => {
  try {
    if (connected.value && !!rfb.value) {
      disconnect();
    }

    if (!screen.value) {
      return;
    }

    screen.value.innerHTML = "";

    console.log(
      `创建vnc连接。容器：${screen.value}；wss链接：${props.url}；rfb配置参数：${props.rfbOptions}`
    );
    const _rfb = new RFB(screen.value, props.url, props.rfbOptions);

    _rfb.viewOnly = props.viewOnly ?? false;
    _rfb.focusOnClick = props.focusOnClick ?? false;
    _rfb.clipViewport = props.clipViewport ?? false;
    _rfb.dragViewport = props.dragViewport ?? false;
    _rfb.resizeSession = props.resizeSession ?? false;
    _rfb.scaleViewport = props.scaleViewport ?? false;
    _rfb.showDotCursor = props.showDotCursor ?? false;
    _rfb.background = props.background ?? "";
    _rfb.qualityLevel = props.qualityLevel ?? 6;
    _rfb.compressionLevel = props.compressionLevel ?? 2;
    setRfb(_rfb);

    eventListeners.value.connect = _onConnect;
    eventListeners.value.disconnect = _onDisconnect;
    eventListeners.value.credentialsrequired = _onCredentialsRequired;
    eventListeners.value.securityfailure = props.onSecurityFailure;
    eventListeners.value.clipboard = props.onClipboard;
    eventListeners.value.bell = props.onBell;
    eventListeners.value.desktopname = _onDesktopName;
    eventListeners.value.capabilities = props.onCapabilities;

    (Object.keys(eventListeners.value) as (keyof NoVncEvents)[]).forEach(
      (event) => {
        if (eventListeners.value[event]) {
          _rfb.addEventListener(event, eventListeners.value[event]);
        }
      }
    );

    setConnected(true);
  } catch (err) {
    logger.error(err);
  }
};

const sendCredentials = (credentials: NoVncOptions["credentials"]) => {
  const rfb = getRfb();
  rfb?.sendCredentials(credentials);
};

const sendKey = (keysym: number, code: string, down?: boolean) => {
  const rfb = getRfb();
  rfb?.sendKey(keysym, code, down);
};

const sendCtrlAltDel = () => {
  const rfb = getRfb();
  rfb?.sendCtrlAltDel();
};

const focus = () => {
  const rfb = getRfb();
  rfb?.focus();
};

const blur = () => {
  const rfb = getRfb();
  rfb?.blur();
};

const machineShutdown = () => {
  const rfb = getRfb();
  rfb?.machineShutdown();
};

const machineReboot = () => {
  const rfb = getRfb();
  rfb?.machineReboot();
};

const machineReset = () => {
  const rfb = getRfb();
  rfb?.machineReset();
};

const clipboardPaste = (text: string) => {
  const rfb = getRfb();
  rfb?.clipboardPasteFrom(text);
};

defineExpose({
  connect,
  disconnect,
  connected: connected.value,
  sendCredentials,
  sendKey,
  sendCtrlAltDel,
  focus,
  blur,
  machineShutdown,
  machineReboot,
  machineReset,
  clipboardPaste,
  rfb: rfb.value,
  eventListeners: eventListeners.value,
});
</script>
<script lang="ts">
export default {
  name: "VueVnc",
};
</script>
<template>
  <div
    v-show="!loading"
    :style="props.style"
    class="vue-vnc_main"
    ref="screen"
  ></div>
  <template v-if="loading">
    <slot name="loading"><div class="vue-vnc_loading">Loading...</div></slot>
  </template>
</template>

<style scoped>
.vue-vnc_main,
.vue-vnc_loading {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  background-color: #ffffff;
}

.vue-vnc_loading {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #333333;
}
</style>
