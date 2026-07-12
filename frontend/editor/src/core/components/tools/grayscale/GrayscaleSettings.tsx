import { Stack, Text, NumberInput } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { GrayscaleParameters } from "@app/hooks/tools/grayscale/useGrayscaleParameters";

interface GrayscaleSettingsProps {
  parameters: GrayscaleParameters;
  onParameterChange: <K extends keyof GrayscaleParameters>(
    key: K,
    value: GrayscaleParameters[K],
  ) => void;
  disabled?: boolean;
}

const GrayscaleSettings = ({
  parameters,
  onParameterChange,
  disabled = false,
}: GrayscaleSettingsProps) => {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        {t(
          "grayscale.settings.note",
          "Every page is rasterised and rebuilt in grayscale, removing colour to save ink when printing.",
        )}
      </Text>

      <NumberInput
        label={t("grayscale.settings.dpiLabel", "Resolution (DPI)")}
        description={t(
          "grayscale.settings.dpiDescription",
          "Higher DPI sharpens output but increases processing time and file size.",
        )}
        value={parameters.dpi}
        onChange={(value) =>
          onParameterChange(
            "dpi",
            value != null && value !== "" ? Number(value) : parameters.dpi,
          )
        }
        disabled={disabled}
        min={72}
        max={600}
        step={50}
      />
    </Stack>
  );
};

export default GrayscaleSettings;
