const NotFoundPage = {
  render() {
    return `
        <div class="not-found-container">
          <div class="not-found-content">
            <h2 class="not-found-title">404</h2>
            <div class="not-found-image">
              <i class="fas fa-map-signs fa-5x"></i>
            </div>
            <h3>Halaman Tidak Ditemukan</h3>
            <p>Maaf, kami tidak dapat menemukan halaman yang Anda cari.</p>
            <p>Mungkin halaman sudah dihapus atau URL yang Anda ketik salah.</p>
            <a href="#/" class="btn btn-primary">Kembali ke Beranda</a>
          </div>
        </div>
      `;
  },

  afterRender() {
    return Promise.resolve();
  },
};

export default NotFoundPage;
