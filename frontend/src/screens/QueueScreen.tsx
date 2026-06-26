import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
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
import { useAuth } from '../auth/AuthContext';
import { WS_BASE } from '../api/config';
import {
  createQueue,
  fetchMessages,
  joinQueue,
  postMessage,
} from '../api/client';
import { ApiMessage } from '../api/types';
import { QueueMode, VenueCategory } from '../types/tablemate';

const categoryLabels: Record<VenueCategory, string> = {
  restaurant: '음식점',
  cafe: '카페',
  bar: '술집',
};

type ChatMessage = {
  id: number;
  sender: 'system' | 'me' | 'other';
  body: string;
};

type Props = {
  category: VenueCategory;
  placeName: string;
  placeGoogleId: string;
  mode: QueueMode;
  queueId: number | null;
  initialWaitingCount: number;
  onBack: () => void;
};

export function QueueScreen({
  category,
  placeName,
  placeGoogleId,
  mode,
  queueId,
  initialWaitingCount,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  const { token, userId } = useAuth();
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [waitingCount, setWaitingCount] = useState(initialWaitingCount);
  const [activeQueueId, setActiveQueueId] = useState<number | null>(queueId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const wsRef = useRef<WebSocket | null>(null);

  const mapMessage = useCallback(
    (m: ApiMessage): ChatMessage => ({
      id: m.id,
      sender:
        m.senderType === 'system'
          ? 'system'
          : m.userId === userId
            ? 'me'
            : 'other',
      body: m.body,
    }),
    [userId],
  );

  const appendMessage = useCallback((incoming: ChatMessage) => {
    setMessages(current =>
      current.some(m => m.id === incoming.id) ? current : [...current, incoming],
    );
  }, []);

  useEffect(() => {
    panelAnim.setValue(0);
    Animated.timing(panelAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [joined, panelAnim]);

  // Open the chat WebSocket once we have joined and know the queue id.
  useEffect(() => {
    if (!joined || activeQueueId === null || !token) {
      return;
    }
    const ws = new WebSocket(
      `${WS_BASE}/queues/${activeQueueId}/ws?token=${encodeURIComponent(token)}`,
    );
    wsRef.current = ws;

    ws.onmessage = event => {
      try {
        const payload = JSON.parse(event.data as string);
        if (payload.type === 'message' && payload.message) {
          appendMessage(mapMessage(payload.message as ApiMessage));
        } else if (payload.type === 'presence') {
          setWaitingCount(payload.waitingCount);
        }
      } catch {
        // ignore malformed frames
      }
    };
    ws.onerror = () => {
      setError('실시간 연결에 문제가 있어요. 메시지는 전송으로 보낼 수 있어요.');
    };

    return () => {
      wsRef.current = null;
      ws.close();
    };
  }, [joined, activeQueueId, token, appendMessage, mapMessage]);

  const enterChat = async (resolvedQueueId: number) => {
    setActiveQueueId(resolvedQueueId);
    try {
      const history = await fetchMessages(resolvedQueueId);
      setMessages(history.map(mapMessage));
    } catch {
      setMessages([]);
    }
    setJoined(true);
  };

  const handlePrimaryAction = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === 'create' || queueId === null) {
        const queue = await createQueue(placeGoogleId, placeName);
        setWaitingCount(queue.waitingCount);
        await enterChat(queue.id);
      } else {
        const queue = await joinQueue(queueId);
        setWaitingCount(queue.waitingCount);
        await enterChat(queue.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '큐 참여에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = () => {
    const body = draft.trim();
    if (!body || activeQueueId === null) {
      return;
    }
    setDraft('');
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'message', body }));
    } else {
      // REST fallback; the message is broadcast back and appended via dedupe.
      postMessage(activeQueueId, body)
        .then(m => appendMessage(mapMessage(m)))
        .catch(() => setError('메시지 전송에 실패했어요.'));
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            onPress={onBack}
            style={({ pressed }) => [styles.backTag, pressed && styles.pressed]}>
            <Text style={styles.backTagText}>{'< 뒤로'}</Text>
          </Pressable>
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
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.actionRow}>
                {busy ? (
                  <ActivityIndicator
                    color={theme.colors.primary}
                    style={styles.primaryAction}
                  />
                ) : (
                  <AppButton
                    label={mode === 'create' ? '큐 생성하기' : '큐 조인'}
                    onPress={handlePrimaryAction}
                    variant="accent"
                    style={styles.primaryAction}
                  />
                )}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.panelKicker}>
                채팅방 · {waitingCount}명 대기 중
              </Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.messages}>
                {messages.map(message => (
                  <View
                    key={message.id}
                    style={[
                      styles.message,
                      message.sender === 'me' && styles.myMessage,
                      message.sender === 'system' && styles.systemMessage,
                    ]}>
                    <Text
                      style={[
                        styles.messageText,
                        message.sender === 'me' && styles.myMessageText,
                        message.sender === 'system' && styles.systemMessageText,
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
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
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
  backTag: {
    minHeight: 30,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(15, 76, 207, 0.08)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  backTagText: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  error: {
    color: '#D92D20',
    fontSize: theme.typography.caption,
    fontWeight: '700',
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
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  messageText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  myMessageText: {
    color: theme.colors.surface,
  },
  systemMessageText: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    fontWeight: '700',
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
