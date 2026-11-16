// Horde nights: a thunderstorm while any player's horde runs on Earth, cleared when the last one ends
const $AbzaHordeSavedData = Java.loadClass('net.smileycorp.hordes.hordeevent.capability.HordeSavedData')
const ABZA_HORDE_STORM = { on: false }

// Whether a player on Earth has a horde running
function abzaHordeRunning(level) {
    var data = $AbzaHordeSavedData.getData(level)
    var players = level.getPlayers()
    for (var i = 0; i < players.size(); i++) {
        var horde = data.getEvent(players.get(i))
        if (horde != null && horde.isActive()) return true
    }
    return false
}

ServerEvents.tick(event => {
    var server = event.server
    if (server.getTickCount() % 20 != 0) return
    var level = server.getOverworld()
    if (abzaHordeRunning(level)) {
        if (!level.isThundering()) server.runCommandSilent('weather thunder')
        ABZA_HORDE_STORM.on = true
    } else if (ABZA_HORDE_STORM.on) {
        ABZA_HORDE_STORM.on = false
        server.runCommandSilent('weather clear')
    }
})
