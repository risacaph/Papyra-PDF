import { List, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { LinkEditorParameters } from "@app/hooks/tools/linkEditor/useLinkEditorParameters";

interface LinkEditorSettingsProps {
  parameters: LinkEditorParameters;
}

const LinkEditorSettings = ({ parameters }: LinkEditorSettingsProps) => {
  const { t } = useTranslation();

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        {t(
          "linkEditor.settings.note",
          "Add or remove hyperlinks in a PDF. Use the workspace to draw new link areas on the page or select existing links to remove them.",
        )}
      </Text>
      <List size="xs" c="dimmed" spacing={2}>
        <List.Item>
          {t(
            "linkEditor.settings.step1",
            'Click "Add link" in the workspace toolbar, then draw a box over the text or image to link.',
          )}
        </List.Item>
        <List.Item>
          {t(
            "linkEditor.settings.step2",
            "Point the link at a web address or another page of the document.",
          )}
        </List.Item>
        <List.Item>
          {t(
            "linkEditor.settings.step3",
            "Select an existing (dashed) link to remove or restore it.",
          )}
        </List.Item>
      </List>
      <Text size="xs" c="dimmed">
        {t(
          "linkEditor.settings.summary",
          "{{added}} link(s) to add, {{removed}} to remove.",
          {
            added: parameters.additions.length,
            removed: parameters.removals.length,
          },
        )}
      </Text>
    </Stack>
  );
};

export default LinkEditorSettings;
