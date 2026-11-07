// Lava and water poured from a bucket freeze where they land, wherever Cold Sweat's temperature is below -15°C
// Lava becomes obsidian and water becomes ice; inside an oxygen distributor's area both stay liquid
const ColdSweatWorld = Java.loadClass('com.momosoftworks.coldsweat.util.world.WorldHelper')
const OxygenApi = Java.loadClass('earth.terrarium.adastra.api.systems.OxygenApi')
const LiquidBlockContainer = Java.loadClass('net.minecraft.world.level.block.LiquidBlockContainer')
const HitResultType = Java.loadClass('net.minecraft.world.phys.HitResult$Type')
const EventResult = Java.loadClass('net.minecraftforge.eventbus.api.Event$Result')
const $Blocks = Java.loadClass('net.minecraft.world.level.block.Blocks')
const $Items = Java.loadClass('net.minecraft.world.item.Items')
const $ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')

const FREEZING_POINT = -0.6
const LAVA_FIZZ_EVENT = 1501
const FROZEN_FLUIDS = {
    'minecraft:lava_bucket': { block: $Blocks.OBSIDIAN, fizz: true },
    'minecraft:water_bucket': { block: $Blocks.ICE, fizz: false }
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.player.FillBucketEvent', event => {
    const level = event.getLevel()
    if (level.isClientSide()) return
    const bucket = event.getEmptyBucket()
    const frozen = FROZEN_FLUIDS[String(bucket.id)]
    if (!frozen) return

    const target = event.getTarget()
    if (target == null || target.getType() != HitResultType.BLOCK) return
    if (level.getBlockState(target.getBlockPos()).getBlock() instanceof LiquidBlockContainer) return

    // The block the fluid would fill: the one in front of the clicked face
    const pos = target.getBlockPos().relative(target.getDirection())
    const state = level.getBlockState(pos)
    if (!state.isAir() && !state.canBeReplaced()) return
    if (!event.getEntity().mayUseItemAt(pos, target.getDirection(), bucket)) return
    if (ColdSweatWorld.getTemperatureAt(level, pos) >= FREEZING_POINT || OxygenApi.API.hasOxygen(level, pos)) return

    event.setFilledBucket(new $ItemStack($Items.BUCKET))
    event.setResult(EventResult.ALLOW)
    level.setBlockAndUpdate(pos, frozen.block.defaultBlockState())
    if (frozen.fizz) level.levelEvent(LAVA_FIZZ_EVENT, pos, 0)
})
