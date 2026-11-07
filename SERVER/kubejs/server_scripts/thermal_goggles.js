// Superb Warfare's thermal imaging goggles lose durability while their thermal view is on (settings in
// startup_scripts/thermal_goggles.js): worn in a Curios slot, every interval of the server's clock, except in a
// vehicle seat with its own thermal view; at 0 they break
const $AbzaGogglesCurios = Java.loadClass('top.theillusivec4.curios.api.CuriosApi')
const $AbzaGogglesVehicle = Java.loadClass('com.atsuishio.superbwarfare.entity.vehicle.base.VehicleEntity')
const ABZA_GOGGLES_ITEM = Item.of('superbwarfare:thermal_imaging_goggles').getItem()

if (global.ABZA_THERMAL_GOGGLES.enabled && !ABZA_GOGGLES_ITEM.canBeDepleted()) {
    console.warn('thermal_goggles.js: the goggles have no durability (the startup script needs a restart to apply)')
}

// Players whose thermal view is on, by UUID (reported by each client)
if (!global.ABZA_THERMAL_ON) global.ABZA_THERMAL_ON = {}

NetworkEvents.dataReceived('abza_thermal_view', event => {
    var uuid = String(event.player.getStringUuid())
    if (event.data.getBoolean('on')) global.ABZA_THERMAL_ON[uuid] = true
    else delete global.ABZA_THERMAL_ON[uuid]
})

PlayerEvents.loggedIn(event => {
    delete global.ABZA_THERMAL_ON[String(event.player.getStringUuid())]
})

PlayerEvents.loggedOut(event => {
    delete global.ABZA_THERMAL_ON[String(event.player.getStringUuid())]
})

// A vehicle seat with its own thermal view (Superb Warfare's seat data); false, logged once, if the names changed
function abzaInThermalSeat(player) {
    var vehicle = player.getVehicle()
    if (!(vehicle instanceof $AbzaGogglesVehicle)) return false
    try {
        var index = vehicle.getSeatIndex(player)
        var seats = vehicle.computed().seats()
        return index >= 0 && index < seats.size() && seats.get(index).hasThermalImaging == true
    } catch (error) {
        if (!global.ABZA_THERMAL_SEAT_ERROR) console.error('thermal_goggles.js: the vehicle seat check failed: ' + error)
        global.ABZA_THERMAL_SEAT_ERROR = true
        return false
    }
}

ServerEvents.tick(event => {
    var settings = global.ABZA_THERMAL_GOGGLES
    if (!settings || !settings.enabled || event.server.getTickCount() % settings.interval != 0) return
    if (Object.keys(global.ABZA_THERMAL_ON).length == 0) return
    event.server.getPlayerList().getPlayers().forEach(player => {
        if (!global.ABZA_THERMAL_ON[String(player.getStringUuid())] || abzaInThermalSeat(player)) return
        var curios = $AbzaGogglesCurios.getCuriosInventory(player).resolve().orElse(null)
        var slot = curios ? curios.findFirstCurio(ABZA_GOGGLES_ITEM).orElse(null) : null
        if (!slot) return
        var stack = slot.stack()
        stack.hurtAndBreak(settings.amount, player, broken => $AbzaGogglesCurios.broadcastCurioBreakEvent(slot.slotContext()))
        if (settings.showTime && !stack.isEmpty()) abzaShowThermalTime(player, stack, settings)
    })
})

// The thermal time left on the action bar, as minutes and seconds (red in the last minute)
function abzaShowThermalTime(player, stack, settings) {
    var left = (stack.getMaxDamage() - stack.getDamageValue()) / settings.amount * settings.interval / 20
    var seconds = Math.max(0, Math.floor(left))
    var time = Math.floor(seconds / 60) + ':' + (seconds % 60 < 10 ? '0' : '') + (seconds % 60)
    var text = 'Thermal goggles: ' + time + ' left'
    player.setStatusMessage(seconds <= 60 ? Text.red(text) : Text.gray(text))
}
