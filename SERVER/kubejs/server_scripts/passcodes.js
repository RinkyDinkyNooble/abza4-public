// Passcodes: each named lock's code in a world, from the world's seed, the lock's name and, for a "copy" lock, the
// chunk it stands in. A keypad takes its code; a keycard reader takes keycards of its level whose signature is its code.
// Each lock has a loot table giving its note (a keypad lock) or keycard (a keycard lock) for the lock in the chunk
// where the loot is rolled: abza:chests/note/<lock>, abza:chests/keycard/<lock>.
// A mystery lock's code is made of parts (ABZA_CODE_PARTS, story_notes.js), each found in story notes; it has no note.
const $AbzaPasscodeUtils = Java.loadClass('net.geforcemods.securitycraft.util.PasscodeUtils')

// Locks by name: a keypad's digits, or a keycard reader's lowest keycard level (its code has 5 digits), or a mystery
// lock's parts in order; scope "copy" gives each building its own code, "world" one code for the whole world; the
// label names the lock in its note
const ABZA_LOCKS = {
    safe: { digits: 4, scope: 'copy', label: 'Safe' },
    door: { digits: 4, scope: 'copy', label: 'Door' },
    vault: { digits: 6, scope: 'copy', label: 'Vault' },
    security: { keycard: 1, scope: 'copy', label: 'Security' },
    records: { parts: ['batch', 'audit_room'], scope: 'world', label: 'Records' },
    field_lab: { parts: ['hq_day', 'headcount'], scope: 'world', label: 'Field lab' },
    uplink: { parts: ['bearing', 'window'], scope: 'world', label: 'Uplink' },
    platinum: { parts: ['member'], scope: 'world', label: 'Platinum' }
}

// The owner every lock is placed with (not a player)
const ABZA_LOCK_OWNER = { name: 'Unknown', uuid: 'c0de0000-ab2a-4000-8000-000000000000' }

// A number from the world's seed and a key, below a limit
function abzaSeededNumber(level, key, limit) {
    var hash = String($AbzaPasscodeUtils.hashPasscodeWithoutSalt(`${level.getSeed()}:${key}`))
    return parseInt(hash.substring(0, 12), 16) % limit
}

// A mystery code's part in a world: its digits in the code, and how story notes write it. A part is fixed (built into
// a place), seeded (a number in a range), a time (minutes after midnight in steps, written hh:mm) or counted back
// from a day to another part's value
function abzaCodePart(level, name) {
    var part = ABZA_CODE_PARTS[name]
    if (part.fixed) return { code: part.fixed, text: part.fixed }
    if (part.daysTo) {
        var days = String(part.daysTo - parseInt(abzaCodePart(level, part.of).code, 10))
        return { code: days, text: days }
    }
    if (part.step) {
        var minutes = abzaSeededNumber(level, `part:${name}`, 1440 / part.step) * part.step
        var pad = n => (n < 10 ? '0' : '') + n
        var hours = pad(Math.floor(minutes / 60))
        return { code: hours + pad(minutes % 60), text: `${hours}:${pad(minutes % 60)}` }
    }
    var code = String(part.min + abzaSeededNumber(level, `part:${name}`, part.max - part.min + 1))
    while (code.length < String(part.max).length) code = '0' + code
    return { code: code, text: code }
}

// A lock's code in a world, as text, for the lock at a position
function abzaLockCode(level, name, pos) {
    var lock = ABZA_LOCKS[name]
    if (lock.parts) return lock.parts.map(part => abzaCodePart(level, part).code).join('')
    var digits = lock.keycard ? 5 : lock.digits
    var key = `${name}`
    if (lock.scope == 'copy') key += `:${level.getDimension()}:${pos.getX() >> 4}:${pos.getZ() >> 4}`
    var code = String(abzaSeededNumber(level, key, Math.pow(10, digits)))
    while (code.length < digits) code = '0' + code
    return code
}

// A lock's loot table, without its "chests/" folder
function abzaLockTable(name) {
    return `abza:${ABZA_LOCKS[name].keycard ? 'keycard' : 'note'}/${name}`
}

// A lock's note or keycard, for the lock at a position; a note's wording is picked by its code (ABZA_LOCK_NOTES)
function abzaLockItem(level, name, pos) {
    var lock = ABZA_LOCKS[name]
    var code = abzaLockCode(level, name, pos)
    if (lock.keycard) {
        return Item.of(`securitycraft:keycard_lv${lock.keycard}`, `{linked:1b,signature:${parseInt(code, 10)},` +
            `ownerName:"${ABZA_LOCK_OWNER.name}",ownerUUID:"${ABZA_LOCK_OWNER.uuid}"}`)
    }
    var wordings = ABZA_LOCK_NOTES[name]
    var note = wordings[parseInt(code, 10) % wordings.length]
    var quote = text => '"' + text.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
    var page = quote(JSON.stringify({ text: note.text.replace('{code}', code) }))
    return Item.of('minecraft:written_book', `{title:${quote(lock.label + ' code')},author:${quote(note.author)},` +
        `pages:[${page}]}`)
}

// Locks that have a note or keycard: every one but the mystery locks
function abzaNotedLocks() {
    return Object.keys(ABZA_LOCKS).filter(name => !ABZA_LOCKS[name].parts)
}

ServerEvents.chestLootTables(event => {
    abzaNotedLocks().forEach(name => event.addChest(abzaLockTable(name), table => {}))
})

LootJS.modifiers(event => {
    abzaNotedLocks().forEach(name => {
        event.addLootTableModifier(abzaLockTable(name).replace(':', ':chests/'))
            .apply(ctx => ctx.addLoot(LootEntry.of(abzaLockItem(ctx.getLevel(), name, ctx.getBlockPos()))))
    })
})

// /passcode [lock]: a lock's code where the operator stands (every lock's without a name)
ServerEvents.commandRegistry(event => {
    var Commands = event.commands
    var Arguments = event.arguments
    var tell = (source, names) => {
        var pos = BlockPos.containing(source.position)
        names.forEach(name => {
            var lock = ABZA_LOCKS[name]
            var code = abzaLockCode(source.level, name, pos)
            var kind = lock.keycard ? `keycard level ${lock.keycard}` : `${code.length} digits`
            source.sendSystemMessage(Text.of(`${name}: ${code} (${kind}, ${lock.scope})`))
        })
        return names.length
    }
    event.register(Commands.literal('passcode').requires(source => source.hasPermission(2))
        .executes(ctx => tell(ctx.source, Object.keys(ABZA_LOCKS)))
        .then(Commands.argument('lock', Arguments.WORD.create(event))
            .executes(ctx => {
                var name = String(Arguments.WORD.getResult(ctx, 'lock'))
                if (ABZA_LOCKS[name]) return tell(ctx.source, [name])
                ctx.source.sendFailure(Text.red(`No lock named ${name}.`))
                return 0
            })))
})
