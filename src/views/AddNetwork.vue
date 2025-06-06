<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ isEdit ? "编辑网络" : "添加网络" }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-button v-if="!isEdit" @click="templateModal = true" expand="block"
        >添加常见网络</ion-button
      >
      <ion-item>
        <ion-input
          label="网络名称(*)"
          labelPlacement="stacked"
          v-model="name"
          placeholder="ex: Polygon"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-input
          label="链ID(*)"
          labelPlacement="stacked"
          v-model="chainId"
          placeholder="137"
          type="number"
        ></ion-input>
      </ion-item>
      <ion-item button>
        <ion-icon
          :icon="clipboardOutline"
          @click="paste('pasteRpc')"
          style="margin-right: 0.5rem; cursor: pointer"
        />
        <ion-input
          label="RPC URL(*)"
          labelPlacement="stacked"
          id="pasteRpc"
          placeholder="https://polygon-mainnet.g.alchemy.com/..."
          v-model="rpc"
        ></ion-input>
      </ion-item>
      <ion-item button>
        <ion-input
          label="原生代币名称"
          labelPlacement="stacked"
          id="native-token"
          placeholder="MATIC"
          v-model="symbol"
        ></ion-input>
      </ion-item>
      <ion-item button>
        <ion-icon
          :icon="clipboardOutline"
          @click="paste('pasteExplorer')"
          style="margin-right: 0.5rem; cursor: pointer"
        />
        <ion-input
          label="区块浏览器"
          labelPlacement="stacked"
          id="pasteExplorer"
          placeholder="https://polygonscan.com"
          v-model="explorer"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-button @click="onCancel">取消</ion-button>
        <ion-button @click="onAddNetwork">{{
          isEdit ? "编辑网络" : "添加网络"
        }}</ion-button>
      </ion-item>
      <ion-alert
        :is-open="alertOpen"
        header="Error"
        :message="alertMsg"
        :buttons="['OK']"
        @didDismiss="alertOpen = false"
      ></ion-alert>
    </ion-content>

    <ion-modal :is-open="templateModal" @will-dismiss="templateModal = false">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="templateModal = false">Close</ion-button>
          </ion-buttons>
          <ion-title>Select</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-list style="margin-bottom: 4rem">
          <ion-list-header>
            <ion-label>Networks</ion-label>
          </ion-list-header>

          <ion-segment :value="currentSegment" @ion-change="segmentChange">
            <ion-segment-button value="mainnets">
              <ion-label>Main Networks</ion-label>
            </ion-segment-button>
            <ion-segment-button value="testnets">
              <ion-label>Test Networks</ion-label>
            </ion-segment-button>
          </ion-segment>

          <div v-if="currentSegment === 'mainnets'">
            <ion-list
              class="ion-padding"
              v-for="network of Object.values(mainNets)"
              :key="network.chainId"
            >
              <ion-item button style="cursor: pointer" @click="fillTemplate(network)">
                <ion-avatar style="margin-right: 1rem">
                  <img
                    :alt="network.name"
                    :src="getUrl('assets/chain-icons/' + network.icon)"
                  /> </ion-avatar
                ><ion-label>{{ network.name }}</ion-label>
              </ion-item>
            </ion-list>
          </div>
          <div v-else>
            <ion-list
              class="ion-padding"
              v-for="network of Object.values(testNets)"
              :key="network.chainId"
            >
              <ion-item button style="cursor: pointer" @click="fillTemplate(network)">
                <ion-avatar style="margin-right: 1rem">
                  <img
                    :alt="network.name"
                    :src="getUrl('assets/chain-icons/' + network.icon)"
                  /> </ion-avatar
                ><ion-label>{{ network.name }}</ion-label>
              </ion-item>
            </ion-list>
          </div>
        </ion-list>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonModal,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonListHeader,
  IonButtons,
  IonAvatar,
  modalController,
  IonAlert,
  onIonViewWillEnter,
} from "@ionic/vue";
import {
  getNetworks,
  saveSelectedNetwork,
  getSelectedNetwork,
  getUrl,
  paste,
  replaceNetworks,
} from "@/utils/platform";
import router from "@/router";
import { mainNets, testNets } from "@/utils/networks";
import { useRoute } from "vue-router";
import { clipboardOutline } from "ionicons/icons";
import type { Networks, Network } from "@/extension/types";

const name = ref("");
const chainId = ref(0);
const rpc = ref("");
const symbol = ref("");
const explorer = ref("");
const templateModal = ref(false);
const currentSegment = ref("mainnets");
const alertOpen = ref(false);
const alertMsg = ref("");
const route = useRoute();
const isEdit = route.path.includes("/edit");
const paramChainId = route.params.chainId ?? "";

const fillNetworkInputs = (network: Network) => {
  name.value = network.name;
  chainId.value = network.chainId;
  rpc.value = network.rpc;
  symbol.value = network.symbol ?? "";
  explorer.value = network.explorer ?? "";
};

onIonViewWillEnter(async () => {
  if (isEdit && paramChainId) {
    const networks = (await getNetworks()) as Networks;
    fillNetworkInputs(networks[Number(paramChainId)]);
  }
});

const resetFields = () => {
  name.value = "";
  chainId.value = 0;
  rpc.value = "";
};

const onAddNetwork = async () => {
  if (Number(chainId.value) < 1) {
    alertMsg.value = "Chain Id must be a valid decimal integer";
    alertOpen.value = true;
    return;
  }
  if (name.value.length < 2) {
    alertMsg.value = "Name must have at least 2 characters";
    alertOpen.value = true;
    return;
  }
  if (name.value.length > 99) {
    alertMsg.value = "Name must be less than 100 characters";
    alertOpen.value = true;
    return;
  }
  if (name.value.length > 99) {
    try {
      new URL(rpc.value);
    } catch {
      alertMsg.value = "RPC must be a valid URL";
      alertOpen.value = true;
      return;
    }
  }
  let p1 = Promise.resolve();
  const networksProm = getNetworks();
  const selectedNetworkProm = getSelectedNetwork();

  const allNetworks = await Promise.all([networksProm, selectedNetworkProm]);
  const networks = allNetworks[0] as Networks;
  const selectedNetwork = allNetworks[1] as Network;

  const network = {
    name: name.value,
    chainId: Number(chainId.value),
    rpc: rpc.value,
    ...(symbol.value ? { symbol: symbol.value } : {}),
    ...(explorer.value ? { explorer: explorer.value } : {}),
  };
  if (
    (Object.keys(networks).length ?? 0) < 1 ||
    selectedNetwork.chainId === chainId.value
  ) {
    p1 = saveSelectedNetwork(network);
  } else {
    if (chainId.value in networks && !isEdit) {
      alertMsg.value = "Network already exists.";
      alertOpen.value = true;
      return;
    }
  }
  networks[chainId.value] = network;
  const p2 = replaceNetworks(networks);
  await Promise.all([p1, p2]);
  if (isEdit) {
    router.push("/tabs/networks");
  } else {
    router.push("/tabs/home");
  }
  resetFields();
};

const segmentChange = (value: any) => {
  currentSegment.value = value.detail.value;
};

const onCancel = () => {
  if (isEdit) {
    router.push("/tabs/networks");
  } else {
    router.push("/tabs/home");
  }
};

const fillTemplate = (network: typeof mainNets[1]) => {
  fillNetworkInputs(network);
  modalController?.dismiss(null, "cancel");
};
</script>
