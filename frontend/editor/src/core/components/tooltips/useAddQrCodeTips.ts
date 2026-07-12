import { useTranslation } from "react-i18next";
import { TooltipContent } from "@app/types/tips";

export const useAddQrCodeTips = (): TooltipContent => {
  const { t } = useTranslation();

  return {
    header: {
      title: t("addQrCode.tooltip.header.title", "Add QR Code Overview"),
    },
    tips: [
      {
        title: t("addQrCode.tooltip.description.title", "Description"),
        description: t(
          "addQrCode.tooltip.description.text",
          "Generate a QR code from any text or URL and stamp it onto the PDF. The code is created locally, so nothing is sent to a third-party service.",
        ),
      },
      {
        title: t("addQrCode.tooltip.placement.title", "Placement"),
        description: t(
          "addQrCode.tooltip.placement.text",
          "Choose one of nine positions and a size in points. The code is added to every selected page, leaving existing content untouched.",
        ),
      },
      {
        title: t("addQrCode.tooltip.uses.title", "Common uses"),
        description: t(
          "addQrCode.tooltip.uses.text",
          "Link to a website, encode a document reference, or add contact details that can be scanned from a printed page.",
        ),
      },
    ],
  };
};
