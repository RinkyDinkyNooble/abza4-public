// Commands that mods register for every player, limited to operators (permission level 2)

const ABZA_OPERATOR_COMMAND_PREFIXES = ['entomophobia:', 'tfth:', 'phayriosis_', 'testcode']

ServerEvents.command(event => {
    var name = String(event.getCommandName())
    if (!ABZA_OPERATOR_COMMAND_PREFIXES.some(prefix => name.startsWith(prefix))) return
    var source = event.getParseResults().getContext().getSource()
    if (source.hasPermission(2)) return
    source.sendFailure(Text.red('Only operators can use this command.'))
    event.cancel()
})
