// Creative tab icons: tabs whose own icon item is cut show one of their kept items instead
const ABZA_TAB_ICONS = {
    'infectious:infectious': 'infectious:barbed_wire',
    'undead_revamp2:theundeadcreative': 'undead_revamp2:bomber_spawn_egg',
    'the_flesh_that_hates:the_flesh_that_hates': 'the_flesh_that_hates:flesh_heart',
    'phayriosisreborn:phayriosis_tech': 'phayriosisreborn:dravarium_495_ingot',
    'the_eyes_are_back:ingredients_tab': 'the_eyes_are_back:eye',
    'the_eyes_are_back:functional_blocks_tab': 'the_eyes_are_back:eye_o_lantern',
    'superbwarfare:ammo': 'superbwarfare:heavy_ammo',
    'superbwarfare:item': 'superbwarfare:crowbar',
    'cold_sweat:cold_sweat': 'cold_sweat:hearth',
    'lootr:lootr': 'lootr:lootr_chest',
    'securitycraft:technical': 'securitycraft:keypad_item'
}

Object.keys(ABZA_TAB_ICONS).forEach(tab => {
    StartupEvents.modifyCreativeTab(tab, event => event.setIcon(ABZA_TAB_ICONS[tab]))
})
