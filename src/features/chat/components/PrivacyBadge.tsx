import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors} from '../../../theme/colors';

export function PrivacyBadge() {
  return (
    <View style={styles.badge} accessibilityLabel="Private space protected">
      <Text style={styles.dot}>●</Text>
      <Text style={styles.text}>PRIVATE SPACE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.sageLight,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  dot: {color: colors.sage, fontSize: 9},
  text: {
    color: colors.inkSoft,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});
