// Prospero, the hub:
// - placed once per world, when the world first loads with its structure (abza:prospero), on the open ocean nearest
//   the world's spawn, its waterline at sea level
// - its containers carry their loot tables from the structure; its crew spawned at the structure's markers as soon
//   as it is placed, and any who didn't the first time a player comes near
// - Ines's letter, with where the yacht lies, given once to each player

const $AbzaHubLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const $AbzaHubSettings = Java.loadClass('net.minecraft.world.level.levelgen.structure.templatesystem.StructurePlaceSettings')
const $AbzaHubBlocks = Java.loadClass('net.minecraft.world.level.block.Blocks')
const $AbzaHubBlockPos = Java.loadClass('net.minecraft.core.BlockPos')
const $AbzaHubHeightmap = Java.loadClass('net.minecraft.world.level.levelgen.Heightmap$Types')
const $AbzaHubTagParser = Java.loadClass('net.minecraft.nbt.TagParser')
const $AbzaHubCompound = Java.loadClass('net.minecraft.nbt.CompoundTag')

const ABZA_HUB = {
    template: 'abza:prospero',
    radius: 4096,       // blocks from spawn searched for open ocean
    step: 64,           // between two spots tried
    margin: 24,         // open water kept round the yacht
    depth: 2,           // water below the keel, at least
    near: 64,           // blocks from the yacht at which its crew comes aboard
    // The crew's /spawnNPC options by the markers' names; a marker may add a yaw
    crew: {
        ines: { cast: 'ines', dialogs: 'ines', lines: 'ines', market: 'ines_flares' },
        ruth: { cast: 'ruth', dialogs: 'ruth', lines: 'ruth', market: 'ruth_medicine' },
        teddy: { cast: 'teddy', dialogs: 'teddy', lines: 'teddy', market: 'teddy_goods' },
        bram: { cast: 'bram', dialogs: 'bram', lines: 'bram', market: 'bram_guns' },
        guard: { skin: 'prospero', name: 'random', faction: 0, kit: 'prospero_guard', hire: 1, dialogs: 'hire_prospero',
            lines: 'prospero', respawn: 300 },
        crew: { skin: 'prospero', name: 'random', faction: 0, lines: 'prospero', wander: 4, respawn: 300 }
    },
    directions: (x, z) => `We're anchored at ${x}, ${z}.`
}

function abzaHubOcean(level, x, z) {
    var tags = level.getBiome(new $AbzaHubBlockPos(x, level.getSeaLevel(), z)).tags().iterator()
    while (tags.hasNext()) {
        if (String(tags.next().location()) == 'minecraft:is_ocean') return true
    }
    return false
}

// Every 8th column of the box is an ocean biome (read from the biome source: nothing generates)
function abzaHubOceanBox(level, x0, z0, x1, z1) {
    for (var x = x0; x <= x1; x += 8) {
        for (var z = z0; z <= z1; z += 8) {
            if (!abzaHubOcean(level, x, z)) return false
        }
    }
    return true
}

// Every 4th column of the box, its chunk generated first: nothing above the water, and the sea floor at or below
// floor
function abzaHubOpenWater(level, x0, z0, x1, z1, floor) {
    var sea = level.getSeaLevel()
    for (var x = x0; x <= x1; x += 4) {
        for (var z = z0; z <= z1; z += 4) {
            level.getChunk(x >> 4, z >> 4)
            if (level.getHeight($AbzaHubHeightmap.WORLD_SURFACE, x, z) > sea) return false
            if (level.getHeight($AbzaHubHeightmap.OCEAN_FLOOR, x, z) > floor) return false
        }
    }
    return true
}

// The yacht's markers: structure blocks in DATA mode, as {name, words, pos} at the given origin (each is placed, then
// taken to air)
function abzaHubMarkers(template, origin, settings) {
    var out = []
    template.filterBlocks(origin, settings, $AbzaHubBlocks.STRUCTURE_BLOCK).forEach(info => {
        var nbt = info.nbt()
        if (!nbt || String(nbt.getString('mode')) != 'DATA') return
        var words = String(nbt.getString('metadata')).trim().split(/\s+/)
        out.push({ name: words[0], words: words, pos: info.pos() })
    })
    return out
}

// Finds the open ocean nearest spawn and places the yacht there; what's saved, or null
function abzaHubPlace(server) {
    var level = server.getOverworld()
    var found = level.getStructureManager().get(new $AbzaHubLocation(ABZA_HUB.template))
    if (!found.isPresent()) return null
    var template = found.get()
    var size = template.getSize()
    var settings = new $AbzaHubSettings().setKeepLiquids(false).setKnownShape(true)
    var waterline = abzaHubMarkers(template, $AbzaHubBlockPos.ZERO, settings).filter(m => m.name == 'waterline')[0]
    if (!waterline) {
        console.error('prospero.js: the structure has no waterline marker')
        return null
    }
    var y = level.getSeaLevel() - 1 - waterline.pos.getY()
    var spawn = level.getSharedSpawnPos()
    var half = [Math.floor(size.getX() / 2), Math.floor(size.getZ() / 2)]
    for (var ring = 0; ring * ABZA_HUB.step <= ABZA_HUB.radius; ring++) {
        for (var i = -ring; i <= ring; i++) {
            for (var j = -ring; j <= ring; j++) {
                if (Math.max(Math.abs(i), Math.abs(j)) != ring) continue
                var x = spawn.getX() + i * ABZA_HUB.step - half[0]
                var z = spawn.getZ() + j * ABZA_HUB.step - half[1]
                var box = [x - ABZA_HUB.margin, z - ABZA_HUB.margin,
                    x + size.getX() + ABZA_HUB.margin, z + size.getZ() + ABZA_HUB.margin]
                if (!abzaHubOceanBox(level, box[0], box[1], box[2], box[3])) continue
                if (!abzaHubOpenWater(level, box[0], box[1], box[2], box[3], y - ABZA_HUB.depth)) continue
                var origin = new $AbzaHubBlockPos(x, y, z)
                template.placeInWorld(level, origin, origin, settings, level.getRandom(), 2)
                var saved = new $AbzaHubCompound()
                var crew = []
                abzaHubMarkers(template, origin, settings).forEach(m => {
                    level.setBlock(m.pos, $AbzaHubBlocks.AIR.defaultBlockState(), 2)
                    if (m.name == 'arrive') {
                        saved.putInt('x', m.pos.getX())
                        saved.putInt('z', m.pos.getZ())
                    }
                    if (m.name == 'npc') crew.push(`${m.words[1]} ${m.words[2] || 0} ${m.pos.getX()} ${m.pos.getY()} ${m.pos.getZ()}`)
                })
                if (!saved.contains('x')) {
                    saved.putInt('x', x + half[0])
                    saved.putInt('z', z + half[1])
                }
                saved.putString('crew', crew.join(';'))
                saved.putBoolean('aboard', false)
                console.info(`prospero.js: Prospero placed at ${x} ${y} ${z}, ${crew.length} crew to come aboard`)
                return saved
            }
        }
    }
    console.error(`prospero.js: no open ocean within ${ABZA_HUB.radius} blocks of spawn`)
    var failed = new $AbzaHubCompound()
    failed.putBoolean('failed', true)
    return failed
}

ServerEvents.loaded(event => {
    var data = event.server.persistentData
    if (data.contains('abza_prospero')) return
    var saved = abzaHubPlace(event.server)
    if (!saved) return
    data.put('abza_prospero', saved)
    if (saved.contains('x')) abzaHubBoard(event.server)
})

// The crew at their markers; each one who spawns leaves the list, and the crew is aboard once the list is empty
function abzaHubBoard(server) {
    var saved = server.persistentData.getCompound('abza_prospero')
    var level = server.getOverworld()
    var left = []
    String(saved.getString('crew')).split(';').filter(s => s).forEach(entry => {
        var p = entry.split(' ')
        var base = ABZA_HUB.crew[p[0]] || ABZA_HUB.crew.crew
        var options = { yaw: Number(p[1]) }
        Object.keys(base).forEach(key => { options[key] = base[key] })
        var snbt = '{' + Object.keys(options).map(key => key + ':' + (typeof options[key] == 'string' ? '"' + options[key] + '"' : options[key])).join(',') + '}'
        var result = abzaSpawnNpcAt(level, Number(p[2]) + 0.5, Number(p[3]), Number(p[4]) + 0.5, 1, 'template_armed',
            $AbzaHubTagParser.parseTag(snbt))
        if (typeof result == 'string') {
            console.warn(`prospero.js: ${p[0]}: ${result}`)
            left.push(entry)
        }
    })
    saved.putString('crew', left.join(';'))
    saved.putBoolean('aboard', left.length == 0)
    console.info(left.length == 0 ? 'prospero.js: the crew is aboard' : `prospero.js: ${left.length} crew still to come aboard`)
}

// Ines's letter, once per player, its directions filled in
function abzaHubLetter(player, saved) {
    var root = player.getPersistentData()
    if (root.getBoolean('abza_prospero_letter')) return
    var nbt = ABZA_STORY_DOCS.prospero_letter.nbt.replace('[DIRECTIONS]', ABZA_HUB.directions(saved.getInt('x'), saved.getInt('z')))
    player.give(Item.of('minecraft:written_book', nbt))
    root.putBoolean('abza_prospero_letter', true)
}

PlayerEvents.loggedIn(event => {
    var saved = event.server.persistentData.getCompound('abza_prospero')
    if (saved.contains('x')) abzaHubLetter(event.player, saved)
})

PlayerEvents.tick(event => {
    var player = event.player
    if (player.tickCount % 100 != 0) return
    var saved = player.server.persistentData.getCompound('abza_prospero')
    if (!saved.contains('x') || saved.getBoolean('aboard')) return
    if (String(player.level.getDimension()) != 'minecraft:overworld') return
    var dx = player.getX() - saved.getInt('x'), dz = player.getZ() - saved.getInt('z')
    if (dx * dx + dz * dz < ABZA_HUB.near * ABZA_HUB.near) abzaHubBoard(player.server)
})

// /abzahub: where Prospero is (operators)
ServerEvents.commandRegistry(event => {
    event.register(event.commands.literal('abzahub').requires(source => source.hasPermission(2)).executes(ctx => {
        var saved = ctx.source.getServer().persistentData.getCompound('abza_prospero')
        var text = saved.contains('x') ? `Prospero: ${saved.getInt('x')}, ${saved.getInt('z')}; crew aboard: ${saved.getBoolean('aboard')}`
            : saved.getBoolean('failed') ? 'Prospero: no open ocean was found' : 'Prospero: not placed (no structure yet)'
        ctx.source.sendSystemMessage(Text.of(text))
        return 1
    }))
})
