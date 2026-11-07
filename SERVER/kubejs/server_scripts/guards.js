// Guards for hire: an NPC placed with /spawnNPC's hire option (and a kit) follows and guards the player who pays its
// day rate (ABZA_HIRE, trading_table.js, by its tier), with CustomNPCs' Follower role and Guard job. Its dialog's
// options hire it, extend the contract and give it orders; a day is a Minecraft day, and when the days run out it
// says goodbye and walks home.
const $AbzaHireUtil = Java.loadClass('noppes.npcs.NoppesUtilServer')

const ABZA_HIRE_FOLLOWER = 2
const ABZA_HIRE_FAREWELL = "That's the last day you paid for. I'm heading back."

// Makes a placed NPC a guard for hire
function abzaSetUpHire(npc) {
    var mcNpc = npc.getMCEntity()
    mcNpc.advanced.setRole(ABZA_HIRE_FOLLOWER)
    mcNpc.role.disableGui = true
    mcNpc.role.dialogFarewell = ABZA_HIRE_FAREWELL
}

// Whether a guard's contract is a player's
function abzaHiredBy(role, player) {
    var owner = role.getOwner()
    return owner != null && String(owner.getName().getString()) == String(player.getName().getString())
}

// /abza hire's work: what (rate, a number of days, stay, follow) for the guard the player is talking to
function abzaHire(player, what) {
    var mcNpc = $AbzaHireUtil.getEditingNpc(player)
    if (!mcNpc || !mcNpc.role || mcNpc.role.getType() != ABZA_HIRE_FOLLOWER) return false
    var role = mcNpc.role
    var mine = abzaHiredBy(role, player)
    var taken = role.hasOwner() && role.getDays() > 0 && !mine
    var rate = global.ABZA_HIRE[String(Number(mcNpc.wrappedNPC.getStoreddata().get('abza_tier')) || 1)] * 100
    if (what == 'rate') {
        var left = mine && role.getDays() > 0 ? ` ${role.getDays()} day${role.getDays() == 1 ? '' : 's'} left.` : ''
        player.tell(Text.gray(`${abzaCashText(rate)} a day.${left}`))
        return true
    }
    if (taken) {
        player.tell(Text.gray(`${mcNpc.getName().getString()} is working for someone else.`))
        return true
    }
    if (what == 'stay' || what == 'follow') {
        if (!mine) {
            player.tell(Text.gray(`${mcNpc.getName().getString()} isn't working for you.`))
            return true
        }
        role.isFollowing = what == 'follow'
        player.tell(Text.gray(what == 'follow' ? 'Following you.' : 'Waiting here.'))
        return true
    }
    var days = parseInt(what)
    if (!(days > 0)) return false
    var price = rate * days
    var cash = abzaCarriedCash(player)
    if (cash[0] < price) {
        player.tell(Text.red(`Not enough cash: ${abzaCashText(price - cash[0])} short.`))
        return true
    }
    abzaTakeCash(player, cash, price)
    role.setOwner(player)
    role.addDays(days)
    role.isFollowing = true
    player.tell(Text.gray(`Hired: ${role.getDays()} day${role.getDays() == 1 ? '' : 's'} left, ${abzaCashText(price)} paid.`))
    return true
}

// /abza hire <player> <rate|days|stay|follow>: a dialog option's command, with @dp for the player
ServerEvents.commandRegistry(event => {
    var Commands = event.commands
    var Arguments = event.arguments
    event.register(Commands.literal('abza').requires(source => source.hasPermission(2))
        .then(Commands.literal('hire')
            .then(Commands.argument('player', Arguments.PLAYER.create(event))
                .then(Commands.argument('what', Arguments.WORD.create(event))
                    .executes(ctx => abzaHire(Arguments.PLAYER.getResult(ctx, 'player'),
                        String(Arguments.WORD.getResult(ctx, 'what'))) ? 1 : 0)))))
})
