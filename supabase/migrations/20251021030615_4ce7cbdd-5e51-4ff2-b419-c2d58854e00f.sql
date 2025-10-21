-- Add DELETE policy for chat_messages to allow users to delete their own conversation messages
CREATE POLICY "Users can delete messages in own conversations"
ON chat_messages FOR DELETE
USING (EXISTS (
  SELECT 1 FROM chat_conversations
  WHERE chat_conversations.id = chat_messages.conversation_id
  AND chat_conversations.user_id = auth.uid()
));

-- Note: public_profiles is a VIEW, not a table, so RLS is controlled by the underlying profiles table
-- The profiles table already has proper RLS policies, so the view inherits that security