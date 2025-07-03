import StoryApi from "../data/story-api.js";

class SigninHandler {
  constructor({ view }) {
    this._uiView = view;
    this._authApi = StoryApi;
  }

  isUserAuthenticated() {
    return this._authApi.checkAuthentication();
  }

  async loginUser({ email, password }) {
  try {
    this._uiView.showLoading(true);

    const { error, message, data } = await this._authApi.login({ email, password });

    this._uiView.showLoading(false);

    if (error) {
      this._uiView.showError(`Login gagal: ${message}`);
      return { success: false };
    }

    localStorage.setItem("token", data.token);
    return { success: true };
  } catch (err) {
    this._uiView.showError(`Error: ${err.message}`);
    this._uiView.showLoading(false);
    return { success: false };
  }
}
}

export default SigninHandler;
