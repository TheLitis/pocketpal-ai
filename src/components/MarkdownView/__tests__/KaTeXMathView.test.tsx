import React from 'react';
import {Text} from 'react-native';

import {fireEvent, render} from '../../../../jest/test-utils';

import {buildKaTeXDocument, KaTeXMathView, renderKaTeX} from '../KaTeXMathView';

describe('KaTeXMathView', () => {
  it('renders valid TeX locally and rejects malformed expressions', () => {
    expect(renderKaTeX('E = mc^2', false)).toContain('class="katex"');
    expect(renderKaTeX('\\frac{1}{', true)).toBeNull();
    expect(renderKaTeX('x'.repeat(8_001), false)).toBeNull();
  });

  it('builds a local-only document without bundled font requests', () => {
    const document = buildKaTeXDocument(
      renderKaTeX('x^2', false) as string,
      false,
      '#123456',
    );

    expect(document).toContain("default-src 'none'");
    expect(document).toContain('color: #123456');
    expect(document).toContain('ReactNativeWebView.postMessage');
    expect(document).not.toContain('@font-face');
    expect(document).not.toContain('https://');
  });

  it('uses an isolated WebView for a valid inline expression', () => {
    const mathHtml = renderKaTeX('x + y', false) as string;
    const {getByTestId} = render(
      <KaTeXMathView
        source="x + y"
        mathHtml={mathHtml}
        displayMode={false}
        maxWidth={240}
        color="#123456"
        fallback={<Text testID="math-fallback">x + y</Text>}
      />,
    );
    const webView = getByTestId('mock-webview');

    expect(webView.props.originWhitelist).toEqual(['about:blank']);
    expect(webView.props.allowFileAccess).toBe(false);
    expect(webView.props.javaScriptEnabled).toBe(true);
    expect(webView.props.scrollEnabled).toBe(false);
    expect(webView.props.source.baseUrl).toBe('about:blank');
    expect(webView.props.onShouldStartLoadWithRequest({url: 'https://x'})).toBe(
      false,
    );
    expect(
      webView.props.onShouldStartLoadWithRequest({url: 'about:blank'}),
    ).toBe(true);
  });

  it('enables horizontal scrolling for a block expression', () => {
    const source = '\\frac{dx}{dt} = \\alpha x + \\beta';
    const mathHtml = renderKaTeX(source, true) as string;
    const {getByTestId} = render(
      <KaTeXMathView
        source={source}
        mathHtml={mathHtml}
        displayMode
        maxWidth={240}
        color="#123456"
        fallback={<Text testID="math-fallback">formula</Text>}
      />,
    );

    expect(getByTestId('mock-webview').props.scrollEnabled).toBe(true);
  });

  it('falls back without crashing when the WebView reports an error', () => {
    const mathHtml = renderKaTeX('x', false) as string;
    const {getByTestId, queryByTestId} = render(
      <KaTeXMathView
        source="x"
        mathHtml={mathHtml}
        displayMode={false}
        maxWidth={240}
        color="#123456"
        fallback={<Text testID="math-fallback">x</Text>}
      />,
    );

    fireEvent(getByTestId('mock-webview'), 'error');

    expect(getByTestId('math-fallback')).toBeTruthy();
    expect(queryByTestId('mock-webview')).toBeNull();
  });
});
