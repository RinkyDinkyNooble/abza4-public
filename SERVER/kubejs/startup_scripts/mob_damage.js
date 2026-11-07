// Mob damage to players, final bosses against plain bullets, armour that grows with wounds, bosses' last hits, credit
// for final boss kills, and natural spawns of mini-bosses, bosses and final bosses. The numbers are in
// server_scripts/mob_stats_table.js.
const $AbzaEntityType = Java.loadClass('net.minecraft.world.entity.EntityType')
const $AbzaPlayer = Java.loadClass('net.minecraft.world.entity.player.Player')

const ABZA_PLAIN_BULLETS = ['tacz:bullet', 'tacz:bullet_void']
const ABZA_FINAL_BULLET_SHARE = 0.1

function abzaMobRow(entity) {
    var mobs = global.ABZA_MOBS
    if (!mobs || !entity) return null
    return mobs[String($AbzaEntityType.getKey(entity.getType()))] || null
}

function abzaDamageType(source) {
    var key = source.typeHolder().unwrapKey()
    return key.isPresent() ? String(key.get().location()) : ''
}

// The players who earn credit for a hit: the attacker, or everyone aboard the vehicle it fires from
function abzaCreditedPlayers(attacker) {
    var out = []
    if (!attacker) return out
    var vehicle = attacker instanceof $AbzaPlayer ? attacker.getVehicle() : attacker
    if (attacker instanceof $AbzaPlayer && !vehicle) return [attacker]
    if (!vehicle) return out
    vehicle.getPassengers().forEach(p => {
        if (p instanceof $AbzaPlayer) out.push(p)
    })
    if (attacker instanceof $AbzaPlayer && out.indexOf(attacker) < 0) out.push(attacker)
    return out
}

// Damage types a mod deals its mobs' hits with, from inside its own attack handler and with no attacker: the mob
// attacking at that moment is taken as the attacker
const ABZA_UNATTRIBUTED_HITS = { 'phayriosisreborn:wasconverted': 'phayriosisreborn' }
const ABZA_ATTACKING = { target: null, attacker: null }
const $AbzaForgeBus = Java.loadClass('net.minecraftforge.common.MinecraftForge').EVENT_BUS
const $AbzaEventPriority = Java.loadClass('net.minecraftforge.eventbus.api.EventPriority')
const $AbzaLivingAttackEvent = Java.loadClass('net.minecraftforge.event.entity.living.LivingAttackEvent')
const $AbzaLivingHurtEvent = Java.loadClass('net.minecraftforge.event.entity.living.LivingHurtEvent')

// A mob's attack on a player: noted before the mods' own handlers run, cleared after them
try {
    $AbzaForgeBus.addListener($AbzaEventPriority.HIGH, false, $AbzaLivingAttackEvent, event => {
        var attacker = event.getSource().getActual()
        if (!attacker || attacker instanceof $AbzaPlayer || !(event.getEntity() instanceof $AbzaPlayer)) return
        ABZA_ATTACKING.target = event.getEntity()
        ABZA_ATTACKING.attacker = attacker
    })
    $AbzaForgeBus.addListener($AbzaEventPriority.LOWEST, false, $AbzaLivingAttackEvent, event => {
        if (event.getSource().getActual() != ABZA_ATTACKING.attacker || event.getEntity() != ABZA_ATTACKING.target) return
        ABZA_ATTACKING.target = null
        ABZA_ATTACKING.attacker = null
    })
} catch (error) {
    console.error('mob_damage.js: the attack listeners could not be registered: ' + error)
}

function abzaUnattributedAttacker(target, source) {
    var mod = ABZA_UNATTRIBUTED_HITS[abzaDamageType(source)]
    var attacker = ABZA_ATTACKING.attacker
    if (!mod || !attacker || ABZA_ATTACKING.target != target) return null
    return String($AbzaEntityType.getKey(attacker.getType())).split(':')[0] == mod ? attacker : null
}

// Damage types mobs deal from their own tick with no attacker (Spore's Verfalldrache, its fallen head and the
// Conductor strike with vanilla's lightning): the closest of those mobs near the player is taken as the attacker
const ABZA_NEARBY_HITS = { 'minecraft:lightning_bolt': ['spore:verfall', 'spore:verfall_head', 'spore:conductor'] }
const ABZA_NEARBY_RANGE = 48
const $AbzaMob = Java.loadClass('net.minecraft.world.entity.Mob')

function abzaNearbyAttacker(target, source) {
    var ids = ABZA_NEARBY_HITS[abzaDamageType(source)]
    if (!ids) return null
    var best = null
    var bestDistance = ABZA_NEARBY_RANGE * ABZA_NEARBY_RANGE
    target.getLevel().getEntitiesOfClass($AbzaMob, target.getBoundingBox().inflate(ABZA_NEARBY_RANGE)).forEach(mob => {
        if (ids.indexOf(String($AbzaEntityType.getKey(mob.getType()))) < 0) return
        var dx = mob.getX() - target.getX()
        var dy = mob.getY() - target.getY()
        var dz = mob.getZ() - target.getZ()
        var distance = dx * dx + dy * dy + dz * dz
        if (distance < bestDistance) {
            best = mob
            bestDistance = distance
        }
    })
    return best
}

// Spore's Knight and Inquisitor gain armour as they lose health, half a point for each point they miss, which assumes
// Spore's own health: with ABZA's the rise follows the share of health they miss. [Spore's max health, the most
// armour it reaches (0: no cap)]
const ABZA_WOUND_ARMOUR = {
    'spore:knight': [25, 0],
    'spore:inquisitor': [60, 21]
}
const $AbzaArmourAttributes = Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')

function abzaWoundArmour(mob, row) {
    var wound = ABZA_WOUND_ARMOUR[String($AbzaEntityType.getKey(mob.getType()))]
    var armour = mob.getAttribute($AbzaArmourAttributes.ARMOR)
    if (!wound || !armour || mob.getMaxHealth() <= 0) return
    var value = row[3] + (1 - mob.getHealth() / mob.getMaxHealth()) * wound[0] / 2
    armour.setBaseValue(wound[1] > 0 ? Math.min(value, wound[1]) : value)
}

// Before armour, after Superb Warfare passes part of a seated player's hit to the vehicle: mobs hit players at their
// region's numbers; Superb Warfare's own damage (its vehicles, wrecks and shells) isn't a mob's hit
function abzaPlayerHurt(event) {
    var target = event.getEntity()
    if (!(target instanceof $AbzaPlayer)) return
    var source = event.getSource()
    var direct = source.getImmediate()
    if (direct && String($AbzaEntityType.getKey(direct.getType())).indexOf('superbwarfare:') == 0) return
    var attacker = source.getActual() || abzaUnattributedAttacker(target, source) || abzaNearbyAttacker(target, source)
    if (attacker && !(attacker instanceof $AbzaPlayer)) {
        var row = abzaMobRow(attacker)
        if (row) event.setAmount(event.getAmount() * row[4])
    }
}

try {
    $AbzaForgeBus.addListener($AbzaEventPriority.LOW, false, $AbzaLivingHurtEvent, event => abzaPlayerHurt(event))
} catch (error) {
    console.error('mob_damage.js: the player hurt listener could not be registered: ' + error)
}

// Before armour: plain bullets do a tenth to final bosses; Spore's wounded Knight and Inquisitor
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingHurtEvent', event => {
    var target = event.getEntity()
    var source = event.getSource()
    if (target instanceof $AbzaPlayer) return
    var own = abzaMobRow(target)
    if (own) abzaWoundArmour(target, own)
    if (own && own[1] == 'final' && ABZA_PLAIN_BULLETS.indexOf(abzaDamageType(source)) >= 0) {
        event.setAmount(event.getAmount() * ABZA_FINAL_BULLET_SHARE)
    }
})

// After armour: the time of a player's last hit on a boss or final boss, and the damage each player deals to a final
// boss, kept on the mob
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDamageEvent', event => {
    var target = event.getEntity()
    var row = abzaMobRow(target)
    if (!row || (row[1] != 'final' && row[1] != 'boss')) return
    var players = abzaCreditedPlayers(event.getSource().getActual())
    if (players.length == 0) return
    var data = target.getPersistentData()
    data.putLong('abza_hit', target.getLevel().getTime())
    if (row[1] != 'final') return
    var amount = Math.min(event.getAmount(), target.getHealth())
    var credit = data.getCompound('abza_credit')
    players.forEach(p => {
        var id = String(p.getStringUuid())
        credit.putFloat(id, credit.getFloat(id) + amount)
    })
    data.put('abza_credit', credit)
})

// Natural spawns: final bosses never; mini-bosses and bosses only by chance
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.MobSpawnEvent$FinalizeSpawn', event => {
    var row = abzaMobRow(event.getEntity())
    if (!row) return
    var type = String(event.getSpawnType().name())
    if (type != 'NATURAL' && type != 'CHUNK_GENERATION') return
    if (row[1] == 'final') {
        event.setSpawnCancelled(true)
        return
    }
    var chance = (global.ABZA_NATURAL_CHANCE || {})[row[1]]
    if (chance !== undefined && Math.random() >= chance) event.setSpawnCancelled(true)
})
