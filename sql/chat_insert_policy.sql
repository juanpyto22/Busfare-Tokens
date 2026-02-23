-- ============================================
-- FIX: Add INSERT policy for chat_messages
-- Without this, users cannot send chat messages
-- because RLS blocks all inserts (only SELECT was allowed)
-- ============================================

-- Allow authenticated users to insert chat messages (their own)
CREATE POLICY "Users can send chat messages"
ON chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to see who deleted messages (for moderators)
CREATE POLICY "Users can update their own messages"
ON chat_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admins/moderators to soft-delete any message
CREATE POLICY "Admins can manage all chat messages"
ON chat_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'moderator')
  )
);

-- ============================================
-- Also add UPDATE policy for matches (for leaveMatch to set cancelled)
-- ============================================

-- Allow match creator to cancel their own match
CREATE POLICY "Players can update their matches"
ON matches
FOR UPDATE
USING (
  auth.uid() = player1_id OR auth.uid() = player2_id
)
WITH CHECK (
  auth.uid() = player1_id OR auth.uid() = player2_id
);
