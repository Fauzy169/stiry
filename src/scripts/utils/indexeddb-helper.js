import { openDB } from "idb";

const DATABASE_NAME = "story-app-db";
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = "favorite-stories";

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database) {
    if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      database.createObjectStore(OBJECT_STORE_NAME, { keyPath: "id" });
      console.log(`Object store ${OBJECT_STORE_NAME} berhasil dibuat`);
    }
  },
});

const IndexedDBHelper = {
  async getAllFavorites() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME);
  },

  async getFavorite(id) {
    if (!id) return null;
    return (await dbPromise).get(OBJECT_STORE_NAME, id);
  },

  async addToFavorites(story) {
    if (!story.id) return;

    story.isFavorite = true;

    story.favoritedAt = new Date().toISOString();

    return (await dbPromise).put(OBJECT_STORE_NAME, story);
  },

  async removeFromFavorites(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME, id);
  },

  async searchFavoritesByName(query) {
    const favorites = await this.getAllFavorites();
    return favorites.filter((story) => {
      const storyName = (story.name || "").toLowerCase();
      const queryLower = query.toLowerCase();
      return storyName.includes(queryLower);
    });
  },

  async isFavorite(id) {
    if (!id) return false;
    const story = await this.getFavorite(id);
    return !!story;
  },

  async updateFavoriteStatus(stories) {
    if (!stories || !Array.isArray(stories)) return stories;

    const favorites = await this.getAllFavorites();
    const favoriteIds = favorites.map((fav) => fav.id);

    return stories.map((story) => ({
      ...story,
      isFavorite: favoriteIds.includes(story.id),
    }));
  },
};

export default IndexedDBHelper;
