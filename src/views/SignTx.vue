<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <p style="margin-bottom: 0.5rem">
            发送交易
            {{
              `${
                intialSelectedAccount?.name
                  ? "- [ " + intialSelectedAccount?.name + " ]"
                  : ""
              }`
            }}
          </p>
          <p
            v-if="intialSelectedAccount?.address"
            style="
              font-size: 0.7rem;
              color: #aca3bb;
              padding: 0;
              margin: 0;
              margin-left: 0.5rem;
            "
          >
            来自: {{ intialSelectedAccount?.address }}
          </p>
          <p
            v-if="website"
            style="
              font-size: 0.7rem;
              color: #aca3bb;
              padding: 0;
              margin: 0;
              margin-left: 0.5rem;
            "
          >
            请求域名: <b>{{ website }}</b>
          </p>
          <p style="margin: 0; padding: 0; margin-top: 0.5rem; font-size: 0">&nbsp;</p>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-item
        ><ion-label>网络名称: {{ selectedNetwork?.name }}</ion-label></ion-item
      >
      <ion-item>
        <ion-avatar
          v-if="(allTemplateNets as any)[selectedNetwork?.chainId]?.icon"
          style="margin-right: 1rem; width: 1.6rem; height: 1.6rem"
        >
          <img
            :alt="selectedNetwork?.name"
            :src="getUrl('assets/chain-icons/' + (allTemplateNets as any)[selectedNetwork?.chainId]?.icon)"
          />
        </ion-avatar>
        <ion-label>网络ID: {{ selectedNetwork?.chainId }}</ion-label>
      </ion-item>
      <ion-item>
        <ion-label>待签署&发送的 &amp; 交易</ion-label>
      </ion-item>
      <ion-item>
        执行前余额: {{ userBalance }}
        <span
          style="font-size: 0.9rem; opacity: 0.7; margin-left: 1rem"
          v-if="dollarPrice > 0"
          >${{ (dollarPrice * userBalance).toFixed(3) }}</span
        >
      </ion-item>
      <ion-item> 合约地址: {{ contract }} </ion-item>
      <ion-item>
        总花费: {{ totalCost }}
        <span
          style="font-size: 0.9rem; opacity: 0.7; margin-left: 1rem"
          v-if="dollarPrice > 0"
          >${{ (dollarPrice * totalCost).toFixed(3) }}</span
        >
      </ion-item>
      <ion-item>
        手续费: {{ gasFee }}
        <span
          style="font-size: 0.9rem; opacity: 0.7; margin-left: 1rem"
          v-if="dollarPrice > 0"
          >${{ (dollarPrice * gasFee).toFixed(3) }}</span
        >
      </ion-item>
      <ion-item> Tx value: {{ txValue }} </ion-item>
      <ion-item>
        Gas Limit: {{ gasLimit }}
        <ion-button style="margin-left: 1rem" @click="gasLimitModal = true"
          >设置</ion-button
        >
      </ion-item>
      <ion-item>
        Gas Price: {{ gasPrice }}
        <ion-button style="margin-left: 1rem" @click="gasPriceModal = true"
          >设置</ion-button
        >
      </ion-item>
      <ion-item>
        <ion-label>Raw TX:</ion-label>
        <ion-textarea
          aria-label="raw tx"
          style="overflow-y: scroll; width: 400px; height: 200px"
          :rows="10"
          :cols="20"
          :value="signTxData"
          readonly
        ></ion-textarea>
      </ion-item>
      <ion-item>
        <ion-button @click="onCancel">取消</ion-button>
        <ion-button :disabled="insuficientBalance" @click="onSign">{{
          insuficientBalance ? "余额不足" : "发送"
        }}</ion-button>
      </ion-item>
      <ion-alert
        :is-open="alertOpen"
        header="Error"
        :message="alertMsg"
        :buttons="['OK']"
        @didDismiss="alertOpen = false"
      ></ion-alert>

      <ion-list>
        <ion-item>Auto-reject Timer: {{ timerReject }}</ion-item>
      </ion-list>
      <ion-list v-if="gasPriceReFetch">
        <ion-item>New Fee price Timer: {{ timerFee }}</ion-item>
      </ion-list>

      <ion-loading
        :is-open="loading"
        cssClass="my-custom-class"
        message="Please wait..."
        :key="`k${loading}`"
        @didDismiss="loading = false"
      >
      </ion-loading>

      <ion-modal :is-open="gasLimitModal">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="gasLimitModal = false">Close</ion-button>
            </ion-buttons>
            <ion-title>设置 Gas Limit</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-label>Limit in units</ion-label>
            </ion-item>
            <ion-item>
              <ion-input
                aria-label="gas limit"
                v-model="inGasLimit"
                type="number"
              ></ion-input>
            </ion-item>
            <ion-item>
              <ion-button @click="setGasLimit">设置</ion-button>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <ion-modal :is-open="gasPriceModal">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="gasPriceModal = false">关闭</ion-button>
            </ion-buttons>
            <ion-title>设置 Gas Price</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-label>Price in gwei</ion-label>
            </ion-item>
            <ion-item>
              <ion-input
                aria-label="price in gwei"
                v-model="inGasPrice"
                type="number"
              ></ion-input>
            </ion-item>
            <ion-item>
              <ion-button @click="setGasPrice">设置</ion-button>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref, Ref } from "vue";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonButton,
  IonAlert,
  IonTextarea,
  onIonViewWillEnter,
  IonList,
  IonLoading,
  IonModal,
  IonButtons,
  IonInput,
  modalController,
} from "@ionic/vue";
import { ethers } from "ethers";
import { approve, walletIssetPassword, walletPing, walletSendData } from "@/extension/userRequest";
import { useRoute } from "vue-router";
import {
  getSelectedNetwork,
  getUrl,
  getPrices,
  numToHexStr,
  blockLockout,
  unBlockLockout,
  getSelectedAccount,
  strToHex,
  hexTostr,
} from "@/utils/platform";
import { getBalance, getGasPrice, estimateGas } from "@/utils/wallet";
import type { Network, Account } from "@/extension/types";
import { allTemplateNets, chainIdToPriceId } from "@/utils/networks";
import UnlockModal from "@/views/UnlockModal.vue";
import router from "@/router";
import { setUnlockModalState } from "@/utils/unlockStore";

const route = useRoute();
const rid = (route?.params?.rid as string) ?? "";
const website = route?.params?.website ? hexTostr(route?.params?.website as string) : "";
let isError = false;
const decodedParam = hexTostr((route.params?.param as string) ?? "");
const params = JSON.parse(decodedParam);
const signTxData = ref("");
const alertOpen = ref(false);
const alertMsg = ref("");
const loading = ref(false);
const contract = params.to;
const gasPrice = ref(0);
const gasLimit = ref(0);
const totalCost = ref(0);
const gasFee = ref(0);
const userBalance = ref(0);
const txValue = ref(0);
const timerReject = ref(140);
const timerFee = ref(20);
const insuficientBalance = ref(false);
const gasPriceReFetch = ref(true);
const selectedNetwork = (ref(null) as unknown) as Ref<Network>;
const intialSelectedAccount = ref(null as unknown) as Ref<Account>;
const dollarPrice = ref(0);
const gasLimitModal = ref(false);
const gasPriceModal = ref(false);
const inGasPrice = ref(0);
const inGasLimit = ref(0);
let gasFeed = {} as Awaited<ReturnType<typeof getGasPrice>>["feed"];

let interval = 0;
const bars = ref(0);

if (!rid) {
  isError = true;
}

if (!decodedParam) {
  isError = true;
} else {
  const paramsWithoutZeros = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(params).filter(([_, v]) => v !== "0x0")
  );

  signTxData.value = JSON.stringify(paramsWithoutZeros, null, 2);
}

const setItervalFn = async () => {
  if (timerReject.value <= 0) {
    onCancel();
    return;
  }
  if (gasPriceReFetch.value) {
    timerFee.value -= 1;
    if (timerFee.value <= 0) {
      timerFee.value = 20;
      loading.value = true;
      const { feed, price } = await getGasPrice();
      gasFeed = feed;
      // @ts-ignore
      gasPrice.value = parseFloat(price.toString() ?? 0.1);
      await newGasData();
      loading.value = false;
    }
  }

  timerReject.value -= 1;
  bars.value++;
  walletPing();
};

const openModal = async () => {
  const modal = await modalController.create({
    component: UnlockModal,
    animated: true,
    focusTrap: false,
    backdropDismiss: false,
  });
  await modal.present();
  setUnlockModalState(true);
  const { role } = await modal.onWillDismiss();
  if (role === "confirm") return true;
  setUnlockModalState(false);
  return false;
};

const onSign = async () => {
  loading.value = true;
  if (interval) {
    clearInterval(interval);
  }
  const selectedAccount = await getSelectedAccount();
  unBlockLockout();
  approve(rid);
  loading.value = false;
};

const onCancel = () => {
  window.close();
  if (interval) {
    try {
      unBlockLockout();
      clearInterval(interval);
    } catch {
      // ignore
    }
  }
};

const newGasData = async () => {
  await walletSendData(rid, {
    gas: numToHexStr(gasLimit.value),
    gasPrice: numToHexStr(BigInt(Math.trunc(gasPrice.value * 1e9))),
    supportsEIP1559: gasFeed?.maxFeePerGas !== null,
  });

  gasFee.value = Number(
    ethers.formatUnits(Math.trunc(gasLimit.value * gasPrice.value), "gwei")
  );
  txValue.value = Number(ethers.formatEther(params?.value ?? "0x0"));
  totalCost.value = gasFee.value + txValue.value;
};

onIonViewWillEnter(async () => {
  (window as any)?.resizeTo?.(600, 860);
  blockLockout();
  let r = await walletIssetPassword()
  if (!r) {
    await openModal()
  }
  loading.value = true
  const pGasPrice = getGasPrice();
  const pBalance = getBalance();
  const pGetPrices = getPrices();
  const data = await Promise.all([getSelectedNetwork(), getSelectedAccount()]);
  selectedNetwork.value = data[0];
  intialSelectedAccount.value = data[1];
  userBalance.value = Number(ethers.formatEther((await pBalance).toString() ?? "0x0"));
  const { feed, price } = await pGasPrice;
  gasFeed = feed;

  // @ts-ignore
  gasPrice.value = parseFloat(price.toString() ?? 0.1);

  const pEstimateGas = estimateGas({
    to: params?.to ?? "",
    from: params?.from ?? "",
    data: params?.data ?? "",
    value: params?.value ?? "0x0",
  });

  try {
    gasLimit.value = parseInt((await pEstimateGas).toString(), 10);
  } catch (err) {
    const errorToHex = strToHex(String(err));
    router.push(`/contract-error/${rid}/${errorToHex}/${contract}`);
    loading.value = false;
    return;
  }
  inGasPrice.value = gasPrice.value;
  inGasLimit.value = gasLimit.value;

  if (userBalance.value < totalCost.value) {
    insuficientBalance.value = true;
  }
  const prices = await pGetPrices;
  dollarPrice.value =
    prices[chainIdToPriceId(selectedNetwork.value?.chainId ?? 0)]?.usd ?? 0;
  await newGasData();
  loading.value = false;

  interval = setInterval(setItervalFn, 1000) as any;
});

const setGasLimit = async () => {
  gasLimit.value = inGasLimit.value;
  await newGasData();
  gasLimitModal.value = false;
};

const setGasPrice = async () => {
  gasPrice.value = inGasPrice.value;
  gasPriceReFetch.value = false;
  await newGasData();
  gasPriceModal.value = false;
};
</script>

<style scoped>
ion-item {
  --min-height: 34px;
  --padding-start: 8px;
  --padding-end: 8px;
}
</style>
