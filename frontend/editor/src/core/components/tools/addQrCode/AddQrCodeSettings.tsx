import { NumberInput, Select, Stack, Text, TextInput } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { AddQrCodeParameters } from "@app/hooks/tools/addQrCode/useAddQrCodeParameters";

interface AddQrCodeSettingsProps {
  parameters: AddQrCodeParameters;
  onParameterChange: <K extends keyof AddQrCodeParameters>(
    key: K,
    value: AddQrCodeParameters[K],
  ) => void;
  disabled?: boolean;
}

const AddQrCodeSettings = ({
  parameters,
  onParameterChange,
  disabled = false,
}: AddQrCodeSettingsProps) => {
  const { t } = useTranslation();

  const positionOptions = [
    {
      value: "1",
      label: t("addQrCode.settings.positions.topLeft", "Top left"),
    },
    {
      value: "2",
      label: t("addQrCode.settings.positions.topCenter", "Top center"),
    },
    {
      value: "3",
      label: t("addQrCode.settings.positions.topRight", "Top right"),
    },
    {
      value: "4",
      label: t("addQrCode.settings.positions.middleLeft", "Middle left"),
    },
    {
      value: "5",
      label: t("addQrCode.settings.positions.middleCenter", "Middle center"),
    },
    {
      value: "6",
      label: t("addQrCode.settings.positions.middleRight", "Middle right"),
    },
    {
      value: "7",
      label: t("addQrCode.settings.positions.bottomLeft", "Bottom left"),
    },
    {
      value: "8",
      label: t("addQrCode.settings.positions.bottomCenter", "Bottom center"),
    },
    {
      value: "9",
      label: t("addQrCode.settings.positions.bottomRight", "Bottom right"),
    },
  ];

  return (
    <Stack gap="md">
      <TextInput
        label={t("addQrCode.settings.contentLabel", "Text or URL")}
        description={t(
          "addQrCode.settings.contentDescription",
          "The text or link to encode in the QR code.",
        )}
        value={parameters.content}
        onChange={(event) =>
          onParameterChange("content", event.currentTarget.value)
        }
        disabled={disabled}
        placeholder="https://example.com"
      />

      <Select
        label={t("addQrCode.settings.positionLabel", "Position")}
        data={positionOptions}
        value={String(parameters.position)}
        onChange={(value) =>
          onParameterChange(
            "position",
            value ? Number(value) : parameters.position,
          )
        }
        disabled={disabled}
        allowDeselect={false}
      />

      <NumberInput
        label={t("addQrCode.settings.sizeLabel", "Size (points)")}
        description={t(
          "addQrCode.settings.sizeDescription",
          "Width and height of the QR code square on the page.",
        )}
        value={parameters.size}
        onChange={(value) =>
          onParameterChange(
            "size",
            value != null && value !== "" ? Number(value) : parameters.size,
          )
        }
        disabled={disabled}
        min={20}
        max={1000}
        step={10}
      />

      <TextInput
        label={t("addQrCode.settings.pagesLabel", "Pages")}
        description={t(
          "addQrCode.settings.pagesDescription",
          "Which pages to stamp. Use 'all', a list, or ranges (e.g. 1,3,5-9).",
        )}
        value={parameters.pageNumbers}
        onChange={(event) =>
          onParameterChange("pageNumbers", event.currentTarget.value)
        }
        disabled={disabled}
        placeholder="all"
      />

      <Text size="sm" c="dimmed">
        {t(
          "addQrCode.settings.note",
          "The QR code is generated locally and stamped onto every selected page.",
        )}
      </Text>
    </Stack>
  );
};

export default AddQrCodeSettings;
