import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Border, NB, Shadow, Typography } from '@/constants/theme';

type Props = {
  status: 'denied' | 'undetermined' | null;
  onRequest: () => void;
  onOpenSettings: () => void;
};

export function PermissionBanner({ status, onRequest, onOpenSettings }: Props) {
  if (status === null) return null;

  const isDenied = status === 'denied';

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isDenied ? NB.coral : NB.yellow,
          borderColor: NB.black,
          ...Shadow.medium,
          shadowColor: NB.black,
        },
      ]}
    >
      <Text style={styles.icon}>{isDenied ? '🔕' : '🔔'}</Text>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isDenied ? 'Notifications Blocked' : 'Enable Notifications'}
        </Text>
        <Text style={styles.body}>
          {isDenied
            ? 'Open system settings to allow reminders.'
            : 'Allow reminders to stay on track with your habits.'}
        </Text>
        <TouchableOpacity
          onPress={isDenied ? onOpenSettings : onRequest}
          style={styles.btn}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>
            {isDenied ? 'Open Settings →' : 'Enable →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    borderWidth: Border.width,
    borderRadius: Border.radius,
    padding: 16,
    gap: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 28,
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...Typography.body,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: NB.black,
  },
  body: {
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: NB.black,
    opacity: 0.75,
  },
  btn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: NB.black,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnText: {
    color: NB.yellow,
    ...Typography.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
