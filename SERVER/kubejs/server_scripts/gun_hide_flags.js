// TaCZ guns: the tooltip parts ABZA's gun tooltips replace stay hidden on every gun (HideFlags: description,
// base, extra, attachment tip and gun pack), from the moment it is in a player's inventory

const ABZA_GUN_HIDE_FLAGS = 61

function abzaHideGunParts(stack) {
    if (!stack || stack.isEmpty() || stack.id != 'tacz:modern_kinetic_gun') return
    let tag = stack.nbt
    if (!tag || !tag.contains('GunId')) return
    if (tag.getInt('HideFlags') != ABZA_GUN_HIDE_FLAGS) tag.putInt('HideFlags', ABZA_GUN_HIDE_FLAGS)
}

PlayerEvents.inventoryChanged(event => abzaHideGunParts(event.item))

PlayerEvents.loggedIn(event => {
    let inventory = event.player.inventory
    for (let i = 0; i < inventory.getContainerSize(); i++) abzaHideGunParts(inventory.getItem(i))
})
