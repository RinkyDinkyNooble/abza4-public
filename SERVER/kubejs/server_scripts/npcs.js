// CustomNPCs clones spawned as CustomNPCs' cloner spawns them, each set up through CustomNPCs' API from a compound of
// options:
//   skin     a pool of ABZA_NPC_SKINS (a random skin of it), or a texture; one ending in _slim.png gets slim arms
//   name     a name, or "random" (a first name of the skin's gender, from ABZA_NPC_NAMES)
//   title    the line under its name
//   respawn  seconds before it stands up again after dying; without it, its death is permanent
//   wander   it wanders this many blocks around where it spawned (1 to 50)
//   market   a page of ABZA_MARKETS, or a CustomNPCs market's name (the NPC becomes a trader)
//   faction  a faction's id
//   yaw      the direction it faces, in degrees
//   dialogs  a character of ABZA_NPC_DIALOGS (its dialogs by slot)
//   lines    a pool of ABZA_NPC_LINES (8 of each kind picked at random, again each time it loads)
//   kit      a weapon kit of ABZA_NPC_KITS (its weapon, shots, health and tactics; npc_kits.js)
//   tier     the tier its kit's numbers come from (1 to 8; without it, the region it stands in)
//   size     its model's size (CustomNPCs' 5 is a grown adult); without it, a size at random from its kit's range or
//            ABZA_NPC_SIZES
//   pose     a pose of ABZA_NPC_POSES it holds while standing
//   cast     a named character of ABZA_NPC_CAST, whose options fill in any not given
//   hire     1: a guard for hire (with a kit, and no market; guards.js)
// Every NPC opens doors and, standing, turns its head to look; one without a kit is unarmed (no weapon, no guard
// duty) and notices things within 16 blocks. /armNPC gives NPCs already placed another kit (npc_kits.js).
const $AbzaNpcApi = Java.loadClass('noppes.npcs.api.NpcAPI')
const $AbzaNpcCloneStore = Java.loadClass('noppes.npcs.controllers.ServerCloneController')
const $AbzaNpcSpawner = Java.loadClass('noppes.npcs.packets.server.SPacketToolMobSpawner')

const ABZA_NPC_OPTIONS = ['skin', 'name', 'title', 'respawn', 'wander', 'market', 'faction', 'yaw', 'dialogs', 'lines',
    'kit', 'tier', 'size', 'pose', 'cast', 'hire']
// The sizes of NPCs without a size or a kit's range: least, most
const ABZA_NPC_SIZES = [4.8, 5.3]
const ABZA_NPC_LINE_TYPES = { interact: 0, attack: 1, world: 2, killed: 3, kill: 4 }
const ABZA_NPC_TRADER = 1
const ABZA_NPC_RESPAWNS = 0
const ABZA_NPC_STAYS_DEAD = 3
const ABZA_NPC_WANDERING = 1
const ABZA_NPC_SLIM_MODEL = 'customnpcs:customnpcalex'
const ABZA_NPC_DOOR_OPEN = 1
const ABZA_NPC_HEAD_TURNS = 3
const ABZA_NPC_CALM_AGGRO = 16
const ABZA_NPC_NO_JOB = 0

// A random entry of a list
function abzaNpcPick(list) {
    return list[Math.floor(Math.random() * list.length)]
}

// A skin from a pool (with its gender), or a texture given whole
function abzaNpcSkin(skin) {
    if (skin.indexOf(':') >= 0) return { texture: skin, gender: null }
    var pool = ABZA_NPC_SKINS[skin]
    var gender = abzaNpcPick(Object.keys(pool).filter(key => pool[key].length > 0))
    return { texture: abzaNpcPick(pool[gender]), gender: gender }
}

// A first name of a gender (either when it's null)
function abzaNpcRandomName(gender) {
    return abzaNpcPick(gender ? ABZA_NPC_NAMES[gender] : ABZA_NPC_NAMES.male.concat(ABZA_NPC_NAMES.female))
}

// What's wrong with a clone and its options, or null
function abzaNpcProblem(tab, name, options) {
    if (!$AbzaNpcCloneStore.Instance.getCloneData(null, name, tab)) return `no NPC clone ${name} in tab ${tab}`
    if (!options) return null
    var keys = options.getAllKeys().iterator()
    while (keys.hasNext()) {
        var key = String(keys.next())
        if (ABZA_NPC_OPTIONS.indexOf(key) < 0) return `unknown NPC option ${key}`
    }
    if (options.contains('cast') && !ABZA_NPC_CAST[String(options.getString('cast'))]) {
        return `no named character ${options.getString('cast')}`
    }
    if (options.contains('pose') && ABZA_NPC_POSES[String(options.getString('pose'))] === undefined) {
        return `no NPC pose ${options.getString('pose')}`
    }
    if (options.contains('hire') && (!options.contains('kit') || options.contains('market'))) {
        return 'a guard for hire needs a kit and no market'
    }
    if (options.contains('skin')) {
        var skin = String(options.getString('skin'))
        if (skin.indexOf(':') < 0 && !ABZA_NPC_SKINS[skin]) return `no NPC skin pool ${skin}`
    }
    if (options.contains('dialogs')) {
        var character = String(options.getString('dialogs'))
        if (!ABZA_NPC_DIALOGS[character]) return `no NPC dialogs for ${character}`
        var missing = ABZA_NPC_DIALOGS[character].filter(id => !$AbzaNpcApi.Instance().getDialogs().get(id))
        if (missing.length > 0) return `no dialog ${missing.join(', ')}: run /noppes dialog reload`
    }
    if (options.contains('lines') && !ABZA_NPC_LINES[String(options.getString('lines'))]) {
        return `no NPC lines ${options.getString('lines')}`
    }
    if (options.contains('kit') && !global.ABZA_NPC_KITS[String(options.getString('kit'))]) {
        return `no NPC kit ${options.getString('kit')}`
    }
    if (options.contains('tier') && (options.getInt('tier') < 1 || options.getInt('tier') > 8)) {
        return `tier ${options.getInt('tier')} isn't 1 to 8`
    }
    if (options.contains('size') && (options.getFloat('size') < 4.75 || options.getFloat('size') > 6)) {
        return `size ${options.getFloat('size')} isn't 4.75 to 6`
    }
    if (options.contains('respawn') && options.getInt('respawn') < 1) return 'respawn is under 1 second'
    if (options.contains('wander')) {
        var range = options.getInt('wander')
        if (range < 1 || range > 50) return `wander ${range} isn't 1 to 50`
    }
    return null
}

// Dialogue reads flags: hidden dialogs (ABZA_DIALOG_FLAGS, npc_story.js) marked read for a player from their stages.
// reached_t<n>: they've stood in tier n's region or a later one (the Moon 4; Interloper counts only after Umbra);
// interloper: they've stood on Interloper; final_t<n>, vaccine_t<n> and finale: those stages. Regions stood in are kept
// as stages (abza_reached_t<n>). medical.js's loop calls this every second with the player's region.
const abzaDialogFlagsSet = {}

function abzaUpdateDialogFlags(player, region) {
    var stages = player.stages
    if (String(player.level.getDimension()) == 'ad_astra:moon') region = 4
    if (region && !stages.has(`abza_reached_t${region}`)) stages.add(`abza_reached_t${region}`)
    var on = {}
    var reached = 0
    for (var t = 1; t <= 8; t++) {
        if (stages.has(`abza_reached_t${t}`) && (t < 8 || stages.has('abza_reached_t7'))) reached = t
    }
    for (var r = 1; r <= reached; r++) on[`reached_t${r}`] = true
    on.interloper = stages.has('abza_reached_t8')
    Object.keys(ABZA_DIALOG_FLAGS).forEach(flag => {
        if (/^(final|vaccine)_t\d$|^finale$/.test(flag)) on[flag] = stages.has(`abza_${flag}`)
    })
    var name = player.getName().getString()
    var set = abzaDialogFlagsSet[name] || (abzaDialogFlagsSet[name] = {})
    Object.keys(ABZA_DIALOG_FLAGS).forEach(flag => {
        var value = !!on[flag]
        if (set[flag] === value) return
        player.getServer().runCommandSilent(`noppes dialog ${value ? 'read' : 'unread'} ${name} ${ABZA_DIALOG_FLAGS[flag]}`)
        set[flag] = value
    })
}

PlayerEvents.loggedIn(event => {
    delete abzaDialogFlagsSet[event.player.getName().getString()]
})

// An NPC's lines: 8 of each kind at random from its pool (its stored "abza_lines"), so it says new things each time
// it loads (CustomNPCs holds 8 a kind)
function abzaDealNpcLines(npc) {
    var pool = ABZA_NPC_LINES[String(npc.getStoreddata().get('abza_lines'))]
    if (!pool) return
    var advanced = npc.getAdvanced()
    Object.keys(pool).forEach(kind => {
        var lines = pool[kind].slice()
        for (var slot = 0; slot < 8; slot++) {
            var text = lines.length ? lines.splice(Math.floor(Math.random() * lines.length), 1)[0] : ''
            advanced.setLine(ABZA_NPC_LINE_TYPES[kind], slot, text, '')
        }
    })
}

// Every NPC attacks its faction's enemies and defends its faction's members; its lines are dealt
;['customnpcs:customnpc', 'customnpcs:customnpcalex'].forEach(type => EntityEvents.spawned(type, event => {
    var advanced = event.entity.advanced
    advanced.attackOtherFactions = true
    advanced.defendFaction = true
    var npc = $AbzaNpcApi.Instance().getIEntity(event.entity)
    if (npc.getStoreddata().has('abza_lines')) abzaDealNpcLines(npc)
}))

// The options with a named character's filled in where they aren't given
function abzaNpcWithCast(options) {
    if (!options || !options.contains('cast')) return options
    var cast = ABZA_NPC_CAST[String(options.getString('cast'))]
    if (!cast) return options
    var merged = options.copy()
    Object.keys(cast).forEach(key => {
        if (merged.contains(key)) return
        var value = cast[key]
        if (typeof value == 'string') merged.putString(key, value)
        else if (key == 'size') merged.putFloat(key, value)
        else merged.putInt(key, value)
    })
    return merged
}

// Spawns clone <name> of tab <tab> at x y z with its options (a compound, or null). Returns the NPC, or why it failed.
function abzaSpawnNpcAt(level, x, y, z, tab, name, options) {
    options = abzaNpcWithCast(options)
    var problem = abzaNpcProblem(tab, name, options)
    if (problem) return problem
    var entity = $AbzaNpcSpawner.spawnClone($AbzaNpcCloneStore.Instance.getCloneData(null, name, tab), x, y, z, level)
    if (!entity || !entity.isAddedToWorld()) return `NPC clone ${name} in tab ${tab} didn't spawn`
    var npc = $AbzaNpcApi.Instance().getIEntity(entity)
    var option = key => options && options.contains(key)
    var display = npc.getDisplay()
    var gender = null
    if (option('skin')) {
        var skin = abzaNpcSkin(String(options.getString('skin')))
        display.setSkinTexture(skin.texture)
        display.setModel(skin.texture.endsWith('_slim.png') ? ABZA_NPC_SLIM_MODEL : null)
        gender = skin.gender
    }
    if (option('name')) {
        var given = String(options.getString('name'))
        display.setName(given == 'random' ? abzaNpcRandomName(gender) : given)
    }
    if (option('title')) display.setTitle(String(options.getString('title')))
    var stats = npc.getStats()
    if (option('respawn')) {
        stats.setRespawnType(ABZA_NPC_RESPAWNS)
        stats.setRespawnTime(options.getInt('respawn'))
    } else {
        stats.setRespawnType(ABZA_NPC_STAYS_DEAD)
    }
    npc.getAi().setDoorInteract(ABZA_NPC_DOOR_OPEN)
    if (option('wander')) {
        npc.getAi().setMovingType(ABZA_NPC_WANDERING)
        npc.getAi().setWanderingRange(options.getInt('wander'))
    } else {
        npc.getAi().setStandingType(ABZA_NPC_HEAD_TURNS)
    }
    if (option('size')) {
        display.setSize(options.getFloat('size'))
    } else {
        var kitSizes = option('kit') ? global.ABZA_NPC_KITS[String(options.getString('kit'))].size : null
        var sizes = kitSizes || ABZA_NPC_SIZES
        display.setSize(Math.round((sizes[0] + Math.random() * (sizes[1] - sizes[0])) * 100) / 100)
    }
    if (option('pose')) npc.getAi().setAnimation(ABZA_NPC_POSES[String(options.getString('pose'))])
    if (option('market')) {
        var market = String(options.getString('market'))
        if (!npc.getRole() || npc.getRole().getType() != ABZA_NPC_TRADER) npc.getMCEntity().advanced.setRole(ABZA_NPC_TRADER)
        if (global.ABZA_MARKETS[market]) {
            npc.getStoreddata().put('abza_market', market)
            abzaFillMarket(npc, market)
        } else {
            npc.getRole().setMarket(market)
        }
    }
    if (option('faction')) npc.setFaction(options.getInt('faction'))
    if (option('dialogs')) {
        var dialogs = $AbzaNpcApi.Instance().getDialogs()
        ABZA_NPC_DIALOGS[String(options.getString('dialogs'))].forEach((id, slot) => npc.setDialog(slot, dialogs.get(id)))
    }
    if (option('lines')) {
        npc.getStoreddata().put('abza_lines', String(options.getString('lines')))
        abzaDealNpcLines(npc)
    }
    if (option('kit')) {
        npc.getStoreddata().put('abza_kit', String(options.getString('kit')))
        npc.getStoreddata().put('abza_tier', option('tier') ? options.getInt('tier') : abzaSpotTier(level, entity.blockPosition()))
        abzaApplyKit(npc, true)
        if (option('hire')) abzaSetUpHire(npc)
    } else {
        stats.setAggroRange(ABZA_NPC_CALM_AGGRO)
        npc.getInventory().setRightHand(null)
        npc.getInventory().setProjectile(null)
        npc.getMCEntity().advanced.setJob(ABZA_NPC_NO_JOB)
    }
    if (option('yaw')) npc.setRotation(options.getFloat('yaw'))
    npc.getMCEntity().setPersistenceRequired()
    npc.updateClient()
    return npc
}
