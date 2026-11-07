// Mob stats on spawn, boss bars, bosses healing when left alone, final boss rewards, max health from rewards and
// bestiary milestones less what deaths took, and the /abza command. The numbers are in mob_stats_table.js,
// boss_regen_table.js and startup_scripts/medical_table.js.
const $AbzaAttributes = Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
const $AbzaMobType = Java.loadClass('net.minecraft.world.entity.EntityType')
const $AbzaServerBossEvent = Java.loadClass('net.minecraft.server.level.ServerBossEvent')
const $AbzaBossBarColor = Java.loadClass('net.minecraft.world.BossEvent$BossBarColor')
const $AbzaBossBarOverlay = Java.loadClass('net.minecraft.world.BossEvent$BossBarOverlay')
const $AbzaUUID = Java.loadClass('java.util.UUID')

const ABZA_TOUGHNESS = 1000
const ABZA_BAR_RANGE = 64
const ABZA_BAR_LIMIT = 2
const ABZA_CREDIT_SHARE = 0.1

// Mobs whose mod raises their attack as it advances: their attack is set back to the mod's base on every join
const ABZA_BASE_ATTACK = {
    'the_flesh_that_hates:flesh_community': 8
}

// Mobs whose mod multiplies their health as they grow (Spore's Mound: by its age, from its config, which holds ABZA's
// health): the multiplier, so a grown one keeps its health when it joins again
const ABZA_GROWN_HEALTH = {
    'spore:mound': entity => Math.max(1, entity.getAge())
}

global.ABZA_BARS = global.ABZA_BARS || {}
global.ABZA_HEALERS = global.ABZA_HEALERS || {}

function abzaMobKey(entity) {
    return String($AbzaMobType.getKey(entity.getType()))
}

function abzaSetBase(entity, attribute, value) {
    var instance = entity.getAttribute(attribute)
    if (instance) instance.setBaseValue(value)
}

// Stats: set on every join, so a retuned table reaches mobs already in the world (their health keeps its share)
EntityEvents.spawned(event => {
    var entity = event.entity
    if (!entity.isLiving()) return
    var row = global.ABZA_MOBS[abzaMobKey(entity)]
    if (!row) return
    var health = entity.getAttribute($AbzaAttributes.MAX_HEALTH)
    if (!health) return
    var data = entity.getPersistentData()
    var old = health.getBaseValue()
    var grown = ABZA_GROWN_HEALTH[abzaMobKey(entity)]
    var max = grown ? row[2] * grown(entity) : row[2]
    abzaSetBase(entity, $AbzaAttributes.MAX_HEALTH, max)
    abzaSetBase(entity, $AbzaAttributes.ARMOR, row[3])
    abzaSetBase(entity, $AbzaAttributes.ARMOR_TOUGHNESS, ABZA_TOUGHNESS)
    var attack = ABZA_BASE_ATTACK[abzaMobKey(entity)]
    if (attack) abzaSetBase(entity, $AbzaAttributes.ATTACK_DAMAGE, attack)
    if (!data.getBoolean('abza_stats')) {
        entity.setHealth(entity.getMaxHealth())
        data.putBoolean('abza_stats', true)
    } else if (old != max && old > 0) {
        entity.setHealth(entity.getHealth() * max / old)
    }
    if (global.ABZA_BOSS_BARS.indexOf(abzaMobKey(entity)) >= 0) abzaTrackBoss(entity, row)
    var rule = (global.ABZA_REGEN || {})[abzaMobKey(entity)]
    if (rule) abzaTrackHealer(entity, rule)
})

// Boss bars for bosses and final bosses that have none of their own
function abzaTrackBoss(entity, row) {
    var id = String(entity.getStringUuid())
    if (global.ABZA_BARS[id]) return
    var colour = row[1] == 'final' ? $AbzaBossBarColor.RED : $AbzaBossBarColor.PURPLE
    var bar = new $AbzaServerBossEvent(entity.getDisplayName(), colour, $AbzaBossBarOverlay.PROGRESS)
    global.ABZA_BARS[id] = { entity: entity, bar: bar, final: row[1] == 'final' }
}

// Each player sees the bars of at most ABZA_BAR_LIMIT bosses within ABZA_BAR_RANGE blocks: final bosses first,
// then the closest
ServerEvents.tick(event => {
    if (event.server.getTickCount() % 10 != 0) return
    var live = []
    var near = {}
    Object.keys(global.ABZA_BARS).forEach(id => {
        var tracked = global.ABZA_BARS[id]
        var entity = tracked.entity
        if (entity.isRemoved() || !entity.isAlive()) {
            tracked.bar.removeAllPlayers()
            delete global.ABZA_BARS[id]
            return
        }
        tracked.bar.setProgress(Math.max(0, Math.min(1, entity.getHealth() / entity.getMaxHealth())))
        tracked.shown = {}
        live.push(tracked)
        entity.level.getPlayers().forEach(player => {
            var distance = player.distanceToEntitySqr(entity)
            if (distance >= ABZA_BAR_RANGE * ABZA_BAR_RANGE) return
            var uuid = String(player.getStringUuid())
            if (!near[uuid]) near[uuid] = []
            near[uuid].push({ tracked: tracked, rank: (tracked.final ? 0 : 1000000) + distance })
        })
    })
    Object.keys(near).forEach(uuid => {
        near[uuid].sort((x, y) => x.rank - y.rank)
        near[uuid].slice(0, ABZA_BAR_LIMIT).forEach(entry => entry.tracked.shown[uuid] = true)
    })
    event.server.getPlayerList().getPlayers().forEach(player => {
        var uuid = String(player.getStringUuid())
        live.forEach(tracked => {
            if (tracked.shown[uuid]) tracked.bar.addPlayer(player)
            else tracked.bar.removePlayer(player)
        })
    })
})

// Bosses and final bosses heal when left alone, each by its rule in boss_regen_table.js
// ([percent of max health, every N seconds]); mob_damage.js keeps the time of the last player's hit on the mob
function abzaIdleTicks(entity) {
    var since = entity.getLevel().getTime() - entity.getPersistentData().getLong('abza_hit')
    return since - (global.ABZA_REGEN_DELAY || 0) * 20
}

function abzaHeal(entity, rule, times) {
    var max = entity.getMaxHealth()
    if (times <= 0 || entity.getHealth() >= max) return
    entity.heal(Math.min(max, max * rule[0] / 100 * times))
}

// On joining (a summon, or a chunk loading again): tracked, and healed for the time it was left alone
function abzaTrackHealer(entity, rule) {
    global.ABZA_HEALERS[String(entity.getStringUuid())] = { entity: entity, last: entity.getLevel().getTime() }
    abzaHeal(entity, rule, Math.floor(abzaIdleTicks(entity) / (rule[1] * 20)))
}

ServerEvents.tick(event => {
    if (event.server.getTickCount() % 10 != 0) return
    Object.keys(global.ABZA_HEALERS).forEach(id => {
        var tracked = global.ABZA_HEALERS[id]
        var entity = tracked.entity
        var rule = (global.ABZA_REGEN || {})[abzaMobKey(entity)]
        if (entity.isRemoved() || !entity.isAlive() || !rule) {
            delete global.ABZA_HEALERS[id]
            return
        }
        var now = entity.getLevel().getTime()
        // In a fight: the interval starts over
        if (abzaIdleTicks(entity) < 0) {
            tracked.last = now
            return
        }
        if (now - tracked.last < rule[1] * 20) return
        tracked.last = now
        abzaHeal(entity, rule, 1)
    })
})

// Earned max health: 20, plus every reward and bestiary milestone the player holds (as stages)
function abzaEarnedHealth(player) {
    var total = global.ABZA_BASE_HEALTH
    var table = global.ABZA_STAGE_HEALTH
    player.stages.getAll().forEach(stage => {
        var extra = table[String(stage)]
        if (extra) total += extra
    })
    return total
}

// Max health lost to deaths, kept with the world by player
function abzaLostHealth(player) {
    return player.getServer().persistentData.getCompound('abza_lost_health').getFloat(String(player.getStringUuid()))
}

function abzaSetLostHealth(player, lost) {
    var data = player.getServer().persistentData
    var all = data.getCompound('abza_lost_health')
    if (lost > 0) all.putFloat(String(player.getStringUuid()), lost)
    else all.remove(String(player.getStringUuid()))
    data.put('abza_lost_health', all)
}

// A death takes a share of the earned max health (at least the minimum), never below the floor's share of it
function abzaDeathPenalty(player) {
    var death = global.ABZA_MEDICAL.death
    var earned = abzaEarnedHealth(player)
    var lost = abzaLostHealth(player)
    var next = Math.min(earned * (1 - death.floor), lost + Math.max(death.minimum, Math.round(earned * death.share)))
    if (next <= lost) return
    abzaSetLostHealth(player, next)
    player.tell(Text.red(`Death cost you ${next - lost} max health (${next} lost in all). A blood pack can restore it.`))
}

// Max health: earned, less what deaths took
function abzaRebuildHealth(player) {
    var earned = abzaEarnedHealth(player)
    var total = Math.max(earned * (1 - global.ABZA_MEDICAL.death.floor), earned - abzaLostHealth(player))
    var instance = player.getAttribute($AbzaAttributes.MAX_HEALTH)
    var old = instance.getBaseValue()
    if (old != total) instance.setBaseValue(total)
    // New max health arrives filled (health set directly, not healed)
    if (total > old && player.getHealth() > 0) player.setHealth(player.getHealth() + total - old)
    if (player.getHealth() > player.getMaxHealth()) player.setHealth(player.getMaxHealth())
}

// A region's reward: its stage, then health; a player who is offline gets it at their next login
function abzaGrantReward(server, uuid, tier) {
    var stage = `abza_final_t${tier}`
    var player = server.getPlayerList().getPlayer($AbzaUUID.fromString(uuid))
    if (!player) {
        var pending = server.persistentData.getCompound('abza_pending')
        pending.putString(`${uuid}|${tier}`, stage)
        server.persistentData.put('abza_pending', pending)
        return
    }
    if (player.stages.has(stage)) return
    player.stages.add(stage)
    abzaRebuildHealth(player)
    var reward = global.ABZA_REGIONS[String(tier)].reward
    player.tell(Text.gold(`You grow stronger: +${reward} max health.`))
}

function abzaGrantPending(player) {
    var pending = player.getServer().persistentData.getCompound('abza_pending')
    var uuid = String(player.getStringUuid())
    var changed = false
    pending.getAllKeys().forEach(key => {
        var parts = String(key).split('|')
        if (parts[0] != uuid) return
        changed = true
        abzaGrantReward(player.getServer(), uuid, parts[1])
    })
    if (!changed) return
    var rest = pending.copy()
    pending.getAllKeys().forEach(key => {
        if (String(key).split('|')[0] == uuid) rest.remove(key)
    })
    player.getServer().persistentData.put('abza_pending', rest)
}

// A final boss's death: every player who dealt at least a tenth of its health earns the region's reward
EntityEvents.death(event => {
    var entity = event.entity
    var row = global.ABZA_MOBS[abzaMobKey(entity)]
    if (!row || row[1] != 'final') return
    var credit = entity.getPersistentData().getCompound('abza_credit')
    var needed = entity.getMaxHealth() * ABZA_CREDIT_SHARE
    credit.getAllKeys().forEach(uuid => {
        if (credit.getFloat(uuid) >= needed) abzaGrantReward(entity.getServer(), String(uuid), row[0])
    })
})

// Bestiary entries of creatures with several forms: killing any form gives the killer its creature's stage,
// or every player aboard the vehicle that killed it
EntityEvents.death(event => {
    var stage = global.ABZA_FORM_STAGES[abzaMobKey(event.entity)]
    if (!stage) return
    var killer = event.source.getActual()
    if (!killer) return
    if (killer.isPlayer()) killer.stages.add(stage)
    else killer.getPassengers().forEach(p => {
        if (p.isPlayer()) p.stages.add(stage)
    })
})

PlayerEvents.loggedIn(event => {
    abzaGrantPending(event.player)
    abzaRebuildHealth(event.player)
})

// A respawn follows a real death only (a Hardcore Revival rescue isn't one)
PlayerEvents.respawned(event => {
    abzaDeathPenalty(event.player)
    abzaRebuildHealth(event.player)
    event.player.setHealth(event.player.getMaxHealth())
})

// Bestiary milestones arrive as stages from FTB Quests: health is rebuilt the tick after a quest completes
// (its rewards are claimed by then), and every 2 seconds for stages from anywhere else
FTBQuestsEvents.completed(event => {
    event.getOnlineMembers().forEach(player => {
        event.server.scheduleInTicks(1, () => {
            if (!player.isRemoved()) abzaRebuildHealth(player)
        })
    })
})

PlayerEvents.tick(event => {
    if (event.player.tickCount % 40 == 0) abzaRebuildHealth(event.player)
})

// /abza reward <players> <region>: gives a region's reward (the Moon's comes from its NPC);
// /abza revoke <players> <region> takes it back
ServerEvents.commandRegistry(event => {
    var Commands = event.commands
    var Arguments = event.arguments
    var give = (ctx, grant) => {
        var tier = Arguments.INTEGER.getResult(ctx, 'region')
        if (!global.ABZA_REGIONS[String(tier)]) return 0
        Arguments.PLAYERS.getResult(ctx, 'targets').forEach(player => {
            if (grant) abzaGrantReward(player.getServer(), String(player.getStringUuid()), tier)
            else {
                player.stages.remove(`abza_final_t${tier}`)
                abzaRebuildHealth(player)
            }
        })
        return 1
    }
    ;[['reward', true], ['revoke', false]].forEach(entry => {
        event.register(Commands.literal('abza').requires(source => source.hasPermission(2))
            .then(Commands.literal(entry[0])
                .then(Commands.argument('targets', Arguments.PLAYERS.create(event))
                    .then(Commands.argument('region', Arguments.INTEGER.create(event))
                        .executes(ctx => give(ctx, entry[1]))))))
    })
})
