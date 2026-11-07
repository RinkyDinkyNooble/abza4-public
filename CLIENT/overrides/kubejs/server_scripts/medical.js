// Afflictions, resting and vaccines: a player in a region they aren't vaccinated for has its affliction and doesn't
// heal naturally; anywhere else (the Moon, orbits, vaccinated regions) they heal by resting with a fed food bar. On
// Earth, between regions (rivers, oceans), a player keeps the last region's affliction. The numbers are in
// startup_scripts/medical_table.js.
const $AbzaEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
const $AbzaEffectRegistry = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const $AbzaEffectId = Java.loadClass('net.minecraft.resources.ResourceLocation')

const ABZA_AFFLICTION_TICKS = 20

// The affliction effects by region, looked up once the first time they're needed
const abzaMedical = { effects: null }

function abzaAfflictionEffects() {
    if (abzaMedical.effects == null) {
        abzaMedical.effects = {}
        Object.keys(global.ABZA_MEDICAL.afflictions).forEach(region => {
            var id = global.ABZA_MEDICAL.afflictions[region].effect
            abzaMedical.effects[region] = $AbzaEffectRegistry.MOB_EFFECT.get(new $AbzaEffectId(id))
        })
    }
    return abzaMedical.effects
}

// The region a player stands in (0: none), from the biome's tags; on Earth outside every region, the last one
function abzaPlayerRegion(player) {
    var data = player.getPersistentData()
    var tags = player.serverLevel().getBiome(player.blockPosition()).tags().iterator()
    while (tags.hasNext()) {
        var region = global.ABZA_MEDICAL.regions[String(tags.next().location())]
        if (region) {
            data.putInt('abza_region', region)
            return region
        }
    }
    if (String(player.level.getDimension()) != 'minecraft:overworld') return 0
    return data.getInt('abza_region')
}

// The region's affliction on the player unless they're vaccinated; every other affliction off
function abzaUpdateAffliction(player, region) {
    if (region && player.stages.has('abza_vaccine_t' + region)) region = 0
    var effects = abzaAfflictionEffects()
    Object.keys(effects).forEach(key => {
        var effect = effects[key]
        if (!effect) return
        var has = player.hasEffect(effect)
        if (String(key) == String(region)) {
            if (!has) player.addEffect(new $AbzaEffectInstance(effect, -1, 0, true, false, true))
        } else if (has) player.removeEffect(effect)
    })
    return region
}

// Resting: vanilla's regeneration, scaled to max health, only without an affliction
function abzaRest(player) {
    var rest = global.ABZA_MEDICAL.rest
    if (player.isDeadOrDying() || player.getHealth() >= player.getMaxHealth()) return
    if (player.getFoodData().getFoodLevel() < rest.food) return
    player.heal(Math.max(1, player.getMaxHealth() * rest.share))
    player.causeFoodExhaustion(rest.exhaustion)
}

ServerEvents.tick(event => {
    var tick = event.server.getTickCount()
    if (tick % ABZA_AFFLICTION_TICKS != 0) return
    var resting = tick % global.ABZA_MEDICAL.rest.interval == 0
    event.server.getPlayerList().getPlayers().forEach(player => {
        if (player.isSpectator()) return
        var where = abzaPlayerRegion(player)
        var region = abzaUpdateAffliction(player, where)
        if (resting && !region) abzaRest(player)
        abzaUpdateDialogFlags(player, where)
    })
})

// A vaccine injected (startup_scripts/medical.js): the region's affliction ends for good (a stage, kept through death)
global.abzaVaccinate = (player, region) => {
    player.stages.add('abza_vaccine_t' + region)
    var row = global.ABZA_MEDICAL.afflictions[String(region)]
    var effect = abzaAfflictionEffects()[String(region)]
    if (effect) player.removeEffect(effect)
    player.tell(Text.green(`Immune to ${row.name}: natural healing works in ${row.region}.`))
    player.level.playSound(null, player.x, player.y, player.z, 'minecraft:entity.player.hurt_sweet_berry_bush', 'players', 1, 1)
}

// A blood pack used (startup_scripts/medical.js): it restores max health lost to deaths, or heals when none is lost
global.abzaBloodPack = player => {
    var death = global.ABZA_MEDICAL.death
    var lost = abzaLostHealth(player)
    if (lost <= 0) {
        player.heal(player.getMaxHealth() * death.heal)
        return
    }
    var restored = Math.min(lost, Math.max(death.minimum, Math.round(abzaEarnedHealth(player) * death.restore)))
    abzaSetLostHealth(player, lost - restored)
    abzaRebuildHealth(player)
    player.tell(Text.green(`Blood pack: +${restored} max health restored` + (lost > restored ? ` (${lost - restored} still lost).` : '.')))
}
