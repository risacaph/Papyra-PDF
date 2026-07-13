import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Stack, Text, TextInput, Center, Anchor } from "@mantine/core";
import { useDocumentMeta } from "@app/hooks/useDocumentMeta";
import AuthLayout from "@app/routes/authShared/AuthLayout";
import LoginHeader from "@app/routes/login/LoginHeader";
import ErrorMessage from "@app/auth/ui/ErrorMessage";
import apiClient from "@app/services/apiClient";
import { Button } from "@app/ui/Button";

/**
 * Public "forgot password" page: collects an email and asks the backend to send a reset link. The
 * backend always responds generically (it never reveals whether the account exists), so this page
 * shows the same confirmation regardless of the outcome.
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useDocumentMeta({
    title: `${t("login.resetYourPassword", "Reset your password")} - Papyra`,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError(t("login.invalidEmail", "Enter a valid email address."));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(
        "/api/v1/user/forgot-password",
        { email: email.trim().toLowerCase() },
        { suppressErrorToast: true },
      );
    } catch {
      // Deliberately ignored: the response is generic by design, so a failure here
      // must not reveal anything either. Always show the same confirmation.
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthLayout>
        <LoginHeader
          title={t("login.resetLinkSentTitle", "Check your email")}
        />
        <Text size="sm" c="dimmed" ta="center">
          {t(
            "login.resetLinkSentBody",
            "If an account with that email exists, we've sent a link to reset your password.",
          )}
        </Text>
        <Center mt="lg">
          <Anchor
            component="button"
            type="button"
            onClick={() => navigate("/login")}
            c="dark"
          >
            {t("login.backToSignIn", "Back to sign in")}
          </Anchor>
        </Center>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <LoginHeader
        title={t("login.resetYourPassword", "Reset your password")}
        subtitle={t(
          "login.resetHelp",
          "Enter your email to receive a secure link to reset your password.",
        )}
      />

      <ErrorMessage error={error} />

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label={t("login.email", "Email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login.enterEmail", "Enter your email")}
            disabled={submitting}
            required
            autoComplete="email"
          />
          <div className="auth-section">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-[0.75rem] rounded-[0.625rem] text-base font-semibold cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed auth-cta-button"
            >
              {submitting
                ? t("loading", "Loading...")
                : t("login.sendResetLink", "Send reset link")}
            </Button>
          </div>
        </Stack>
      </form>

      <Center mt="md">
        <Text size="sm" c="dimmed">
          <Anchor
            component="button"
            type="button"
            onClick={() => navigate("/login")}
            c="dark"
          >
            {t("login.backToSignIn", "Back to sign in")}
          </Anchor>
        </Text>
      </Center>
    </AuthLayout>
  );
}
