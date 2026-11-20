// Player chat
// Each chat message goes to every player and the server log as a server message, in the usual <name> message form.

PlayerEvents.chat(event => {
  event.server.tell(Text.translate('chat.type.text', event.player.displayName, event.message))
  event.cancel()
})
