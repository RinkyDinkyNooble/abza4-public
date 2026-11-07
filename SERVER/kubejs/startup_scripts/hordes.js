// Horde nights: the table for the region a player stands in, picked by the world's difficulty and by how many hordes
// the player has faced in that region (stages abza_horde_<region>_<step>, kept through death). The tables, wave sizes,
// lengths and messages are in server_scripts/horde_table.js.
const $AbzaHordeTables = Java.loadClass('net.smileycorp.hordes.hordeevent.data.HordeTableLoader')
const $AbzaHordeSpawnTypes = Java.loadClass('net.smileycorp.hordes.hordeevent.HordeSpawnTypes')
const $AbzaHordeId = Java.loadClass('net.minecraft.resources.ResourceLocation')

// The region (t1, t2, t3) of the biome under the player, or null
function abzaHordeRegion(player) {
    var regions = global.ABZA_HORDES.regions
    var tags = player.serverLevel().getBiome(player.blockPosition()).tags().iterator()
    while (tags.hasNext()) {
        var region = regions[String(tags.next().location())]
        if (region) return region
    }
    return null
}

// How many of the region's hordes the player has faced, up to the ladder's top
function abzaHordeStep(player, region) {
    var step = 0
    while (step < global.ABZA_HORDES.steps && player.stages.has('abza_horde_' + region + '_' + (step + 1))) step++
    return step
}

// A table and its settings onto a night: its mobs, wave size, length and messages
function abzaHordeApply(data, id) {
    var row = global.ABZA_HORDES.tables[id]
    data.setTable($AbzaHordeTables.INSTANCE.getTable(new $AbzaHordeId(id)))
    data.setSpawnType($AbzaHordeSpawnTypes.AVOID_FLUIDS)
    if (!row) return
    data.setSpawnAmount(row.amount)
    data.setSpawnDuration(row.duration)
    data.setStartMessage(row.start)
    data.setEndMessage(row.end)
}

// A scheduled horde climbs the region's ladder by one step; a horde started by command with one of these tables
// takes that table's settings
ForgeEvents.onEvent('net.smileycorp.hordes.common.event.HordeStartEvent', event => {
    if (!global.ABZA_HORDES) return
    var player = event.getPlayer()
    if (event.wasCommand()) {
        var data = event.getHorde().getSpawnData()
        if (!data || !data.getTable()) return
        var id = String(data.getTable().getName())
        if (global.ABZA_HORDES.tables[id]) abzaHordeApply(data, id)
        return
    }
    var region = abzaHordeRegion(player)
    if (!region || String(player.serverLevel().getDifficulty().getKey()) == 'peaceful') return
    var step = abzaHordeStep(player, region)
    if (step < global.ABZA_HORDES.steps) player.stages.add('abza_horde_' + region + '_' + (step + 1))
})

// The night's table: the region's, at the player's step and the world's difficulty; an empty one (no horde that
// night) outside every region and in peaceful
ForgeEvents.onEvent('net.smileycorp.hordes.common.event.HordeBuildSpawnDataEvent', event => {
    if (!global.ABZA_HORDES) return
    var player = event.getPlayer()
    var region = abzaHordeRegion(player)
    var id = 'abza:none'
    if (region) {
        var difficulty = String(player.serverLevel().getDifficulty().getKey())
        var step = Math.max(1, abzaHordeStep(player, region))
        if (global.ABZA_HORDES.tables['abza:' + region + '_' + difficulty + '_' + step]) {
            id = 'abza:' + region + '_' + difficulty + '_' + step
        }
    }
    abzaHordeApply(event.getSpawnData(), id)
})
