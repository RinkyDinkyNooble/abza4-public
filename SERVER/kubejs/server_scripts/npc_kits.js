// NPC weapon kits (ABZA_NPC_KITS, npc_kit_table.js): /spawnNPC's kit and tier options, or /armNPC later, store them on
// the NPC, and its weapon, shots, health and tactics are set from the table at spawn and whenever it loads. A shot
// does its gun's damage to mobs and NPCs and the kit's share of it to players (npc_shots.js). A bad faction's NPC
// drops cash, rounds of its gun, sometimes the gun itself (worn) and a find from its region's loot; a player's kill
// moves faction points.
const $AbzaKitApi = Java.loadClass('noppes.npcs.api.NpcAPI')
const $AbzaKitLaunched = Java.loadClass('noppes.npcs.api.event.NpcEvent$RangedLaunchedEvent')
const $AbzaKitDied = Java.loadClass('noppes.npcs.api.event.NpcEvent$DiedEvent')
const $AbzaKitPriority = Java.loadClass('net.minecraftforge.eventbus.api.EventPriority')
const $AbzaKitNpcEntity = Java.loadClass('noppes.npcs.entity.EntityNPCInterface')
const $AbzaKitItemEntity = Java.loadClass('net.minecraft.world.entity.item.ItemEntity')
const $AbzaKitPlayer = Java.loadClass('net.minecraft.world.entity.player.Player')

// CustomNPCs' settings: resistances by index, the normal drop style, the Guard job
const ABZA_KIT_MELEE = 0
const ABZA_KIT_KNOCKBACK = 3
const ABZA_KIT_DROPS_FALL = 0
const ABZA_KIT_SOUNDS = 3
const ABZA_KIT_GUARD = 3
// The clone whose guard targets an armed NPC takes (tab, name)
const ABZA_KIT_TEMPLATE = [1, 'template_armed']

// The kit and tier an NPC carries, with that tier's numbers and weapon, or null
function abzaNpcKit(npc) {
    var data = npc.getStoreddata()
    if (!data.has('abza_kit')) return null
    var kit = global.ABZA_NPC_KITS[String(data.get('abza_kit'))]
    var tier = Number(data.get('abza_tier')) || 1
    if (!kit || !kit.tiers[tier]) return null
    var numbers = kit.tiers[tier]
    return { kit: kit, tier: tier, numbers: numbers, weapon: kit.weapons[numbers.w] }
}

// The tier of a spot: its region, the Moon 4, else 1
function abzaSpotTier(level, pos) {
    var region = abzaBlockRegion(level, pos)
    if (region) return region
    return String(level.getDimension()) == 'ad_astra:moon' ? 4 : 1
}

// Sets an NPC up from its kit; fresh (at spawn or a new kit) also fills its health
function abzaApplyKit(npc, fresh) {
    var found = abzaNpcKit(npc)
    if (!found) return
    var api = $AbzaKitApi.Instance()
    var kit = found.kit
    var numbers = found.numbers
    var weapon = found.weapon
    var mcNpc = npc.getMCEntity()
    var stats = npc.getStats()
    var ai = npc.getAi()
    var inventory = npc.getInventory()
    if (mcNpc.job.getType() != ABZA_KIT_GUARD) {
        mcNpc.advanced.setJob(ABZA_KIT_GUARD)
        mcNpc.job.load($AbzaNpcCloneStore.Instance.getCloneData(null, ABZA_KIT_TEMPLATE[1], ABZA_KIT_TEMPLATE[0]))
    }
    stats.setMaxHealth(numbers.health)
    stats.setHealthRegen(numbers.regen)
    stats.setCombatRegen(numbers.combat)
    stats.setAggroRange(weapon.aggro)
    stats.setResistance(ABZA_KIT_KNOCKBACK, kit.knockback)
    ai.setDoorInteract(kit.door)
    ai.setTacticalType(kit.tactic)
    ai.setTacticalRange(kit.radius)
    var held = weapon.hand[1] ? Item.of(weapon.hand[0], weapon.hand[1]) : Item.of(weapon.hand[0])
    inventory.setRightHand(api.getIItemStack(held))
    if (weapon.reach) {
        inventory.setProjectile(null)
        stats.setResistance(ABZA_KIT_MELEE, weapon.melee_resist)
        var melee = stats.getMelee()
        melee.setStrength(Math.max(1, Math.round(numbers.shot)))
        melee.setDelay(weapon.delay[0])
        melee.setRange(weapon.reach)
    } else {
        inventory.setProjectile(api.getIItemStack(Item.of(weapon.projectile)))
        var ranged = stats.getRanged()
        ranged.setStrength(Math.max(1, Math.round(numbers.shot)))
        ranged.setDelay(weapon.delay[0], weapon.delay[1])
        ranged.setBurst(weapon.burst[0])
        ranged.setBurstDelay(weapon.burst[1])
        ranged.setShotCount(weapon.pellets)
        ranged.setAccuracy(weapon.accuracy)
        ranged.setRange(weapon.range)
        for (var sound = 0; sound < ABZA_KIT_SOUNDS; sound++) ranged.setSound(sound, weapon.sounds[sound])
    }
    mcNpc.getPersistentData().putFloat('abza_player_scale', numbers.scale)
    mcNpc.inventory.lootMode = ABZA_KIT_DROPS_FALL
    if (fresh) npc.setHealth(numbers.health)
}

// Takes an NPC's kit away: unarmed, off guard duty, noticing things within 16 blocks (as placed without a kit)
function abzaClearKit(npc) {
    var mcNpc = npc.getMCEntity()
    npc.getStoreddata().remove('abza_kit')
    npc.getStats().setAggroRange(ABZA_NPC_CALM_AGGRO)
    npc.getInventory().setRightHand(null)
    npc.getInventory().setProjectile(null)
    mcNpc.advanced.setJob(ABZA_NPC_NO_JOB)
    mcNpc.getPersistentData().remove('abza_player_scale')
}

;['customnpcs:customnpc', 'customnpcs:customnpcalex'].forEach(type => EntityEvents.spawned(type, event => {
    var npc = $AbzaKitApi.Instance().getIEntity(event.entity)
    if (npc.getStoreddata().has('abza_kit')) abzaApplyKit(npc, false)
}))

// /armNPC <targets> <kit|none> [tier]: gives NPCs already placed another kit (none takes it away), at the tier given,
// else the one they have, else their spot's
function abzaArmNpcs(source, targets, kit, tier) {
    if (kit != 'none' && !global.ABZA_NPC_KITS[kit]) return abzaCommandFail(source, `no NPC kit ${kit}`)
    if (tier !== null && (tier < 1 || tier > 8)) return abzaCommandFail(source, `tier ${tier} isn't 1 to 8`)
    var count = 0
    targets.forEach(entity => {
        if (!(entity instanceof $AbzaKitNpcEntity)) return
        var npc = $AbzaKitApi.Instance().getIEntity(entity)
        var data = npc.getStoreddata()
        if (kit == 'none') {
            abzaClearKit(npc)
        } else {
            if (tier !== null) data.put('abza_tier', tier)
            else if (!data.has('abza_tier')) data.put('abza_tier', abzaSpotTier(entity.getLevel(), entity.blockPosition()))
            data.put('abza_kit', kit)
            abzaApplyKit(npc, true)
        }
        npc.updateClient()
        count++
    })
    return count > 0 ? count : abzaCommandFail(source, 'no NPC among the targets')
}

ServerEvents.commandRegistry(event => {
    var Commands = event.commands
    var Arguments = event.arguments
    var targets = ctx => Arguments.ENTITIES.getResult(ctx, 'targets')
    var kit = ctx => String(Arguments.WORD.getResult(ctx, 'kit'))
    event.register(Commands.literal('armNPC').requires(source => source.hasPermission(2))
        .then(Commands.argument('targets', Arguments.ENTITIES.create(event))
            .then(Commands.argument('kit', Arguments.WORD.create(event))
                .executes(ctx => abzaArmNpcs(ctx.source, targets(ctx), kit(ctx), null))
                .then(Commands.argument('tier', Arguments.INTEGER.create(event))
                    .executes(ctx => abzaArmNpcs(ctx.source, targets(ctx), kit(ctx),
                        Arguments.INTEGER.getResult(ctx, 'tier')))))))
})

// Cash as Saro's notes (ABZA_CASH, trading.js), largest first
function abzaCashStacks(dollars) {
    var out = []
    var cents = dollars * 100
    ABZA_CASH.forEach(entry => {
        var count = Math.floor(cents / entry[1])
        cents -= count * entry[1]
        while (count > 0) {
            var stack = Item.of(entry[0], Math.min(count, 64))
            count -= stack.getCount()
            out.push(stack)
        }
    })
    return out
}

// A weighted pick from a loot category of the region (ABZA_LOOT), as a stack, or null
function abzaKitFind(categories, tier) {
    var pools = categories.map(c => global.ABZA_LOOT[`${c}_t${tier}`]).filter(p => p && p.length)
    if (!pools.length) return null
    var pool = pools[Math.floor(Math.random() * pools.length)]
    var total = pool.reduce((sum, entry) => sum + entry[2], 0)
    var roll = Math.random() * total
    for (var i = 0; i < pool.length; i++) {
        roll -= pool[i][2]
        if (roll > 0) continue
        var entry = pool[i]
        var stack = entry[1] ? Item.of(entry[0], entry[1]) : Item.of(entry[0])
        stack.setCount(entry[3] + Math.floor(Math.random() * (entry[4] - entry[3] + 1)))
        return stack
    }
    return null
}

// What a bad faction's NPC drops: cash, its rounds, sometimes its gun (worn) and a find
function abzaKitDrops(found) {
    var drops = global.ABZA_NPC_DROPS
    var kit = found.kit
    var weapon = found.weapon
    var out = []
    var cash = drops.income[found.tier] * drops.cash_hours * (0.5 + Math.random()) * (kit.leader ? drops.leader_cash : 1)
    abzaCashStacks(Math.max(1, Math.round(cash))).forEach(stack => out.push(stack))
    if (weapon.ammo && weapon.ammo[0] && Math.random() < drops.rounds[0]) {
        var rounds = Item.of(weapon.ammo[0], weapon.ammo[1])
        rounds.setCount(drops.rounds[1] + Math.floor(Math.random() * (drops.rounds[2] - drops.rounds[1] + 1)))
        out.push(rounds)
    }
    if (weapon.ammo && Math.random() < drops.gun[0]) {
        var gun = Item.of(weapon.hand[0], weapon.hand[1])
        var worn = drops.gun[1] + Math.random() * (drops.gun[2] - drops.gun[1])
        if (gun.getMaxDamage() > 0) gun.setDamageValue(Math.round(gun.getMaxDamage() * worn))
        out.push(gun)
    }
    if (Math.random() < drops.find[0]) {
        var find = abzaKitFind(drops.find[1], found.tier)
        if (find) out.push(find)
    }
    return out
}

// Faction points a player's kill moves (ABZA_NPC_DEATH_POINTS): a good NPC costs its faction; a bad one raises the
// factions it preys on (on the Moon, Station Crew too), a leader more
function abzaKitDeathPoints(event, found) {
    var killer = event.source ? event.source.getMCEntity() : null
    if (!(killer instanceof $AbzaKitPlayer)) return
    var rules = global.ABZA_NPC_DEATH_POINTS
    var player = $AbzaKitApi.Instance().getIEntity(killer)
    var faction = String(event.npc.getFaction().getId())
    if (rules.good.indexOf(Number(faction)) >= 0) {
        player.addFactionPoints(Number(faction), -rules.lose)
        return
    }
    var raised = (rules.raise[faction] || []).slice()
    if (String(killer.getLevel().getDimension()) == 'ad_astra:moon') raised = raised.concat(rules.moon[faction] || [])
    var points = found && found.kit.leader ? rules.leader : rules.points
    raised.forEach(id => player.addFactionPoints(id, points))
}

// Each shot carries its gun's damage, as a decimal (CustomNPCs sets a shot's damage to the whole number before this
// event)
global.abzaKitLaunched = event => {
    var found = abzaNpcKit(event.npc)
    if (!found) return
    event.projectiles.forEach(projectile => {
        projectile.getMCEntity().damage = found.numbers.shot
    })
}

// A dead NPC drops no experience; a bad faction's drops its kit's loot where it died
global.abzaKitDied = event => {
    event.expDropped = 0
    var found = abzaNpcKit(event.npc)
    abzaKitDeathPoints(event, found)
    if (!found || global.ABZA_NPC_DROPS.factions.indexOf(event.npc.getFaction().getId()) < 0) return
    var body = event.npc.getMCEntity()
    var level = body.getLevel()
    abzaKitDrops(found).forEach(stack => {
        var drop = new $AbzaKitItemEntity(level, body.getX(), body.getY() + 0.5, body.getZ(), stack)
        drop.setDefaultPickUpDelay()
        level.addFreshEntity(drop)
    })
}

// CustomNPCs posts NPC events on its own bus; each listener is registered once, its handler read fresh
if (!global.abzaKitListeners) global.abzaKitListeners = {}
function abzaKitListen(name, eventClass, handler) {
    if (global.abzaKitListeners[name]) return
    global.abzaKitListeners[name] = true
    $AbzaKitApi.Instance().events().addListener($AbzaKitPriority.NORMAL, false, eventClass, event => {
        try {
            if (global[handler]) global[handler](event)
        } catch (error) {
            console.error(`npc_kits.js: ${handler} failed: ${error}`)
        }
    })
}
abzaKitListen('launched', $AbzaKitLaunched, 'abzaKitLaunched')
abzaKitListen('died', $AbzaKitDied, 'abzaKitDied')
