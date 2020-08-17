class SbPhonenumber extends SbComponent {
    constructor(ctx) {
        super()

        this.start(ctx, () => {
            const data = this.store[this.name] = {
                value: ''
            }

            this.data = new Proxy(data, {
                set: (target, key, value) => {
                    target[key] = value

                    switch(key) {
                        case 'value':
                            this.actors[`${this.name}__input`].value = value

                            break
                        default:

                            break
                    }

                    return true
                }
            })
        }, () => {
            this.data.value = JSON.parse(localStorage.getItem('sb-form'))?.phone ?? ''
        })
    }

    initial = {
        container: {},
        group: {
            className: 'sb-form-group',
        },
        input: {
            tag: 'input',
            parent: 'group',
            type: 'phone',
            className: 'sb-form-control',
            placeholder: 'Enter phone number',
            'oninput': ({target, inputType}) => {
                const {value, selectionStart} = target
                const [next] = this.pls.formatPhonenumber(value)
                const isDeleted = !!inputType?.includes('deleteContent')
                const isForwardDirection = !isDeleted ? true : inputType === 'deleteContentForward'

                let caret = selectionStart
                let result = next

                if (inputType === 'insertFromPaste') {
                    caret = next.length
                } else if (!isDeleted && [1, 3, 7, 11, 14, 17, 20].includes(selectionStart)) {
                    caret = selectionStart + 1
                } else if (isDeleted && selectionStart === 0) {
                    caret = 1
                } else if (isDeleted && selectionStart === 1 && next.length === 1) {
                    result = ''
                } else if (isDeleted && selectionStart === next.length-1) {
                    caret = selectionStart + 1
                } else if (isDeleted && [2, 6, 10, 13, 16, 19].includes(selectionStart)) {
                    result = this.pls.formatPhonenumber(isForwardDirection
                        ? `${next.substring(0, selectionStart)}${next.substring(selectionStart+2)}`
                        : `${next.substring(0, selectionStart-1)}${next.substring(selectionStart+1)}`)[0]
                    caret = selectionStart + (isForwardDirection ? 1 : -1)
                }

                if (!['historyUndo', 'historyRedo'].includes(inputType)) {
                    this.data.value = result
                    target.selectionStart = target.selectionEnd = caret
                }
            }
        },
        hint: {
            parent: 'group',
            className: 'sb-form-hint',
            innerHTML: 'example: <span>+79006000000</span>, <span>3 934 532 33 55</span>',
            'onclick': ({ target }) => {
                if (target.nodeName === 'SPAN') {
                    const Input = this.actors[`${this.name}__input`]
                    Input.value = target.innerText
                    Input.dispatchEvent(new Event('input'))
                }
            }
        }
    }
}
