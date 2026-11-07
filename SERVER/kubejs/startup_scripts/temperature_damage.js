// Temperature damage: Cold Sweat's freezing and overheating hits take a share of the player's max health, larger in
// later regions (Cold Sweat's own amount is replaced)
const ABZA_TEMPERATURE_DAMAGE = ['cold_sweat:cold', 'cold_sweat:cold_scaling', 'cold_sweat:hot', 'cold_sweat:hot_scaling']
const ABZA_TEMPERATURE_SHARE = { 1: 0.0475, 2: 0.055, 3: 0.0625, 4: 0.07, 5: 0.0775, 6: 0.085, 7: 0.0925, 8: 0.1 }
const ABZA_TEMPERATURE_DIMENSIONS = {
    'ad_astra:moon': 4, 'ad_astra:earth_orbit': 4, 'ad_astra:moon_orbit': 4,
    'abza:cinder': 5, 'abza:cinder_orbit': 5, 'abza:eden': 6, 'abza:eden_orbit': 6,
    'abza:umbra': 7, 'abza:umbra_orbit': 7, 'abza:interloper': 8, 'abza:interloper_orbit': 8
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingHurtEvent', event => {
    var player = event.getEntity()
    if (!(player instanceof $AbzaPlayer)) return
    if (ABZA_TEMPERATURE_DAMAGE.indexOf(abzaDamageType(event.getSource())) < 0) return
    var dimension = String(player.getLevel().getDimension())
    var region = ABZA_TEMPERATURE_DIMENSIONS[dimension] || player.getPersistentData().getInt('abza_region') || 1
    event.setAmount(player.getMaxHealth() * ABZA_TEMPERATURE_SHARE[region])
})
