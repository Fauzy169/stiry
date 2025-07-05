import StoryApi from "../data/story-api.js";

class StoryUploadHandler {
  constructor({ view }) {
    this._uiView = view;
    this._apiService = StoryApi;
  }

  isUserLoggedIn() {
    return this._apiService.checkAuthentication();
  }

  async uploadStory({ description, photoFile, lat, lon }) {
    try {
      if (!this.isUserLoggedIn()) {
        alert("Silakan login terlebih dahulu sebelum mengunggah cerita.");
        return { success: false };
      }

      if (!description || !photoFile || !lat || !lon) {
        alert("Semua kolom wajib diisi, termasuk judul, deskripsi, foto, dan lokasi.");
        return { success: false };
      }

      if (!photoFile || photoFile.size === 0) {
        alert("File foto tidak valid atau kosong.");
        return { success: false };
      }

      if (this._uiView?.showLoading) {
        this._uiView.showLoading(true);
      }

      const { error, message } = await this._apiService.addStory({
        
        description,
        photoFile,
        lat,
        lon,
      });

      if (error) {
        alert(`Gagal mengunggah cerita: ${message}`);
        if (this._uiView?.showLoading) this._uiView.showLoading(false);
        return { success: false };
      }

      alert("Cerita berhasil ditambahkan!");
      return { success: true };
    } catch (err) {
      alert(`Terjadi kesalahan saat mengunggah cerita: ${err.message}`);
      if (this._uiView?.showLoading) this._uiView.showLoading(false);
      return { success: false };
    }
  }

  async convertBase64ToFile(base64String, fileName) {
    const res = await fetch(`data:image/jpeg;base64,${base64String}`);
    const blob = await res.blob();
    return new File([blob], fileName, { type: "image/jpeg" });
  }

  setupMapPicker(mapElement, locationDisplayElement, onSelect) {
    const map = L.map(mapElement).setView([-2.548926, 118.0148634], 5);

    const baseLayers = {
      Street: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }),
      Satellite: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
      }),
      Topo: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenTopoMap',
      }),
    };

    baseLayers.Street.addTo(map);
    L.control.layers(baseLayers).addTo(map);

    let marker = null;

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;

      locationDisplayElement.innerHTML = `
        <p><strong>Lokasi dipilih:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
      `;

      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng]).addTo(map);
      }

      if (onSelect) {
        onSelect({ lat, lng });
      }
    });

    return map;
  }
}

export default StoryUploadHandler;
