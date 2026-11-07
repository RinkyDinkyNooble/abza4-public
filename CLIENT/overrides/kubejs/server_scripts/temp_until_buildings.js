// Encounters, finds and chest loot by region:
// - each player meets a mini-boss or boss every 15 minutes spent in a fought region, and from the region's first
//   hour on, its final boss at most once an hour
// - mini-bosses, bosses and final bosses drop finds from their region's loot; every common drops a find from what
//   a city's containers hold (food and materials most often, guns and armour least)
// - the Badlands' final boss drops two Alien Navigation Cores, its bosses sometimes one
// - the first time a player is in a region (the Moon included), its traders and guards for hire make camp nearby,
//   once per world, and chat gives everyone its place

const $AbzaTempEntityType = Java.loadClass('net.minecraft.world.entity.EntityType')
const $AbzaTempMob = Java.loadClass('net.minecraft.world.entity.Mob')
const $AbzaTempSpawnType = Java.loadClass('net.minecraft.world.entity.MobSpawnType')
const $AbzaTempEvents = Java.loadClass('net.minecraftforge.event.ForgeEventFactory')
const $AbzaTempHeightmapTypes = Java.loadClass('net.minecraft.world.level.levelgen.Heightmap$Types')
const $AbzaTempItemEntity = Java.loadClass('net.minecraft.world.entity.item.ItemEntity')
const $AbzaTempBlockPos = Java.loadClass('net.minecraft.core.BlockPos')
const $AbzaTempDamageTags = Java.loadClass('net.minecraft.tags.DamageTypeTags')
const $AbzaTempTagParser = Java.loadClass('net.minecraft.nbt.TagParser')

const ABZA_TEMP = {
    encounterSeconds: 900,      // time in a region between encounters
    finalAfterSeconds: 3600,    // time in a region before its final boss can come, and between two of them
    bossShare: 0.4,             // of encounters that aren't a final boss, the share that are bosses
    distance: [24, 40],         // blocks from the player
    finds: { common: 1, mini: 1, boss: 2, final: 4 },
    findCategories: {
        // a category listed twice comes up twice as often
        common: ['food', 'food', 'materials', 'materials', 'medical', 'ammo', 'ammo', 'gear', 'parts', 'guns',
            'attachments', 'explosives', 'armour', 'farming', 'defence'],
        loot: ['guns', 'attachments', 'armour', 'gear', 'explosives', 'medical', 'parts', 'ordnance', 'vehicles', 'intel']
    },
    core: 'superbwarfare:ancient_cpu',
    coreRegion: 3,
    coreBossChance: 0.25,
    regionNames: { 1: 'the Plains', 2: 'the Snow', 3: 'the Badlands', 5: 'Cinder', 6: 'Eden', 7: 'Umbra', 8: 'Interloper' }
}

// Each region's camp: its chat line, then the /spawnNPC options of each NPC in it
const ABZA_TEMP_FIELD = (tier) => [
    { skin: 'survivor', name: 'random', title: 'Trader', faction: 1, market: `survivor_t${tier}`, respawn: 300 },
    { skin: 'survivor', name: 'random', title: 'Grocer', faction: 1, market: `food_t${tier}`, respawn: 300 },
    { skin: 'survivor', name: 'random', title: 'Supplier', faction: 1, market: `materials_t${tier}`, respawn: 300 }
]
const ABZA_TEMP_JOINT = (planet, lenaPage) => [
    lenaPage ? { cast: 'lena', dialogs: `lena_${planet}`, lines: 'lena_camp', market: lenaPage } : { cast: 'lena', dialogs: `lena_${planet}`, lines: 'lena_camp' },
    { cast: 'bello', dialogs: 'bello_camp', lines: 'camp' },
    { skin: 'corps', name: 'random', title: 'Quartermaster', faction: 2, market: `camp_${planet}`, dialogs: 'quartermaster', lines: 'camp', respawn: 300 },
    { skin: 'survivor', name: 'random', title: 'Quartermaster', faction: 1, market: `rations_${planet}`, dialogs: 'quartermaster', lines: 'camp', respawn: 300 },
    { skin: 'corps', name: 'random', faction: 2, kit: 'corps_rifle', hire: 1, dialogs: 'hire_corps', lines: 'camp', respawn: 300 }
]
const ABZA_TEMP_CAMPS = {
    1: { line: 'Survivors are trading nearby', npcs: ABZA_TEMP_FIELD(1) },
    2: { line: "Lena's camp is nearby", npcs: [
        { cast: 'lena', dialogs: 'lena', lines: 'lena', market: 'lena_t2' },
        { skin: 'survivor', name: 'random', title: 'Quartermaster', faction: 1, market: 'camp_t2', dialogs: 'quartermaster', lines: 'survivor_t2', respawn: 300 },
        { skin: 'survivor', name: 'random', faction: 1, kit: 'survivor_guard', hire: 1, dialogs: 'hire_survivors', lines: 'survivor_t2', respawn: 300 }
    ].concat(ABZA_TEMP_FIELD(2)) },
    3: { line: 'The Free Air Corps have landed nearby', npcs: [
        { cast: 'bello', dialogs: 'bello', lines: 'bello', market: 'bello_arms' },
        { skin: 'corps', name: 'random', faction: 2, kit: 'corps_rifle', hire: 1, dialogs: 'hire_corps', lines: 'corps', respawn: 300 }
    ].concat(ABZA_TEMP_FIELD(3)) },
    4: { line: 'Station Crew are nearby', npcs: [
        { cast: 'paz', dialogs: 'paz', lines: 'paz', market: 'paz_supplies' },
        { skin: 'crew', name: 'random', faction: 3, kit: 'crew_guard', hire: 1, dialogs: 'hire_crew', lines: 'crew', respawn: 300 }
    ] },
    5: { line: 'A joint camp is nearby', npcs: ABZA_TEMP_JOINT('cinder', null) },
    6: { line: 'A joint camp is nearby', npcs: ABZA_TEMP_JOINT('eden', 'lena_eden') },
    7: { line: 'A joint camp is nearby', npcs: ABZA_TEMP_JOINT('umbra', 'lena_umbra') },
    8: { line: 'A joint camp is nearby', npcs: ABZA_TEMP_JOINT('interloper', 'lena_interloper_1') }
}
// Where a camp's NPCs stand around its middle, in blocks
const ABZA_TEMP_CAMP_SPOTS = [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3], [3, 3], [-3, -3], [3, -3]]

// A weighted pick from the region's loot categories (ABZA_LOOT), as a stack, or null
function abzaTempFind(categories, tier) {
    var pools = categories.map(c => global.ABZA_LOOT[`${c}_t${tier}`]).filter(p => p && p.length)
    if (!pools.length) return null
    var pool = pools[Math.floor(Math.random() * pools.length)]
    var total = pool.reduce((sum, entry) => sum + entry[2], 0)
    var roll = Math.random() * total
    for (var i = 0; i < pool.length; i++) {
        roll -= pool[i][2]
        if (roll > 0) continue
        var entry = pool[i]
        if (entry[1] && entry[1].indexOf('hook:') == 0) return global.abzaGrappleHook(entry[1].substring(5))
        var stack = entry[1] ? Item.of(entry[0], entry[1]) : Item.of(entry[0])
        stack.setCount(entry[3] + Math.floor(Math.random() * (entry[4] - entry[3] + 1)))
        return stack
    }
    return null
}

function abzaTempDrop(entity, stack) {
    var level = entity.getLevel()
    var drop = new $AbzaTempItemEntity(level, entity.getX(), entity.getY() + 0.5, entity.getZ(), stack)
    drop.setDefaultPickUpDelay()
    level.addFreshEntity(drop)
}

// A spot on the surface 24 to 40 blocks from the player, in a loaded chunk, not in water, not far above or below
function abzaTempSpot(player) {
    var level = player.serverLevel()
    for (var tries = 0; tries < 10; tries++) {
        var angle = Math.random() * 6.283185307179586   // a full turn in radians
        var distance = ABZA_TEMP.distance[0] + Math.random() * (ABZA_TEMP.distance[1] - ABZA_TEMP.distance[0])
        var x = Math.floor(player.getX() + Math.cos(angle) * distance)
        var z = Math.floor(player.getZ() + Math.sin(angle) * distance)
        if (!level.hasChunkAt(new $AbzaTempBlockPos(x, 0, z))) continue
        var y = level.getHeight($AbzaTempHeightmapTypes.MOTION_BLOCKING_NO_LEAVES, x, z)
        if (Math.abs(y - player.getY()) > 24) continue
        var pos = new $AbzaTempBlockPos(x, y, z)
        if (!level.getFluidState(pos.below()).isEmpty()) continue
        return pos
    }
    return null
}

// A mob of the region, spawned as a command spawns it, hunting the player; it despawns when left far behind
function abzaTempSpawn(player, id, pos) {
    var level = player.serverLevel()
    var entity = $AbzaTempEntityType.byString(id).get().create(level)
    if (!(entity instanceof $AbzaTempMob)) return null
    entity.setPositionAndRotation(pos.getX() + 0.5, pos.getY(), pos.getZ() + 0.5, Math.random() * 360, 0)
    $AbzaTempEvents.onFinalizeSpawn(entity, level, level.getCurrentDifficultyAt(pos), $AbzaTempSpawnType.COMMAND, null, null)
    level.addFreshEntityWithPassengers(entity)
    if (!entity.isAddedToWorld()) return null
    entity.setTarget(player)
    return entity
}

function abzaTempPick(region, mobClass) {
    var ids = Object.keys(global.ABZA_MOBS).filter(id => global.ABZA_MOBS[id][0] == region && global.ABZA_MOBS[id][1] == mobClass)
    return ids.length ? ids[Math.floor(Math.random() * ids.length)] : null
}

// One encounter: the final boss when its hour has come, otherwise a mini-boss or a boss; the id spawned, or null
function abzaTempEncounter(player, region, data) {
    var pos = abzaTempSpot(player)
    if (!pos) return null
    var time = data.getInt(`t${region}`)
    var lastFinal = data.contains(`final_t${region}`) ? data.getInt(`final_t${region}`) : -ABZA_TEMP.finalAfterSeconds
    if (time >= ABZA_TEMP.finalAfterSeconds && time - lastFinal >= ABZA_TEMP.finalAfterSeconds) {
        var final = global.ABZA_REGIONS[String(region)] && global.ABZA_REGIONS[String(region)].final
        if (final && abzaTempSpawn(player, final, pos)) {
            data.putInt(`final_t${region}`, time)
            player.tell(Text.red(`The final boss of ${ABZA_TEMP.regionNames[region]} is coming for you.`))
            return final
        }
    }
    var id = abzaTempPick(region, Math.random() < ABZA_TEMP.bossShare ? 'boss' : 'mini')
    return id && abzaTempSpawn(player, id, pos) ? id : null
}

// The region a player is in for camps: a fought region, or 4 on the Moon
function abzaTempCampRegion(player) {
    var region = abzaPlayerRegion(player)
    if (region) return region
    return String(player.level.getDimension()) == 'ad_astra:moon' ? 4 : 0
}

// A region's camp around a spot near the player, its NPCs as /spawnNPC places them; the spot, or null
function abzaTempCamp(player, region) {
    var camp = ABZA_TEMP_CAMPS[region]
    var middle = camp ? abzaTempSpot(player) : null
    if (!middle) return null
    var level = player.serverLevel()
    camp.npcs.forEach((npc, i) => {
        var spot = ABZA_TEMP_CAMP_SPOTS[i % ABZA_TEMP_CAMP_SPOTS.length]
        var x = middle.getX() + spot[0], z = middle.getZ() + spot[1]
        var y = level.getHeight($AbzaTempHeightmapTypes.MOTION_BLOCKING_NO_LEAVES, x, z)
        if (!level.getFluidState(new $AbzaTempBlockPos(x, y - 1, z)).isEmpty()) {
            x = middle.getX(); y = middle.getY(); z = middle.getZ()
        }
        var snbt = '{' + Object.keys(npc).map(key => key + ':' + (typeof npc[key] == 'string' ? '"' + npc[key] + '"' : npc[key])).join(',') + '}'
        var result = abzaSpawnNpcAt(level, x + 0.5, y, z + 0.5, 1, 'template_armed', $AbzaTempTagParser.parseTag(snbt))
        if (typeof result == 'string') console.warn(`temp_until_buildings.js: camp ${region}: ${result} (${snbt})`)
    })
    player.server.runCommandSilent(`tellraw @a {"text":"${camp.line}: ${middle.getX()}, ${middle.getZ()}.","color":"green"}`)
    return middle
}

// Time in each fought region, counted per player every second; an encounter every 15 minutes of it. A region's camp
// is made the first time anyone is there.
PlayerEvents.tick(event => {
    var player = event.player
    if (player.tickCount % 20 != 0 || player.isCreative() || player.isSpectator()) return
    var campRegion = abzaTempCampRegion(player)
    if (ABZA_TEMP_CAMPS[campRegion]) {
        var world = player.server.persistentData
        var camps = world.getCompound('abza_temp_camps')
        if (!camps.contains(String(campRegion)) && abzaTempCamp(player, campRegion)) {
            camps.putBoolean(String(campRegion), true)
            world.put('abza_temp_camps', camps)
        }
    }
    var region = abzaPlayerRegion(player)
    if (!ABZA_TEMP.regionNames[region]) return
    var root = player.getPersistentData()
    var data = root.getCompound('abza_temp')
    var time = data.getInt(`t${region}`) + 1
    data.putInt(`t${region}`, time)
    root.put('abza_temp', data)
    if (time % ABZA_TEMP.encounterSeconds == 0) abzaTempEncounter(player, region, data)
})

// Finds from a region's loot when its creatures die to a player or a vehicle
EntityEvents.death(event => {
    var entity = event.entity
    var row = global.ABZA_MOBS[String($AbzaTempEntityType.getKey(entity.getType()))]
    if (!row || !event.source.getActual()) return
    var region = row[0], mobClass = row[1]
    var tier = Math.min(region, 8)
    var finds = ABZA_TEMP.finds[mobClass]
    if (mobClass == 'common') {
        if (event.source.is($AbzaTempDamageTags.IS_EXPLOSION) || Math.random() >= finds) return
        var common = abzaTempFind(ABZA_TEMP.findCategories.common, tier)
        if (common) abzaTempDrop(entity, common)
        return
    }
    for (var i = 0; i < finds; i++) {
        var stack = abzaTempFind(ABZA_TEMP.findCategories.loot, tier)
        if (stack) abzaTempDrop(entity, stack)
    }
    if (region != ABZA_TEMP.coreRegion) return
    if (mobClass == 'final') abzaTempDrop(entity, Item.of(ABZA_TEMP.core, 2))
    else if (mobClass == 'boss' && Math.random() < ABZA_TEMP.coreBossChance) abzaTempDrop(entity, Item.of(ABZA_TEMP.core))
})


// /abzatemp encounter: an encounter now where the player stands; /abzatemp final: its region's final boss now;
// /abzatemp camp: the region's camp again, near the player
ServerEvents.commandRegistry(event => {
    var Commands = event.commands
    var run = (ctx, final) => {
        var player = ctx.source.getPlayerOrException()
        var region = abzaPlayerRegion(player)
        if (!ABZA_TEMP.regionNames[region]) {
            player.tell('No encounters here.')
            return 0
        }
        var root = player.getPersistentData()
        var data = root.getCompound('abza_temp')
        if (final) {
            data.putInt(`t${region}`, Math.max(data.getInt(`t${region}`), ABZA_TEMP.finalAfterSeconds))
            data.putInt(`final_t${region}`, data.getInt(`t${region}`) - ABZA_TEMP.finalAfterSeconds)
        }
        root.put('abza_temp', data)
        var id = abzaTempEncounter(player, region, data)
        player.tell(id ? `Spawned ${id}.` : 'Nothing spawned: no dry, loaded ground 24 to 40 blocks away.')
        return id ? 1 : 0
    }
    var camp = ctx => {
        var player = ctx.source.getPlayerOrException()
        var region = abzaTempCampRegion(player)
        if (!ABZA_TEMP_CAMPS[region]) {
            player.tell('No camp here.')
            return 0
        }
        if (abzaTempCamp(player, region)) return 1
        player.tell('No camp: no dry, loaded ground 24 to 40 blocks away.')
        return 0
    }
    event.register(Commands.literal('abzatemp').requires(source => source.hasPermission(2))
        .then(Commands.literal('encounter').executes(ctx => run(ctx, false)))
        .then(Commands.literal('final').executes(ctx => run(ctx, true)))
        .then(Commands.literal('camp').executes(ctx => camp(ctx))))
})
