import StoryUploadHandler from "../../presenters/story-upload-handler.js";
import CameraInitiator from "../../utils/camera-initiator.js";
import { createPageTemplate } from "../templates/page-template.js";
import NotificationHelper from "../../utils/notification-helper.js";

const AddStoryPage = {
  async render() {
    return createPageTemplate({
      title: "Tambah Cerita Baru",
      content: `
        <form id="addStoryForm" class="add-story-form">
          <div class="form-group">
            <label class="form-label">Foto</label>
            <div class="camera-container">
              <video id="camera" autoplay playsinline></video>
              <canvas id="canvas" class="d-none"></canvas>
              <img id="capturedImage" alt="Captured Image">
            </div>
            <div class="camera-buttons">
              <button type="button" id="captureButton" class="btn btn-primary">Ambil Foto</button>
              <button type="button" id="recaptureButton" class="btn btn-secondary">Ambil Ulang</button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Lokasi</label>
            <p>Klik pada peta untuk menentukan lokasi cerita</p>
            <div id="pickLocationMap" class="map-container"></div>
            <div id="selectedLocation" class="selected-location">
              <span>Belum ada lokasi yang dipilih</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="description" class="form-label">Cerita</label>
            <textarea id="description" class="form-textarea" required></textarea>
          </div>
          
          <button type="submit" class="btn btn-primary">Bagikan Cerita</button>
        </form>
      `,
    });
  },

  async afterRender() {
    this._storyUploader = new StoryUploadHandler({ view: this });

    if (!this._storyUploader.isUserLoggedIn()) {
      alert("Anda harus login terlebih dahulu untuk menambahkan cerita.");
      window.location.hash = "#/login";
      return;
    }

    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const isSubscribed = await NotificationHelper.isSubscribed();
        if (!isSubscribed) {
          await NotificationHelper.subscribeToPushNotification();
        }
      }
    }

    const cameraElement = document.querySelector("#camera");
    const canvasElement = document.querySelector("#canvas");
    const capturedImageElement = document.querySelector("#capturedImage");
    const captureButton = document.querySelector("#captureButton");
    const recaptureButton = document.querySelector("#recaptureButton");

    this._cameraInitiator = new CameraInitiator({
      cameraElement,
      canvasElement,
      capturedImageElement,
    });

    await this._cameraInitiator.init();

    this._storyUploader.setupMapPicker(
      document.getElementById("pickLocationMap"),
      document.getElementById("selectedLocation"),
      (location) => {
        this._selectedLocation = location;
      }
    );

    captureButton.addEventListener("click", () => {
      this._imageBase64 = this._cameraInitiator.captureImage();
      recaptureButton.style.display = "inline-block";
    });

    recaptureButton.addEventListener("click", () => {
      this._cameraInitiator.resumeCamera();
    });

    const form = document.querySelector("#addStoryForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const description = document.querySelector("#description").value;

      if (!description) {
        alert("Semua kolom harus diisi!");
        return;
      }

      if (!this._imageBase64) {
        alert("Silakan ambil foto terlebih dahulu!");
        return;
      }

      if (!this._selectedLocation) {
        alert("Silakan pilih lokasi pada peta!");
        return;
      }

      try {
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = "Mengirim...";

        const photoFile = await this._storyUploader.convertBase64ToFile(
          this._imageBase64,
          "story.jpg"
        );

        const { success } = await this._storyUploader.uploadStory({
          description,
          photoFile,
          lat: this._selectedLocation.lat,
          lon: this._selectedLocation.lng,
        });

        if (!success) {
          submitButton.disabled = false;
          submitButton.textContent = "Bagikan Cerita";
          return;
        }

        if ("Notification" in window && Notification.permission === "granted") {
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification("Story Baru", {
              body: `Story baru telah dibuat dengan deskripsi: ${description}`,
              icon: "/icons/icon-192x192.png",
              badge: "/icons/icon-72x72.png",
              vibrate: [100, 50, 100],
              data: {
                url: "/",
              },
            });
          } catch (err) {
            console.error("Error showing notification:", err);
          }
        }

        alert("Cerita berhasil dibagikan!");
        window.location.hash = "#/";
      } catch (error) {
        alert(`Gagal mengirim cerita: ${error.message}`);
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = "Bagikan Cerita";
      }
    });

    window.addEventListener("hashchange", () => {
      this._cameraInitiator.stopStream();
    });
  },
};

export default AddStoryPage;
