// Superb Warfare vehicles and turrets charged from a held energy item: sneak and right-click the vehicle
// Each click is one transfer, up to the item's output rate; the item loses only what the vehicle takes
const ForgeCapabilities = Java.loadClass('net.minecraftforge.common.capabilities.ForgeCapabilities')
const VehicleEntity = Java.loadClass('com.atsuishio.superbwarfare.entity.vehicle.base.VehicleEntity')

ItemEvents.entityInteracted(event => {
    const item = event.item
    if (!event.player.isShiftKeyDown() || item.isEmpty()) return
    const vehicle = event.target
    if (!String(vehicle.type).startsWith('superbwarfare:')) return
    if (!(vehicle instanceof VehicleEntity) || !vehicle.hasEnergyStorage()) return

    const source = item.getCapability(ForgeCapabilities.ENERGY).orElse(null)
    if (source == null || !source.canExtract()) return

    // One transfer through the vehicle's own energy methods
    const before = vehicle.getEnergy()
    const offer = source.extractEnergy(vehicle.getMaxEnergy() - before, true)
    if (offer <= 0) return
    vehicle.setEnergy(before + offer)
    const added = vehicle.getEnergy() - before
    if (added <= 0) return
    source.extractEnergy(added, false)
    event.cancel()
})
