import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { theme } from '../design/theme';
import { useAuth } from '../auth/AuthContext';

type Mode = 'login' | 'signup';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Strip non-digits, cap at 8 (YYYYMMDD), re-join with hyphens so the user
// never has to type '-' themselves and DATE_RE always sees YYYY-MM-DD.
// Backspace-safe: deleting a digit next to a hyphen just reformats whatever
// digits remain, rather than getting stuck on the hyphen.
function formatBirthDate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)];
  return parts.filter(Boolean).join('-');
}

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [nickname, setNickname] = useState('');

  const isSignup = mode === 'signup';

  const validate = (): string | null => {
    if (!email.includes('@')) {
      return '올바른 이메일을 입력하십시오.';
    }
    if (password.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다.';
    }
    if (isSignup) {
      if (realName.trim().length === 0) {
        return '이름을 입력하십시오.';
      }
      if (!DATE_RE.test(birthDate)) {
        return '생년월일을 YYYY-MM-DD 형식으로 입력하십시오.';
      }
      if (nickname.trim().length < 2 || nickname.trim().length > 20) {
        return '닉네임은 2~20자로 입력하십시오.';
      }
    }
    return null;
  };

  const submit = async () => {
    if (submitting) {
      return;
    }
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (isSignup) {
        await signup({
          email: email.trim(),
          password,
          real_name: realName.trim(),
          birth_date: birthDate,
          nickname: nickname.trim(),
        });
      } else {
        await login(email.trim(), password);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '요청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setError(null);
    setMode(isSignup ? 'login' : 'signup');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + theme.spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Sinchon Guide</Text>
        <Text style={styles.title}>
          {isSignup ? '회원가입' : '로그인'}
        </Text>
        <Text style={styles.subtitle}>
          {isSignup
            ? '주변 장소 추천과 길안내를 이용하려면 가입하십시오.'
            : '다시 오셨습니다. 계정으로 로그인하십시오.'}
        </Text>

        <View style={styles.form}>
          <Field
            label="이메일"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            placeholder="8자 이상"
            secureTextEntry
            autoCapitalize="none"
          />
          {isSignup ? (
            <>
              <Field
                label="이름"
                value={realName}
                onChangeText={setRealName}
                placeholder="홍길동"
              />
              <Field
                label="생년월일"
                value={birthDate}
                onChangeText={value => setBirthDate(formatBirthDate(value))}
                placeholder="YYYY-MM-DD"
                keyboardType="number-pad"
                maxLength={10}
                autoCapitalize="none"
              />
              <Field
                label="닉네임"
                value={nickname}
                onChangeText={setNickname}
                placeholder="2~20자"
                autoCapitalize="none"
              />
            </>
          ) : null}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          {submitting ? (
            <ActivityIndicator color={theme.colors.primary} size="large" />
          ) : (
            <AppButton
              label={isSignup ? '회원가입' : '로그인'}
              onPress={submit}
              variant="accent"
            />
          )}
          <Pressable
            accessibilityRole="button"
            onPress={toggleMode}
            disabled={submitting}
            style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
            <Text style={styles.toggleText}>
              {isSignup
                ? '이미 계정이 있으십니까? 로그인'
                : '계정이 없으십니까? 회원가입'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string };

function Field({ label, ...inputProps }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={theme.colors.muted}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  brand: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.title,
    fontWeight: '900',
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  form: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  field: {
    gap: theme.spacing.xs,
  },
  fieldLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  input: {
    minHeight: 52,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.body,
  },
  error: {
    color: '#D92D20',
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  actions: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  toggle: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  toggleText: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
