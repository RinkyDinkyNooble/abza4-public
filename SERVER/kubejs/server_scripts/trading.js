// Traders' markets: a page of ABZA_MARKETS (trading_table.js) is filled into a trader's market when it opens, a
// trade's rule decides who may buy it, and a price in notes can be paid with any notes and coins the player carries,
// the change given back
const $AbzaTradeApi = Java.loadClass('noppes.npcs.api.NpcAPI')
const $AbzaTradeUtil = Java.loadClass('noppes.npcs.NoppesUtilServer')
const $AbzaTradeMenu = Java.loadClass('noppes.npcs.containers.ContainerNPCTrader')
const $AbzaTradeFailedEvent = Java.loadClass('noppes.npcs.api.event.RoleEvent$TradeFailedEvent')
const $AbzaTraderEvent = Java.loadClass('noppes.npcs.api.event.RoleEvent$TraderEvent')
const $AbzaNpcInteractEvent = Java.loadClass('noppes.npcs.api.event.NpcEvent$InteractEvent')
const $AbzaTradePriority = Java.loadClass('net.minecraftforge.eventbus.api.EventPriority')
const $AbzaTradeStack = Java.loadClass('net.minecraft.world.item.ItemStack')

// Saro's Money's notes and coins, in cents, largest first
const ABZA_CASH = [
    ['saros__money_mod:euro_500', 50000], ['saros__money_mod:euro_200', 20000], ['saros__money_mod:euro_100', 10000],
    ['saros__money_mod:euro_50', 5000], ['saros__money_mod:euro_20', 2000], ['saros__money_mod:euro_10', 1000],
    ['saros__money_mod:euro_5', 500], ['saros__money_mod:euro_2', 200], ['saros__money_mod:euro_1', 100],
    ['saros__money_mod:cent_50', 50], ['saros__money_mod:cent_20', 20], ['saros__money_mod:cent_10', 10],
    ['saros__money_mod:cent_5', 5], ['saros__money_mod:cent_2', 2], ['saros__money_mod:cent_1', 1]
]
const ABZA_CASH_VALUE = {}
ABZA_CASH.forEach(entry => { ABZA_CASH_VALUE[entry[0]] = entry[1] })
const ABZA_TRADE_WEEK = 168000

// A market stack from its [item, NBT, count]
function abzaMarketStack(entry) {
    var stack = entry[1].indexOf('hook:') == 0 ? global.abzaGrappleHook(entry[1].substring(5))
        : entry[1] ? Item.of(entry[0], entry[1]) : Item.of(entry[0])
    stack.setCount(entry[2])
    return stack
}

// Fills a trader's market with a page's trades
function abzaFillMarket(npc, page) {
    var api = $AbzaTradeApi.Instance()
    var role = npc.getRole()
    var trades = global.ABZA_MARKETS[page]
    role.setMarket('')
    for (var slot = 0; slot < 18; slot++) {
        var trade = trades[slot]
        if (!trade) {
            role.remove(slot)
            continue
        }
        var payment = trade[1].map(entry => api.getIItemStack(abzaMarketStack(entry)))
        role.set(slot, payment[0], payment.length > 1 ? payment[1] : null, api.getIItemStack(abzaMarketStack(trade[0])))
    }
    npc.getStoreddata().put('abza_page', page)
}

// Whether another player has this trader's market open
function abzaMarketBusy(player, mcNpc) {
    var players = player.server.getPlayerList().getPlayers()
    for (var i = 0; i < players.size(); i++) {
        var other = players.get(i)
        if (other != player && other.containerMenu instanceof $AbzaTradeMenu && other.containerMenu.role == mcNpc.role) {
            return true
        }
    }
    return false
}

// Opens a page of the market of the NPC the player is talking to ("stored": the page it was spawned with)
function abzaOpenMarket(player, page) {
    var mcNpc = $AbzaTradeUtil.getEditingNpc(player)
    if (mcNpc && page == 'stored') page = String(mcNpc.wrappedNPC.getStoreddata().get('abza_market'))
    if (!mcNpc || !global.ABZA_MARKETS[page]) return false
    if (!mcNpc.role || mcNpc.role.getType() != ABZA_NPC_TRADER) {
        console.warn(`trading.js: ${mcNpc.getName().getString()} isn't a trader, so page ${page} can't open`)
        return false
    }
    if (abzaMarketBusy(player, mcNpc)) {
        player.tell(Text.gray(`${mcNpc.getName().getString()} is serving someone else.`))
        return true
    }
    abzaFillMarket(mcNpc.wrappedNPC, page)
    mcNpc.role.interact(player)
    return true
}

// The trade on the NPC's current page that sells this item: [index, trade], or null
function abzaFindTrade(npc, sold) {
    var page = npc.getStoreddata().get('abza_page')
    var trades = page ? global.ABZA_MARKETS[String(page)] : null
    if (!trades) return null
    for (var i = 0; i < trades.length; i++) {
        var stack = abzaMarketStack(trades[i][0])
        if (stack.getCount() == sold.getCount() && $AbzaTradeStack.isSameItemSameTags(stack, sold)) {
            return [String(page) + ':' + i, trades[i]]
        }
    }
    return null
}

// Why a player may not buy a trade (a chat line), or null; a weekly or counted purchase is recorded when record is set
function abzaTradeRefused(iplayer, npc, sold, record) {
    var found = abzaFindTrade(npc, sold)
    var rule = found ? found[1][2] : null
    if (!rule) return null
    var player = iplayer.getMCEntity()
    if (rule.reached && !player.stages.has(`abza_reached_t${rule.reached}`)) return rule.says
    if (rule.friendly != null && $AbzaTradeApi.Instance().getFactions().get(rule.friendly).playerStatus(iplayer) < 1) {
        return rule.says
    }
    if (rule.quest && !iplayer.hasFinishedQuest(rule.quest)) return rule.says
    var data = player.server.persistentData
    var all = data.getCompound('abza_trades')
    var mine = all.getCompound(player.getStringUuid())
    var key = found[0]
    var now = player.server.getOverworld().getDayTime()
    if (rule.weekly) {
        var last = mine.contains(key) ? mine.getLong(key) : -ABZA_TRADE_WEEK
        if (now - last < ABZA_TRADE_WEEK) {
            var days = Math.ceil((ABZA_TRADE_WEEK - (now - last)) / 24000)
            return `One a week: the next in ${days} day${days == 1 ? '' : 's'}.`
        }
    }
    var counted = 'bought:' + String(sold.getId())
    var bought = mine.getInt(counted)
    if (rule.total) {
        if (bought >= rule.total.length) return rule.most
        if (!player.stages.has(`abza_reached_t${rule.total[bought][0]}`)) return rule.total[bought][1]
    }
    if (record && (rule.weekly || rule.total)) {
        if (rule.weekly) mine.putLong(key, now)
        if (rule.total) mine.putInt(counted, bought + 1)
        all.put(player.getStringUuid(), mine)
        data.put('abza_trades', all)
    }
    return null
}

// A stack's worth in cents, if it's cash; a payment that isn't cash is worth nothing
function abzaCashOf(stack) {
    if (!stack) return 0
    var mc = stack.getMCItemStack()
    if (mc.isEmpty()) return 0
    var value = ABZA_CASH_VALUE[String(mc.getId())]
    return value ? value * mc.getCount() : -1
}

// "$12" or "$12.50"
function abzaCashText(cents) {
    return '$' + (cents % 100 ? (cents / 100).toFixed(2) : String(cents / 100))
}

// A trade with the exact payment: refused when its rule says so
global.abzaTradeChecked = event => {
    var refused = abzaTradeRefused(event.player, event.npc, event.sold.getMCItemStack(), true)
    if (!refused) return
    event.setCanceled(true)
    event.player.getMCEntity().tell(Text.red(refused))
}

// The cash a player carries: [cents, the inventory slots holding it]
function abzaCarriedCash(player) {
    var inventory = player.getInventory()
    var carried = 0
    var slots = []
    for (var slot = 0; slot < inventory.getContainerSize(); slot++) {
        var stack = inventory.getItem(slot)
        var value = stack.isEmpty() ? 0 : ABZA_CASH_VALUE[String(stack.getId())]
        if (value) {
            carried += value * stack.getCount()
            slots.push(slot)
        }
    }
    return [carried, slots]
}

// Takes a price from the cash a player carries (abzaCarriedCash's), giving the change back in the largest notes
function abzaTakeCash(player, cash, price) {
    var inventory = player.getInventory()
    cash[1].forEach(slot => inventory.getItem(slot).setCount(0))
    var change = cash[0] - price
    ABZA_CASH.forEach(entry => {
        var count = Math.floor(change / entry[1])
        change -= count * entry[1]
        while (count > 0) {
            var stack = Item.of(entry[0], Math.min(count, 64))
            count -= stack.getCount()
            if (!inventory.add(stack)) player.drop(stack, false)
        }
    })
}

// A trade the player lacks the exact notes for: paid with whatever cash they carry, the change given back
global.abzaTradeFailed = event => {
    var first = abzaCashOf(event.currency1)
    var second = abzaCashOf(event.currency2)
    if (first < 0 || second < 0 || first + second == 0) return
    var price = first + second
    var player = event.player.getMCEntity()
    var cash = abzaCarriedCash(player)
    if (cash[0] < price) {
        player.tell(Text.red(`Not enough cash: ${abzaCashText(price - cash[0])} short.`))
        return
    }
    var refused = abzaTradeRefused(event.player, event.npc, event.sold.getMCItemStack(), true)
    if (refused) {
        player.tell(Text.red(refused))
        return
    }
    abzaTakeCash(player, cash, price)
    var bought = event.sold.getMCItemStack().copy()
    var held = player.containerMenu.getCarried()
    if (!held.isEmpty()) bought.grow(held.getCount())
    event.receiving = $AbzaTradeApi.Instance().getIItemStack(bought)
}

// A trader with a page of its own (a field or camp trader) gets the page's current trades whenever it's talked to
global.abzaTraderTalkedTo = event => {
    var page = event.npc.getStoreddata().get('abza_market')
    if (!page || !global.ABZA_MARKETS[String(page)]) return
    var mcNpc = event.npc.getMCEntity()
    if (abzaMarketBusy(event.player.getMCEntity(), mcNpc)) return
    abzaFillMarket(event.npc, String(page))
}

// CustomNPCs posts trades and talks on its own event bus; each listener is registered once, its handler read fresh
if (!global.abzaTradeListeners) global.abzaTradeListeners = {}
function abzaListenOnce(name, eventClass, handler) {
    if (global.abzaTradeListeners[name]) return
    global.abzaTradeListeners[name] = true
    $AbzaTradeApi.Instance().events().addListener($AbzaTradePriority.NORMAL, false, eventClass, event => {
        try {
            if (global[handler]) global[handler](event)
        } catch (error) {
            console.error(`trading.js: ${handler} failed: ${error}`)
        }
    })
}
if (global.abzaTradeListener) global.abzaTradeListeners.failed = true
abzaListenOnce('failed', $AbzaTradeFailedEvent, 'abzaTradeFailed')
abzaListenOnce('trader', $AbzaTraderEvent, 'abzaTradeChecked')
abzaListenOnce('interact', $AbzaNpcInteractEvent, 'abzaTraderTalkedTo')

// /abza market <player> <page>: opens a page of the market of the NPC the player is talking to (a dialog option's
// command, with @dp for the player)
ServerEvents.commandRegistry(event => {
    var Commands = event.commands
    var Arguments = event.arguments
    event.register(Commands.literal('abza').requires(source => source.hasPermission(2))
        .then(Commands.literal('market')
            .then(Commands.argument('player', Arguments.PLAYER.create(event))
                .then(Commands.argument('page', Arguments.WORD.create(event))
                    .executes(ctx => abzaOpenMarket(Arguments.PLAYER.getResult(ctx, 'player'),
                        String(Arguments.WORD.getResult(ctx, 'page'))) ? 1 : 0)))))
})
