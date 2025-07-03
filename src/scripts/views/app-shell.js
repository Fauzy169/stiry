class AppShell {
  constructor({ content }) {
    this._content = content;
    this._renderAppShell();
  }

  _renderAppShell() {
    this._renderDrawerContent();
  }

  _renderDrawerContent() {
    const navigationDrawer = document.querySelector("#navigationDrawer");
    if (navigationDrawer) {
      navigationDrawer.innerHTML = this._navigationTemplate();
      navigationDrawer.classList.add("app-bar__navigation");
    }
  }

  _navigationTemplate() {
    return `
      <ul>
        <li><a href="#/"><i class="fas fa-home"></i> Home</a></li>
        <li><a href="#/add"><i class="fas fa-plus-circle"></i> Tambah Cerita</a></li>
        <li><a href="#/favorites"><i class="fas fa-heart"></i> Cerita Tersimpan</a></li>
        <li id="authNavItem">
          ${this._authNavTemplate()}
        </li>
      </ul>
    `;
  }

  _authNavTemplate() {
    return `
      <a href="#/login"><i class="fas fa-sign-in-alt"></i> Login</a>
    `;
  }
}

export default AppShell;
