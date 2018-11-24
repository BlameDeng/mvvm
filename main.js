function Dep() {
    this.subs = []
}
Dep.prototype.addSub = function(sub) {
    this.subs.push(sub)
}
Dep.prototype.notify = function() {
    this.subs.forEach(sub => sub.update())
}

function Vue(options = {}) {
    this.$options = options
    this._data = this.$options.data
    new Observer(this._data)
    for (const key in this._data) {
        Object.defineProperty(this, key, {
            enumerable: true,
            get() {
                return this._data[key]
            },
            set(newVal) {
                this._data[key] = newVal
            }
        })
    }
    new Compile(this.$options.el, this)
}

function Compile(el, vm) {
    vm.$el = document.querySelector(el)
    const fragment = document.createDocumentFragment()
    let child = null
    while (child = vm.$el.firstChild) {
        fragment.append(child)
    }
    replace(fragment)
    vm.$el.append(fragment)

    function replace(fragment) {
        const pattern = /\{\{(.*)\}\}/
        Array.from(fragment.childNodes).forEach(node => {
            let text = node.textContent
            if (node.nodeType === 3 && pattern.test(text)) {
                const key = RegExp.$1.trim()
                new Watcher(vm, key, (newVal) => {
                    node.textContent = text.replace(pattern, newVal)
                })
                node.textContent = text.replace(pattern, vm[key])
            }
            if (node.childNodes && node.childNodes.length) {
                replace(node)
            }
        })
    }
}

function Observer(data) {
    const dep = new Dep()
    for (const key in data) {
        let val = data[key]
        Object.defineProperty(data, key, {
            enumerable: true,
            get() {
                Dep.target && dep.addSub(Dep.target)
                Dep.target = null
                return val
            },
            set(newVal) {
                if (newVal === val) {
                    return
                }
                val = newVal
                dep.notify()
            }
        })
    }
}

function Watcher(vm, key, fn) {
    this.vm = vm
    this.key = key
    this.fn = fn
    Dep.target = this
}

Watcher.prototype.update = function() {
    this.fn(this.vm[this.key])
}