import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';

/**
 * An <Svg> that exactly covers its parent (gradients, decorative circles).
 *
 * `<Svg width="100%" height="100%">` on Android can keep the size from the
 * first layout pass, leaving the drawing short of the box once it grows. So the
 * box is measured first and the Svg drawn at that size in pixels.
 */
export default function FillSvg({ children }: { children: React.ReactNode }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (!size || size.w !== width || size.h !== height) setSize({ w: width, h: height });
      }}
    >
      {size && size.w > 0 && size.h > 0 && (
        <Svg width={size.w} height={size.h}>
          {children}
        </Svg>
      )}
    </View>
  );
}
