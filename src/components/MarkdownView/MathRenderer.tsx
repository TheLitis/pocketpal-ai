import React from 'react';
import {ScrollView, StyleSheet, Text} from 'react-native';

import {useTheme} from '../../hooks';
import {decodeHtmlEntities} from '../../utils/messageRendering';

import {KaTeXMathView, renderKaTeX} from './KaTeXMathView';

/** Styled TeX fallback when KaTeX is disabled, unavailable, or rejects input. */
export const MathRenderer = ({TDefaultRenderer, ...props}: any) => {
  const theme = useTheme();
  const styles = StyleSheet.create({
    inline: {
      color: theme.colors.text,
      fontFamily: 'Courier',
    },
    block: {
      color: theme.colors.text,
      fontFamily: 'Courier',
      paddingVertical: 6,
    },
  });
  const attributes = props.tnode?.domNode?.attribs || {};
  const kind = attributes['data-pp-math'];

  if (!kind) {
    return <TDefaultRenderer {...props} />;
  }

  const source = decodeHtmlEntities(attributes['data-source'] || '');
  const displayMode = kind === 'block';
  const maxWidth = Number(attributes['data-max-width']) || 320;
  const fallback = displayMode ? (
    <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator>
      <Text selectable style={styles.block}>
        {source}
      </Text>
    </ScrollView>
  ) : (
    <Text selectable style={styles.inline}>
      {source}
    </Text>
  );
  const mathHtml = renderKaTeX(source, displayMode);

  if (!mathHtml) {
    return fallback;
  }

  return (
    <KaTeXMathView
      source={source}
      mathHtml={mathHtml}
      displayMode={displayMode}
      maxWidth={maxWidth}
      color={theme.colors.text}
      fallback={fallback}
    />
  );
};
