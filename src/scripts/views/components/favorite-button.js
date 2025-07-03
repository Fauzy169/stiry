const createFavoriteButtonTemplate = (story, isFavorite = false) => `
  <button 
    aria-label="${isFavorite ? "hapus dari favorit" : "tambah ke favorit"}" 
    id="favoriteButton-${story.id}" 
    class="favorite-btn ${isFavorite ? "favorited" : ""}"
    title="${isFavorite ? "Hapus dari Favorit" : "Tambah ke Favorit"}"
  >
    <i class="fa-heart ${isFavorite ? "fas" : "far"}" aria-hidden="true"></i>
  </button>
`;

const createFavoriteButton = ({ story, favoriteStories, onFavoriteClick }) => {
  const favoriteButtonContainer = document.createElement("div");
  favoriteButtonContainer.style.display = "inline-block";

  const renderButton = () => {
    const isFavorite = favoriteStories.some(
      (favStory) => favStory.id === story.id
    );
    favoriteButtonContainer.innerHTML = createFavoriteButtonTemplate(
      story,
      isFavorite
    );

    const favoriteButton = favoriteButtonContainer.querySelector(
      `#favoriteButton-${story.id}`
    );
    favoriteButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      event.preventDefault();

      const icon = favoriteButton.querySelector("i");
      const originalClass = icon.className;
      icon.className = "fas fa-spinner fa-spin";
      favoriteButton.disabled = true;

      try {
        await onFavoriteClick(story);
      } finally {
        icon.className = originalClass;
        favoriteButton.disabled = false;
      }
    });
  };

  renderButton();
  return favoriteButtonContainer;
};

export { createFavoriteButton, createFavoriteButtonTemplate };
