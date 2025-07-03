import HomeHandler from "../../presenters/home-handler.js";
import StoryCardTemplate from "../templates/story-card.js";
import { createPageTemplate } from "../templates/page-template.js";
import StorySource from "../../data/story-source.js";
import NotificationHelper from "../../utils/notification-helper.js";
import FavoriteStorage from "../../data/favorite-storage.js";
import { createFavoriteButton } from "../components/favorite-button.js";

const HomePage = {
  async render() {
    return createPageTemplate({
      title: "Daftar Cerita",
      content: `
        <div class="search-container">
          <input type="text" id="search-input" placeholder="Cari cerita..." />
          <button id="search-button">Cari</button>
        </div>
        <div class="notification-controls">
          <button id="notification-button" class="btn btn-primary">
            <i class="fas fa-bell"></i> <span id="notification-status">Memuat status notifikasi...</span>
          </button>
          <button id="test-notification-button" class="btn btn-secondary" style="display: none;">
            <i class="fas fa-paper-plane"></i> Test Notifikasi
          </button>
        </div>
        <div class="map-container" id="storyMap"></div>
        <div class="offline-status-container" id="offline-status"></div>
        <div class="stories" id="stories"></div>
      `,
    });
  },

  async afterRender() {
    try {
      const storiesContainer = document.querySelector("#stories");
      if (!storiesContainer) {
        console.error("Stories container not found");
        return;
      }

      this.showLoading();

      const mapContainer = document.querySelector("#storyMap");
      const searchInput = document.querySelector("#search-input");
      const searchButton = document.querySelector("#search-button");
      const offlineStatus = document.querySelector("#offline-status");
      const notificationButton = document.querySelector("#notification-button");
      const notificationStatus = document.querySelector("#notification-status");
      const testNotificationButton = document.querySelector(
        "#test-notification-button"
      );

      if (offlineStatus) {
        this._checkConnectivity(offlineStatus);
      }

      if (notificationButton && notificationStatus && testNotificationButton) {
        await this._initNotificationControls(
          notificationButton,
          notificationStatus,
          testNotificationButton
        );
      }

      const response = await StorySource.fetchAll();

      if (!response.error && response.data.length > 0) {
        const stories = response.data.map((story) => ({
          ...story,
          isOffline: response.isOffline,
        }));

        await this.showStories(stories);

        if (mapContainer) {
          this._presenter = new HomeHandler({
            view: this,
          });
          this._presenter.initMapView(mapContainer, stories);
        }

        if (searchButton && searchInput) {
          searchButton.addEventListener("click", () => {
            const keyword = searchInput.value.trim();
            this._filterStories(keyword, stories);
          });

          searchInput.addEventListener("keyup", (event) => {
            if (event.key === "Enter") {
              const keyword = searchInput.value.trim();
              this._filterStories(keyword, stories);
            }
          });
        }
      } else if (response.error) {
        this.showError(response.message);
      } else {
        this.showEmpty();
      }
    } catch (error) {
      console.error("Error in afterRender:", error);
      this.showError(error.message);
    }
  },

  async _initNotificationControls(
    notificationButton,
    notificationStatus,
    testNotificationButton
  ) {
    if (!("Notification" in window) || !("PushManager" in window)) {
      notificationButton.disabled = true;
      notificationStatus.textContent = "Browser tidak mendukung notifikasi";
      return;
    }

    const isLoggedIn = !!localStorage.getItem("token");
    if (!isLoggedIn) {
      notificationButton.disabled = true;
      notificationStatus.textContent = "Login untuk mengaktifkan notifikasi";
      return;
    }

    this.updateNotificationStatus(
      notificationButton,
      notificationStatus,
      testNotificationButton
    );

    notificationButton.addEventListener("click", async () => {
      const isSubscribed = await NotificationHelper.isSubscribed();

      if (isSubscribed) {
        notificationButton.disabled = true;
        notificationStatus.textContent = "Menonaktifkan notifikasi...";

        const result =
          await NotificationHelper.unsubscribeFromPushNotification();

        if (!result.error) {
          alert("Notifikasi berhasil dinonaktifkan!");
        } else {
          alert(`Gagal menonaktifkan notifikasi: ${result.message}`);
        }
      } else {
        notificationButton.disabled = true;
        notificationStatus.textContent = "Mengaktifkan notifikasi...";

        const result = await NotificationHelper.subscribeToPushNotification();

        if (!result.error) {
          alert("Notifikasi berhasil diaktifkan!");
        } else {
          alert(`Gagal mengaktifkan notifikasi: ${result.message}`);
        }
      }

      this.updateNotificationStatus(
        notificationButton,
        notificationStatus,
        testNotificationButton
      );
    });

    testNotificationButton.addEventListener("click", async () => {
      const result = await NotificationHelper.sendTestNotification();
      if (result.error) {
        alert(`Gagal mengirim notifikasi test: ${result.message}`);
      }
    });
  },

  async updateNotificationStatus(
    notificationButton,
    notificationStatus,
    testNotificationButton
  ) {
    notificationButton.disabled = true;

    try {
      const isSubscribed = await NotificationHelper.isSubscribed();

      if (isSubscribed) {
        notificationStatus.textContent = "Nonaktifkan Notifikasi";
        testNotificationButton.style.display = "inline-block";
      } else {
        notificationStatus.textContent = "Aktifkan Notifikasi";
        testNotificationButton.style.display = "none";
      }

      notificationButton.disabled = false;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      notificationStatus.textContent = "Error: Gagal memeriksa status";
      notificationButton.disabled = false;
    }
  },

  _setupDeleteButtons() {
    console.log("Setting up delete buttons");

    const oldButtons = document.querySelectorAll(".delete-button");
    oldButtons.forEach((button) => {
      button.replaceWith(button.cloneNode(true));
    });

    const deleteButtons = document.querySelectorAll(".delete-button");
    console.log(`Found ${deleteButtons.length} delete buttons`);

    deleteButtons.forEach((button) => {
      button.addEventListener("click", async (event) => {
        console.log("Delete button clicked");
        const storyId = button.dataset.id;
        console.log(`Story ID: ${storyId}`);

        if (confirm("Apakah Anda yakin ingin menghapus cerita ini?")) {
          try {
            console.log(`Deleting story ${storyId} from IndexedDB`);
            await StorySource.deleteStory(storyId);

            const storyElement = document.getElementById(`story-${storyId}`);
            if (storyElement) {
              storyElement.remove();
              console.log(`Removed story element from DOM`);
            }

            alert("Cerita berhasil dihapus");
          } catch (error) {
            console.error("Error deleting story:", error);
            alert(`Gagal menghapus cerita: ${error.message}`);
          }
        }
      });
    });
  },

  _checkConnectivity(statusContainer) {
    const updateStatus = () => {
      if (navigator.onLine) {
        statusContainer.innerHTML = "";
      } else {
        statusContainer.innerHTML = `
          <div class="offline-banner">
            <i class="fas fa-exclamation-triangle"></i>
            Anda sedang offline. Menampilkan data dari penyimpanan lokal.
          </div>
        `;
      }
    };

    updateStatus();

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
  },

  _filterStories(keyword, allStories) {
    if (!keyword) {
      this.showStories(allStories);
      return;
    }

    const filteredStories = allStories.filter((story) => {
      return (
        story.name.toLowerCase().includes(keyword.toLowerCase()) ||
        story.description.toLowerCase().includes(keyword.toLowerCase())
      );
    });

    if (filteredStories.length > 0) {
      this.showStories(filteredStories);
    } else {
      const storiesContainer = document.querySelector("#stories");
      storiesContainer.innerHTML = `<div class="empty">Tidak ada cerita yang sesuai dengan pencarian "${keyword}"</div>`;
    }
  },

  showLoading() {
    const storiesContainer = document.querySelector("#stories");
    if (storiesContainer) {
      storiesContainer.innerHTML =
        '<div class="loading">Memuat cerita...</div>';
    }
  },

  showError(message) {
    const storiesContainer = document.querySelector("#stories");
    if (storiesContainer) {
      storiesContainer.innerHTML = `<div class="error">Error: ${message}</div>`;
    }
  },

  showEmpty() {
    const storiesContainer = document.querySelector("#stories");
    if (storiesContainer) {
      storiesContainer.innerHTML =
        '<div class="empty">Belum ada cerita yang dibagikan</div>';
    }
  },

  async showStories(stories) {
    const storiesContainer = document.querySelector("#stories");
    storiesContainer.innerHTML = "";

    const favoriteStories = await FavoriteStorage.fetchAll();

    stories.forEach(async (story) => {
      const storyElement = document.createElement("div");
      storyElement.innerHTML = StoryCardTemplate(story);
      const storyCard = storyElement.firstElementChild;

      const favoriteButtonContainer = storyCard.querySelector(
        `#favoriteButtonContainer-${story.id}`
      );
      if (favoriteButtonContainer) {
        const handleFavoriteClick = async (storyData) => {
          const isStoryFavorited = await FavoriteStorage.fetchById(
            storyData.id
          );

          if (isStoryFavorited) {
            await FavoriteStorage.remove(storyData.id);
            alert("Story dihapus dari favorit");
          } else {
            await FavoriteStorage.save(storyData);
            alert("Story ditambahkan ke favorit");
          }

          const updatedFavorites = await FavoriteStorage.fetchAll();
          const favoriteButton = createFavoriteButton({
            story: storyData,
            favoriteStories: updatedFavorites,
            onFavoriteClick: handleFavoriteClick,
          });

          favoriteButtonContainer.innerHTML = "";
          favoriteButtonContainer.appendChild(favoriteButton);
        };

        const favoriteButton = createFavoriteButton({
          story,
          favoriteStories,
          onFavoriteClick: handleFavoriteClick,
        });

        favoriteButtonContainer.innerHTML = "";
        favoriteButtonContainer.appendChild(favoriteButton);
      }

      storiesContainer.appendChild(storyCard);
    });

    this._setupDeleteButtons();
  },

  async initializeFavoriteButton(story, containerId) {
    const favoriteStories = await FavoriteStorage.fetchAll();
    const favoriteButtonContainer = document.getElementById(containerId);

    if (!favoriteButtonContainer) return;

    const handleFavoriteClick = async (story) => {
      const isStoryFavorited = await FavoriteStorage.fetchById(story.id);

      if (isStoryFavorited) {
        await FavoriteStorage.remove(story.id);
      } else {
        await FavoriteStorage.save(story);
      }

      this.initializeFavoriteButton(story, containerId);
    };

    const favoriteButton = createFavoriteButton({
      story,
      favoriteStories,
      onFavoriteClick: handleFavoriteClick,
    });

    favoriteButtonContainer.innerHTML = "";
    favoriteButtonContainer.appendChild(favoriteButton);
  },
};

export default HomePage;
