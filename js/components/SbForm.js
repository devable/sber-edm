class SbForm extends SbComponent {
    constructor(ctx) {
        super()

        this.start(ctx, () => {
            const data = this.store[this.name] = {
                interactive: 0,
                allow: true,
                complete: false
            }

            this.data = new Proxy(data, {
                set: (target, key, value) => {
                    target[key] = value

                    switch(key) {
                        case 'interactive':
                            target[key] = value

                            const actorSave = this.actors[`${this.name}__save`]

                            if (value === 1) {
                                this.explain('Oops...')
                            } else if (value === 2) {
                                this.explain('This is joke')
                            }
                            if (value === 3) {
                                actorSave.style = 'transform: translate(0, 0) rotate(360deg);'

                                this.explain('Will you press?')
                            } else if (value < 3 && value > 0) {
                                const offsets = [Math.min(actorSave.offsetLeft, window.innerWidth
                                    - actorSave.offsetLeft - actorSave.offsetWidth), Math.min(actorSave.offsetTop,
                                    window.innerHeight - actorSave.offsetTop - actorSave.offsetHeight)]

                                const deg = this.pls.rand(300)
                                const x = this.pls.rand(offsets[0], -offsets[0])
                                const y = this.pls.rand(offsets[1], -offsets[1])

                                actorSave.style = `transform: translate(${x}px, ${y}px) rotate(${deg}deg);`
                            }

                            break
                        default:

                            break
                    }

                    return true
                }
            })
        })
    }

    stand = {}

    explain(value, timeout = 2500, style) {
        const actorResult = this.actors[`${this.name}__result`]

        actorResult.innerText = value
        actorResult.style = `opacity: 1;${!!style ? ` ${style}` : ''}`

        if (!this.stand.hideExplain) {
            this.stand.hideExplain = this.pls.debounce(async () => {
                actorResult.style = 'opacity: 0;'
            }, timeout)
        }

        this.stand.hideExplain()
    }

    initial = {
        container: {
            tag: 'form',
            action: '/',
            method: 'post',
            'onsubmit': e => {
                e.preventDefault()
            }
        },
        footer: {
            parent: 'container'
        },
        result: {
            parent: 'footer',
            innerText: '...'
        },
        save: {
            tag: 'button',
            type: 'submit',
            parent: 'footer',
            className: 'sb-form-control sb-form-control--primary',
            innerText: 'Save',
            'onclick': () => {
                localStorage.setItem(this.name, JSON.stringify({
                    phone: this.components['sb-phonenumber'].data.value,
                    selected: this.components['sb-autosuggest'].data.selected
                }))

                const jokeName = `${this.name}__not-joke`
                const isJoke = !localStorage.getItem(jokeName)

                if (this.data.interactive === 3 && isJoke) {
                    this.explain('Nice job! ;)', 5000, 'color: var(--color-accent-deep);')
                } else {
                    this.explain('Saved!', 2500, 'color: var(--color-accent-deep);')
                }

                if (isJoke) {
                    this.actors[`${this.name}__save`].style = 'transform: translate(0, 0) rotate(360deg);'
                }

                this.data.interactive = 4
                localStorage.setItem(jokeName, 'true')
            },
            'onmouseenter': () => {
                if (this.data.interactive < 4 && this.data.allow === true
                    && !localStorage.getItem(`${this.name}__not-joke`)) {
                    this.data.interactive += 1
                    this.data.allow = false

                    setTimeout(() => {
                        this.data.allow = true
                    }, 700)
                }
            }
        },
        clear: {
            tag: 'button',
            parent: 'footer',
            className: 'sb-form-control',
            innerText: 'Clear form',
            'onclick': () => {
                const data = this.components['sb-autosuggest'].data

                data.searched = ''
                data.selected = []

                this.components['sb-phonenumber'].data.value = ''

                localStorage.setItem(this.name, JSON.stringify({
                    phone: '',
                    selected: []
                }))
            }
        }
    }
}
