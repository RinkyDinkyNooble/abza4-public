// Axes: every axe's attack damage lowered by 4 (its tooltip shows the new value)
const $AbzaAxeItem = Java.loadClass('net.minecraft.world.item.AxeItem')
const ABZA_AXE_DAMAGE_DROP = 4

ItemEvents.modification(event => {
    event.modify('*', item => {
        if (item instanceof $AbzaAxeItem) item.setAttackDamage(Math.max(item.getAttackDamage() - ABZA_AXE_DAMAGE_DROP, 0))
    })
})
