import { openDB } from "idb";

const DATABASE_NAME = "story-app-db";
const DATABASE_VERSION = 2;
const STORIES_STORE_NAME = "stories";
const FAVORITE_STORE_NAME = "favorite-stories";

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database, oldVersion, newVersion) {
    if (oldVersion < 1) {
      if (!database.objectStoreNames.contains(STORIES_STORE_NAME)) {
        database.createObjectStore(STORIES_STORE_NAME, { keyPath: "id" });
        console.log(`Object store ${STORIES_STORE_NAME} berhasil dibuat`);
      }
    }

    if (oldVersion < 2) {
      if (!database.objectStoreNames.contains(FAVORITE_STORE_NAME)) {
        database.createObjectStore(FAVORITE_STORE_NAME, { keyPath: "id" });
        console.log(`Object store ${FAVORITE_STORE_NAME} berhasil dibuat`);
      }
    }
  },
});

const StoryDB = {
  async getAllStories() {
    return (await dbPromise).getAll(STORIES_STORE_NAME);
  },

  async getStory(id) {
    if (!id) return null;
    return (await dbPromise).get(STORIES_STORE_NAME, id);
  },

  async saveStory(story) {
    if (!story.id) return;
    return (await dbPromise).put(STORIES_STORE_NAME, story);
  },

  async deleteStory(id) {
    return (await dbPromise).delete(STORIES_STORE_NAME, id);
  },

  async searchStories(query) {
    const stories = await this.getAllStories();
    return stories.filter((story) => {
      const storyName = (story.name || "").toLowerCase();
      const queryLower = query.toLowerCase();
      return storyName.includes(queryLower);
    });
  },

  async getAllFavorites() {
    return (await dbPromise).getAll(FAVORITE_STORE_NAME);
  },

  async getFavorite(id) {
    if (!id) return null;
    return (await dbPromise).get(FAVORITE_STORE_NAME, id);
  },

  async saveFavorite(story) {
    if (!story.id) return;
    return (await dbPromise).put(FAVORITE_STORE_NAME, story);
  },

  async deleteFavorite(id) {
    return (await dbPromise).delete(FAVORITE_STORE_NAME, id);
  },

  async searchFavorites(query) {
    const stories = await this.getAllFavorites();
    return stories.filter((story) => {
      const storyName = (story.name || "").toLowerCase();
      const queryLower = query.toLowerCase();
      return storyName.includes(queryLower);
    });
  },
};

export default StoryDB;
