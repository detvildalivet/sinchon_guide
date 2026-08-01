import React, { useState } from 'react';
import {
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
import { MAX_LENGTH, MIN_LENGTH, checkPassword, passwordError } from '../utils/password';

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
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [realName, setRealName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [nickname, setNickname] = useState('');

  const isSignup = mode === 'signup';
  const passwordChecks = checkPassword(password);

  const validate = (): string | null => {
    if (!email.includes('@')) {
      return '올바른 이메일을 입력하십시오.';
    }
    if (isSignup) {
      const pwError = passwordError(password);
      if (pwError) {
        return pwError;
      }
      if (realName.trim().length === 0) {
        return '이름을 입력하십시오.';
      }
      if (!DATE_RE.test(birthDate)) {
        return '생년월일을 YYYY-MM-DD 형식으로 입력하십시오.';
      }
      if (nickname.trim().length < 2 || nickname.trim().length > 20) {
        return '닉네임은 2~20자로 입력하십시오.';
      }
    } else if (password.length === 0) {
      // Login only needs a non-empty password — accounts created before
      // this policy existed (e.g. plain lowercase) must keep working.
      return '비밀번호를 입력하십시오.';
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
    setPasswordTouched(false);
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
            onChangeText={text => {
              setPassword(text);
              setPasswordTouched(true);
            }}
            placeholder={`${MIN_LENGTH}~${MAX_LENGTH}자, 영문·숫자·기호 중 2종 이상`}
            secureTextEntry
            autoCapitalize="none"
          />
          {isSignup && passwordTouched ? (
            <View style={styles.passwordChecklist}>
              <ChecklistItem
                ok={passwordChecks.length}
                label={`${MIN_LENGTH}자 이상 ${MAX_LENGTH}자 이하`}
              />
              <ChecklistItem
                ok={passwordChecks.variety}
                label="영문·숫자·기호 중 2종 이상"
              />
            </View>
          ) : null}
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
          <AppButton
            label={isSignup ? '회원가입' : '로그인'}
            onPress={submit}
            loading={submitting}
          />
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

type ChecklistItemProps = { ok: boolean; label: string };

// One row of the live signup password checklist — ✓ green once satisfied,
// ○ muted while not. See src/utils/password.ts for the underlying rule.
function ChecklistItem({ ok, label }: ChecklistItemProps) {
  return (
    <View style={styles.checklistRow}>
      <Text style={[styles.checklistGlyph, ok && styles.checklistGlyphOk]}>
        {ok ? '✓' : '○'}
      </Text>
      <Text style={[styles.checklistLabel, ok && styles.checklistLabelOk]}>
        {label}
      </Text>
    </View>
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
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  title: {
    ...theme.text.display,
    color: theme.colors.text,
  },
  form: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  field: {
    gap: theme.spacing.xs,
  },
  fieldLabel: {
    ...theme.text.label,
    color: theme.colors.text,
  },
  input: {
    minHeight: 50,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
    ...theme.text.body,
  },
  error: {
    ...theme.text.caption,
    color: theme.colors.danger,
  },
  passwordChecklist: {
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  checklistGlyph: {
    ...theme.text.label,
    color: theme.colors.subtle,
  },
  checklistGlyphOk: {
    color: theme.colors.success,
  },
  checklistLabel: {
    ...theme.text.caption,
    color: theme.colors.muted,
  },
  checklistLabelOk: {
    color: theme.colors.success,
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
    ...theme.text.label,
    color: theme.colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
});
