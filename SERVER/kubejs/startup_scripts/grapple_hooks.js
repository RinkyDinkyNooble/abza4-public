// priority: 10
// Grappling hooks: each hook's name, rarity colour and settings. Every hook is the Grappling Hook item with its id
// in abza_hook and its settings in custom; settings left out keep the mod's defaults (rope 30, throw speed 2,
// swing speed 1, no motor, one hook, no rocket)
const GRAPPLE_HOOKS = {
    "bare": {
        "name": "Grappling Hook",
        "colour": "white",
        "custom": {"maxlen": 30, "throwspeed": 2, "playermovementmult": 1}
    },
    "motor": {
        "name": "Motorized Grappling Hook",
        "colour": "yellow",
        "custom": {"maxlen": 34, "throwspeed": 2.25, "playermovementmult": 1.15, "motor": true, "motormaxspeed": 4}
    },
    "dual": {
        "name": "Dual Grappling Hooks",
        "colour": "aqua",
        "custom": {"maxlen": 38, "throwspeed": 2.5, "playermovementmult": 1.3, "motor": true, "motormaxspeed": 4.4,
                   "doublehook": true, "smartdoublemotor": true}
    },
    "rocket": {
        "name": "Rocket Grappling Hook",
        "colour": "light_purple",
        "custom": {"maxlen": 42, "throwspeed": 2.75, "playermovementmult": 1.45, "motor": true, "motormaxspeed": 4.8,
                   "smartmotor": true, "rocket": true}
    },
    "dual_rocket": {
        "name": "Dual Rocket Grappling Hooks",
        "colour": "light_purple",
        "custom": {"maxlen": 42, "throwspeed": 2.75, "playermovementmult": 1.45, "motor": true, "motormaxspeed": 4.8,
                   "smartmotor": true, "doublehook": true, "smartdoublemotor": true, "rocket": true}
    }
}

// A hook as an item stack
function abzaGrappleHookItem(id) {
    var hook = GRAPPLE_HOOKS[id]
    var custom = Object.keys(hook.custom).map(key => {
        var value = hook.custom[key]
        return key + ':' + (value === true ? '1b' : value.toFixed(2) + 'd')
    }).join(',')
    var name = JSON.stringify({"text": hook.name, "color": hook.colour, "italic": false})
    return Item.of('grapplemod:grapplinghook', `{abza_hook:"abza:${id}",display:{Name:'${name}'},custom:{${custom}}}`)
}

global.abzaGrappleHook = id => abzaGrappleHookItem(id)
global.abzaGrappleHookIds = Object.keys(GRAPPLE_HOOKS)

// The Grappling Hook tab shows each hook instead of the plain item
StartupEvents.modifyCreativeTab('grapplemod:grapplemod', event => {
    event.remove(Ingredient.custom('grapplemod:grapplinghook', stack => !stack.nbt || !stack.nbt.contains('abza_hook')))
    event.add(Object.keys(GRAPPLE_HOOKS).map(id => abzaGrappleHookItem(id)))
})
