import StoryDB from "./database.js";

const FavoriteStorage = {
  async fetchById(storyId) {
    return StoryDB.getFavorite(storyId);
  },

  async fetchAll() {
    return StoryDB.getAllFavorites();
  },

  async save(storyData) {
    return StoryDB.saveFavorite(storyData);
  },

  async remove(storyId) {
    return StoryDB.deleteFavorite(storyId);
  },

  async search(keyword) {
    return StoryDB.searchFavorites(keyword);
  },
};

export default FavoriteStorage;
