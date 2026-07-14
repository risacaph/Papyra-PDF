import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Checkbox,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Button } from "@app/ui/Button";
import { StirlingFile } from "@app/types/fileContext";
import { extractErrorMessage } from "@app/utils/toolErrorHandler";
import {
  AccessibilityAudit,
  fetchAccessibilityAudit,
} from "@app/hooks/tools/accessibility/useAccessibilityOperation";
import { AccessibilityParameters } from "@app/hooks/tools/accessibility/useAccessibilityParameters";

interface AccessibilitySettingsProps {
  parameters: AccessibilityParameters;
  onParameterChange: <K extends keyof AccessibilityParameters>(
    key: K,
    value: AccessibilityParameters[K],
  ) => void;
  selectedFiles: StirlingFile[];
  disabled?: boolean;
}

interface CheckRow {
  label: string;
  passed: boolean;
  detail?: string;
}

const AccessibilitySettings = ({
  parameters,
  onParameterChange,
  selectedFiles,
  disabled = false,
}: AccessibilitySettingsProps) => {
  const { t } = useTranslation();

  const [report, setReport] = useState<AccessibilityAudit | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Clear a stale report when the selected file changes.
  const selectionSignature = selectedFiles.map((file) => file.fileId).join(",");
  useEffect(() => {
    setReport(null);
    setAuditError(null);
  }, [selectionSignature]);

  const file = selectedFiles[0] ?? null;

  const runAudit = useCallback(async () => {
    if (!file) return;
    setIsAuditing(true);
    setAuditError(null);
    try {
      const audit = await fetchAccessibilityAudit(file);
      setReport(audit);
      if (!parameters.title.trim() && audit.title) {
        onParameterChange("title", audit.title);
      }
      if (!parameters.language.trim() && audit.language) {
        onParameterChange("language", audit.language);
      }
    } catch (error) {
      setAuditError(extractErrorMessage(error));
    } finally {
      setIsAuditing(false);
    }
  }, [file, onParameterChange, parameters.language, parameters.title]);

  const checkRows: CheckRow[] = report
    ? [
        {
          label: t("accessibility.check.title", "Document title"),
          passed: Boolean(report.title && report.title.trim()),
          detail: report.title ?? undefined,
        },
        {
          label: t("accessibility.check.language", "Document language"),
          passed: Boolean(report.language && report.language.trim()),
          detail: report.language ?? undefined,
        },
        {
          label: t("accessibility.check.displayDocTitle", "Window shows title"),
          passed: report.displayDocTitle,
        },
        {
          label: t("accessibility.check.tagged", "Tagged (structure tree)"),
          passed: report.tagged,
          detail: report.tagged
            ? undefined
            : t(
                "accessibility.check.taggedHint",
                "Tagging content requires the source document; it cannot be added automatically.",
              ),
        },
        {
          label: t("accessibility.check.marked", "Marked as tagged PDF"),
          passed: report.marked,
        },
        {
          label: t(
            "accessibility.check.extraction",
            "Screen-reader text extraction allowed",
          ),
          passed: report.accessibilityExtractionAllowed,
          detail: report.encrypted
            ? t(
                "accessibility.check.extractionHint",
                "Controlled by the document's permission settings.",
              )
            : undefined,
        },
      ]
    : [];

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        {t(
          "accessibility.settings.note",
          "Check a document's accessibility properties and fix the document-level ones: title, language, and how it presents to screen readers.",
        )}
      </Text>

      <Button
        variant="secondary"
        onClick={() => void runAudit()}
        loading={isAuditing}
        disabled={disabled || !file}
      >
        {t("accessibility.settings.runCheck", "Run accessibility check")}
      </Button>

      {auditError && (
        <Alert color="red" variant="light">
          <Text size="sm">{auditError}</Text>
        </Alert>
      )}

      {report && (
        <Stack gap="xs">
          {checkRows.map((row) => (
            <Paper key={row.label} p="xs" radius="sm" withBorder>
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon
                  color={row.passed ? "teal" : "red"}
                  variant="light"
                  size="md"
                  radius="xl"
                >
                  {row.passed ? (
                    <CheckIcon style={{ fontSize: "1rem" }} />
                  ) : (
                    <CloseIcon style={{ fontSize: "1rem" }} />
                  )}
                </ThemeIcon>
                <Stack gap={0} style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600}>
                    {row.label}
                  </Text>
                  {row.detail && (
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {row.detail}
                    </Text>
                  )}
                </Stack>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}

      <Divider
        label={t("accessibility.settings.fixes", "Fixes to apply")}
        labelPosition="left"
      />

      <TextInput
        label={t("accessibility.settings.titleField", "Document title")}
        description={t(
          "accessibility.settings.titleHint",
          "Leave blank to keep the current title.",
        )}
        value={parameters.title}
        onChange={(e) => onParameterChange("title", e.currentTarget.value)}
        disabled={disabled}
      />

      <TextInput
        label={t("accessibility.settings.languageField", "Document language")}
        description={t(
          "accessibility.settings.languageHint",
          "IETF language tag, e.g. en-US. Leave blank to keep the current language.",
        )}
        placeholder="en-US"
        value={parameters.language}
        onChange={(e) => onParameterChange("language", e.currentTarget.value)}
        disabled={disabled}
      />

      <Checkbox
        label={t(
          "accessibility.settings.displayDocTitle",
          "Show the document title in the window title bar",
        )}
        checked={parameters.setDisplayDocTitle}
        onChange={(e) =>
          onParameterChange("setDisplayDocTitle", e.currentTarget.checked)
        }
        disabled={disabled}
      />

      <Checkbox
        label={t(
          "accessibility.settings.structureTabOrder",
          "Set page tab order to follow the document structure",
        )}
        checked={parameters.setStructureTabOrder}
        onChange={(e) =>
          onParameterChange("setStructureTabOrder", e.currentTarget.checked)
        }
        disabled={disabled}
      />
    </Stack>
  );
};

export default AccessibilitySettings;
