import StoryApi from "../data/story-api.js";

const NotificationHelper = {
  vapidPublicKey:
    "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk",

  async requestPermission() {
    if (!("Notification" in window)) {
      console.error("Browser tidak mendukung notifikasi");
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  },

  async getServiceWorkerRegistration() {
    if (!("serviceWorker" in navigator)) {
      console.error("Browser tidak mendukung service worker");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      console.log("Service worker siap:", registration);
      return registration;
    } catch (error) {
      console.error("Error mendapatkan service worker:", error);
      return null;
    }
  },

  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  async subscribeToPushNotification() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return {
          error: true,
          message: "Browser tidak mendukung push notification",
        };
      }

      const registration = await this.getServiceWorkerRegistration();
      if (!registration) {
        return { error: true, message: "Service worker tidak siap" };
      }

      const permissionGranted = await this.requestPermission();
      if (!permissionGranted) {
        return { error: true, message: "Izin notifikasi ditolak" };
      }

      let subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        console.log("Unsubscribing from existing subscription");
        await subscription.unsubscribe();
      }

      console.log("Creating new push subscription");
      const applicationServerKey = this.urlBase64ToUint8Array(
        this.vapidPublicKey
      );

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      console.log("Push subscription created:", subscription);

      const token = localStorage.getItem("token");
      if (!token) {
        return { error: true, message: "Anda harus login terlebih dahulu" };
      }

      const subscriptionJSON = subscription.toJSON();
      const { endpoint, keys } = subscriptionJSON;

      console.log("Sending subscription to server:", { endpoint, keys });

      const response = await fetch(
        "https://story-api.dicoding.dev/v1/notifications/subscribe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            endpoint,
            keys: {
              p256dh: keys.p256dh,
              auth: keys.auth,
            },
          }),
        }
      );

      const responseJson = await response.json();
      console.log("Server response:", responseJson);

      if (responseJson.error) {
        return { error: true, message: responseJson.message };
      }

      localStorage.setItem(
        "pushSubscription",
        JSON.stringify({ endpoint, keys })
      );

      return { error: false, data: responseJson.data };
    } catch (error) {
      console.error("Error saat subscribe push notification:", error);
      return { error: true, message: error.message };
    }
  },

  async unsubscribeFromPushNotification() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return {
          error: true,
          message: "Browser tidak mendukung push notification",
        };
      }

      const registration = await this.getServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        return { error: true, message: "Tidak ada langganan yang aktif" };
      }

      const { endpoint } = subscription;
      console.log("Unsubscribing endpoint:", endpoint);

      const token = localStorage.getItem("token");
      if (!token) {
        return { error: true, message: "Anda harus login terlebih dahulu" };
      }

      const response = await fetch(
        "https://story-api.dicoding.dev/v1/notifications/subscribe",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint }),
        }
      );

      const responseJson = await response.json();
      console.log("Server unsubscribe response:", responseJson);

      await subscription.unsubscribe();
      console.log("Successfully unsubscribed locally");

      localStorage.removeItem("pushSubscription");

      return { error: false, message: responseJson.message };
    } catch (error) {
      console.error("Error saat unsubscribe push notification:", error);
      return { error: true, message: error.message };
    }
  },

  async isSubscribed() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }

    try {
      const registration = await this.getServiceWorkerRegistration();
      if (!registration) return false;

      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error("Error cek status langganan:", error);
      return false;
    }
  },

  isNotificationSupported() {
    return "Notification" in window;
  },

  async sendTestNotification() {
    try {
      if (Notification.permission !== "granted") {
        return { error: true, message: "Izin notifikasi belum diberikan" };
      }

      const registration = await this.getServiceWorkerRegistration();
      if (!registration) {
        return { error: true, message: "Service worker tidak siap" };
      }

      await registration.showNotification("Test Notification", {
        body: "Ini adalah test notifikasi",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        vibrate: [100, 50, 100],
      });

      return { error: false, message: "Test notifikasi berhasil dikirim" };
    } catch (error) {
      console.error("Error mengirim test notifikasi:", error);
      return { error: true, message: error.message };
    }
  },
};

export default NotificationHelper;
