// TROL items' built-in Chinese tooltip lines are removed (the item name, line 0, is kept)
const CJK = /[　-鿿＀-￯]/

ItemEvents.tooltip(event => {
    event.addAdvanced('@trol_armor', (item, advanced, text) => {
        for (let i = text.size() - 1; i >= 1; i--) {
            if (CJK.test(String(text.get(i).getString()))) text.remove(text.get(i))
        }
    })
})
