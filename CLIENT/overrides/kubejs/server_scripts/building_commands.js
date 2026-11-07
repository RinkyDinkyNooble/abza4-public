// Commands for buildings' command blocks (operators only). Each acts at its command block, in that block's dimension,
// and replaces it; a failed command logs why.
//
//   /placeBlock <block[state]{nbt}>             the block, as /setblock places it
//   /placeKeypad <block[state]{nbt}> <lock>     a keypad block with the lock's code (a door's upper half too)
//   /placeKeycardReader <block[state]> <lock>   a keycard reader taking the lock's keycards
//   /spawnEntity <entity|class> [count] [nbt]   mobs in the middle of the block, as /summon spawns them (spawn type
//                                               command), persistent unless the NBT says otherwise; a class (common,
//                                               mini, boss, final) picks one of the region's mobs at random for each
//   /spawnNPC <tab> <name> [options]            a CustomNPCs clone standing in the block, set up by its options
//                                               (npcs.js), its death permanent unless they give it a respawn
const $AbzaBlockProperties = Java.loadClass('net.minecraft.world.level.block.state.properties.BlockStateProperties')
const $AbzaDoubleBlockHalf = Java.loadClass('net.minecraft.world.level.block.state.properties.DoubleBlockHalf')
const $AbzaNbtCompound = Java.loadClass('net.minecraft.nbt.CompoundTag')
const $AbzaPasscodeProtected = Java.loadClass('net.geforcemods.securitycraft.api.IPasscodeProtected')
const $AbzaKeycardReader = Java.loadClass('net.geforcemods.securitycraft.blockentities.KeycardReaderBlockEntity')
const $AbzaSpawnEntityType = Java.loadClass('net.minecraft.world.entity.EntityType')
const $AbzaSpawnMob = Java.loadClass('net.minecraft.world.entity.Mob')
const $AbzaSpawnType = Java.loadClass('net.minecraft.world.entity.MobSpawnType')
const $AbzaSpawnEvents = Java.loadClass('net.minecraftforge.event.ForgeEventFactory')

const ABZA_MOB_CLASSES = ['common', 'mini', 'boss', 'final']

// Where a command ran, for the log
function abzaCommandWhere(source) {
    var pos = BlockPos.containing(source.position)
    return `${source.level.getDimension()} ${pos.getX()} ${pos.getY()} ${pos.getZ()}`
}

// A failed command: logged, and told to whoever ran it
function abzaCommandFail(source, message) {
    console.error(`building_commands.js: ${message} (at ${abzaCommandWhere(source)})`)
    source.sendFailure(Text.red(message))
    return 0
}

// Places a block as /setblock does
function abzaPlaceBlock(level, pos, input) {
    if (!input.place(level, pos, 2)) return false
    level.blockUpdated(pos, input.getState().getBlock())
    return true
}

// Merges data into a block entity, as /data merge does
function abzaMergeBlockData(blockEntity, data) {
    var tag = blockEntity.saveWithoutMetadata()
    tag.merge(data)
    blockEntity.load(tag)
    blockEntity.setChanged()
}

// A keypad's positions: a door's lower half gets its upper half above it
function abzaKeypadPositions(level, pos) {
    var state = level.getBlockState(pos)
    var half = $AbzaBlockProperties.DOUBLE_BLOCK_HALF
    if (!state.hasProperty(half) || String(state.getValue(half)) != 'lower') return [pos]
    level.setBlock(pos.above(), state.setValue(half, $AbzaDoubleBlockHalf.UPPER), 3)
    return [pos, pos.above()]
}

// A lock's block entity data: its owner, and its code (a keypad) or code and accepted levels (a keycard reader)
function abzaLockData(lock, code) {
    var tag = new $AbzaNbtCompound()
    tag.putString('owner', ABZA_LOCK_OWNER.name)
    tag.putString('ownerUUID', ABZA_LOCK_OWNER.uuid)
    if (!lock.keycard) {
        tag.putString('passcode', code)
        return tag
    }
    tag.putInt('signature', parseInt(code, 10))
    var levels = new $AbzaNbtCompound()
    for (var i = 1; i <= 5; i++) levels.putBoolean(`lvl${i}`, i >= lock.keycard)
    tag.put('acceptedLevels', levels)
    return tag
}

// /placeKeypad and /placeKeycardReader: the block, then the lock's data in it
function abzaPlaceLock(source, input, name, keycard) {
    var lock = ABZA_LOCKS[name]
    if (!lock) return abzaCommandFail(source, `no lock named ${name}`)
    if (!!lock.keycard != keycard) return abzaCommandFail(source, `${name} is a ${lock.keycard ? 'keycard' : 'keypad'} lock`)
    var level = source.level
    var pos = BlockPos.containing(source.position)
    var block = input.getState().getBlock().id
    if (!abzaPlaceBlock(level, pos, input)) return abzaCommandFail(source, `couldn't place ${block}`)
    var code = abzaLockCode(level, name, pos)
    var positions = keycard ? [pos] : abzaKeypadPositions(level, pos)
    for (var i = 0; i < positions.length; i++) {
        var blockEntity = level.getBlockEntity(positions[i])
        var fits = keycard ? blockEntity instanceof $AbzaKeycardReader : blockEntity instanceof $AbzaPasscodeProtected
        if (!fits) return abzaCommandFail(source, `${block} isn't a ${keycard ? 'keycard reader' : 'keypad block'}`)
        abzaMergeBlockData(blockEntity, abzaLockData(lock, code))
    }
    return 1
}

// The region a block is in (0: none), from its biome's tags
function abzaBlockRegion(level, pos) {
    var tags = level.getBiome(pos).tags().iterator()
    while (tags.hasNext()) {
        var region = global.ABZA_MEDICAL.regions[String(tags.next().location())]
        if (region) return region
    }
    return 0
}

// Spawns a mob in the middle of a block
function abzaSpawnOne(level, pos, id, nbt) {
    var entity = $AbzaSpawnEntityType.byString(id).get().create(level)
    if (!entity) {
        console.error(`building_commands.js: ${id} can't be spawned`)
        return
    }
    entity.setPositionAndRotation(pos.getX() + 0.5, pos.getY(), pos.getZ() + 0.5, level.getRandom().nextFloat() * 360, 0)
    var mob = entity instanceof $AbzaSpawnMob
    if (mob) {
        $AbzaSpawnEvents.onFinalizeSpawn(entity, level, level.getCurrentDifficultyAt(pos), $AbzaSpawnType.COMMAND, null, null)
    }
    if (nbt) entity.mergeNbt(nbt)
    if (mob && !(nbt && nbt.contains('PersistenceRequired'))) entity.setPersistenceRequired()
    level.addFreshEntityWithPassengers(entity)
    if (!entity.isAddedToWorld()) {
        console.warn(`building_commands.js: ${id} was refused (mob locking or a cap) at ${level.getDimension()} ` +
            `${pos.getX()} ${pos.getY()} ${pos.getZ()}`)
    }
}

// /spawnEntity: count mobs of an id or class
function abzaSpawnEntities(source, id, count, nbt) {
    var level = source.level
    var pos = BlockPos.containing(source.position)
    var region = abzaBlockRegion(level, pos)
    var mobClass = id.startsWith('minecraft:') && ABZA_MOB_CLASSES.indexOf(id.substring(10)) >= 0 ? id.substring(10) : null
    var ids = [id]
    if (mobClass) {
        ids = Object.keys(global.ABZA_MOBS).filter(mobId => global.ABZA_MOBS[mobId][0] == region && global.ABZA_MOBS[mobId][1] == mobClass)
        if (ids.length == 0) return abzaCommandFail(source, `no ${mobClass} mobs in region ${region}`)
    } else if (!$AbzaSpawnEntityType.byString(id).isPresent()) {
        return abzaCommandFail(source, `no entity ${id}`)
    } else if (global.ABZA_MOBS[id] && global.ABZA_MOBS[id][0] != region) {
        console.warn(`building_commands.js: ${id} is a region ${global.ABZA_MOBS[id][0]} mob, placed in region ${region} ` +
            `(at ${abzaCommandWhere(source)})`)
    }
    if (count < 1) return abzaCommandFail(source, `count ${count} is under 1`)
    level.removeBlock(pos, false)
    for (var i = 0; i < count; i++) abzaSpawnOne(level, pos, ids[Math.floor(Math.random() * ids.length)], nbt)
    return count
}

// /spawnNPC: a clone in the middle of the block (a % in its name is a space)
function abzaSpawnNpc(source, tab, name, options) {
    name = name.replace(/%/g, ' ')
    var problem = abzaNpcProblem(tab, name, options)
    if (problem) return abzaCommandFail(source, problem)
    var pos = BlockPos.containing(source.position)
    source.level.removeBlock(pos, false)
    var npc = abzaSpawnNpcAt(source.level, pos.getX() + 0.5, pos.getY(), pos.getZ() + 0.5, tab, name, options)
    return typeof npc == 'string' ? abzaCommandFail(source, npc) : 1
}

ServerEvents.commandRegistry(event => {
    var Commands = event.commands
    var Arguments = event.arguments
    var operator = source => source.hasPermission(2)
    var block = ctx => Arguments.BLOCK_STATE.getResult(ctx, 'block')
    var lock = ctx => String(Arguments.WORD.getResult(ctx, 'lock'))

    event.register(Commands.literal('placeBlock').requires(operator)
        .then(Commands.argument('block', Arguments.BLOCK_STATE.create(event))
            .executes(ctx => {
                var input = block(ctx)
                if (abzaPlaceBlock(ctx.source.level, BlockPos.containing(ctx.source.position), input)) return 1
                return abzaCommandFail(ctx.source, `couldn't place ${input.getState().getBlock().id}`)
            })))

    ;[['placeKeypad', false], ['placeKeycardReader', true]].forEach(entry => {
        event.register(Commands.literal(entry[0]).requires(operator)
            .then(Commands.argument('block', Arguments.BLOCK_STATE.create(event))
                .then(Commands.argument('lock', Arguments.WORD.create(event))
                    .executes(ctx => abzaPlaceLock(ctx.source, block(ctx), lock(ctx), entry[1])))))
    })

    var entity = ctx => String(Arguments.RESOURCE_LOCATION.getResult(ctx, 'entity'))
    var count = ctx => Arguments.INTEGER.getResult(ctx, 'count')
    event.register(Commands.literal('spawnEntity').requires(operator)
        .then(Commands.argument('entity', Arguments.RESOURCE_LOCATION.create(event))
            .executes(ctx => abzaSpawnEntities(ctx.source, entity(ctx), 1, null))
            .then(Commands.argument('count', Arguments.INTEGER.create(event))
                .executes(ctx => abzaSpawnEntities(ctx.source, entity(ctx), count(ctx), null))
                .then(Commands.argument('nbt', Arguments.NBT_COMPOUND.create(event))
                    .executes(ctx => abzaSpawnEntities(ctx.source, entity(ctx), count(ctx),
                        Arguments.NBT_COMPOUND.getResult(ctx, 'nbt')))))))

    var tab = ctx => Arguments.INTEGER.getResult(ctx, 'tab')
    var npcName = ctx => String(Arguments.STRING.getResult(ctx, 'name'))
    event.register(Commands.literal('spawnNPC').requires(operator)
        .then(Commands.argument('tab', Arguments.INTEGER.create(event))
            .then(Commands.argument('name', Arguments.STRING.create(event))
                .executes(ctx => abzaSpawnNpc(ctx.source, tab(ctx), npcName(ctx), null))
                .then(Commands.argument('options', Arguments.NBT_COMPOUND.create(event))
                    .executes(ctx => abzaSpawnNpc(ctx.source, tab(ctx), npcName(ctx),
                        Arguments.NBT_COMPOUND.getResult(ctx, 'options')))))))
})
