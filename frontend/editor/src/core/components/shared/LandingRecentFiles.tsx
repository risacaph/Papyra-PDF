import { useEffect, useState } from "react";
import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Button } from "@app/ui/Button";
import DocumentThumbnail from "@app/components/shared/filePreview/DocumentThumbnail";
import { fileStorage } from "@app/services/fileStorage";
import { useFilesModalContext } from "@app/contexts/FilesModalContext";
import { StirlingFileStub } from "@app/types/fileContext";

const MAX_RECENT = 6;

/**
 * A compact strip of the user's most recently worked-on documents, shown on the empty landing
 * screen so they can jump straight back in. Renders nothing until (or unless) there is stored
 * history, keeping a fresh install's landing screen clean. Recency uses the same lastModified
 * ordering as the Files modal / My Files page, and reopening reuses the canonical
 * onRecentFileSelect flow so version history and metadata are preserved.
 */
export function LandingRecentFiles() {
  const { t } = useTranslation();
  const { onRecentFileSelect, openFilesModal } = useFilesModalContext();
  const [recents, setRecents] = useState<StirlingFileStub[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stubs = await fileStorage.getLeafStirlingFileStubs();
        const sorted = [...stubs]
          .sort((a, b) => b.lastModified - a.lastModified)
          .slice(0, MAX_RECENT);
        if (!cancelled) {
          setRecents(sorted);
        }
      } catch {
        if (!cancelled) {
          setRecents([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (recents.length === 0) {
    return null;
  }

  const openStub = (stub: StirlingFileStub) => {
    onRecentFileSelect([stub]);
  };

  return (
    <Stack gap="sm" className="landing-recent" w="100%" maw="52rem" mt="xl">
      <Group justify="space-between" align="center">
        <Text fw={600} size="sm">
          {t("landing.recentFiles.title", "Recent files")}
        </Text>
        <Button variant="quiet" size="sm" onClick={() => openFilesModal()}>
          {t("landing.recentFiles.seeAll", "See all")}
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 2, xs: 3, sm: 6 }} spacing="sm">
        {recents.map((stub) => (
          <div
            key={stub.id}
            role="button"
            tabIndex={0}
            className="landing-recent__card"
            onClick={() => openStub(stub)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openStub(stub);
              }
            }}
            title={stub.name}
          >
            <Paper
              withBorder
              radius="md"
              p={4}
              className="landing-recent__thumb"
            >
              <DocumentThumbnail
                file={stub}
                thumbnail={stub.thumbnailUrl}
                iconSize="2rem"
              />
            </Paper>
            <Text size="xs" mt={4} lineClamp={1} ta="center">
              {stub.name}
            </Text>
          </div>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export default LandingRecentFiles;
