// Spawners can't be broken by players or explosions (creative mode still breaks them)
BlockEvents.modification(event => {
  event.modify('minecraft:spawner', block => {
    block.setDestroySpeed(-1)
    block.setExplosionResistance(3600000)
  })
})
