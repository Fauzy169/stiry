import SignupHandler from "../../presenters/signup-handler.js";
import { createPageTemplate } from "../templates/page-template.js";

const RegisterPage = {
  async render() {
    return createPageTemplate({
      title: "Daftar Akun",
      content: `
        <div class="auth-form-container">
          <form id="registerForm" class="auth-form">
            <div class="form-group">
              <label for="name" class="form-label">Nama</label>
              <input type="text" id="name" class="form-input" required>
            </div>
            
            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input type="email" id="email" class="form-input" required>
            </div>
            
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input type="password" id="password" class="form-input" required minlength="6">
            </div>
            
            <button type="submit" class="btn btn-primary">Daftar</button>
            
            <p class="auth-link">Sudah punya akun? <a href="#/login">Login</a></p>
          </form>
        </div>
      `,
    });
  },

  async afterRender() {
    this._presenter = new SignupHandler({ view: this });

    if (this._presenter.isUserAuthenticated()) {
      window.location.hash = "#/";
      return;
    }

    const form = document.querySelector("#registerForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.querySelector("#name").value;
      const email = document.querySelector("#email").value;
      const password = document.querySelector("#password").value;

      const { success } = await this._presenter.registerUser({
        name,
        email,
        password,
      });

      if (success) {
        window.location.hash = "#/login";
      }
    });
  },

  showLoading(isLoading) {
    const submitButton = document.querySelector(
      '#registerForm button[type="submit"]'
    );
    if (submitButton) {
      submitButton.disabled = isLoading;
      submitButton.textContent = isLoading ? "Loading..." : "Daftar";
    }
  },

  showError(message) {
    alert(message);
  },

  showSuccess(message) {
    alert(message);
  },
};

export default RegisterPage;
