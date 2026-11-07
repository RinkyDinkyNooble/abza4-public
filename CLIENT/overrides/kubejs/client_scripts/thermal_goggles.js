// Superb Warfare's thermal view (on or off, kept only on the client): sent to the server whenever it changes, and
// again after joining a world
const $AbzaThermalView = Java.loadClass('com.atsuishio.superbwarfare.event.ClientEventHandler')
const ABZA_THERMAL_REPORT = { sent: '' }

ClientEvents.loggedIn(event => {
    ABZA_THERMAL_REPORT.sent = ''
})

ClientEvents.tick(event => {
    var state = $AbzaThermalView.activeThermalImaging == true ? 'on' : 'off'
    if (state == ABZA_THERMAL_REPORT.sent || !Client.player) return
    ABZA_THERMAL_REPORT.sent = state
    Client.player.sendData('abza_thermal_view', { on: state == 'on' })
})
