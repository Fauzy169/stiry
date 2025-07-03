const createPageTemplate = ({ title, content }) => {
  return `
      <div class="page">
        <h2 class="page__title">${title}</h2>
        <div class="page__content">
          ${content}
        </div>
      </div>
    `;
};

export { createPageTemplate };
