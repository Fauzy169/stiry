import UrlParser from "@/scripts/routes/url-parser.js";
import { AppRoutes as routes } from "./routes/routes.js";
import NotFoundPage from "@/scripts/routes/routes.js";
import DrawerInitiator from "@/scripts/utils/drawer-initiator.js";
import AppShell from "@/scripts/views/app-shell.js";
import NotificationHelper from "@/scripts/utils/notification-helper.js";

class App {
  constructor({ content, button, drawer }) {
    this._content = content;
    this._button = button;
    this._drawer = drawer;
    this._appShell = new AppShell({
      content: this._content,
    });

    this._initialAppShell();
    this._initSkipToContent();
  }

  _initialAppShell() {
    DrawerInitiator.init({
      button: this._button,
      drawer: this._drawer,
      content: this._content,
    });
  }

  _initSkipToContent() {
    const skipLink = document.querySelector(".skip-link");
    const mainContent = document.querySelector("#mainContent");

    if (skipLink && mainContent) {
      skipLink.addEventListener("click", function (event) {
        event.preventDefault();
        skipLink.blur();
        mainContent.focus();
        mainContent.scrollIntoView();
      });
    }
  }

  async renderPage() {
    try {
      // Close drawer if it's open
      const drawer = document.querySelector("#navigationDrawer");
      if (drawer && drawer.classList.contains("open")) {
        drawer.classList.remove("open");
        // Wait for drawer transition to complete
        await new Promise((resolve) => {
          const handleTransition = () => {
            window.removeEventListener("drawerTransitionEnd", handleTransition);
            resolve();
          };
          window.addEventListener("drawerTransitionEnd", handleTransition);
        });
      }

      const url = UrlParser.parseActiveUrlWithCombiner();
      const page = routes[url];

      // Clear existing content
      this._content.innerHTML = "";

      // Add loading indicator
      const loadingElement = document.createElement("div");
      loadingElement.className = "loading";
      loadingElement.textContent = "Memuat halaman...";
      this._content.appendChild(loadingElement);

      // Render page content
      const pageContent = page
        ? await page.render()
        : await NotFoundPage.render();
      this._content.innerHTML = pageContent;

      // Run afterRender after content is loaded
      if (page) {
        await page.afterRender();
      } else {
        await NotFoundPage.afterRender();
      }

      // Set focus to main content
      const mainContent = document.querySelector("#mainContent");
      if (mainContent) {
        mainContent.focus();
        mainContent.setAttribute("tabindex", "-1");
      }

      // Update auth menu
      updateAuthMenu();
    } catch (error) {
      console.error("Error rendering page:", error);
      if (this._content) {
        this._content.innerHTML =
          '<div class="error">Terjadi kesalahan saat memuat halaman</div>';
      }
    }
  }
}

// Inisialisasi app
const app = new App({
  content: document.querySelector("#mainContent"),
  button: document.querySelector("#hamburgerButton"),
  drawer: document.querySelector("#navigationDrawer"),
});

// Update auth menu function
function updateAuthMenu() {
  const authNavItem = document.querySelector("#authNavItem");
  if (!authNavItem) return;

  if (localStorage.getItem("token")) {
    authNavItem.innerHTML = `
      <a href="#/" id="logoutButton"><i class="fas fa-sign-out-alt"></i> Logout</a>
    `;

    const logoutButton = document.querySelector("#logoutButton");
    if (logoutButton) {
      logoutButton.addEventListener("click", async (e) => {
        e.preventDefault();

        if ("serviceWorker" in navigator && "PushManager" in window) {
          try {
            const isSubscribed = await NotificationHelper.isSubscribed();
            if (isSubscribed) {
              await NotificationHelper.unsubscribeFromPushNotification();
              console.log("Successfully unsubscribed from push notifications");
            }
          } catch (error) {
            console.error("Error unsubscribing from push notification:", error);
          }
        }

        localStorage.removeItem("token");
        updateAuthMenu();
        window.location.hash = "#/";
      });
    }
  } else {
    authNavItem.innerHTML = `
      <a href="#/login"><i class="fas fa-sign-in-alt"></i> Login</a>
    `;
  }
}

// Event listeners
window.addEventListener("load", async () => {
  await app.renderPage();
  updateAuthMenu();
});

window.addEventListener("hashchange", async () => {
  await app.renderPage();
});

export default app;
