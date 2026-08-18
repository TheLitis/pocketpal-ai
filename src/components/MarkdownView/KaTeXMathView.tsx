import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {WebView} from 'react-native-webview';
import katex from 'katex';

import {KATEX_WEBVIEW_CSS} from './katexStyles.generated';

interface KaTeXMathViewProps {
  source: string;
  mathHtml: string;
  displayMode: boolean;
  maxWidth: number;
  color: string;
  fallback: React.ReactNode;
}

interface KaTeXLayoutMessage {
  type: 'pp-katex-layout';
  height: number;
  width: number;
}

interface KaTeXLayout {
  height: number;
  width: number;
}

const DEFAULT_INLINE_LAYOUT: KaTeXLayout = {height: 28, width: 120};
const DEFAULT_BLOCK_LAYOUT: KaTeXLayout = {height: 52, width: 0};
const MAX_MATH_HEIGHT = 320;
const MAX_CACHED_LAYOUTS = 200;
const MAX_KATEX_SOURCE_CHARS = 8_000;
const layoutCache = new Map<string, KaTeXLayout>();

function hashFormula(source: string, displayMode: boolean): string {
  let hash = displayMode ? 7 : 17;
  for (let index = 0; index < source.length; index++) {
    hash = (hash * 31 + source.charCodeAt(index)) % 2147483647;
  }
  return Math.abs(hash).toString(36);
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value));
}

function isKaTeXLayoutMessage(value: unknown): value is KaTeXLayoutMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as Partial<KaTeXLayoutMessage>;
  return (
    message.type === 'pp-katex-layout' &&
    typeof message.height === 'number' &&
    Number.isFinite(message.height) &&
    typeof message.width === 'number' &&
    Number.isFinite(message.width)
  );
}

function safeColor(color: string): string {
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : '#1f2937';
}

function cacheLayout(key: string, layout: KaTeXLayout): void {
  if (!layoutCache.has(key) && layoutCache.size >= MAX_CACHED_LAYOUTS) {
    const oldestKey = layoutCache.keys().next().value;
    if (oldestKey) {
      layoutCache.delete(oldestKey);
    }
  }

  layoutCache.set(key, layout);
}

/**
 * Parses TeX in the native JS runtime. `throwOnError: false` avoids a
 * streaming-time crash, while `trust: false` rejects TeX commands that could
 * otherwise create links or untrusted HTML in the WebView document.
 */
export function renderKaTeX(
  source: string,
  displayMode: boolean,
): string | null {
  if (!source.trim() || source.length > MAX_KATEX_SOURCE_CHARS) {
    return null;
  }

  try {
    const html = katex.renderToString(source, {
      displayMode,
      output: 'htmlAndMathml',
      strict: 'warn',
      throwOnError: false,
      trust: false,
    });

    return html.includes('katex-error') ? null : html;
  } catch {
    return null;
  }
}

/**
 * Builds the only HTML document mounted for math. The formula itself has
 * already passed through KaTeX; CSP and WebView navigation policy prevent
 * network access, external scripts, form submission, and document escape.
 */
export function buildKaTeXDocument(
  mathHtml: string,
  displayMode: boolean,
  color: string,
): string {
  const presentationClass = displayMode ? ' pp-katex-display' : '';
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; form-action 'none'; img-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'" />
  <style>
    ${KATEX_WEBVIEW_CSS}
    html, body { margin: 0; padding: 0; background: transparent; color: ${safeColor(color)}; overflow: ${displayMode ? 'auto' : 'hidden'}; }
    #pp-katex-root { display: inline-block; min-height: 1px; }
    #pp-katex-root.pp-katex-display { display: block; min-width: max-content; padding: 4px 0; }
  </style>
</head>
<body>
  <div id="pp-katex-root" class="${presentationClass.trim()}">${mathHtml}</div>
  <script>
    (function () {
      var root = document.getElementById('pp-katex-root');
      var report = function () {
        var width = Math.max(root.scrollWidth, document.documentElement.scrollWidth);
        var height = Math.max(root.scrollHeight, document.documentElement.scrollHeight);
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'pp-katex-layout', width: width, height: height}));
      };
      window.addEventListener('load', report);
      if (window.ResizeObserver) { new ResizeObserver(report).observe(root); }
      setTimeout(report, 0);
    })();
  </script>
</body>
</html>`;
}

export const KaTeXMathView: React.FC<KaTeXMathViewProps> = ({
  source,
  mathHtml,
  displayMode,
  maxWidth,
  color,
  fallback,
}) => {
  const cacheKey = `${displayMode ? 'block' : 'inline'}:${hashFormula(
    source,
    displayMode,
  )}`;
  const initialLayout =
    layoutCache.get(cacheKey) ??
    (displayMode ? DEFAULT_BLOCK_LAYOUT : DEFAULT_INLINE_LAYOUT);
  const [layout, setLayout] = useState<KaTeXLayout>(initialLayout);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
    setLayout(
      layoutCache.get(cacheKey) ??
        (displayMode ? DEFAULT_BLOCK_LAYOUT : DEFAULT_INLINE_LAYOUT),
    );
  }, [cacheKey, displayMode]);

  const document = useMemo(
    () => buildKaTeXDocument(mathHtml, displayMode, color),
    [color, displayMode, mathHtml],
  );

  if (loadFailed) {
    return <>{fallback}</>;
  }

  const width = displayMode
    ? maxWidth
    : clamp(layout.width, 24, Math.max(24, maxWidth));
  const height = clamp(layout.height, displayMode ? 36 : 20, MAX_MATH_HEIGHT);

  return (
    <View style={[styles.container, {width, height}]}>
      <WebView
        accessibilityLabel="Rendered mathematical expression"
        androidLayerType="software"
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
        cacheEnabled={false}
        domStorageEnabled={false}
        javaScriptCanOpenWindowsAutomatically={false}
        javaScriptEnabled
        mediaPlaybackRequiresUserAction
        mixedContentMode="never"
        onError={() => setLoadFailed(true)}
        onHttpError={() => setLoadFailed(true)}
        onMessage={event => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (!isKaTeXLayoutMessage(message)) {
              return;
            }

            const nextLayout = {
              height: clamp(
                message.height,
                displayMode ? 36 : 20,
                MAX_MATH_HEIGHT,
              ),
              width: displayMode
                ? maxWidth
                : clamp(message.width, 24, Math.max(24, maxWidth)),
            };
            cacheLayout(cacheKey, nextLayout);
            setLayout(nextLayout);
          } catch {
            // Ignore malformed bridge messages. The WebView only needs a
            // layout hint; rendering remains usable with the default size.
          }
        }}
        onShouldStartLoadWithRequest={request => request.url === 'about:blank'}
        originWhitelist={['about:blank']}
        overScrollMode="never"
        scrollEnabled={displayMode}
        setSupportMultipleWindows={false}
        showsHorizontalScrollIndicator={displayMode}
        showsVerticalScrollIndicator={false}
        source={{html: document, baseUrl: 'about:blank'}}
        style={styles.webView}
        textInteractionEnabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  webView: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});
