const StoryCardTemplate = (story) => {
  const formatReadableDate = (dateStr) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateStr).toLocaleDateString("id-ID", options);
  };

  const shortenText = (text, limit) => {
    return text.length <= limit ? text : text.slice(0, limit) + "...";
  };

  const isOffline = story.isOffline;
  const offlineBadge = isOffline
    ? '<span class="offline-indicator" title="Data dari penyimpanan lokal"><i class="fas fa-database"></i></span>'
    : "";

  const imageValue =
    story.photo ||
    story.photoUrl ||
    story.image ||
    story.url ||
    story.pictureId ||
    story.imageUrl;

  let photoUrl = "https://via.placeholder.com/300x200?text=No+Image";
  if (imageValue) {
    // Gunakan langsung jika sudah full URL, jika tidak, tambahkan prefix
    photoUrl = imageValue.startsWith("http")
      ? imageValue
      : `https://story-api.dicoding.dev/images/stories/${imageValue}`;
  }

  return `
    <article class="story-item" id="story-${story.id}">
      <img src="${photoUrl}" alt="${story.name || "User"}" />
      <div class="story-item__content">
        <div class="story-item__header">
          <h3 class="story-item__name">${story.name || "Tanpa Nama"} ${offlineBadge}</h3>
          <div class="story-item__favorite" id="favoriteButtonContainer-${story.id}"></div>
        </div>
        <p class="story-item__description">${shortenText(story.description || story.desc || "", 150)}</p>
        <div class="story-item__footer">
          <p class="story-item__date">${formatReadableDate(story.createdAt || story.created_at || new Date())}</p>
          <div class="story-location">
            ${
              story.lat && story.lon
                ? '<i class="fas fa-map-marker-alt"></i> Lokasi tersedia'
                : '<i class="fas fa-map-marker-alt text-muted"></i> Tidak ada lokasi'
            }
          </div>
        </div>
      </div>
    </article>
  `;
};

export default StoryCardTemplate;
