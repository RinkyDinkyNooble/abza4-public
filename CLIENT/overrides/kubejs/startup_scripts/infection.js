// Effects: Infectious' and Prion's own infection effects and Infectious' radiation never apply, and a player who has
// one loses it; nothing cures an effect (milk is taken off every effect's cures as it's applied, and honey no longer
// clears poison). Phayriosis' radiation stays at 0 on players, and the fire plutonium sets on its carrier goes out.
const $AbzaEffectResult = Java.loadClass('net.minecraftforge.eventbus.api.Event$Result')
const $AbzaRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const $AbzaResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const $AbzaArrayList = Java.loadClass('java.util.ArrayList')
const $AbzaEffectItems = Java.loadClass('net.minecraft.world.item.Items')
const $AbzaEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')

const ABZA_BLOCKED_EFFECTS = ['infectious:infection', 'prionmod:infection', 'infectious:radiation']
// How often each player is checked for a blocked effect, in ticks (1: every tick; 20: once a second)
const ABZA_EFFECT_SWEEP_TICKS = 20
const ABZA_RADIATION_ATTRIBUTE = 'phayriosisreborn:radiation'
// Plutonium sets its carrier on fire for 2 seconds (raw, nuggets) or 3 (ingots), counted in ticks
const ABZA_PLUTONIUM = ['phayriosisreborn:raw_plutonium', 'phayriosisreborn:plutonium_nugget', 'phayriosisreborn:plutonium_ingot']
const ABZA_PLUTONIUM_FIRE_TICKS = [40, 60]

// The blocked effects and the radiation attribute, looked up once the first time they're needed
const abzaInfection = { effects: null, radiation: null }

function abzaBlockedEffects() {
    if (abzaInfection.effects == null) {
        abzaInfection.effects = []
        ABZA_BLOCKED_EFFECTS.forEach(id => {
            var effect = $AbzaRegistries.MOB_EFFECT.get(new $AbzaResourceLocation(id))
            if (effect) abzaInfection.effects.push(effect)
        })
    }
    return abzaInfection.effects
}

function abzaRadiationAttribute() {
    if (abzaInfection.radiation == null) {
        abzaInfection.radiation = $AbzaRegistries.ATTRIBUTE.get(new $AbzaResourceLocation(ABZA_RADIATION_ATTRIBUTE))
    }
    return abzaInfection.radiation
}

function abzaCarriesPlutonium(player) {
    var inventory = player.getInventory()
    for (var i = 0; i < inventory.getContainerSize(); i++) {
        if (ABZA_PLUTONIUM.indexOf(String(inventory.getItem(i).getId())) >= 0) return true
    }
    return false
}

// Runs for every effect applied to any creature: denies a blocked effect, and leaves every other with no cures
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.MobEffectEvent$Applicable', event => {
    var instance = event.getEffectInstance()
    var effect = instance.getEffect()
    var blocked = abzaBlockedEffects()
    for (var i = 0; i < blocked.length; i++) {
        if (effect == blocked[i]) {
            event.setResult($AbzaEffectResult.DENY)
            return
        }
    }
    instance.setCurativeItems(new $AbzaArrayList())
})

// Honey clears poison in its own code: the removal is refused while a honey bottle is being drunk
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.MobEffectEvent$Remove', event => {
    if (event.getEffect() != $AbzaEffects.POISON) return
    if (event.getEntity().getUseItem().getItem() == $AbzaEffectItems.HONEY_BOTTLE) event.setCanceled(true)
})

// At the start of each player tick: radiation back to 0, and a fresh plutonium fire put out. Once a second at the
// end: a blocked effect that got through anyway (applied before this script, or forced past the check above) is cleared.
ForgeEvents.onEvent('net.minecraftforge.event.TickEvent$PlayerTickEvent', event => {
    var player = event.player
    if (player.level.isClientSide()) return
    if (String(event.phase) == 'START') {
        var radiation = abzaRadiationAttribute() ? player.getAttribute(abzaRadiationAttribute()) : null
        if (radiation && radiation.getBaseValue() != 0) radiation.setBaseValue(0)
        var fire = Number(player.getRemainingFireTicks())
        if (ABZA_PLUTONIUM_FIRE_TICKS.indexOf(fire) >= 0 && abzaCarriesPlutonium(player)) {
            player.extinguish()
        }
        return
    }
    if (player.tickCount % ABZA_EFFECT_SWEEP_TICKS != 0) return
    abzaBlockedEffects().forEach(effect => {
        if (player.hasEffect(effect)) player.removeEffect(effect)
    })
})
