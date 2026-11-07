// Vanilla zombies spawn with no armour and nothing in their hands
const $AbzaEquipmentSlot = Java.loadClass('net.minecraft.world.entity.EquipmentSlot')
const $AbzaItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')

EntityEvents.spawned('minecraft:zombie', event => {
    var zombie = event.entity
    var data = zombie.getPersistentData()
    if (data.getBoolean('abza_bare')) return
    data.putBoolean('abza_bare', true)
    var slots = $AbzaEquipmentSlot.values()
    for (var i = 0; i < slots.length; i++) zombie.setEquipment(slots[i], $AbzaItemStack.EMPTY)
})
