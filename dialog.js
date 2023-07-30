'use strict';

/** @class */
export default class Dialog {
    /**
     * ダイアローグ要素
     *
     * @type { HTMLDialogElement }
     */
    #dialog;

    /**
     * @constructor
     * @param { Element } [ parent = document.body ] ダイアログの親要素
     */
    constructor(parent) {
        const base = parent || document.body;
        this.#dialog = document.createElement('dialog');
        base.appendChild(this.#dialog);
    }

    /**
     * ダイアローグを閉じる。
     *
     * @param { any } [ returnValue ] ダイアローグの返り値
     * @returns { any } ダイアローグの返り値そのもの
     */
    close(returnValue) {
        this.#dialog.close(returnValue);
        this.clearContent();
        return returnValue;
    }

    /**
     * ダイアローグを開く。
     * show() も同じ動作をする。
     */
    open() {
        this.show();
    }

    /**
     * モーダルなダイアローグを開く。
     * showModal() も同じ動作をする。
     */
    openModal() {
        this.showModal();
    }

    /**
     * ダイアローグを表示する。
     * open() も同じ動作をする。
     */
    show() {
        this.#dialog.show();
    }

    /**
     * モーダルなダイアローグを表示する。
     * openModal() も同じ動作をする。
     */
    showModal() {
        this.#dialog.showModal();
    }

    /**
     * ダイアローグの返り値を得る
     *
     * @returns { string } ダイアローグの返り値
     */
    getValue() {
        return this.#dialog.returnValue;
    }

    /**
     * ダイアローグに内容を追加する。
     *
     * @param { ... string | Element | DocumentFragment } contents ダイアローグの内容
     */
    appendContent(...contents) {
        contents.forEach(content => {
            if (content.valueOf && typeof(content.valueOf()) === 'string') {
                const paragraph = document.createElement('p');
                paragraph.textContent = String(content);
                paragraph.style.whiteSpace = 'pre';
                this.#dialog.append(paragraph);
            } else {
                this.#dialog.append(content);
            }
        });
    }

    /**
     * ダイアローグの内容をクリアする。
     */
    clearContent() {
        const clone = this.#dialog.cloneNode(false);
        clone.returnValue = this.#dialog.returnValue;
        this.#dialog.parentNode.replaceChild(clone, this.#dialog).remove();
        this.#dialog = clone;
    }

    /**
     * ダイアローグの内容を設定する。
     * 全ての内容に文字列を指定した場合は [ OK ] のボタンが同時に設置される。
     * 要素や文書の断片を指定する場合は完全な内容を含める必要がある。
     *
     * @param { ... string | Element | DocumentFragment } contents ダイアローグの内容
     */
    setContent(...contents) {
        this.clearContent();
        const isOnlyString = contents.reduce((isOnlyString, content) => {
            this.appendContent(content);
            return isOnlyString && content.valueOf && typeof(content.valueOf()) === 'string';
        }, true);
        if (isOnlyString) {
            const button = document.createElement('button');
            button.textContent = 'OK';
            button.addEventListener('click', _ => this.close(button.textContent));
            const div = document.createElement('div');
            div.style.textAlign = 'right';
            div.append(button);
            this.appendContent(div);
        }
    }

    /**
     * window.alert() を再現する。
     *
     * @param { string } msg ダイアローグに表示したい文字列
     * @returns { Promise<void> } ボタンが押されたときに解決するプロミス
     */
    alert(msg) {
        return new Promise(r => {
            const button = document.createElement('button');
            button.textContent = 'OK';
            button.addEventListener('click', _ => r(this.close()));
            const div = document.createElement('div');
            div.style.textAlign = 'right';
            div.append(button);
            this.setContent(String(msg), div);
            this.showModal();
        });
    }

    /**
     * window.confirm() を再現する。
     *
     * @param { string } msg ダイアローグに表示したい文字列
     * @returns { Promise<boolean> } ボタンが押されたときに解決するプロミス
     */
    confirm(msg) {
        return new Promise(r => {
            const buttonCancel = document.createElement('button');
            buttonCancel.textContent = 'Cancel';
            buttonCancel.addEventListener('click', _ => r(this.close(false)));
            const buttonOk = document.createElement('button');
            buttonOk.textContent = 'OK';
            buttonOk.addEventListener('click', _ => r(this.close(true)));
            const div = document.createElement('div');
            div.style.textAlign = 'right';
            div.append(buttonCancel, ' ', buttonOk);
            this.setContent(String(msg), div);
            this.showModal();
        });
    }

    /**
     * window.prompt() を再現する。
     *
     * @param { string } msg ダイアローグに表示したい文字列
     * @param { string } [ dflt ] デフォルト文字列
     * @returns { Promise<string | null> } ボタンが押されたときに解決するプロミス
     */
    prompt(msg, dflt) {
        return new Promise(r => {
            const input = document.createElement('input');
            input.setAttribute('type', 'text');
            dflt && (input.value = String(dflt));
            const divInput = document.createElement('div');
            divInput.append(input);
            const buttonCancel = document.createElement('button');
            buttonCancel.textContent = 'Cancel';
            buttonCancel.addEventListener('click', _ => r(this.close(null)));
            const buttonOk = document.createElement('button');
            buttonOk.textContent = 'OK';
            buttonOk.addEventListener('click', _ => r(this.close(input.value)));
            const divButtons = document.createElement('div');
            divButtons.style.textAlign = 'right';
            divButtons.append(buttonCancel, ' ', buttonOk);
            this.setContent(String(msg), divInput, divButtons);
            this.showModal();
        });
    }
}
