// Flare guns only work in the Overworld
ItemEvents.rightClicked(event => {
  let id = String(event.item.id)
  if (!id.startsWith('dyairdrop:flaregun')) return
  if (String(event.level.dimension) == 'minecraft:overworld') return
  event.player.setStatusMessage(Text.red('Flare guns only work on Earth.'))
  event.cancel()
})
