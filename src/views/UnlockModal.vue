<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>解锁</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="close" color="primary">关闭</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list>
        <ion-item>
          <ion-label>解锁密码</ion-label>
        </ion-item>
        <ion-list>
          <ion-item>
            <ion-input
              ref="passinputref"
              label-placement="floating"
              aria-label="password"
              type="password"
              v-model="mpPass"
              autocomplete="off"
              autocorrect="off"
              :clear-input="false"
              :clear-on-edit="false"
              :spellcheck="false"
              id="pass-input"
            >
              <div slot="label"><ion-text color="danger">(密码)</ion-text></div>
            </ion-input>

            <!-- <ion-input
            label="Password"
            label-placement="floating"
            fill="outline"
            placeholder=""
            type="password"
            @ion-input="mpPass = String($event.target.value)"
          ></ion-input> -->
          </ion-item>
        </ion-list>
      </ion-list>
      <ion-item>
        <ion-button @click="unlock">确认</ion-button>
      </ion-item>
      <ion-alert
        :is-open="alertOpen"
        header="Error"
        :message="alertMsg"
        :buttons="['OK']"
        @didDismiss="alertOpen = false"
      ></ion-alert>
      <ion-loading
        :is-open="loading"
        cssClass="my-custom-class"
        message="Please wait..."
        :duration="4000"
        :key="`k${loading}`"
        @didDismiss="loading = false"
      />
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
  IonInput,
  IonButton,
  IonAlert,
  IonList,
  IonButtons,
  modalController,
  IonLoading,
} from "@ionic/vue";
import { getAccounts, replaceAccounts, saveSelectedAccount } from "@/utils/platform";
import { decrypt, getCryptoParams } from "@/utils/webCrypto";
import { unlockModalStateSubscribe, setUnlockModalState } from "@/utils/unlockStore";
import { walletSetPassword } from '@/extension/userRequest'
defineProps<{
  unlockType: string;
}>();

const mpPass = ref("");
const loading = ref(false);
const alertOpen = ref(false);
const alertMsg = ref("");
const passinputref: Ref<any> = ref(null);

const close = () => {
  setUnlockModalState(false);
  return modalController?.dismiss(null, "cancel");
};

const unlock = async () => {
  try {
    loading.value = true;
    await walletSetPassword(mpPass.value)
    loading.value = false;
    return modalController?.dismiss(mpPass.value, "confirm");
  } catch {
    loading.value = false;
    alertMsg.value = "Decryption failed, password is not correct, try again.";
    alertOpen.value = true;
    return;
  }
};

unlockModalStateSubscribe((state) => {
  if (state) {
    passinputref.value?.$el?.setFocus?.();
  }
});
</script>
