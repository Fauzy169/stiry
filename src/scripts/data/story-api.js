const BASE_URL = "https://story-api.dicoding.dev/v1";

class StoryApi {
  static async register({ name, email, password }) {
    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });
      
      const responseJson = await response.json();
      
      if (responseJson.error) {
        return { error: true, message: responseJson.message };
      }
      
      return { error: false, data: responseJson };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }

  static async login({ email, password }) {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      
      const responseJson = await response.json();
      
      if (responseJson.error) {
        return { error: true, message: responseJson.message };
      }
      
      localStorage.setItem('token', responseJson.loginResult.token);
      
      return { error: false, data: responseJson.loginResult };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }

  static async getAllStories() {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`${BASE_URL}/stories`, {
        headers,
      });

      const responseJson = await response.json();

      if (responseJson.error) {
        return { error: true, message: responseJson.message };
      }

      return { error: false, data: responseJson.listStory };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }

  static async addStory({ description, photoFile, lat, lon }) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return { error: true, message: 'Anda harus login terlebih dahulu' };
      }

      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", photoFile);
      if (lat) formData.append("lat", lat);
      if (lon) formData.append("lon", lon);

      const response = await fetch(`${BASE_URL}/stories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      return response.json();
    } catch (error) {
      return { error: true, message: error.message };
    }
  }

  static checkAuthentication() {
    return !!localStorage.getItem('token');
  }

  static logout() {
    localStorage.removeItem('token');
  }
}

export default StoryApi;
