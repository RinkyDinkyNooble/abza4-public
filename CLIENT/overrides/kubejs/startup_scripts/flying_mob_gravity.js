// Planet gravity leaves alone any entity without gravity of its own, such as flying mobs
const EntityGravityEvent = Java.loadClass('earth.terrarium.adastra.api.events.AdAstraEvents$EntityGravityEvent')

EntityGravityEvent.register((entity, gravity) => entity.isNoGravity() ? 1.0 : gravity)
