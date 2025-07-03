import { createPageTemplate } from "../templates/page-template.js";
import StoryCardTemplate from "../templates/story-card.js";
import FavoriteStorage from "../../data/favorite-storage.js";
import { createFavoriteButton } from "../components/favorite-button.js";

const FavoritePage = {
  async render() {
    return createPageTemplate({
      title: "Cerita Tersimpan",
      content: `
        <div class="stories" id="stories"></div>
      `,
    });
  },

  async afterRender() {
    const storiesContainer = document.querySelector("#stories");
    if (!storiesContainer) {
      console.error("Stories container not found");
      return;
    }

    this.showLoading();
    try {
      const stories = await FavoriteStorage.fetchAll();
      if (stories && stories.length > 0) {
        await this.showStories(stories);
      } else {
        this.showEmpty();
      }
    } catch (error) {
      console.error("Error loading favorite stories:", error);
      this.showError(error.message);
    }
  },

  showLoading() {
    const storiesContainer = document.querySelector("#stories");
    if (storiesContainer) {
      storiesContainer.innerHTML = `
        <div class="loading">Memuat cerita tersimpan...</div>
      `;
    }
  },

  showError(message) {
    const storiesContainer = document.querySelector("#stories");
    if (storiesContainer) {
      storiesContainer.innerHTML = `
        <div class="error">Error: ${message}</div>
      `;
    }
  },

  showEmpty() {
    const storiesContainer = document.querySelector("#stories");
    if (storiesContainer) {
      storiesContainer.innerHTML = `
        <div class="empty">
          <i class="far fa-heart"></i>
          <p>Belum ada cerita yang disimpan</p>
          <a href="#/" class="btn btn-primary">Jelajahi Cerita</a>
        </div>
      `;
    }
  },

  async showStories(stories) {
    const storiesContainer = document.querySelector("#stories");
    storiesContainer.innerHTML = "";

    stories.forEach(async (story) => {
      const storyElement = document.createElement("div");
      storyElement.innerHTML = StoryCardTemplate(story);
      const storyCard = storyElement.firstElementChild;

      const favoriteButtonContainer = storyCard.querySelector(
        `#favoriteButtonContainer-${story.id}`
      );
      if (favoriteButtonContainer) {
        const handleFavoriteClick = async (storyData) => {
          try {
            await FavoriteStorage.remove(storyData.id);

            storyCard.style.transition = "all 0.3s ease";
            storyCard.style.opacity = "0";
            storyCard.style.transform = "scale(0.8)";

            setTimeout(() => {
              storyCard.remove();

              const remainingStories = document.querySelectorAll(".story-item");
              if (remainingStories.length === 0) {
                this.showEmpty();
              }
            }, 300);
          } catch (error) {
            console.error("Error removing story from favorites:", error);
            alert("Gagal menghapus story dari favorit");
          }
        };

        const favoriteButton = createFavoriteButton({
          story,
          favoriteStories: stories,
          onFavoriteClick: handleFavoriteClick,
        });

        favoriteButtonContainer.innerHTML = "";
        favoriteButtonContainer.appendChild(favoriteButton);
      }

      storiesContainer.appendChild(storyCard);
    });

    if (!document.querySelector("#favoritesEmptyStyle")) {
      const style = document.createElement("style");
      style.id = "favoritesEmptyStyle";
      style.textContent = `
        .empty {
          text-align: center;
          padding: 2rem;
          color: #666;
        }
        .empty i {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: #e74c3c;
        }
        .empty p {
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }
      `;
      document.head.appendChild(style);
    }
  },
};

export default FavoritePage;
