// The questbook's stages (abza_q_<step>), each set once per player: a creature killed, Prospero reached, a tier's
// vehicle ridden or its crate carried; medical.js, hordes.js and trading.js set the stages for a medicine used, a
// horde night ended alive and a purchase
const ABZA_QUEST_NEAR_HUB = 64     // blocks from Prospero that count as reaching it

global.abzaQuestStage = (player, step) => {
    var stage = 'abza_q_' + step
    if (!player.stages.has(stage)) player.stages.add(stage)
}

// A creature killed by a player
EntityEvents.death(event => {
    var killer = event.source.getActual()
    if (!killer || !killer.isPlayer() || !global.ABZA_MOBS[abzaMobKey(event.entity)]) return
    global.abzaQuestStage(killer, 'kill')
})

// A tier's vehicle: the one the player rides, and every vehicle crate in the inventory (quest_table.js)
function abzaQuestVehicles(player) {
    var tiers = global.ABZA_QUEST_VEHICLES
    var riding = player.getVehicle()
    if (riding && tiers[abzaMobKey(riding)]) global.abzaQuestStage(player, 'vehicle_t' + tiers[abzaMobKey(riding)])
    var inventory = player.inventory
    for (var i = 0; i < inventory.getContainerSize(); i++) {
        var stack = inventory.getItem(i)
        if (stack.isEmpty() || stack.id != 'superbwarfare:container' || !stack.nbt) continue
        var tier = tiers[String(stack.nbt.getCompound('BlockEntityTag').getString('EntityType'))]
        if (tier) global.abzaQuestStage(player, 'vehicle_t' + tier)
    }
}

// Every 100 ticks: each player's vehicles, and a player in the Overworld near Prospero
ServerEvents.tick(event => {
    var server = event.server
    if (server.getTickCount() % 100 != 0) return
    var saved = server.persistentData.getCompound('abza_prospero')
    server.getPlayerList().getPlayers().forEach(player => {
        abzaQuestVehicles(player)
        if (!saved.contains('x') || player.stages.has('abza_q_prospero')) return
        if (String(player.level.dimension) != 'minecraft:overworld') return
        var dx = player.getX() - saved.getInt('x'), dz = player.getZ() - saved.getInt('z')
        if (dx * dx + dz * dz < ABZA_QUEST_NEAR_HUB * ABZA_QUEST_NEAR_HUB) global.abzaQuestStage(player, 'prospero')
    })
})
