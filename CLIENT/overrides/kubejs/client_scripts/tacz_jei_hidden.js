// TaCZ calibers no gun fires and the creative ammo boxes, hidden from JEI
JEIEvents.hideItems(event => {
    ["tacz:30_06", "tacz:338", "tacz:46x30", "tacz:500mag", "tacz:50bmg", "tacz:545x39", "tacz:58x42", "tacz:68x51fury", "tacz:762x25", "tacz:762x54"].forEach(ammo => event.hide(Item.of('tacz:ammo', `{AmmoId:"${ammo}"}`).weakNBT()))
    event.hide(Item.of('tacz:ammo_box', '{Creative:1b}').weakNBT())
    event.hide(Item.of('tacz:ammo_box', '{AllTypeCreative:1b}').weakNBT())
})
