import HomePage from "../views/pages/home-page.js";
import AddStoryPage from "../views/pages/add-story-page.js";
import FavoritePage from "../views/pages/favorite-page.js";
import LoginPage from "../views/pages/login-page.js";
import RegisterPage from "../views/pages/register-page.js";
import NotFoundPage from "../views/pages/not-found-page.js";

const AppRoutes = {
  "/": HomePage,
  "/add": AddStoryPage,
  "/favorites": FavoritePage,
  "/login": LoginPage,
  "/register": RegisterPage,
};

export { AppRoutes, NotFoundPage as default };
