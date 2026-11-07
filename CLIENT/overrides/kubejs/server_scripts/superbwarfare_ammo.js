// Superb Warfare's rifle and heavy ammo can't be used from the hand
ItemEvents.rightClicked(event => {
  let id = event.item.id
  if (id == 'superbwarfare:rifle_ammo' || id == 'superbwarfare:heavy_ammo') event.cancel()
})
