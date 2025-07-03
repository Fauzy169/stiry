import StorySource from "../data/story-source.js";

class HomeHandler {
  constructor({ view }) {
    this._viewRef = view;
    this._storyData = StorySource;
  }

  async fetchStories() {
    try {
      this._viewRef.showLoading();

      const {
        error: hasError,
        data: storiesList,
        message: errorMessage,
        isOffline: offlineMode,
      } = await this._storyData.getAllStories();

      if (hasError) {
        this._viewRef.showError(errorMessage);
        return [];
      }

      if (storiesList.length === 0) {
        this._viewRef.showEmpty();
      } else {
        this._viewRef.showStories(storiesList);
        if (offlineMode) {
          this._displayOfflineBanner();
        }
      }

      return storiesList;
    } catch (err) {
      this._viewRef.showError(err.message);
      return [];
    }
  }

  async removeStoryById(storyId) {
    try {
      const {
        error: failed,
        message: resultMessage,
      } = await this._storyData.deleteStory(storyId);

      if (failed) {
        this._viewRef.showError(resultMessage);
        return false;
      }

      this._displayToast(resultMessage);
      await this.fetchStories();
      return true;
    } catch (err) {
      this._viewRef.showError(err.message);
      return false;
    }
  }

  initMapView(containerEl, storyDataList) {
    const mapObj = L.map(containerEl).setView([-0.789275, 113.921327], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapObj);

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      }
    );

    const baseLayerOptions = {
      Street: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }),
      Satellite: satelliteLayer,
      Topography: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution:
          'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      }),
    };

    L.control.layers(baseLayerOptions).addTo(mapObj);

    storyDataList.forEach((story) => {
      if (story.lat && story.lon) {
        const storyMarker = L.marker([story.lat, story.lon]).addTo(mapObj);
        storyMarker.bindPopup(`
          <div class="popup-content">
            <img src="${story.photoUrl}" alt="${story.name}" style="width: 100px; height: auto;">
            <h3>${story.name}</h3>
            <p>${story.description.substring(0, 100)}${story.description.length > 100 ? "..." : ""}</p>
          </div>
        `);
      }
    });

    return mapObj;
  }

  _displayOfflineBanner() {
    const banner = document.createElement("div");
    banner.classList.add("offline-notification");
    banner.innerHTML = `
      <div class="offline-icon">
        <i class="fas fa-wifi-slash"></i>
      </div>
      <div class="offline-message">
        <strong>Anda sedang melihat data offline</strong>
        <p>Koneksi internet tidak tersedia. Data ditampilkan dari penyimpanan lokal.</p>
      </div>
    `;

    document.body.appendChild(banner);

    setTimeout(() => {
      banner.classList.add("fade-out");
      setTimeout(() => {
        if (banner.parentNode) {
          document.body.removeChild(banner);
        }
      }, 300);
    }, 5000);
  }

  _displayToast(message) {
    const toastElement = document.createElement("div");
    toastElement.classList.add("toast");
    toastElement.textContent = message;

    document.body.appendChild(toastElement);

    setTimeout(() => {
      toastElement.classList.add("toast-hide");
      setTimeout(() => {
        document.body.removeChild(toastElement);
      }, 300);
    }, 3000);
  }
}

export default HomeHandler;
