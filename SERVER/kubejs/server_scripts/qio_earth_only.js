// QIO only works on Earth: its blocks can't be placed, and the portable dashboard can't be opened, in other dimensions
const EARTH = 'minecraft:overworld'

BlockEvents.placed(event => {
    if (String(event.level.dimension) == EARTH) return
    if (!String(event.block.id).startsWith('mekanism:qio_')) return
    if (event.entity && event.entity.isPlayer()) {
        event.entity.setStatusMessage(Text.of('The QIO network only reaches Earth').red())
    }
    event.cancel()
})

ItemEvents.rightClicked('mekanism:portable_qio_dashboard', event => {
    if (String(event.level.dimension) == EARTH) return
    event.player.setStatusMessage(Text.of('The QIO network only reaches Earth').red())
    event.cancel()
})
