// Superb Warfare vehicle containers hidden from JEI
JEIEvents.hideItems(event => {
  ['wheel_chair', 'tom_6', 'happiest_ghast', 'air_sheep', 'kv_16'].forEach(vehicle => {
    event.hide(Item.of('superbwarfare:container', '{BlockEntityTag:{EntityType:"superbwarfare:' + vehicle + '",id:"superbwarfare:container"}}').weakNBT())
  })
})

// Applied Armorer's melee gun, its melee ammo and four of its attachments hidden from JEI
JEIEvents.hideItems(event => {
  event.hide(Item.of('tacz:modern_kinetic_gun', '{GunId:"applied_armorer:special_melee_task_manager"}').weakNBT())
  event.hide(Item.of('tacz:ammo', '{AmmoId:"applied_armorer:melee"}').weakNBT())
  event.hide(Item.of('tacz:attachment', '{AttachmentId:"applied_armorer:si_zako_2403"}').weakNBT())
  event.hide(Item.of('tacz:attachment', '{AttachmentId:"applied_armorer:muzzle_chip_tutorial_sword_mastery"}').weakNBT())
  event.hide(Item.of('tacz:attachment', '{AttachmentId:"applied_armorer:muzzle_chip_toxic_sword"}').weakNBT())
  event.hide(Item.of('tacz:attachment', '{AttachmentId:"applied_armorer:muzzle_chip_wither_sword"}').weakNBT())
})

// Dev Utility tab items hidden from JEI
JEIEvents.hideItems(event => {
  global.devUtilityItems.filter(id => Item.exists(id)).forEach(id => event.hide(id))
})

// The bullet NPCs fire hidden from JEI
JEIEvents.hideItems(event => {
  event.hide(/^abza:npc_bullet$/)
})

// Infection mods' spawn eggs hidden from JEI (allowed mobs' eggs are in the Dev Utility tab)
JEIEvents.hideItems(event => {
  event.hide(/^(infectious|undead_revamp2|prionmod|the_eyes_are_back|the_flesh_that_hates):.+_spawn_egg$/)
  event.hide(/^(entomophobia|the_eyes_are_back):.+_spawn$/)
  event.hide(/^spore:.+_spawnegg$/)
  event.hide(/^phayriosisreborn:spawn.*$/)
})

// SecurityCraft reinforced blocks hidden from JEI
JEIEvents.hideItems(event => {
  event.hide(/^securitycraft:reinforced_/)
  event.hide('securitycraft:door_indestructible_iron_item')
})

// Anvil and brewing categories removed from JEI
JEIEvents.removeCategories(event => {
  event.remove('minecraft:anvil')
  event.remove('minecraft:brewing')
})

// Backpack tier recipes: Sophisticated Backpacks' JEI plugin shows its own copy of each, with the colour variants
JEIEvents.removeRecipes(event => {
  event.remove('minecraft:crafting', [
    'abza:tech/sophisticatedbackpacks/copper_backpack',
    'abza:tech/sophisticatedbackpacks/iron_backpack_from_copper',
    'abza:tech/sophisticatedbackpacks/gold_backpack',
    'abza:tech/sophisticatedbackpacks/diamond_backpack',
    'abza:tech/abza/sophisticatedbackpacks/netherite_backpack'
  ])
})
