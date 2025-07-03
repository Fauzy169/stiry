import StoryApi from "../data/story-api.js";

class SignupHandler {
  constructor({ view }) {
    this._uiView = view;
    this._authService = StoryApi;
  }

  isUserAuthenticated() {
    return this._authService.checkAuthentication();
  }

  async registerUser({ name, email, password }) {
    try {
      this._uiView.showLoading(true);

      const { error, message } = await this._authService.register({
        name,
        email,
        password,
      });

      this._uiView.showLoading(false);

      if (error) {
        this._uiView.showError(`Registrasi gagal: ${message}`);
        return { success: false };
      }

      this._uiView.showSuccess("Pendaftaran berhasil! Silakan login.");
      return { success: true };
    } catch (err) {
      this._uiView.showError(`Error: ${err.message}`);
      this._uiView.showLoading(false);
      return { success: false };
    }
  }
}

export default SignupHandler;
