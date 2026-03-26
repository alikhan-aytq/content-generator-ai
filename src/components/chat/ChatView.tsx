import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ModelId } from "@/components/SettingsPanel";
import ChatMessage from "./ChatMessage";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

interface Props {
  model: ModelId;
  conversations: Conversation[];
  activeConversationId: string | null;
  resetToken: number;
  onConversationsChange: (convs: Conversation[]) => void;
}

export default function ChatView({
  model,
  conversations,
  activeConversationId,
  resetToken,
  onConversationsChange,
}: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeConversationId === null) {
      setMessages([]);
      setCurrentConvId(null);
      return;
    }

    const selected = conversations.find((conv) => conv.id === activeConversationId);
    if (selected) {
      setMessages(selected.messages);
      setCurrentConvId(selected.id);
    }
  }, [activeConversationId, conversations, resetToken]);

  const saveConversation = async (msgs: Message[]) => {
    if (!user) return null;
    const title = msgs[0]?.content.slice(0, 40) + (msgs[0]?.content.length > 40 ? "..." : "");
    const serialized = JSON.stringify(msgs);

    if (currentConvId) {
      await supabase
        .from("generation_history")
        .update({ generated_content: serialized, prompt: msgs[0]?.content || "" })
        .eq("id", currentConvId);
      onConversationsChange(
        conversations.map((c) =>
          c.id === currentConvId ? { ...c, title, messages: msgs } : c
        )
      );
      return currentConvId;
    } else {
      const { data, error } = await supabase
        .from("generation_history")
        .insert({
          user_id: user.id,
          prompt: msgs[0]?.content || "",
          content_type: "chat",
          model,
          generated_content: serialized,
        })
        .select()
        .single();
      if (!error && data) {
        const newConv: Conversation = {
          id: data.id,
          title,
          date: new Date(data.created_at).toLocaleDateString("en-US"),
          messages: msgs,
        };
        onConversationsChange([newConv, ...conversations].slice(0, 20));
        setCurrentConvId(data.id);
        return data.id;
      }
      return null;
    }
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    if (!user) {
      toast.error("Please sign in to use AI chat");
      return;
    }

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantContent = "";

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error("Session expired. Please sign in again.");
      }

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          model,
        }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => "Unknown error");
        if (resp.status === 401) {
          throw new Error("Failed to start stream (401). Please sign in again.");
        }
        throw new Error(`Stream error (${resp.status}): ${errText}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {}
        }
      }

      const finalMessages = [...newMessages, { role: "assistant" as const, content: assistantContent }];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
    } catch (err: any) {
      if (err.name === "AbortError") {
        const finalMessages = [
          ...newMessages,
          ...(assistantContent ? [{ role: "assistant" as const, content: assistantContent }] : []),
        ];
        setMessages(finalMessages);
        if (assistantContent) await saveConversation(finalMessages);
      } else {
        toast.error(err.message || "Chat error");
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, messages, model, currentConvId, conversations, user]);

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm">Ask me to help you create any type of content</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t bg-card p-4">
        <div className="mx-auto max-w-3xl flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[48px] max-h-[160px] resize-none"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button variant="destructive" size="icon" onClick={handleStop} className="shrink-0 h-12 w-12">
              <Square size={16} />
            </Button>
          ) : (
            <Button size="icon" onClick={handleSend} disabled={!input.trim()} className="shrink-0 h-12 w-12">
              <Send size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
