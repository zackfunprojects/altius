import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useActiveTrek } from '../hooks/useActiveTrek'
import { useProfile } from '../hooks/useProfile'
import { useSherpaChat } from '../hooks/useSherpaChat'
import { topo, fonts, colors } from '../lib/theme'
import PocketHeader from '../components/brand/PocketHeader'

export default function ChatScreen() {
  const { profile } = useProfile()
  const { trek } = useActiveTrek()
  const { messages, sendMessage, loading } = useSherpaChat({
    trekId: trek?.id,
    mode: 'general',
  })

  const [input, setInput] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true })
    }
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text) return
    setInput('')
    sendMessage(text)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <PocketHeader title="The Sherpa" elevation={profile?.current_elevation || 0} />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id || item.content?.slice(0, 20)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>&gt; Ask me anything about your trek.</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.msgRow, item.role === 'user' && styles.msgRowUser]}>
            <View style={[styles.msgBubble, item.role === 'user' && styles.msgBubbleUser]}>
              {item.role === 'assistant' && (
                <Text style={styles.prompt}>&gt; </Text>
              )}
              <Text style={item.role === 'user' ? styles.userText : styles.assistantText}>
                {item.content}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          loading ? <Text style={styles.typing}>&gt; ...</Text> : null
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask the Sherpa..."
          placeholderTextColor={topo.textDim}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && { opacity: 0.3 }]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: topo.bg },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 8 },
  empty: { fontFamily: fonts.mono, fontSize: 13, color: topo.textDim, textAlign: 'center', marginTop: 40 },
  msgRow: { marginBottom: 12 },
  msgRowUser: { alignItems: 'flex-end' },
  msgBubble: { maxWidth: '85%', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row' },
  msgBubbleUser: { backgroundColor: 'rgba(26,61,124,0.2)' },
  prompt: { fontFamily: fonts.mono, fontSize: 13, color: topo.textMuted },
  assistantText: { fontFamily: fonts.mono, fontSize: 13, color: topo.text, flex: 1 },
  userText: { fontFamily: fonts.mono, fontSize: 13, color: colors.catalogCream },
  typing: { fontFamily: fonts.mono, fontSize: 13, color: topo.textMuted, paddingLeft: 16, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: topo.border,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: topo.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: fonts.mono, fontSize: 13, color: topo.text,
  },
  sendButton: {
    backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: 8,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  sendText: { fontFamily: fonts.mono, fontSize: 13, color: topo.text },
})
