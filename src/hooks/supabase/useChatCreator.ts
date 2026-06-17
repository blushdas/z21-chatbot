
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SupabaseChat } from './types';
import { ChatMode } from '@/components/ChatInterface';
import logger from '@/utils/logger';
import {
  writePowerOverride,
  writeModelOverride,
  writeKbOverride,
  POWER_VALUES,
  MODEL_VALUES,
  KB_VALUES,
  type PowerValue,
  type ModelValue,
  type KbSource,
} from '@/lib/chatDefaults';

async function seedDefaultsFromFolder(folderId: string, chatId: string) {
  try {
    const { data } = await supabase
      .from('folders')
      .select('default_processing, default_model, default_kb_sources')
      .eq('id', folderId)
      .maybeSingle();
    if (!data) return;
    const power = data.default_processing as string | null;
    if (power && (POWER_VALUES as string[]).includes(power)) {
      writePowerOverride(chatId, power as PowerValue);
    }
    const model = data.default_model as string | null;
    if (model && (MODEL_VALUES as string[]).includes(model)) {
      writeModelOverride(chatId, model as ModelValue);
    }
    const kb = data.default_kb_sources as string[] | null;
    if (Array.isArray(kb)) {
      const filtered = kb.filter((v): v is KbSource => (KB_VALUES as string[]).includes(v));
      writeKbOverride(chatId, filtered);
    }
  } catch (e) {
    logger.debug('Failed to seed folder defaults', e);
  }
}

const pendingCreationPromises = new Map<string, Promise<string>>();
const getCreationKey = (folderId?: string | null) => folderId ? `folder:${folderId}` : 'no-folder';

export const useChatCreator = (userId?: string) => {
  const { toast } = useToast();

  const createNewChat = useCallback(async (
    mode: ChatMode = 'coach',
    options?: { folderId?: string | null }
  ): Promise<string> => {
    if (!userId) {
      logger.debug('Guest user attempting to create chat - generating temporary ID');
      const tempId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      toast({
        title: "Guest mode",
        description: "Sign in to save your conversations",
        variant: "default"
      });
      return tempId;
    }

    const creationKey = getCreationKey(options?.folderId);
    const pendingCreationPromise = pendingCreationPromises.get(creationKey);
    if (pendingCreationPromise) {
      logger.debug('Chat creation already in progress for scope, waiting for pending promise...', creationKey);
      return pendingCreationPromise;
    }

    const createPromise = (async () => {
      try {
        logger.debug('Creating new chat for authenticated user:', userId, 'mode:', mode);
        
        if (options?.folderId) {
          const { data: reusableChat, error: reusableError } = await supabase
            .from('chats')
            .select('id')
            .eq('user_id', userId)
            .eq('folder_id', options.folderId)
            .eq('title', 'New Chat')
            .eq('messages', '[]')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!reusableError && reusableChat?.id) {
            logger.debug('Reusing existing empty project chat:', reusableChat.id);
            return reusableChat.id;
          }
        }
        
        const newChat: {
          user_id: string;
          title: string;
          messages: never[];
          mode: ChatMode;
          is_typing_title: boolean;
          folder_id?: string;
        } = {
          user_id: userId,
          title: "New Chat",
          messages: [],
          mode,
          is_typing_title: false,
        };
        if (options?.folderId) newChat.folder_id = options.folderId;

        const { data, error } = await supabase
          .from('chats')
          .insert(newChat)
          .select()
          .single();

        if (error) {
          logger.error('Supabase insert error:', error);
          throw error;
        }

        logger.debug('Successfully created new chat:', data.id);
        if (options?.folderId) {
          await seedDefaultsFromFolder(options.folderId, data.id);
        }
        return data.id;
      } catch (error) {
        logger.error('Error creating chat:', error);
        toast({
          title: "Error creating chat",
          description: `Failed to create new conversation: ${(error as Error).message}`,
          variant: "destructive"
        });
        const tempId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return tempId;
      } finally {
        pendingCreationPromises.delete(creationKey);
      }
    })();

    pendingCreationPromises.set(creationKey, createPromise);
    return createPromise;
  }, [userId, toast]);

  const findOrCreateEmptyChat = useCallback(async (
    mode: ChatMode = 'coach',
    forceNew: boolean = false,
    existingChats: SupabaseChat[] = []
  ): Promise<string> => {
    if (!userId) {
      logger.debug('Guest user - generating temporary ID');
      const tempId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      toast({
        title: "Guest mode",
        description: "Sign in to save your conversations",
        variant: "default"
      });
      return tempId;
    }

    if (forceNew) {
      logger.debug('Force creating new chat (user clicked button)');
      return await createNewChat(mode);
    }

    const creationKey = getCreationKey(null);
    const pendingCreationPromise = pendingCreationPromises.get(creationKey);
    if (pendingCreationPromise) {
      logger.debug('No-project chat creation already in progress, waiting...');
      return pendingCreationPromise;
    }

    const localEmptyChat = existingChats.find(chat => 
      Array.isArray(chat.messages) && chat.messages.length === 0 && !chat.folder_id
    );
    
    if (localEmptyChat) {
      const { data: existsInDb } = await supabase
        .from('chats')
        .select('id')
        .eq('id', localEmptyChat.id)
        .maybeSingle();
      
      if (existsInDb) {
        logger.debug('Reusing existing empty chat from LOCAL STATE (verified in DB):', localEmptyChat.id);
        return localEmptyChat.id;
      } else {
        logger.debug('Local empty chat not found in DB, will create new:', localEmptyChat.id);
      }
    }

    const findOrCreatePromise = (async () => {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: deletedChats, error: cleanupError } = await supabase
          .from('chats')
          .delete()
          .eq('user_id', userId)
          .eq('title', 'New Chat')
          .eq('messages', '[]')
          .lt('created_at', twentyFourHoursAgo)
          .select('id');
        
        if (!cleanupError && deletedChats && deletedChats.length > 0) {
          logger.debug(`Cleaned up ${deletedChats.length} old empty chat(s)`);
        }

        logger.debug('Checking database for existing empty chats...');
        const { data: recentChats, error } = await supabase
          .from('chats')
          .select('id, created_at, messages, folder_id')
          .eq('user_id', userId)
          .is('folder_id', null)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        const emptyChat = recentChats?.find(chat =>
          Array.isArray(chat.messages) &&
          chat.messages.length === 0 &&
          !(chat as any).folder_id &&
          new Date(chat.created_at).getTime() > fiveMinutesAgo
        );

        if (emptyChat) {
          logger.debug('Reusing existing empty chat from DB:', emptyChat.id);
          return emptyChat.id;
        }

        logger.debug('No recent empty chats found, creating new one');
        
        const newChat = {
          user_id: userId,
          title: "New Chat",
          messages: [],
          mode,
          is_typing_title: false
        };

        const { data, error: createError } = await supabase
          .from('chats')
          .insert(newChat)
          .select()
          .single();

        if (createError) {
          logger.error('Supabase insert error:', createError);
          throw createError;
        }

        logger.debug('Successfully created new chat:', data.id);
        return data.id;
      } catch (error) {
        logger.error('Error in findOrCreateEmptyChat:', error);
        const tempId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return tempId;
      } finally {
        pendingCreationPromises.delete(creationKey);
      }
    })();

    pendingCreationPromises.set(creationKey, findOrCreatePromise);
    return findOrCreatePromise;
  }, [userId, toast, createNewChat]);

  return { createNewChat, findOrCreateEmptyChat };
};
