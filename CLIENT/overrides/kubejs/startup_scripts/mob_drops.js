// Mobs of these mods, vanilla zombies and zombie horses drop only their region's natural drops, by mob class
// (mob_drops_table.js); everything else they would drop is cleared
const $EntityType = Java.loadClass('net.minecraft.world.entity.EntityType')
const $ItemEntity = Java.loadClass('net.minecraft.world.entity.item.ItemEntity')
const $DamageTypeTags = Java.loadClass('net.minecraft.tags.DamageTypeTags')

const DROPLESS_MODS = ['infectious', 'undead_revamp2', 'prionmod', 'entomophobia', 'the_eyes_are_back',
    'the_flesh_that_hates', 'phayriosisreborn', 'spore', 'hordes']
const DROPLESS_MOBS = ['minecraft:zombie', 'minecraft:zombie_horse']

// What each class drops: [list in the region's table, how many rolls]
const ABZA_CLASS_DROPS = {
    common: [['common', 1], ['uncommon', 1]],
    mini: [['mini', 1], ['common', 1]],
    boss: [['boss', 1], ['mini', 2]],
    final: [['boss', 3], ['mini', 4], ['common', 6], ['unique', 1]]
}

function abzaRoll(entry) {
    if (Math.random() >= entry[3]) return 0
    return entry[1] + Math.floor(Math.random() * (entry[2] - entry[1] + 1))
}

function abzaDrop(event, id, count) {
    if (count <= 0) return
    var entity = event.getEntity()
    event.getDrops().add(new $ItemEntity(entity.getLevel(), entity.getX(), entity.getY() + 0.5, entity.getZ(), Item.of(id, count)))
}

function abzaNaturalDrops(event, mobId) {
    var row = (global.ABZA_MOBS || {})[mobId]
    if (!row) return
    var table = (global.ABZA_DROPS || {})[String(row[0])]
    var plan = ABZA_CLASS_DROPS[row[1]]
    if (!table || !plan) return
    // Commons killed by explosions drop nothing
    if (row[1] == 'common' && event.getSource().is($DamageTypeTags.IS_EXPLOSION)) return
    plan.forEach(part => {
        (table[part[0]] || []).forEach(entry => {
            var total = 0
            for (var i = 0; i < part[1]; i++) total += abzaRoll(entry)
            abzaDrop(event, entry[0], total)
        })
    })
    var specimens = table.specimens || []
    if (row[1] == 'common' && specimens.length > 0 && Math.random() < global.ABZA_SPECIMEN_CHANCE) {
        abzaDrop(event, specimens[Math.floor(Math.random() * specimens.length)], 1)
    }
    abzaAmmoDrops(event, row)
}

// Ammo: the region's rounds only; the killer's gun's round when it fires one of them, else one at random
function abzaAmmoDrops(event, row) {
    var region = (global.ABZA_AMMO || {})[String(row[0])]
    var range = (global.ABZA_AMMO_DROPS || {})[row[1]]
    if (!region || !range || region.ammo.length == 0) return
    var ammo = region.ammo[Math.floor(Math.random() * region.ammo.length)]
    var killer = event.getSource().getActual()
    if (killer && killer.isPlayer()) {
        var held = killer.getMainHandItem()
        var tag = held.getNbt()
        if (String(held.getId()) == 'tacz:modern_kinetic_gun' && tag && tag.contains('GunId')) {
            var own = region.guns[String(tag.getString('GunId'))]
            if (own) ammo = own
        }
    }
    var count = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1))
    var entity = event.getEntity()
    while (count > 0) {
        var stack = Item.of('tacz:ammo', Math.min(count, 30), `{AmmoId:"${ammo}"}`)
        event.getDrops().add(new $ItemEntity(entity.getLevel(), entity.getX(), entity.getY() + 0.5, entity.getZ(), stack))
        count -= 30
    }
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDropsEvent', event => {
    const id = String($EntityType.getKey(event.getEntity().getType()))
    if (DROPLESS_MOBS.indexOf(id) >= 0 || DROPLESS_MODS.indexOf(id.split(':')[0]) >= 0) {
        event.getDrops().clear()
        abzaNaturalDrops(event, id)
    }
})

// Mods that spawn their own drops some ticks after one of their mobs dies, outside the drops event: items and XP that
// appear at the exact spot of the death, after its tick and within ABZA_LATE_DROP_TICKS, are removed
const $ExperienceOrb = Java.loadClass('net.minecraft.world.entity.ExperienceOrb')
const ABZA_LATE_DROP_MODS = ['phayriosisreborn']
const ABZA_LATE_DROP_TICKS = 120
const ABZA_LATE_DROP_SPOTS = []

function abzaForgetLateDropSpots(now) {
    while (ABZA_LATE_DROP_SPOTS.length > 0 && ABZA_LATE_DROP_SPOTS[0].time + ABZA_LATE_DROP_TICKS < now) {
        ABZA_LATE_DROP_SPOTS.shift()
    }
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDeathEvent', event => {
    var entity = event.getEntity()
    if (ABZA_LATE_DROP_MODS.indexOf(String($EntityType.getKey(entity.getType())).split(':')[0]) < 0) return
    var level = entity.getLevel()
    abzaForgetLateDropSpots(level.getTime())
    ABZA_LATE_DROP_SPOTS.push({ level: level, x: entity.getX(), y: entity.getY(), z: entity.getZ(), time: level.getTime() })
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.EntityJoinLevelEvent', event => {
    if (ABZA_LATE_DROP_SPOTS.length == 0) return
    var entity = event.getEntity()
    if (!(entity instanceof $ItemEntity) && !(entity instanceof $ExperienceOrb)) return
    var now = event.getLevel().getTime()
    abzaForgetLateDropSpots(now)
    var late = ABZA_LATE_DROP_SPOTS.some(spot => spot.level == event.getLevel() && spot.time < now &&
        Math.abs(spot.x - entity.getX()) < 0.01 && Math.abs(spot.y - entity.getY()) < 0.01 && Math.abs(spot.z - entity.getZ()) < 0.01)
    if (late) event.setCanceled(true)
})

// Totems of undying are cut: one a mob hands out anyway (Spore's Hexenmeister, finished off while it plays dead)
// never reaches the world
const $AbzaItems = Java.loadClass('net.minecraft.world.item.Items')

ForgeEvents.onEvent('net.minecraftforge.event.entity.EntityJoinLevelEvent', event => {
    var entity = event.getEntity()
    if (entity instanceof $ItemEntity && entity.getItem().getItem() == $AbzaItems.TOTEM_OF_UNDYING) event.setCanceled(true)
})
