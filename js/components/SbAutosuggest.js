class SbAutosuggest extends SbComponent {
    constructor(ctx) {
        super()

        this.start(ctx, () => {
            const data = this.store[this.name] = {
                focus: false,
                searched: '',
                selected: [],
                result: [],
                loading: false
            }

            this.data = new Proxy(data, {
                set: (target, key, value) => {
                    target[key] = value

                    switch(key) {
                        case 'focus':
                            if (value) {
                                this.actors[`${this.name}__field`].focus()
                            }

                            this.actors[`${this.name}__input`].classList
                                .toggle(`${this.name}__input--focus`, value)
                            this.actors[`${this.name}__results`].classList
                                .toggle(`${this.name}__results--show`, value && this.data.result.length > 0)

                            break
                        case 'searched':
                            this.actors[`${this.name}__field`].value = value

                            if (!this.stand.getRepoInfo) {
                                this.stand.getRepoInfo = this.pls.debounce(async () => {
                                    this.data.result = await this.actions.getRepoInfo()
                                }, this.config.api.debounceTime)
                            }

                            this.data.loading = true
                            this.data.result = []
                            this.stand.getRepoInfo()

                            break
                        case 'selected':
                            const resultFiltered = this.data.result.filter(item => !value.includes(item))

                            this.actors[`${this.name}__variants`].innerHTML = ''

                            this.data.selected.forEach((variant, idx) => {
                                const name = `${this.name}__variant sb-form-control sb-form-control--button sb-form-control--xs`

                                this.actors[`${this.name}__variants`].appendChild(this.registerActor(`variant-${idx}`, {
                                    node: 'span',
                                    className: name,
                                    innerText: variant,
                                    onclick: () => {
                                        this.data.selected = this.data.selected.filter(item => item !== variant)
                                        this.data.result = [variant, ...this.data.result
                                            .filter(item => !Object.values(this.messages).includes(item))]
                                    }
                                }))
                            })

                            this.data.result = resultFiltered.length > 0 ? resultFiltered : []

                            break
                        case 'result':
                            this.actors[`${this.name}__results`].innerHTML = ''

                            const display = this.config.components[this.name].display
                            const length = value.length

                            this.actors[`${this.name}__results`].classList
                                .toggle(`${this.name}__results--show`,
                                    this.data.focus && length > 0)

                            for (let i = 0; i < display && i < length; i++) {
                                const isVariant = !Object.values(this.messages).includes(value[i])

                                this.actors[`${this.name}__results`].appendChild(this.registerActor(`result-${i}`, isVariant ? {
                                    className: `${this.name}__result`,
                                    innerText: value[i],
                                    onclick: () => {
                                        this.data.selected = [...this.data.selected, value[i]]
                                    }
                                } : {
                                    className: `${this.name}__message`,
                                    innerText: value[i],
                                }))
                            }
                            break
                        case 'loading':
                            this.actors[`${this.name}__spinner`].classList
                                .toggle('sb-spinner', !!this.data.searched && value)

                            break
                        default:
                            break
                    }

                    return true
                }
            })
        }, () => {
            this.data.selected = JSON.parse(localStorage.getItem('sb-form'))?.selected ?? []
        })

        document.addEventListener('click', ({ target }) => {
            const className = target?.className

            this.data.focus = !!className.includes(`${this.name}__`)
                && !className.includes(`${this.name}__group`)
                && !className.includes(`${this.name}__hint`)
        })
    }

    stand = {}

    actions = {
        getRepoInfo: async () => {
            if (!this.data.searched) {
                this.data.loading = false

                return []
            } else if (this.data.searched.length < this.config.components[this.name].minLetters) {
                this.data.loading = false
                return [this.messages.needMoreMana]
            }

            let i = this.config.api.repos.length - 1

            while (i >= 0) {
                const data = await this.api.getRepoInfo(this.config.api.repos[i])
                const patternSearch = `([a-zа-я]*)?(${this.data.searched.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")})([a-zа-я]*)?`
                const matched = data.match(new RegExp(patternSearch, 'gi'))

                if (!!matched && matched.length > this.config.components[this.name].minResult) {
                    const filtered = [...new Set(matched.filter(item => !this.data.selected.includes(item)))]

                    i = -1

                    this.data.loading = false

                    return filtered
                } else {
                    i--

                    if (i === 0) {
                        this.data.loading = false
                    }
                }
            }

            return [this.messages.notFound]
        },
        handleArrowNavigate: (isUp = false) => {
            const baseClass = `${this.name}__result`
            const activeClass = `${baseClass}--active`

            const variants = this.actors[`${this.name}__results`]
                .querySelectorAll(`.${baseClass}`)

            if (variants.length > 0) {
                const active = this.actors[`${this.name}__results`].querySelector(`.${activeClass}`)

                const elements = isUp
                    ? [variants[0], variants[variants.length - 1], active?.previousSibling]
                    : [variants[variants.length - 1], variants[0], active?.nextSibling]

                if (!!active && active !== elements[0]) {
                    active.classList.remove(activeClass)

                    elements[2].classList.add(activeClass)
                } else {
                    elements[1].classList.add(activeClass)

                    if (!!active && active === elements[0]) {
                        elements[0].classList.remove(activeClass)
                    }
                }
            }
        }
    }

    initial = {
        container: {
            onsubmit: e => e.preventDefault()
        },
        group: {
            className: 'sb-form-group'
        },
        input: {
            parent: 'group',
            className: 'sb-form-control'
        },
        variants: {
            parent: 'input'
        },
        field: {
            tag: 'input',
            parent: 'input',
            placeholder: 'Enter text',
            oninput: ({ target }) => {
                this.data.searched = target.value
            },
            'onkeydown': (e) => {
                switch(e.key) {
                    case 'Backspace':
                        if (e.target.value.length === 0) {
                            const selected = this.data.selected

                            if (selected.length > 0) {
                                selected.pop()
                            }

                            this.data.selected = selected
                        }

                        break
                    case 'Enter':
                        e.preventDefault()

                        const active = this.actors[`${this.name}__results`]
                            .querySelector(`.${this.name}__result--active`)

                        active.dispatchEvent(new Event('click'))

                        break;
                    case 'Escape':
                        this.data.focus = false

                        break
                    case 'ArrowUp':
                        this.actions.handleArrowNavigate(true)

                        break;
                    case 'ArrowDown':
                        if (!this.data.focus) {
                            this.data.focus = true
                        }

                        this.actions.handleArrowNavigate()

                        break
                    default:

                        break
                }
            }
        },
        results: {
            parent: 'group',
        },
        hint: {
            parent: 'group',
            className: 'sb-form-hint',
            innerHTML: `example: <span class="sb-autosuggest__option">react</span>,
                    <span class="sb-autosuggest__option">vue</span>,
                    <span class="sb-autosuggest__option">angular</span>,
                    <span class="sb-autosuggest__option">ember</span>,
                    <span class="sb-autosuggest__option">svelte</span>`,
            'onclick': ({ target }) => {
                if (target.nodeName.toLowerCase() === 'span') {
                    this.data.searched = target.innerText
                }
            }
        },
        spinner: {
            tag: 'span',
            parent: 'input'
        }
    }
}
