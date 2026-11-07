// priority: -10
// Egg icons for bestiary mobs that have no spawn egg: icons only, in the Dev Utility tab
global.ABZA_BESTIARY_ICONS = {
    "abza:bestiary_prionmod_tumor": [
        "Tumor",
        9124410,
        14257292
    ],
    "abza:bestiary_prionmod_vulture": [
        "Vulture",
        4864814,
        11051930
    ],
    "abza:bestiary_prionmod_tank": [
        "Tank",
        5983051,
        10365739
    ],
    "abza:bestiary_entomophobia_celestial_carrion": [
        "Celestial Carrion",
        3023936,
        13220095
    ],
    "abza:bestiary_entomophobia_hive_heart": [
        "Hive Heart",
        7020062,
        14721088
    ],
    "abza:bestiary_phayriosisreborn_decayed_human": [
        "Decayed Human",
        6050886,
        9413467
    ],
    "abza:bestiary_phayriosisreborn_infestation_root": [
        "Infestation Root",
        3874603,
        11550810
    ],
    "abza:bestiary_spore_tentacle": [
        "Tentacle",
        7220011,
        12872282
    ]
}

Object.keys(global.ABZA_BESTIARY_ICONS).forEach(id => global.devUtilityItems.push(id))

StartupEvents.registry('item', event => {
    Object.keys(global.ABZA_BESTIARY_ICONS).forEach(id => {
        var icon = global.ABZA_BESTIARY_ICONS[id]
        event.create(id)
            .displayName(`${icon[0]} (Bestiary Icon)`)
            .texture('layer0', 'minecraft:item/spawn_egg')
            .texture('layer1', 'minecraft:item/spawn_egg_overlay')
            .color(0, icon[1])
            .color(1, icon[2])
            .maxStackSize(1)
    })
})
