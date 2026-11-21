// Gamerules, set once per world: a rule is set when a world first loads with it in this list, and again only when
// its value here changes
const ABZA_GAMERULES = {
    // Vanilla
    commandBlockOutput: false,
    announceAdvancements: false,
    lavaSourceConversion: true,
    doPatrolSpawning: false,
    doInsomnia: false,
    doTraderSpawning: false,
    naturalRegeneration: false,
    // Superb Warfare
    sbwDoGenerateLoots: false,
    // Infectious
    enableInfection: false,
    enableHordes: false,
    enableAncientZombie: false,
    enableLootdrops: false,
    enableZombifiedChicken: false,
    zombieMutationLevel: 4,
    // The Undead Revamped
    sunray: false,
    // The eYes Are Back
    eyes: 10010
}

ServerEvents.loaded(event => {
    var server = event.server
    var data = server.persistentData
    var applied = data.getCompound('abza_gamerules')
    Object.keys(ABZA_GAMERULES).forEach(rule => {
        var value = String(ABZA_GAMERULES[rule])
        if (applied.getString(rule) == value) return
        server.runCommandSilent('gamerule ' + rule + ' ' + value)
        applied.putString(rule, value)
    })
    data.put('abza_gamerules', applied)
})

// Prion's infection points (its world-wide count, saved with the world): raised to this floor whenever a world loads
const $AbzaPrionState = Java.loadClass('net.demod.prionmod.ServerState')
const ABZA_PRION_POINTS = 10000

ServerEvents.loaded(event => {
    var prion = $AbzaPrionState.getServerState(event.server)
    if (prion.totalInfKills < ABZA_PRION_POINTS) prion.totalInfKills = ABZA_PRION_POINTS
})

// The Flesh That Hates' points (its world-wide count: its phase, which of its mobs spawn and how far its flesh
// spreads): held at this value, set when a world loads and again every minute
const $AbzaFleshWorld = Java.loadClass('net.mcreator.thefleshthathates.FEvents.FleshWorld')
const ABZA_TFTH_POINTS = 6000
const ABZA_TFTH_HOLD_TICKS = 1200

function abzaHoldFleshPoints(server) {
    var level = server.getOverworld()
    var difference = ABZA_TFTH_POINTS - $AbzaFleshWorld.getPoints()
    if (difference == 0) return
    if (difference < 0) $AbzaFleshWorld.subtractPoints(-difference, level)
    $AbzaFleshWorld.addPoints(Math.max(difference, 0), level)
}

ServerEvents.loaded(event => abzaHoldFleshPoints(event.server))

ServerEvents.tick(event => {
    if (event.server.getTickCount() % ABZA_TFTH_HOLD_TICKS == 0) abzaHoldFleshPoints(event.server)
})

// Phayriosis' phase (from its points, kept per dimension: which of its mobs spawn, its spread, its minds): its own
// phase freeze holds the points in every dimension, and Umbra's phase is set to match when a world loads (a frozen
// phase is never recalculated, so the other dimensions stay at phase 1)
const $AbzaPhayriosisWorld = Java.loadClass('net.mcreator.phayriosisreborn.network.PhayriosisrebornModVariables$WorldVariables')
const $AbzaPhayriosisSettings = Java.loadClass('net.mcreator.phayriosisreborn.network.PhayriosisrebornModVariables$MapVariables')
const ABZA_PHAYRIOSIS_DIMENSION = 'abza:umbra'
const ABZA_PHAYRIOSIS_PHASE = 6
const ABZA_PHAYRIOSIS_POINTS = 500000

ServerEvents.loaded(event => {
    var server = event.server
    var settings = $AbzaPhayriosisSettings.get(server.getOverworld())
    if (!settings.phasefrozen || settings.frozenpoints != ABZA_PHAYRIOSIS_POINTS) {
        settings.phasefrozen = true
        settings.frozenpoints = ABZA_PHAYRIOSIS_POINTS
        settings.syncData(server.getOverworld())
    }
    server.getAllLevels().forEach(level => {
        if (String(level.getDimension()) != ABZA_PHAYRIOSIS_DIMENSION) return
        var umbra = $AbzaPhayriosisWorld.get(level)
        if (umbra.phayriosis_phase == ABZA_PHAYRIOSIS_PHASE && umbra.phayriosis_points == ABZA_PHAYRIOSIS_POINTS) return
        umbra.phayriosis_phase = ABZA_PHAYRIOSIS_PHASE
        umbra.phayriosis_points = ABZA_PHAYRIOSIS_POINTS
        umbra.syncData(level)
    })
})
