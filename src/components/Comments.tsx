import { useState } from "react";
import {
  Button,
  Group,
  Stack,
  Text,
  Textarea,
  FileButton,
  Anchor,
} from "@mantine/core";
import { MessageSquare, Paperclip, Send } from "lucide-react";
import { notifications } from "@mantine/notifications";
import { useApp } from "../lib/i18n";
import { useSave } from "../lib/store";
import {
  uid,
  today,
  type Comment,
  type Database,
  type Attachment,
} from "../lib/types";
import { Initials } from "./ui";
export async function readAttachment(file: File): Promise<Attachment> {
  if (file.size > 1_000_000) throw new Error("size");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, url: String(reader.result) });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
export function Comments({
  comments,
  entity,
  id,
  db,
  attachments,
}: {
  comments: Comment[];
  entity: "tasks" | "processes";
  id: string;
  db: Database;
  attachments?: Attachment[];
}) {
  const { t, personId } = useApp();
  const [text, setText] = useState("");
  const save = useSave();
  const add = () => {
    if (!text.trim()) return;
    save.mutate(
      (d) => ({
        ...d,
        [entity]: d[entity].map((x) =>
          x.id === id
            ? {
                ...x,
                comments: [
                  ...x.comments,
                  { id: uid(), personId, text: text.trim(), date: today },
                ],
              }
            : x,
        ),
      }),
      { onSuccess: () => setText("") },
    );
  };
  return (
    <Stack gap="md">
      <Group gap={8}>
        <MessageSquare size={17} />
        <Text fw={500}>
          {t("Komentarai ir priedai", "Comments & attachments")}
        </Text>
      </Group>
      {comments.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t(
            "Komentarų dar nėra. Pradėkite pokalbį su komanda.",
            "No comments yet. Start a conversation with your team.",
          )}
        </Text>
      ) : (
        comments.map((c) => {
          const p = db.people.find((p) => p.id === c.personId);
          return (
            <Group align="flex-start" key={c.id} wrap="nowrap">
              <Initials name={p?.name || "SR"} />
              <div>
                <Group gap="sm">
                  <Text fw={500} size="sm">
                    {p?.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {c.date}
                  </Text>
                </Group>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {c.text}
                </Text>
              </div>
            </Group>
          );
        })
      )}
      <Textarea
        label={t("Naujas komentaras", "New comment")}
        placeholder={t("Pasidalinkite informacija…", "Share an update…")}
        value={text}
        onChange={(e) => setText(e.target.value)}
        autosize
        minRows={2}
      />
      <Group justify="space-between">
        {entity === "tasks" ? (
          <FileButton
            accept="image/*,.pdf,.docx,.xlsx,.txt"
            onChange={async (file) => {
              if (!file) return;
              try {
                const attachment = await readAttachment(file);
                save.mutate((d) => ({
                  ...d,
                  tasks: d.tasks.map((x) =>
                    x.id === id
                      ? { ...x, attachments: [...x.attachments, attachment] }
                      : x,
                  ),
                }));
              } catch {
                notifications.show({
                  message: t(
                    "Failas per didelis. Didžiausias dydis – 1 MB.",
                    "The file is too large. Maximum size is 1 MB.",
                  ),
                  color: "red",
                });
              }
            }}
          >
            {(props) => (
              <Button
                {...props}
                variant="subtle"
                leftSection={<Paperclip size={15} />}
              >
                {t("Pridėti failą / nuotrauką", "Add file / photo")}
              </Button>
            )}
          </FileButton>
        ) : (
          <span />
        )}
        <Button
          size="xs"
          leftSection={<Send size={14} />}
          onClick={add}
          disabled={!text.trim()}
        >
          {t("Komentuoti", "Comment")}
        </Button>
      </Group>
      {attachments?.map((a, i) => (
        <Group key={i} justify="space-between">
          <Anchor href={a.url} download={a.name} size="sm">
            {a.name}
          </Anchor>
          <Button
            size="compact-xs"
            color="red"
            variant="subtle"
            onClick={() =>
              save.mutate((d) => ({
                ...d,
                tasks: d.tasks.map((x) =>
                  x.id === id
                    ? {
                        ...x,
                        attachments: x.attachments.filter((_, j) => j !== i),
                      }
                    : x,
                ),
              }))
            }
          >
            {t("Pašalinti", "Remove")}
          </Button>
        </Group>
      ))}
    </Stack>
  );
}
