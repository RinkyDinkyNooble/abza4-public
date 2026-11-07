// NPCs' shots: every one lands, as TaCZ's bullets do (a target hit by an NPC's shot has no hurt cooldown against it).
// An armed NPC's hits carry its gun's damage, and a player takes its kit's share of it (abza_player_scale, set by
// npc_kits.js), before armour.
const $AbzaShotBus = Java.loadClass('net.minecraftforge.common.MinecraftForge').EVENT_BUS
const $AbzaShotPriority = Java.loadClass('net.minecraftforge.eventbus.api.EventPriority')
const $AbzaShotAttack = Java.loadClass('net.minecraftforge.event.entity.living.LivingAttackEvent')
const $AbzaShotHurt = Java.loadClass('net.minecraftforge.event.entity.living.LivingHurtEvent')
const $AbzaNpcShot = Java.loadClass('noppes.npcs.entity.EntityProjectile')
const $AbzaShotNpc = Java.loadClass('noppes.npcs.entity.EntityNPCInterface')
const $AbzaShotPlayer = Java.loadClass('net.minecraft.world.entity.player.Player')

try {
    $AbzaShotBus.addListener($AbzaShotPriority.HIGHEST, false, $AbzaShotAttack, event => {
        if (event.getSource().getImmediate() instanceof $AbzaNpcShot) event.getEntity().invulnerableTime = 0
    })
    $AbzaShotBus.addListener($AbzaShotPriority.NORMAL, false, $AbzaShotHurt, event => {
        if (!(event.getEntity() instanceof $AbzaShotPlayer)) return
        var attacker = event.getSource().getActual()
        if (!(attacker instanceof $AbzaShotNpc)) return
        var data = attacker.getPersistentData()
        if (data.contains('abza_player_scale')) event.setAmount(event.getAmount() * data.getFloat('abza_player_scale'))
    })
} catch (error) {
    console.error('npc_shots.js: the shot listeners could not be registered: ' + error)
}

// The bullet NPCs fire: a tiny sprite, out of the creative tabs (and JEI, jei_hidden.js)
StartupEvents.registry('item', event => {
    event.create('abza:npc_bullet').displayName('Bullet').texture('abza:item/npc_bullet')
})

StartupEvents.modifyCreativeTab('kubejs:tab', event => event.remove('abza:npc_bullet'))
