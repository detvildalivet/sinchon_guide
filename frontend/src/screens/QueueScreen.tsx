import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { MapBackdrop } from '../components/MapBackdrop';
import { QueueStatusCard } from '../components/QueueStatusCard';
import { mapLayoutStyles } from '../design/mapLayout';
import { shellStyles } from '../design/shellStyles';
import { theme } from '../design/theme';
import { QueueMode, VenueCategory } from '../types/tablemate';

const categoryLabels: Record<VenueCategory, string> = {
  restaurant: '음식점',
  cafe: '카페',
  bar: '술집',
};

type Message = {
  id: number;
  sender: 'system' | 'me';
  body: string;
};

type Props = {
  category: VenueCategory;
  placeName: string;
  mode: QueueMode;
  waitingCount: number;
};

export function QueueScreen({
  category,
  placeName,
  mode,
  waitingCount,
}: Props) {
  const insets = useSafeAreaInsets();
  const [joined, setJoined] = useState(false);
  const [draft, setDraft] = useState('');
  const panelAnim = useRef(new Animated.Value(0)).current;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'system',
      body:
        mode === 'create'
          ? `${placeName} 큐를 준비했어요. 생성하면 다른 사람이 조인할 수 있어요.`
          : `${placeName} 큐에 ${waitingCount}명이 함께 기다리고 있어요.`,
    },
  ]);

  useEffect(() => {
    panelAnim.setValue(0);
    Animated.timing(panelAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [joined, panelAnim]);

  const sendMessage = () => {
    const body = draft.trim();
    if (!body) {
      return;
    }

    setMessages(current => [
      ...current,
      {
        id: Date.now(),
        sender: 'me',
        body,
      },
    ]);
    setDraft('');
  };

  const handlePrimaryAction = () => {
    setJoined(true);

    if (mode === 'create') {
      setMessages(current => [
        ...current,
        {
          id: Date.now(),
          sender: 'system',
          body: '큐가 열렸어요. 이제 다른 사람이 조인할 수 있어요.',
        },
      ]);
    }
  };

  return (
    <View style={mapLayoutStyles.screenRoot}>
      <View style={mapLayoutStyles.mapBackground} pointerEvents="none">
        <MapBackdrop variant="together" />
      </View>

      <View style={mapLayoutStyles.overlayLayer} pointerEvents="box-none">
      <Animated.View
        style={[
          shellStyles.promptPanel,
          styles.promptPanel,
          {
            top: insets.top + theme.spacing.md,
            opacity: panelAnim,
            transform: [
              {
                translateY: panelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.promptTopRow}>
          <Text style={styles.eyebrow}>{categoryLabels[category]}</Text>
        </View>
        <Text style={styles.question}>{placeName}</Text>
        <Text style={styles.description}>
          {joined
            ? '임시 채팅방에서 메뉴를 맞춰보세요.'
            : mode === 'create'
              ? '첫 큐를 만들고 밥친구를 기다려보세요.'
              : '같은 장소를 고른 사람과 바로 대화를 시작해요.'}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          shellStyles.bottomPanel,
          styles.bottomPanel,
          {
            paddingBottom: insets.bottom + theme.spacing.lg,
            opacity: panelAnim,
            transform: [
              {
                translateY: panelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [32, 0],
                }),
              },
            ],
          },
        ]}>
        <Animated.View style={[styles.panelBody, { opacity: panelAnim }]}>
          {!joined ? (
            <>
              <Text style={styles.panelKicker}>밥친구 큐</Text>
              <QueueStatusCard mode={mode} waitingCount={waitingCount} />
              <View style={styles.actionRow}>
                <AppButton
                  label={mode === 'create' ? '큐 생성하기' : '큐 조인'}
                  onPress={handlePrimaryAction}
                  variant="accent"
                  style={styles.primaryAction}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.panelKicker}>채팅방</Text>
              <View style={styles.messages}>
                {messages.map(message => (
                  <View
                    key={message.id}
                    style={[
                      styles.message,
                      message.sender === 'me' && styles.myMessage,
                    ]}>
                    <Text
                      style={[
                        styles.messageText,
                        message.sender === 'me' && styles.myMessageText,
                      ]}>
                      {message.body}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.composer}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="메시지"
                  placeholderTextColor={theme.colors.muted}
                  style={styles.input}
                  returnKeyType="send"
                  onSubmitEditing={sendMessage}
                />
                <AppButton
                  label="전송"
                  onPress={sendMessage}
                  style={styles.sendButton}
                />
              </View>
            </>
          )}
        </Animated.View>
      </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  promptPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: 'rgba(255, 255, 255, 0.96)',
    zIndex: 2,
  },
  promptTopRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  eyebrow: {
    color: theme.colors.text,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  question: {
    color: theme.colors.text,
    fontSize: theme.typography.title,
    lineHeight: 36,
    fontWeight: '900',
  },
  description: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  bottomPanel: {
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.98)',
    minHeight: 280,
  },
  panelBody: {
    gap: theme.spacing.sm,
  },
  panelKicker: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  primaryAction: {
    flex: 1,
  },
  messages: {
    minHeight: 220,
    maxHeight: 320,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  message: {
    alignSelf: 'flex-start',
    maxWidth: '82%',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  messageText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  myMessageText: {
    color: theme.colors.surface,
  },
  composer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 52,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.body,
  },
  sendButton: {
    width: 82,
  },
});
