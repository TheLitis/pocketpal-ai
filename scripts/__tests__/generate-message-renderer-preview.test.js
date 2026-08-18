const {
  createPreviewDocument,
  renderMath,
} = require('../generate-message-renderer-preview');

describe('message renderer desktop preview', () => {
  it('is self-contained and renders KaTeX locally', () => {
    const document = createPreviewDocument();

    expect(document).toContain('class="katex"');
    expect(document).toContain('PocketPal rich renderer preview');
    expect(document).not.toContain('<script src=');
    expect(document).not.toContain('<img ');
    expect(document).not.toContain('@font-face');
  });

  it('keeps malformed TeX readable in the preview', () => {
    expect(renderMath('\\frac{1}{', true)).toContain('math-fallback');
  });
});
