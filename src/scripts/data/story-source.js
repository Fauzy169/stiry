import StoryApi from "./story-api.js";
import StoryDB from "./database.js";

class StorySource {
  static async fetchAll() {
    try {
      const {
        error: apiError,
        data: onlineData,
        message: apiMessage,
      } = await StoryApi.getAllStories();

      if (!apiError) {
        await this._cacheToIDB(onlineData);
        return { error: false, data: onlineData };
      }

      console.warn("API gagal. Coba ambil data dari IndexedDB...");
      const cachedData = await StoryDB.getAllStories();

      if (cachedData.length > 0) {
        return {
          error: false,
          data: cachedData,
          isOffline: true,
        };
      }

      return {
        error: true,
        message: "Gagal memuat cerita. Coba periksa koneksi internet.",
      };
    } catch (err) {
      console.error("Gagal di fetchAll:", err);
      return { error: true, message: err.message };
    }
  }

  static async _cacheToIDB(storyList) {
    try {
      await Promise.all(
        storyList.map((item) => StoryDB.saveStory(item))
      );
      console.info(`${storyList.length} cerita disimpan ke IndexedDB`);
    } catch (err) {
      console.error("Gagal menyimpan ke IndexedDB:", err);
    }
  }

  static async getLocalStories() {
    return StoryDB.getAllStories();
  }

  static async removeStory(id) {
    try {
      await StoryDB.deleteStory(id);
      return {
        error: false,
        message: "Cerita berhasil dihapus dari penyimpanan lokal.",
      };
    } catch (err) {
      return { error: true, message: err.message };
    }
  }
}

export default StorySource;
