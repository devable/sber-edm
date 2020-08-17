class SbComponent {
    name
    target
    actors
    actor
    data
    store
    actions
    stand

    registerActor(name, { tag = 'div', className, ...attrs }) {
        const actor = document.createElement(tag)
        name = name === 'container' ? this.name : `${this.name}__${name}`

        actor.className = name
        if (!!className) {
            actor.className += ` ${className}`
        }

        Object.entries(attrs).forEach(([attr, value]) => {
            actor[attr] = value
        })

        this.actors[name] = actor

        return actor
    }

    arrangeActors() {
        const { container, ...actors } = this.initial
        const Container = this.actor = this.registerActor('container', container)

        !!this.target.firstChild && [...this.target.children].forEach(actor => {
            Container.appendChild(actor)
        });

        [...Object.entries(actors)].forEach(([ name, data ]) => {
            const { parent, ...attrs } = data
            const Actor = this.registerActor(name, attrs)
            const Parent = this.actors[`${this.name}__${parent}`];

            (!!Parent ? Parent : Container).appendChild(Actor)
        })

        this.target.parentNode.replaceChild(Container, this.target)
    }

    applyCtx(ctx) {
        [...Object.entries(ctx)].forEach(([key, value]) => {
            this[key] = value
        })
    }

    start(ctx, before, after) {
        this.applyCtx(ctx)

        !!before && before()

        this.arrangeActors()

        !!after && after()
    }

    initial = {
        container: {
            className: `${this.name} container`
        }
    }
}
