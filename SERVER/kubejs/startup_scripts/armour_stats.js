// Armour stats: protection, toughness, knockback resistance and durability per piece
const ARMOUR_STATS = [
    ['trol_armor:fwpc_helmet', 1, 0, 0, 88],
    ['trol_armor:fwpc_chestplate', 2, 0, 0, 128],
    ['trol_armor:fwpc_leggings', 2, 0, 0, 120],
    ['trol_armor:fwpc_boots', 1, 0, 0, 104],
    ['trol_armor:police_helmet', 2, 0, 0, 110],
    ['trol_armor:police_chestplate', 4, 0, 0, 160],
    ['trol_armor:police_leggings', 3, 0, 0, 150],
    ['trol_armor:police_boots', 1, 0, 0, 130],
    ['trol_armor:ltv_helmet', 2, 0, 0, 110],
    ['trol_armor:ltv_chestplate', 4, 0, 0, 160],
    ['trol_armor:ltv_leggings', 3, 0, 0, 150],
    ['trol_armor:ltv_boots', 1, 0, 0, 130],
    ['trol_armor:lv_1c_helmet', 2, 0, 0, 110],
    ['trol_armor:lv_1c_chestplate', 4, 0, 0, 160],
    ['trol_armor:lv_1c_leggings', 3, 0, 0, 150],
    ['trol_armor:lv_1c_boots', 1, 0, 0, 130],
    ['trol_armor:trauma_team_helmet', 2, 0.25, 0.0125, 132],
    ['trol_armor:trauma_team_chestplate', 5, 0.25, 0.0125, 192],
    ['trol_armor:trauma_team_leggings', 4, 0.25, 0.0125, 180],
    ['trol_armor:trauma_team_boots', 2, 0.25, 0.0125, 156],
    ['trol_armor:eods_helmet', 2, 0.5, 0.025, 165],
    ['trol_armor:eods_chestplate', 5, 0.5, 0.025, 240],
    ['trol_armor:eods_leggings', 4, 0.5, 0.025, 225],
    ['trol_armor:eods_boots', 2, 0.5, 0.025, 195],
    ['trol_armor:rigmk_1_helmet', 2, 1, 0.05, 220],
    ['trol_armor:rigmk_1_chestplate', 7, 1, 0.05, 320],
    ['trol_armor:rigmk_1_leggings', 5, 1, 0.05, 300],
    ['trol_armor:rigmk_1_boots', 2, 1, 0.05, 260],
    ['ad_astra:space_helmet', 2, 0.75, 0.0375, 220],
    ['ad_astra:space_suit', 5, 0.75, 0.0375, 320],
    ['ad_astra:space_pants', 3, 0.75, 0.0375, 300],
    ['ad_astra:space_boots', 2, 0.75, 0.0375, 260],
    ['ad_astra:netherite_space_helmet', 2, 1.5, 0.075, 275],
    ['ad_astra:netherite_space_suit', 6, 1.5, 0.075, 400],
    ['ad_astra:netherite_space_pants', 5, 1.5, 0.075, 375],
    ['ad_astra:netherite_space_boots', 2, 1.5, 0.075, 325],
    ['trol_armor:mk_1_helmet', 3, 2.5, 0.125, 330],
    ['trol_armor:mk_1_chestplate', 9, 2.5, 0.125, 480],
    ['trol_armor:mk_1_leggings', 7, 2.5, 0.125, 450],
    ['trol_armor:mk_1_boots', 3, 2.5, 0.125, 390],
    ['ad_astra:jet_suit_helmet', 3, 2, 0.1, 330],
    ['ad_astra:jet_suit', 7, 2, 0.1, 480],
    ['ad_astra:jet_suit_pants', 5, 2, 0.1, 450],
    ['ad_astra:jet_suit_boots', 3, 2, 0.1, 390],
    ['trol_armor:lowexo_helmet', 4, 3.5, 0.175, 385],
    ['trol_armor:lowexo_chestplate', 10, 3.5, 0.175, 560],
    ['trol_armor:lowexo_leggings', 8, 3.5, 0.175, 525],
    ['trol_armor:lowexo_boots', 4, 3.5, 0.175, 455],
    ['trol_armor:exo_helmet', 5, 5, 0.25, 495],
    ['trol_armor:exo_chestplate', 12, 5, 0.25, 720],
    ['trol_armor:exo_leggings', 9, 5, 0.25, 675],
    ['trol_armor:exo_boots', 4, 5, 0.25, 585],
    ['trol_armor:armor_117_helmet', 3, 2.5, 0.125, 330],
    ['trol_armor:armor_117_chestplate', 9, 2.5, 0.125, 480],
    ['trol_armor:armor_117_leggings', 7, 2.5, 0.125, 450],
    ['trol_armor:armor_117_boots', 3, 2.5, 0.125, 390],
]

ItemEvents.modification(event => {
    ARMOUR_STATS.forEach(([id, protection, toughness, knockback, durability]) => {
        event.modify(id, item => {
            item.armorProtection = protection
            item.armorToughness = toughness
            item.armorKnockbackResistance = knockback
            item.maxDamage = durability
        })
    })
})
