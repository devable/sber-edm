const config = {
    api: {
        name: 'github',
        url: 'https://raw.githubusercontent.com',
        repos: [
            'emberjs/ember.js',
            'sveltejs/svelte',
            'angular/angular',
            'vuejs/vue',
            'facebook/react'
        ],
        debounceTime: 700
    },
    components: {
        'sb-autosuggest': {
            minResult: 3,
            minLetters: 3,
            display: 10
        }
    }
}

class App {
    constructor(config) {
        this.config = config
    }

    // App configurations
    config = {}

    // Data store
    store = {}

    // Registered actors
    actors = {}

    // Registered components
    components = {}

    // Utils
    pls = {
        debounce: (callback, wait = 300, timeout) => (...args) => {
            clearTimeout(timeout)
            timeout = setTimeout(() => callback(...args), wait)
        },
        formatPhonenumber: (value) => {
            const cleared = value.replace(/[\D]/g, '')
            const groups = [cleared.substring(0, 1), cleared.substring(1, 4), cleared.substring(4, 7),
                cleared.substring(7, 9), cleared.substring(9, 11),
                cleared.substring(11, 13), cleared.substring(13, 15)].filter(group => group !== '')
            const next = groups.join(' ').trim()

            return [`${value.length === 0 ? '' : '+'}${next}`, groups]
        },
        rand: (max, min = 0) => {
            min = Math.ceil(min)
            max = Math.floor(max)

            return Math.floor(Math.random() * (max - min + 1)) + min
        }
    }

    // Remote data methods
    api = {
        getRepoInfo: async (repo) => {
            const res = await fetch(`${config.api.url}/${repo}/master/README.md`)

            return res.ok ? await res.text() : []
        }
    }

    // Human readable messages
    messages = {
        needMoreMana: 'Need more mana!',
        noMore: 'No more',
        notFound: 'Not found'
    }

    registerComponent(name, constructor) {
        const elements = document.querySelectorAll(name)
        const length = elements.length

        elements.forEach((element, idx) => {
            const component = length <= 1 ? name : `${name}-${idx}`

            this.components[component] = new constructor({
                ...this,
                name: component,
                target: element
            })
        })
    }
}

window.addEventListener('load', () => {
    const app = new App(config)

    app.registerComponent('sb-autosuggest', SbAutosuggest)
    app.registerComponent('sb-phonenumber', SbPhonenumber)
    app.registerComponent('sb-form', SbForm)
})
