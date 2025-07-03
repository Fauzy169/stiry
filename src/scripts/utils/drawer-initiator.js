const DrawerInitiator = {
  init({ button, drawer, content }) {
    button.addEventListener("click", (event) => {
      this._toggleDrawer(event, drawer);
    });

    content.addEventListener("click", (event) => {
      this._closeDrawer(event, drawer);
    });

    // Add transition end listener
    drawer.addEventListener("transitionend", () => {
      if (!drawer.classList.contains("open")) {
        // Ensure content is properly rendered after drawer closes
        window.dispatchEvent(new Event("drawerTransitionEnd"));
      }
    });
  },

  _toggleDrawer(event, drawer) {
    event.stopPropagation();
    drawer.classList.toggle("open");
  },

  _closeDrawer(event, drawer) {
    event.stopPropagation();
    drawer.classList.remove("open");
  },
};

export default DrawerInitiator;
