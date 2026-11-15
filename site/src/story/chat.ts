// 猪猪生活本 is a household notebook, not a chat or agent product. Keep the conversation
// panel closed in every scene; the real phone screens are the protagonists.

import type { SceneChat } from "../engine/AgentPanel.tsx";

const EMPTY: SceneChat = { label: "", open: null, rows: [] };

export const STORY_CHATS: readonly SceneChat[] = [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY];
