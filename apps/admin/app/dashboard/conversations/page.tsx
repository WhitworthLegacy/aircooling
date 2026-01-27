"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Loader2, Send, User, RefreshCw, AlertCircle } from 'lucide-react';
import { Button, Card, Input, useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { getConversationsToken } from '@/lib/conversations';
import type { Client as TwilioClient } from '@twilio/conversations';
import type { Conversation, Message, Paginator } from '@twilio/conversations';

type ConversationItem = {
  sid: string;
  friendlyName: string | null;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
};

type MessageItem = {
  sid: string;
  author: string | null;
  body: string | null;
  dateCreated: Date | null;
  isAdmin: boolean;
};

export default function ConversationsPage() {
  const [client, setClient] = useState<TwilioClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState<string | null>(null);

  // Conversations list
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Selected conversation
  const [selectedSid, setSelectedSid] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Composer
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Initialize Twilio client
  const initClient = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const tokenRes = await getConversationsToken();
      if (!tokenRes.ok || !tokenRes.token) {
        throw new Error(tokenRes.error || 'Failed to get token');
      }

      setIdentity(tokenRes.identity || null);

      const { Client } = await import('@twilio/conversations');
      const twilioClient = await Client.create(tokenRes.token);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 15000);

        if (twilioClient.connectionState === 'connected') {
          clearTimeout(timeout);
          resolve();
          return;
        }

        twilioClient.on('stateChanged', (state: string) => {
          if (state === 'initialized') {
            clearTimeout(timeout);
            resolve();
          } else if (state === 'failed') {
            clearTimeout(timeout);
            reject(new Error('Client initialization failed'));
          }
        });

        twilioClient.on('connectionError', (err: { message?: string }) => {
          clearTimeout(timeout);
          reject(new Error(err.message || 'Connection error'));
        });
      });

      setClient(twilioClient);

      // Listen for new messages
      twilioClient.on('messageAdded', (message: Message) => {
        if (message.conversation.sid === selectedSid) {
          setMessages((prev) => [
            ...prev,
            {
              sid: message.sid,
              author: message.author,
              body: message.body,
              dateCreated: message.dateCreated,
              isAdmin: message.author?.startsWith('admin:') || false,
            },
          ]);
        }
        // Update conversation list
        loadConversations(twilioClient);
      });
    } catch (err) {
      console.error('TWILIO_INIT_ERROR', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  }, [selectedSid]);

  // Load conversations list
  const loadConversations = useCallback(async (twilioClient: TwilioClient) => {
    setLoadingConversations(true);
    try {
      const paginator: Paginator<Conversation> = await twilioClient.getSubscribedConversations();
      const items: ConversationItem[] = [];

      for (const conv of paginator.items) {
        let lastMessage: string | undefined;
        let lastMessageTime: Date | undefined;

        try {
          const msgPaginator = await conv.getMessages(1);
          if (msgPaginator.items.length > 0) {
            const msg = msgPaginator.items[0];
            lastMessage = msg.body || undefined;
            lastMessageTime = msg.dateCreated || undefined;
          }
        } catch {
          // Ignore errors fetching last message
        }

        items.push({
          sid: conv.sid,
          friendlyName: conv.friendlyName,
          lastMessage,
          lastMessageTime,
        });
      }

      // Sort by last message time (most recent first)
      items.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
      });

      setConversations(items);
    } catch (err) {
      console.error('LOAD_CONVERSATIONS_ERROR', err);
      toast.addToast('Erreur chargement conversations', 'error');
    } finally {
      setLoadingConversations(false);
    }
  }, [toast]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conv: Conversation) => {
    setLoadingMessages(true);
    try {
      const paginator = await conv.getMessages(50);
      const items: MessageItem[] = paginator.items.map((msg) => ({
        sid: msg.sid,
        author: msg.author,
        body: msg.body,
        dateCreated: msg.dateCreated,
        isAdmin: msg.author?.startsWith('admin:') || false,
      }));
      setMessages(items);

      // Mark as read
      await conv.setAllMessagesRead();
    } catch (err) {
      console.error('LOAD_MESSAGES_ERROR', err);
      toast.addToast('Erreur chargement messages', 'error');
    } finally {
      setLoadingMessages(false);
    }
  }, [toast]);

  // Select a conversation
  const selectConversation = useCallback(async (sid: string) => {
    if (!client) return;

    setSelectedSid(sid);
    setMessages([]);

    try {
      const conv = await client.getConversationBySid(sid);
      setSelectedConversation(conv);
      await loadMessages(conv);
    } catch (err) {
      console.error('SELECT_CONVERSATION_ERROR', err);
      toast.addToast('Erreur ouverture conversation', 'error');
    }
  }, [client, loadMessages, toast]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!selectedConversation || !messageText.trim()) return;

    setSending(true);
    try {
      await selectedConversation.sendMessage(messageText.trim());
      setMessageText('');
    } catch (err) {
      console.error('SEND_MESSAGE_ERROR', err);
      toast.addToast('Erreur envoi message', 'error');
    } finally {
      setSending(false);
    }
  }, [selectedConversation, messageText, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize on mount
  useEffect(() => {
    initClient();

    return () => {
      if (client) {
        client.shutdown();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load conversations when client is ready
  useEffect(() => {
    if (client) {
      loadConversations(client);
    }
  }, [client, loadConversations]);

  const formatTime = (date: Date | null | undefined) => {
    if (!date) return '';
    return date.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    const today = new Date();
    const msgDate = new Date(date);

    if (msgDate.toDateString() === today.toDateString()) {
      return formatTime(date);
    }

    return msgDate.toLocaleDateString('fr-BE', { day: '2-digit', month: 'short' });
  };

  return (
    <PageContainer>
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
            <span className="ml-3 text-airMuted">Connexion à Twilio...</span>
          </div>
        )}

        {error && (
          <Card className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-2">Erreur de connexion</p>
            <p className="text-sm text-airMuted mb-4">{error}</p>
            <Button variant="secondary" onClick={initClient}>
              Réessayer
            </Button>
          </Card>
        )}

        {!loading && !error && client && (
          <div className="flex h-[calc(100vh-180px)] gap-4">
            {/* Left panel: Conversations list */}
            <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-2xl border border-airBorder overflow-hidden">
              <div className="p-3 border-b border-airBorder flex items-center justify-between">
                <span className="text-sm font-medium text-airDark">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={loadingConversations ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  onClick={() => loadConversations(client)}
                  disabled={loadingConversations}
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-sm text-airMuted">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-airMuted/50" />
                    Aucune conversation
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.sid}
                      onClick={() => selectConversation(conv.sid)}
                      className={`w-full p-3 text-left border-b border-airBorder hover:bg-airSurface transition ${
                        selectedSid === conv.sid ? 'bg-airPrimary/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-airPrimary/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-airPrimary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-airDark truncate">
                            {conv.friendlyName || conv.sid.slice(0, 12)}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-xs text-airMuted truncate">{conv.lastMessage}</p>
                          )}
                        </div>
                        {conv.lastMessageTime && (
                          <span className="text-xs text-airMuted flex-shrink-0">
                            {formatDate(conv.lastMessageTime)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right panel: Messages */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-airBorder overflow-hidden">
              {!selectedSid ? (
                <div className="flex-1 flex items-center justify-center text-airMuted">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-airMuted/50" />
                    <p>Sélectionnez une conversation</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-airBorder">
                    <p className="font-medium text-airDark">
                      {conversations.find((c) => c.sid === selectedSid)?.friendlyName || selectedSid}
                    </p>
                    <p className="text-xs text-airMuted">Connecté en tant que {identity}</p>
                  </div>

                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-airPrimary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-sm text-airMuted py-8">
                        Aucun message
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.sid}
                          className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              msg.isAdmin
                                ? 'bg-airPrimary text-white rounded-br-sm'
                                : 'bg-airSurface text-airDark rounded-bl-sm'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                            <p
                              className={`text-xs mt-1 ${
                                msg.isAdmin ? 'text-white/70' : 'text-airMuted'
                              }`}
                            >
                              {formatTime(msg.dateCreated)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Composer */}
                  <div className="p-4 border-t border-airBorder">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        placeholder="Écrire un message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="flex-1"
                        disabled={sending}
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        icon={sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        disabled={sending || !messageText.trim()}
                      >
                        Envoyer
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </PageContainer>
  );
}
