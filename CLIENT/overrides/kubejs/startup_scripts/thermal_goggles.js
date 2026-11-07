// Superb Warfare's thermal imaging goggles: durability, lost while their thermal view is on (the drain is in
// server_scripts/thermal_goggles.js, the thermal view's state comes from client_scripts/thermal_goggles.js)
// Thermal time per pair, in seconds: durability / amount * interval / 20
global.ABZA_THERMAL_GOGGLES = {
    // false: the goggles have no durability and never wear out
    enabled: true,
    // Durability of a new pair (at least 1)
    durability: 1200,
    // Durability lost each interval while the thermal view is on (1 to the durability)
    amount: 1,
    // Ticks between losses (20 to 1200: one second to one minute)
    interval: 20,
    // true: while the goggles wear out, the action bar shows their thermal time left
    showTime: true
}

// Each setting kept within its range, with a warning when it was outside it
function abzaGogglesSetting(key, min, max) {
    var settings = global.ABZA_THERMAL_GOGGLES
    var value = Math.round(Number(settings[key]))
    if (isNaN(value)) value = min
    var kept = Math.max(min, Math.min(max, value))
    if (kept != settings[key]) console.warn('thermal_goggles.js: ' + key + ' ' + settings[key] + ' is outside ' + min + ' to ' + max + ', using ' + kept)
    settings[key] = kept
}

abzaGogglesSetting('durability', 1, 2147483647)
abzaGogglesSetting('amount', 1, global.ABZA_THERMAL_GOGGLES.durability)
abzaGogglesSetting('interval', 20, 1200)

ItemEvents.modification(event => {
    if (!global.ABZA_THERMAL_GOGGLES.enabled) return
    event.modify('superbwarfare:thermal_imaging_goggles', item => {
        item.maxDamage = global.ABZA_THERMAL_GOGGLES.durability
    })
})
