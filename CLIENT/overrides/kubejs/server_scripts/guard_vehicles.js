// Hired guards ride Superb Warfare's vehicles with their player: a following guard near a player in a vehicle takes
// a free seat other than the driver's, and gets out when its player does or when its contract ends.
const $AbzaGuardVehicle = Java.loadClass('com.atsuishio.superbwarfare.entity.vehicle.base.VehicleEntity')
const $AbzaGuardNpc = Java.loadClass('noppes.npcs.entity.EntityNPCInterface')

const ABZA_GUARD_RIDE_TICKS = 5
const ABZA_GUARD_RIDE_REACH = 16
const ABZA_GUARD_RIDE_SEARCH = 32

// A free seat other than the driver's, or -1
function abzaGuardSeat(vehicle) {
    var max = vehicle.getMaxPassengers()
    if (vehicle.getPassengers().size() >= max) return -1
    var seats = vehicle.getOrderedPassengers()
    for (var i = 1; i < max; i++) {
        if (i >= seats.size() || seats.get(i) == null) return i
    }
    return -1
}

// The player's guards nearby board the player's vehicle, or leave a vehicle the player isn't in
function abzaGuardRide(player) {
    var vehicle = player.getVehicle()
    if (vehicle != null && !(vehicle instanceof $AbzaGuardVehicle)) vehicle = null
    var box = player.getBoundingBox().inflate(ABZA_GUARD_RIDE_SEARCH)
    player.level.getEntitiesOfClass($AbzaGuardNpc, box).forEach(npc => {
        var role = npc.role
        if (!role || role.getType() != ABZA_HIRE_FOLLOWER || !abzaHiredBy(role, player)) return
        var following = npc.isFollower()
        var riding = npc.getVehicle()
        if (riding != null) {
            if (riding instanceof $AbzaGuardVehicle && (vehicle == null || riding.getId() != vehicle.getId() || !following)) {
                npc.stopRiding()
            }
            return
        }
        if (vehicle == null || !following) return
        if (player.distanceToEntitySqr(npc) > ABZA_GUARD_RIDE_REACH * ABZA_GUARD_RIDE_REACH) return
        var seat = abzaGuardSeat(vehicle)
        if (seat < 0 || !npc.startRiding(vehicle, false)) return
        if (vehicle.getSeatIndex(npc) == 0 && !vehicle.changeSeat(npc, seat)) npc.stopRiding()
    })
}

ServerEvents.tick(event => {
    if (event.server.getTickCount() % ABZA_GUARD_RIDE_TICKS != 0) return
    event.server.getPlayerList().getPlayers().forEach(player => {
        if (!player.isSpectator()) abzaGuardRide(player)
    })
})
