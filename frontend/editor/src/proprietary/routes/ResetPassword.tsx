import { useState, useEffect } from "react";
import { isAxiosError } from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Stack, Text, Center, Loader, PasswordInput } from "@mantine/core";
import { useDocumentMeta } from "@app/hooks/useDocumentMeta";
import AuthLayout from "@app/routes/authShared/AuthLayout";
import LoginHeader from "@app/routes/login/LoginHeader";
import ErrorMessage from "@app/auth/ui/ErrorMessage";
import apiClient from "@app/services/apiClient";
import { Button } from "@app/ui/Button";

/**
 * Public "reset password" page reached from the emailed link (/reset-password?token=...). It
 * validates the token on mount, then lets the user set a new password. On success it redirects to
 * the login page, which shows the "password changed" banner.
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useDocumentMeta({
    title: `${t("login.updatePassword", "Update password")} - Papyra`,
  });

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const res = await apiClient.get<{ valid: boolean }>(
          `/api/v1/user/reset-password/validate/${token}`,
          { suppressErrorToast: true },
        );
        setTokenValid(res.data?.valid === true);
      } catch {
        setTokenValid(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError(t("login.passwordRequired", "Please enter a new password."));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("login.passwordMismatch", "Passwords do not match."));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(
        "/api/v1/user/reset-password",
        { token, newPassword: password },
        { suppressErrorToast: true },
      );
      navigate("/login?messageType=passwordChanged");
    } catch (err: unknown) {
      const message = isAxiosError(err)
        ? err.response?.data?.error || err.message
        : t("login.passwordResetError", "Unable to reset your password.");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthLayout>
        <LoginHeader title={t("login.updatePassword", "Update password")} />
        <Center py="xl">
          <Loader size="md" />
        </Center>
      </AuthLayout>
    );
  }

  if (!tokenValid) {
    return (
      <AuthLayout>
        <LoginHeader
          title={t("login.resetInvalidTitle", "Invalid or expired link")}
        />
        <Text size="sm" c="dimmed" ta="center" mb="lg">
          {t(
            "login.resetInvalidBody",
            "This password reset link is invalid or has expired. Please request a new one.",
          )}
        </Text>
        <div className="auth-section">
          <Button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="w-full px-4 py-[0.75rem] rounded-[0.625rem] text-base font-semibold cursor-pointer border-0 auth-cta-button"
          >
            {t("login.sendResetLink", "Send reset link")}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <LoginHeader
        title={t("login.updatePassword", "Update password")}
        subtitle={t(
          "login.resetChooseNew",
          "Choose a new password for your account.",
        )}
      />

      <ErrorMessage error={error} />

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <PasswordInput
            label={t("login.newPassword", "New password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login.newPassword", "New password")}
            disabled={submitting}
            required
            autoComplete="new-password"
          />
          <PasswordInput
            label={t("login.confirmNewPassword", "Confirm new password")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("login.confirmNewPassword", "Confirm new password")}
            disabled={submitting}
            required
            autoComplete="new-password"
          />
          <div className="auth-section">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-[0.75rem] rounded-[0.625rem] text-base font-semibold cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed auth-cta-button"
            >
              {submitting
                ? t("loading", "Loading...")
                : t("login.updatePassword", "Update password")}
            </Button>
          </div>
        </Stack>
      </form>
    </AuthLayout>
  );
}
