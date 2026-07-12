import { useTranslation } from "react-i18next";
import { TooltipContent } from "@app/types/tips";

export const useGrayscaleTips = (): TooltipContent => {
  const { t } = useTranslation();

  return {
    header: {
      title: t(
        "grayscale.tooltip.header.title",
        "Grayscale / Ink-Saver Overview",
      ),
    },
    tips: [
      {
        title: t("grayscale.tooltip.description.title", "Description"),
        description: t(
          "grayscale.tooltip.description.text",
          "Convert a colour PDF into a grayscale document. Each page is rasterised and rebuilt as a single grayscale image, so colour is removed everywhere it appears.",
        ),
      },
      {
        title: t("grayscale.tooltip.inkSaver.title", "Ink Saver"),
        description: t(
          "grayscale.tooltip.inkSaver.text",
          "Removing colour reduces the coloured ink or toner used when printing, which is useful for drafts and internal copies.",
        ),
      },
      {
        title: t("grayscale.tooltip.dpi.title", "Resolution (DPI)"),
        description: t(
          "grayscale.tooltip.dpi.text",
          "Controls how sharply each page is rendered. Higher values keep more detail but produce larger files and take longer to process.",
        ),
      },
    ],
  };
};
