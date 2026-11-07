// Repairs: a repairer's dialog option runs /abza repair <player>, which opens a screen of the player's own inventory,
// worn armour and off-hand; a click picks an item (nothing moves), and a button repairs it, or everything worn, for
// cash (any notes, as at a trade). A repair costs the item's worth (ABZA_REPAIRS, trading_table.js) times the share
// worn, times the table's share, at least $1; a gun's attachments are repaired with it and its jam cleared
const $AbzaRepairApi = Java.loadClass('noppes.npcs.api.NpcAPI')
const $AbzaRepairSlot = Java.loadClass('noppes.npcs.api.wrapper.gui.CustomGuiItemSlotWrapper')
const $AbzaRepairButtonEvent = Java.loadClass('noppes.npcs.api.event.CustomGuiEvent$ButtonEvent')
const $AbzaRepairClickEvent = Java.loadClass('noppes.npcs.api.event.CustomGuiEvent$SlotClickEvent')
const $AbzaRepairCloseEvent = Java.loadClass('noppes.npcs.api.event.CustomGuiEvent$CloseEvent')
const $AbzaRepairPriority = Java.loadClass('net.minecraftforge.eventbus.api.EventPriority')
const $AbzaRepairStack = Java.loadClass('net.minecraft.world.item.ItemStack')
const $AbzaArmorItem = Java.loadClass('net.minecraft.world.item.ArmorItem')

const ABZA_REPAIR_GUI = 7301
// Screen parts: title, picked item, its name, its condition, the two buttons
const ABZA_REPAIR_PARTS = { title: 1, item: 2, name: 3, status: 4, one: 10, all: 11 }
// Inventory slots: 0 to 35 the inventory, 36 to 39 boots to helmet, 40 the off-hand; each worn one with its slot icon
const ABZA_REPAIR_WORN = [[39, 5], [38, 6], [37, 7], [36, 8], [40, 4]]
const ABZA_REPAIR_RED = 0xAA2222
const ABZA_REPAIR_TEXT = 0x404040
if (!global.abzaRepairPicks) global.abzaRepairPicks = {}

// The key a stack's worth is listed under: a gun's or hook's id, a melee weapon's, else the item's id
function abzaRepairKey(stack) {
    var id = String(stack.getId())
    var tag = stack.getNbt()
    if (!tag) return id
    if (id == 'tacz:modern_kinetic_gun') return 'gun:' + tag.getString('GunId')
    if (id == 'grapplemod:grapplinghook' && tag.contains('abza_hook')) {
        return 'hook:' + String(tag.getString('abza_hook')).replace('abza:', '')
    }
    if (id == 'lrtactical:melee') return 'lrtactical:melee{' + String(tag.getString('MeleeWeaponId')).split(':').pop() + '}'
    return id
}

// What a stack is worth new, in dollars
function abzaRepairWorth(stack) {
    var table = global.ABZA_REPAIRS
    var worth = table.worth[abzaRepairKey(stack)]
    if (worth) return worth
    if (String(stack.getId()) == 'tacz:attachment') return table.fallback.attachment
    var item = stack.getItem()
    if (item instanceof $AbzaArmorItem) return table.fallback[String(item.getEquipmentSlot().getName())] || table.fallback.tool
    return table.fallback.tool
}

// The share of a stack worn away, 0 to 1
function abzaWornShare(stack) {
    if (!stack.isDamageableItem() || stack.getDamageValue() <= 0 || stack.getMaxDamage() <= 0) return 0
    return stack.getDamageValue() / stack.getMaxDamage()
}

// A gun's fitted attachments as stacks that read and write the gun's own NBT
function abzaGunAttachments(stack) {
    var out = []
    var tag = stack.getNbt()
    if (String(stack.getId()) != 'tacz:modern_kinetic_gun' || !tag) return out
    tag.getAllKeys().forEach(key => {
        if (String(key).indexOf('Attachment') == 0 && tag.contains(key, 10)) {
            out.push($AbzaRepairStack.of(tag.getCompound(key)))
        }
    })
    return out
}

// What repairing a stack costs, in cents (0 when nothing on it is worn)
function abzaRepairCost(stack) {
    if (stack.isEmpty()) return 0
    var dollars = abzaRepairWorth(stack) * abzaWornShare(stack)
    abzaGunAttachments(stack).forEach(part => {
        dollars += global.ABZA_REPAIRS.fallback.attachment * abzaWornShare(part)
    })
    if (dollars <= 0) return 0
    return Math.max(1, Math.ceil(dollars * global.ABZA_REPAIRS.share)) * 100
}

// Repairs a stack in place: its wear, its attachments' wear (in the gun's NBT) and a jam
function abzaRepairStack(stack) {
    if (stack.isDamageableItem()) stack.setDamageValue(0)
    var tag = stack.getNbt()
    if (String(stack.getId()) != 'tacz:modern_kinetic_gun' || !tag) return
    tag.getAllKeys().forEach(key => {
        if (String(key).indexOf('Attachment') == 0 && tag.contains(key, 10)) {
            var part = tag.getCompound(key)
            if (part.contains('tag', 10) && part.getCompound('tag').contains('Damage')) part.getCompound('tag').putInt('Damage', 0)
        }
    })
    if (tag.contains('Jammed')) tag.putBoolean('Jammed', false)
}

// Every slot holding something worn: [slot, cents]
function abzaWornSlots(player) {
    var inventory = player.getInventory()
    var out = []
    for (var slot = 0; slot < inventory.getContainerSize(); slot++) {
        var cost = abzaRepairCost(inventory.getItem(slot))
        if (cost > 0) out.push([slot, cost])
    }
    return out
}

// Sets the screen's parts: the picked item (or the hint), its cost and the buttons' totals
function abzaRepairFill(gui, player, note, noteColour) {
    var api = $AbzaRepairApi.Instance()
    var picked = global.abzaRepairPicks[player.getStringUuid()]
    var stack = picked == null ? null : player.getInventory().getItem(picked)
    var cost = stack ? abzaRepairCost(stack) : 0
    var all = abzaWornSlots(player).reduce((sum, entry) => sum + entry[1], 0)
    var item = gui.getComponent(ABZA_REPAIR_PARTS.item)
    var name = gui.getComponent(ABZA_REPAIR_PARTS.name)
    var status = gui.getComponent(ABZA_REPAIR_PARTS.status)
    var one = gui.getComponent(ABZA_REPAIR_PARTS.one)
    var every = gui.getComponent(ABZA_REPAIR_PARTS.all)
    item.setStack(api.getIItemStack(stack && !stack.isEmpty() ? stack.copy() : Item.of('minecraft:air')))
    name.setText(stack && !stack.isEmpty() ? stack.getHoverName().getString() : 'Click a worn item.')
    if (note) {
        status.setText(note)
        status.setColor(noteColour)
    } else if (stack && !stack.isEmpty()) {
        var share = abzaWornShare(stack)
        status.setText(cost ? `Condition ${Math.floor((1 - share) * 100)}%` : 'Nothing to fix.')
        status.setColor(ABZA_REPAIR_TEXT)
    } else {
        status.setText('')
        status.setColor(ABZA_REPAIR_TEXT)
    }
    one.setLabel(cost ? `Repair: ${abzaCashText(cost)}` : 'Repair')
    one.setEnabled(cost > 0)
    every.setLabel(all ? `All: ${abzaCashText(all)}` : 'All')
    every.setEnabled(all > 0)
}

// Refreshes an open screen: the whole screen is sent again, as CustomNPCs' own menus do (a part sent alone stopped
// showing after the first time the screen was opened)
function abzaRepairRefresh(gui, player, note, noteColour) {
    abzaRepairFill(gui, player, note, noteColour)
    gui.update()
}

// Pays for and repairs the given slots ([slot, cents]); a line on the screen says what happened
function abzaRepairSlots(gui, player, slots) {
    var price = slots.reduce((sum, entry) => sum + entry[1], 0)
    if (price <= 0) return
    var cash = abzaCarriedCash(player)
    if (cash[0] < price) {
        abzaRepairRefresh(gui, player, `Not enough cash: ${abzaCashText(price - cash[0])} short.`, ABZA_REPAIR_RED)
        return
    }
    abzaTakeCash(player, cash, price)
    slots.forEach(entry => abzaRepairStack(player.getInventory().getItem(entry[0])))
    player.level.playSound(null, player.x, player.y, player.z, 'minecraft:block.smithing_table.use', 'players', 0.8, 1)
    abzaRepairRefresh(gui, player, `Repaired for ${abzaCashText(price)}.`, ABZA_REPAIR_TEXT)
}

// Opens the repair screen for a player
function abzaOpenRepairs(player) {
    var api = $AbzaRepairApi.Instance()
    var gui = api.createCustomGui(ABZA_REPAIR_GUI, 176, 180, false, api.getIEntity(player))
    gui.setBackgroundTexture('customnpcs:textures/gui/components.png')
    gui.getBackgroundRect().setTextureOffset(0, 0)
    gui.getBackgroundRect().setRepeatingTexture(64, 64, 4)
    gui.addLabel(ABZA_REPAIR_PARTS.title, 'Repairs', 8, 6, 160, 10)
    gui.addItemRenderer(ABZA_REPAIR_PARTS.item, 8, 20, 16, 16, api.getIItemStack(Item.of('minecraft:air')))
    gui.addLabel(ABZA_REPAIR_PARTS.name, 'Click a worn item.', 30, 20, 140, 10)
    gui.addLabel(ABZA_REPAIR_PARTS.status, '', 30, 31, 140, 10)
    gui.addButton(ABZA_REPAIR_PARTS.one, 'Repair', 8, 46, 78, 20)
    gui.addButton(ABZA_REPAIR_PARTS.all, 'All', 90, 46, 78, 20)
    gui.showPlayerInventory(8, 96, true)
    var worn = gui.getPlayerSlots()
    ABZA_REPAIR_WORN.forEach((entry, i) => worn.add(new $AbzaRepairSlot(8 + i * 18, 72, player).setGuiType(entry[1])
        .setID(entry[0])))
    delete global.abzaRepairPicks[player.getStringUuid()]
    abzaRepairFill(gui, player)
    api.getIEntity(player).showCustomGui(gui)
    return true
}

// The screen's events: every click is cancelled (nothing moves) and picks the clicked item; the buttons repair
global.abzaRepairClicked = event => {
    if (event.gui.getID() != ABZA_REPAIR_GUI) return
    event.setCanceled(true)
    if (!event.slot || !event.slot.isPlayerSlot()) return
    var player = event.player.getMCEntity()
    global.abzaRepairPicks[player.getStringUuid()] = event.slot.getID()
    abzaRepairRefresh(event.gui, player)
}
global.abzaRepairPressed = event => {
    if (event.gui.getID() != ABZA_REPAIR_GUI) return
    var player = event.player.getMCEntity()
    if (event.buttonId == ABZA_REPAIR_PARTS.all) {
        abzaRepairSlots(event.gui, player, abzaWornSlots(player))
        return
    }
    var picked = global.abzaRepairPicks[player.getStringUuid()]
    if (event.buttonId != ABZA_REPAIR_PARTS.one || picked == null) return
    var cost = abzaRepairCost(player.getInventory().getItem(picked))
    if (cost > 0) abzaRepairSlots(event.gui, player, [[picked, cost]])
}
global.abzaRepairClosed = event => {
    if (event.gui.getID() == ABZA_REPAIR_GUI) delete global.abzaRepairPicks[event.player.getMCEntity().getStringUuid()]
}

// CustomNPCs posts its screens' events on its own bus; each listener is registered once, its handler read fresh
if (!global.abzaRepairListeners) global.abzaRepairListeners = {}
function abzaRepairListen(name, eventClass, handler) {
    if (global.abzaRepairListeners[name]) return
    global.abzaRepairListeners[name] = true
    $AbzaRepairApi.Instance().events().addListener($AbzaRepairPriority.NORMAL, false, eventClass, event => {
        try {
            if (global[handler]) global[handler](event)
        } catch (error) {
            console.error(`repairs.js: ${handler} failed: ${error}`)
        }
    })
}
abzaRepairListen('click', $AbzaRepairClickEvent, 'abzaRepairClicked')
abzaRepairListen('button', $AbzaRepairButtonEvent, 'abzaRepairPressed')
abzaRepairListen('close', $AbzaRepairCloseEvent, 'abzaRepairClosed')

// /abza repair <player>: opens the repair screen (a dialog option's command, with @dp for the player)
ServerEvents.commandRegistry(event => {
    var Commands = event.commands
    var Arguments = event.arguments
    event.register(Commands.literal('abza').requires(source => source.hasPermission(2))
        .then(Commands.literal('repair')
            .then(Commands.argument('player', Arguments.PLAYER.create(event))
                .executes(ctx => abzaOpenRepairs(Arguments.PLAYER.getResult(ctx, 'player')) ? 1 : 0))))
})
