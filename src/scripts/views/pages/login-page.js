import SigninHandler from "../../presenters/signin-handler.js";
import { createPageTemplate } from "../templates/page-template.js";

const LoginPage = {
  async render() {
    return createPageTemplate({
      title: "Login",
      content: `
        <div class="auth-form-container">
          <form id="loginForm" class="auth-form">
            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input type="email" id="email" class="form-input" required>
            </div>
            
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input type="password" id="password" class="form-input" required>
            </div>
            
            <button type="submit" class="btn btn-primary">Login</button>
            
            <p class="auth-link">Belum punya akun? <a href="#/register">Daftar sekarang</a></p>
          </form>
        </div>
      `,
    });
  },

  async afterRender() {
    this._presenter = new SigninHandler({ view: this });

    if (this._presenter.isUserAuthenticated()) {
      window.location.hash = "#/";
      return;
    }

    const form = document.querySelector("#loginForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.querySelector("#email").value;
      const password = document.querySelector("#password").value;

      const { success } = await this._presenter.loginUser({ email, password });

      if (success) {
        window.location.hash = "#/";
      }
    });
  },

  showLoading(isLoading) {
    const submitButton = document.querySelector(
      '#loginForm button[type="submit"]'
    );
    if (submitButton) {
      submitButton.disabled = isLoading;
      submitButton.textContent = isLoading ? "Loading..." : "Login";
    }
  },

  showError(message) {
    alert(message);
  },
};

export default LoginPage;
