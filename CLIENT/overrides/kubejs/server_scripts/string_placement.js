// String can't be placed as tripwire
BlockEvents.placed('minecraft:tripwire', event => {
    event.cancel()
})
